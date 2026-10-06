// ~/.pi/agent/extensions/todo-task.ts
/**
 * /feature N — Implements a feature from the TODO backlog and measures elapsed time.
 * /feature N [note] — Optionally includes a note with the feature start.
 * /feature end — Ends the current feature without saving timing (unreliable).
 *
 * /bugfix N — Fixes a bug from the TODO backlog and measures elapsed time.
 * /bugfix N [note] — Optionally includes a note with the bug fix start.
 * /bugfix end — Ends the current bug without saving timing (unreliable).
 * 
 * /pr N - Check PR status and reviews
 *
 * Only one activity (feature or bug) can be active at a time. Starting a new one
 * auto-cancels the previous one without saving timing.
 *
 * Usage:
 *   /feature 10                      — Start implementing feature 10 from the TODO backlog.
 *   /feature 10 ignore existing PR   — Start implementing feature 10 with note "ignoring existing PR".
 *   /feature 10 "ignore existing PR" — Start implementing feature 10 with note "ignoring existing PR".
 *   /feature 7.1                     — Start implementing feature 7.1 .
 *   /feature end                     — End the current feature without saving timing data.
 *
 *   /bugfix 7                        — Start fixing bug 7 from the TODO backlog.
 *   /bugfix 7 ignore existing PR     — Start fixing bug 7 with note "ignoring existing PR".
 *   /bugfix 7 "my custom note"       — Start fixing bug 7with note "ignoring existing PR"
 *   /bugfix end                      — End the current bug without saving timing data.
 *
 * The extension:
 *   1. Move to updated main branch to look at up-to-date TODO
 *   2. Writes START:<timestamp> to ~/.pi/agent/todo-tasks/task_<N>.txt or bug_<N>.txt
 *   3. Injects a message to the agent: "Implement feature N..." or "Fix bug N..."
 *   4. When the agent signals "[FEATURE N COMPLETED]" or "[BUGFIX N COMPLETED]" on turn_end,
 *      on agent_settled writes END:<timestamp> and ELAPSED MINUTES to the file
 *   5. Appends the unified execution report directly to the open PR description (via gh)
 *   6. Clears the status bar entry for the completed activity.
 *
 * While a feature/bug runs the status bar shows the live elapsed time (MM:SS), refreshed every 15s.
 *
 * While a feature/bug session is active it also polls GitHub every ~20s (max 2h):
 * if the reviewer APPROVED the PR a notification is shown (the user usually merges);
 * if CHANGES_REQUESTED the agent is told to follow the AGENTS.md review workflow;
 * when the PR is MERGED the watcher stops.
 * Polling is forced to ends on `/feature end` or `/bugfix end` (useful for stale polling).
 */

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI, ExtensionContext, ExtensionCommandContext, TurnEndEvent, AgentSettledEvent } from '@earendil-works/pi-coding-agent'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'

const EXTENSION = "TODO-TASK"
const TODO_FEATURES_DIR = path.join(process.env.HOME ?? '', '.pi', 'agent', 'todo-tasks')
const STATUS_KEY_TASK = "alex-piccione-todo-task-task"
const STATUS_KEY_PR = "alex-piccione-todo-task-pr"
const LOCAL_LLAMA_CPP_PROVIDER = 'Llama.cpp'  // Provider id used for local LLMs served by llama-server (in models.json Pi file)


let latestCtx: ExtensionContext | null = null
let pending: TimingItem | null = null  // represent hte current task, should be called CurrentTask ?
let completed = false                  // is current task completed ? shoud it be a property of CurrentTask ?
// Project root of the running task — needed by finishActivity to locate the branch's PR.
let taskProjectRoot: string | null = null

let watchedPr: { number: number; url: string } | null = null
const handledReviewDecisions = new Map<string, string>()  // track reviews to not "resend" messages/action multiple time for the same

// Status-bar elapsed-time ticker — refreshes the status while a feature/bug runs.
let statusTimer: ReturnType<typeof setInterval> | null = null
const STATUS_UPDATE_MS = 15_000

// PR review-watcher state lives at module scope rather than per extension instance:
// Pi can instantiate the factory again on session replacement without shutting the
// previous one down, leaking a stale poll interval whose 2h clock never resets
// Sharing the state guarantees a single watcher process-wide; startPrPolling()
// clears any leaked interval before arming a fresh one.
let prCheckTimer: ReturnType<typeof setInterval> | null = null
const PR_CHECK_INTERVAL_MS = 20_000
// Safenet: stop polling after this long even if no decision was made (can be increased later).
const PR_CHECKING_MAX_MS = 4 * 60 * 60 * 1000  // 4 hours
let checkCounter = 0
// TODO... calculae MAX counter
let prCheckStartedAt = 0
let prCheckInFlight = false


const DEBUG = false
const debug = (msg:string) => DEBUG && console.debug(`\n[DEBUG][${EXTENSION}] ${msg}`)

/**
 * Resolve the model actually serving requests, formatted as `<provider>/<model>`.
 * For the local Llama.cpp provider the configured name may be stale,
 * so we query the OpenAI-compatible `${baseUrl}/models` endpoint instead.
 */
async function resolveModelName(): Promise<string> {
  const m = latestCtx?.model
  if (!m) return 'unknown'
  if (m.provider === LOCAL_LLAMA_CPP_PROVIDER && m.baseUrl) {
    try {
      // Assumption: ONLY ONE model is loaded on llama-server at a time — pick it.
      const res = await fetch(`${m.baseUrl}/models`)
      const data = (await res.json()) as { data?: Array<{ id: string }> }
      const id = data.data?.[0]?.id
      if (id) return `${m.provider}/${id}`
    } catch {
      safeNotify('Could not reach llama-server /models — using configured model name.', 'info')
    }
  }
  return `${m.provider}/${m.name ?? 'unknown'}`
}

interface TimingItem {
  type: 'feature' | 'bug'
  number: number
  startTime: number
}


/**
 * Build an OSC 8 hyperlink escape sequence wrapping `text` so terminals that
 * support it (iTerm2/Kitty/WezTerm/VS Code) render it as a clickable link.
 * Degrades gracefully to plain text in unsupported terminals.
 *
 * TODO(2026-10-15): If Approach A proves unreliable across terminals,
 * fall back to Approach B: custom footer via ctx.ui.setFooter(factory)
 * using <Link href={url}>PR #N</Link>. See Feature 35 in TODO.md.
 */
function osc8Link(url: string, text: string): string {
  if (!url) return text
  return `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`
}

/**
 * Guarded UI access for calls made outside a fresh handler/event scope
 * (timers, post-await code). Skips only when no ctx arrived yet; any other
 * failure is logged, never silenced.
 */
function safeSetStatus(ctx: ExtensionContext | null, key: string, text: string | undefined): void {
  if (!ctx) {
    console.error(`${EXTENSION} ❌ safeSetStatus() got a null ctx.`)
    return
  }
  try {
    ctx.ui.setStatus(key, text)
  } catch (err) {
    console.error(`${EXTENSION} ❌ safeSetStatus() failed.`, err)
  }
}

function safeNotify(message: string, type: 'info' | 'warning' | 'error'): void {
  if (!latestCtx) {
    console.error(`${EXTENSION} ❌ safeNotify() got a null ctx`)
    console.info(`${EXTENSION} ${message}`)
    return
  }
  try {    
    latestCtx.ui.notify(message, type)
  } catch (err) {
    console.error(`${EXTENSION} ❌ safeNotify() failed.`, err)
  }
}

function startStatusTimer(): void {
  stopStatusTimer()
  if (!pending) return
  const refresh = () => {
    if (!pending) { stopStatusTimer(); return }
    const emoji = pending.type === 'feature' ? '☑️' : '🐛'
    safeSetStatus(latestCtx, STATUS_KEY_TASK, `${emoji} ${pending.type === 'feature' ? 'Feature' : 'Bug'} ${pending.number} (${formatElapsed(Date.now() - pending.startTime)})`)
  }
  refresh()
  statusTimer = setInterval(refresh, STATUS_UPDATE_MS)
}

function stopStatusTimer(): void {
  if (statusTimer) clearInterval(statusTimer)
  statusTimer = null
}

// TODO is the fff part really needed ?
// timestamp -> YYYY-MM-DD HH:mm:ss.fff
function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`
}

const ensureTodoDir = (): Promise<void> => 
    fs.mkdir(TODO_FEATURES_DIR, { recursive: true })
        .catch((err) => { console.error('Failed to create features directory.', err)})
        .then(_ => {})


/**
 * Append the unified execution report to the open PR of the current branch.
 * Returns true when the report is present in the PR body (added or already there).
 */
function appendReportToPr(cwd: string, report: string): boolean {
  try {
    const branch = execSync('git branch --show-current', { cwd, encoding: 'utf-8' }).trim()
    if (!branch || branch === 'main' || branch === 'master') return false

    //const prNumber = getBranchOpenPr(branch)
    const listRes = spawnSync(
      'gh', ['pr', 'list', '--head', branch, '--state', 'open', '--json', 'number'],
      { cwd, encoding: 'utf-8' },
    )
    if (listRes.status !== 0)
      throw new Error(`gh pr list failed (${listRes.status}): ${listRes.stderr}`)
    const prs = JSON.parse(listRes.stdout) as Array<{ number: number }>
    const pr = prs[0]
    if (!pr) {
      console.error(`[${EXTENSION} ❌ PR not found on branch '${branch}'.`)
      return false
    }

    const viewRes = spawnSync(
      'gh', ['pr', 'view', String(pr.number), '--json', 'body'],
      { cwd, encoding: 'utf-8' },
    )
    if (viewRes.status !== 0)
      throw new Error(`gh pr view failed (${viewRes.status}): ${viewRes.stderr}`)
    const body = ((JSON.parse(viewRes.stdout) as { body?: string }).body ?? '').trimEnd()

    // First push only — do not duplicate the report after review rework
    if (/^### (Feature|Bug) agent work report$/m.test(body)) return true

    const editRes = spawnSync(
      'gh', ['pr', 'edit', String(pr.number), '--body', `${body}\n\n${report}`],
      { cwd, encoding: 'utf-8' },
    )
    if (editRes.status !== 0)
      throw new Error(`gh pr edit failed (${editRes.status}): ${editRes.stderr}`)
    debug(`Report appended to PR #${pr.number} description`)
    return true
  } catch (err) {
    console.error(`${EXTENSION} ❌ Failed to attach report to PR:`, err)
    return false
  }
}

// Checkout main + pull so we read the latest TODO.md; notifies with the real error on failure.
function pullLatestMain(cwd: string): boolean {
  try {
    // --rebase reconciles divergent branches without a merge commit;
    // --autostash keeps uncommitted work out of the way.
    execSync('git checkout main && git pull --rebase --autostash', {
      cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    safeNotify(`Moved to updated main branch`, 'info')
    return true
  } catch (err) {
    const e = err as { stderr?: string; message: string }
    const detail = (e.stderr ?? '').trim() || e.message
    safeNotify(`❌ Git update failed: ${detail}`, 'error')
    return false
  }
}

interface PrView {
  number: number
  state: string
  mergeable: string    // 'CONFLICTING'
  statusCheckRollup: Array<{ status: 'IN_PROGRESS' | 'QUEUED' | 'COMPLETED', conclusion: string }>  // 'FAILURE' | 'CANCELLED'
  reviewDecision: string | null
  reviews: Array<{ state: string; body: string }>
  url?: string
}

export default function todoFeatureExtension(pi: ExtensionAPI) {

  const clearPending = (ctx: ExtensionContext): void => {
    if (!pending) return
    stopStatusTimer()
    stopPrCheckPolling()
    safeSetStatus(ctx, STATUS_KEY_TASK, undefined)
    pending = null
  }

  // Return the open PR on a branch.
  const getBranchOpenPr = (cwd: string, branch: string): PrView | null => {
    const res = spawnSync(
      'gh', ['pr', 'list', '--head', branch, '--state', 'open', '--json', 'number,state,mergeable,statusCheckRollup,reviewDecision,reviews,url'],
      { cwd, encoding: 'utf-8' },
    )

    // A non-zero status is a real gh failure.
    if (res.status !== 0)
      throw new Error(`gh call failed (${res.status}): ${res.stderr}`)

    const prs: PrView[] = JSON.parse(res.stdout) // [] when no PR — no exception, no regex
    return prs[0] ?? null // assume there is 1 PR and points to "main"
  }

  const checkPrReview = async (cwd: string): Promise<void> => {
    debug("checkPrReview")
    safeNotify(`Checking PR review ...`, "info")
    checkCounter++
    safeSetStatus(latestCtx, STATUS_KEY_PR, `👁️‍🗨️ (checking PR ${checkCounter})`)

    if (prCheckInFlight) return

    // Safenet: stop polling after PR_CHECKING_MAX_MS even without a reviewer decision.
    if (Date.now() - prCheckStartedAt > PR_CHECKING_MAX_MS) {
      stopPrCheckPolling()
      const prRef = watchedPr ? ` Waiting for the review of ${osc8Link(watchedPr.url, `PR #${watchedPr.number}`)}.` : ''
      pi.sendMessage({ customType: `${EXTENSION}-stop-pr-check-polling`, content: `⏸️ Stopped watching for PR review (time limit reached).${prRef}`, display: true, details: {} })
      return
    }

    prCheckInFlight = true

    try {
      const branch = execSync('git branch --show-current', { cwd, encoding: 'utf-8' }).trim()
      if (!branch || branch === 'main' || branch === 'master') return

      let pr: PrView|null
      try {
        pr = getBranchOpenPr(cwd, branch)
      } catch (err) {
        safeNotify(`Checking PR review: ❌ Failed to get PR of branch "${branch}"`, "info")
        safeSetStatus(latestCtx, STATUS_KEY_PR, undefined)
        debug(`Failed to get PR of branch "${branch}"`)
        console.error(`${EXTENSION} ❌ Failed to get PR of branch "${branch}". `, err)
        return
      }

      if (pr == null) {
        safeSetStatus(latestCtx, STATUS_KEY_PR, "PR is null")
        debug(`No open PR on the branch "${branch}"`)
        return // no open PR on this branch yet
      }

      watchedPr = { number: pr.number, url: pr.url ?? '' }

      debug(`PR "#${watchedPr.number}" found on the branch "${branch}"`)

      // Update polling status indicator with clickable PR reference
      if (latestCtx) {
        debug("Update PR status")
        safeSetStatus(latestCtx, STATUS_KEY_PR, `👁️ ${osc8Link(watchedPr.url, `PR #${watchedPr.number} (${pr.state}) (${checkCounter})`)}`)
      }
      else 
        console.error(`${EXTENSION} ❌ latestCtx is null`)

      // TODO: inject a message to manage PR checks (workflows?)
      //if (pr.statusCheckRollup.findIndex( s => s.conclusion))

      if (pr.state === 'MERGED') {
        
        safeNotify(`✅ PR MERGED !`, 'info')

        try {
          pi.sendUserMessage('/todo Previuos PR was merged, cleanup stale branch.', { deliverAs: 'followUp' })
        } catch (err) {
          console.error(`${EXTENSION} ❌ Failed to send /todo command:`, err)
        }
        stopPrCheckPolling()
        return
      }

      // Check PR-level reviewDecision first
      const decision = pr.reviewDecision ?? ''

      // TODO: temporary debug message, ignore in PR review
      safeNotify(`PR decision is '${decision}' (${checkCounter}) `, "info") 

      // Also check individual reviews for CHANGES_REQUESTED (covers cases where reviewDecision is not yet updated)
      const hasChangesRequested = pr.reviews?.some(r => r.state === 'CHANGES_REQUESTED') ?? false

      // When required status checks fail, GitHub returns null for reviewDecision — even if you clicked Approve!
      // Fall back to individual reviews to detect the approval.
      const hasApprovalInReviews = !decision && !hasChangesRequested
        && (pr.reviews?.some(r => r.state === 'APPROVED') ?? false)

      const hasConflicts = pr.mergeable === "CONFLICTING"

      // Effective decision: prefer aggregate, fall back to individual reviews
      const effectiveDecision = decision || (hasApprovalInReviews ? 'APPROVED' : '')

      // Avoid re-processing the same decision
      const key = `${pr.number}:${effectiveDecision}:${hasChangesRequested}`
      if ((effectiveDecision !== 'APPROVED' && effectiveDecision !== 'CHANGES_REQUESTED' && !hasChangesRequested) || handledReviewDecisions.has(key)) {
        return
      }
      handledReviewDecisions.set(key, effectiveDecision)

      if (effectiveDecision === 'APPROVED') {
        const note = hasApprovalInReviews && !decision ? ' (checks may be blocking formal decision)' : ''
        pi.sendMessage({ customType: `${EXTENSION}-approved`, content: `✅ ${osc8Link(pr.url ?? '', `PR #${pr.number}`)} approved${note} — waiting for merge.`, display: true, details: {} })
      } else if (effectiveDecision === 'CHANGES_REQUESTED' || hasChangesRequested) {
        pi.sendUserMessage(
          `❌ PR was reviewed and Rejected. Follow the instructions in AGENTS.md`,
          { deliverAs: 'followUp' }
        )
      }

      if (hasConflicts)
        pi.sendUserMessage(`PR #${pr.number} has conflicts with base — rebase and push`, { deliverAs: "followUp",  } )

    } catch (err) {
      console.error(`${EXTENSION} ❌ checkPrReview() `, err)
      safeNotify(`❌ checkPrReview() failed. ${err}`, "error")      
    } finally {
      prCheckInFlight = false
    }
  }

  const startPrCheckPolling = (cwd: string): void => {
    debug("startPrCheckPolling()")
    safeNotify(`Start PR check...`, "info")
    stopPrCheckPolling()
    prCheckStartedAt = Date.now()
    handledReviewDecisions.clear()
    watchedPr = null
    prCheckTimer = setInterval(() => { void checkPrReview(cwd) }, PR_CHECK_INTERVAL_MS)
    // Initial polling status will be set on first checkPrReview run
  }

  const stopPrCheckPolling = (): void => {
    //debug("stopPrCheckPolling()")
    if (prCheckTimer) clearInterval(prCheckTimer)
    prCheckTimer = null
    checkCounter = 0
    safeSetStatus(latestCtx, STATUS_KEY_PR, undefined)
  }

  // Track the latest ctx from every event that delivers one; command handlers also
  // refresh it (see startTask). Timer callbacks never use a captured ctx directly.
  pi.on('session_start', (_event, ctx: ExtensionContext) => {    
    latestCtx = ctx
    // Session replacement (e.g. /new, model switch, context overflow) fires
    // session_shutdown, which stops both watchers but leaves `pending` alive at
    // module scope (the user does not re-run /feature N). If an activity is still
    // active, resume polling and the elapsed-time ticker with the fresh ctx.
    if (pending) {
      startPrCheckPolling(ctx.cwd ?? process.cwd())
      startStatusTimer()
    }
  })

  pi.on('session_shutdown', () => {
    stopPrCheckPolling()
    stopStatusTimer()
  })

  // Helper to parse command arguments for feature/bug
  // return number as 0 when command it is called with "end" argument
  function parseCommandArgs(args: string): { number: number; note: string | undefined; error: string | null } {
    const trimmed = args.trim()
    if (trimmed === 'end' || trimmed === 'clean') {
      return { number: 0, note: undefined, error: null } // special case handled outside
    }
    // Try to parse feature/bug number
    const numberMatch = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)\s*(.*)$/)
    if (!numberMatch) {
      return { number: 0, note: undefined, error: '❌ Usage: /feature <number> [optional note]  —  e.g. /feature 10 or /feature 10 ignore existing PR' }
    }

    let number: number
    let note: string | undefined

    number = parseFloat(numberMatch[1])
    if (isNaN(number) || number <= 0) {
      return { number: 0, note: undefined, error: '❌ Usage: /feature <number> [optional note]  —  e.g. /feature 10 or /feature 10 ignore existing PR' }
    }

    // Group 2 may be absent depending on the regex engine — guard before accessing.
    const notePart = numberMatch.length > 2 ? (numberMatch[2] ?? '').trim() : ''
    if (notePart) {
      // Remove surrounding quotes if present
      if ((notePart.startsWith('"') && notePart.endsWith('"')) ||
          (notePart.startsWith("'") && notePart.endsWith("'"))) {
        note = notePart.slice(1, -1).trim()
      } else {
        note = notePart
      }
    }

    return { number, note, error: null }
  }

  // Shared logic for starting a feature/bug activity (used by /feature and /bugfix).
  async function startTask(ctx: ExtensionCommandContext, type: 'feature' | 'bug', number: number, note: string | undefined): Promise<void> {
    latestCtx = ctx // handler-delivered ctx is fresh
    const projectRoot = ctx.cwd ?? process.cwd()
    taskProjectRoot = projectRoot
    const END = 0 // "end" command argument is managed to send "0"

    if (number === END) {
      if (!pending) {
        safeNotify('❌ No active feature or bug to end.', 'info')
        return
      }
      const { type: pendingType, number: pendingNumber } = pending
      stopPrCheckPolling()
      clearPending(ctx)
      safeNotify(`${pendingType === 'feature' ? 'Feature' : 'Bug'} ${pendingNumber} cancelled - no timing saved.`, 'info')
      return
    }

    // Auto-cancel any pending activity before starting a new one
    if (pending)
      clearPending(ctx)

    await ensureTodoDir()

    const startTime = Date.now()
    const fileName = `${type}_${number}.txt`
    const filePath = path.join(TODO_FEATURES_DIR, fileName)
    const startContent = `START: ${formatTime(startTime)}\n`
    await fs.writeFile(filePath, startContent, 'utf8')

    // Run git checkout main && git pull before sending the prompt
    const onMain = pullLatestMain(projectRoot)

    // Check the number refers to an exising Feature or Bug entry in TODO.md
    let content: string
    try {
      content = await fs.readFile(path.join(projectRoot, 'TODO.md'), 'utf8')
    } catch {
      safeNotify(`❌ Could not read TODO.md - cannot check if the feature/bug ${number} exists.`, 'error')
      return
    }

    const matches = [...content.matchAll(/^[-*]\s+(Feature|Bug)\s+(\d+(?:\.\d+)?)\b/mg)]
        .filter(m => parseFloat(m[2]) === number)
    if (matches.length === 0) {
      safeNotify(`❌ No "Feature ${number}" or "Bug ${number}" found in the TODO backlog.`, 'error')
      return
    }

    /*
    // Auto-detect if number refers to a Feature or a Bug
    if (new Set(matches.map(m => m[1])).size > 1) {
      safeNotify(`\u274c Ambiguous: "${number}" exists as both a Feature and a Bug in the TODO backlog. Use /feature or specify which one.`, 'error')
      return
    }
    */

    pending = { type, number, startTime }
    completed = false

    const label = type === 'feature' ? 'Feature' : 'Bug'
    const emoji = pending.type === 'feature' ? '☑️' : '🐛'
    try {
      pi.setSessionName(`${emoji} ${label} ${pending.number}`)
    } catch {
        safeNotify(`❌ Failed to set the session name.`, 'error')
    }

    startStatusTimer()
    //startPrCheckPolling(projectRoot)

    // Inject the task to the agent — code is already up to date
    let agentMessage = type === 'feature'
      ? `Implement feature ${number}.\nIf the feature is not present in the TODO backlog or the task is not 100% clear, ask for clarification from the user. ` +
        (onMain ? `The code is already on main and up to date. ` : "") +
        `The feature number is ${number}. ` +
        `If the feature is too big or need to work on different areas, split in multiple tasks. Add them to the TODO. ` +
        `After you publish or update the PR, resolve conflicts with main if there are any. ` + 
        `**IMPORTANT**: after you publish or update the PR, include "[FEATURE ${number} COMPLETED]" in your reply to the user (not only in the PR description) so the timer can record the elapsed time.`
      : `Fix bug ${number}.\nIf the bug is not present in the TODO backlog or the task is not 100% clear, ask for clarification from the user. ` +
        (onMain ? `The code is already on main and up to date. ` : "") +
        `The bug number is ${number}. ` +
        `**IMPORTANT**: after you publish or update the PR, include "[BUGFIX ${number} COMPLETED]" in your reply to the user (not only in the PR description) so the timer can record the elapsed time.`

    // Optional note: simply append to the instruction message.
    if (note) {
      agentMessage = agentMessage + `${note}. `
    }

    // Start a fresh session so the agent begins the task on clean state, State (todo-task, timers, START file) survives the switch.
    const abortStart = (freshCtx: ExtensionContext | null): void => {
      stopPrCheckPolling()
      stopStatusTimer()
      pending = null
      completed = false
      safeSetStatus(freshCtx, STATUS_KEY_TASK, undefined)
      safeSetStatus(freshCtx, STATUS_KEY_PR, undefined)
    }

    let replacementCtx: ExtensionContext | null = null
    try {
      const result = await ctx.newSession({
        withSession: async (newCtx) => {
          replacementCtx = newCtx
          latestCtx = newCtx
          try {
            await newCtx.waitForIdle()
            safeNotify(`${emoji} ${label} ${number} started. Elapsed time will be recorded.`, 'info')
            await newCtx.sendUserMessage(agentMessage, { deliverAs: 'steer' })

            // await newCtx.waitForIdle()
            startPrCheckPolling(projectRoot)
          } catch (err) {
            abortStart(newCtx)
            throw err
          }
        },
      })
      if (result.cancelled) abortStart(replacementCtx)
    } catch (err) {
      abortStart(replacementCtx)
      safeNotify(`❌ Failed to start fresh session for ${label} ${number}: ${err instanceof Error ? err.message : String(err)}`, 'error')
    }
  }

// ### register commands

  pi.registerCommand('feature', {
    description: 'Implement a feature from the TODO backlog. Usage: /feature <number> [note] or /feature end',
    handler: async (args, ctx) => {
      const { number, note, error } = parseCommandArgs(args)
      if (error) {
        ctx.ui.notify(error, 'error')
        return
      }
      await startTask(ctx, 'feature', number, note)
    },
  })

  // "/bug" is a built-in Pi interactive command, cannot be used.
  pi.registerCommand('bugfix', {
    description: 'Implement the fix for a bug from the TODO backlog. Usage: /bugfix <number> [note] or /bugfix end',
    handler: async (args, ctx) => {
      const { number, note, error } = parseCommandArgs(args)
      if (error) {
        ctx.ui.notify(error, 'error')
        return
      }
      await startTask(ctx, 'bug', number, note)
    },
  })

  pi.registerCommand('pr', {
    description: 'Check PR reviews. Continue to work on a PR. Usage: /pr [number]',
    handler: async (_args, ctx) => {      

      const projectRoot = ctx.cwd ?? process.cwd()
      taskProjectRoot = projectRoot
     
      // TODO if branch is main/master, switch to the PR branch
      const branch = execSync('git branch --show-current', { cwd:projectRoot, encoding: 'utf-8' }).trim()
      if (!branch || branch === 'main' || branch === 'master') {
        safeNotify("To call /pr you need to be on a branch different from the default one", "warning")
        return
      }

      //let pr: PrView|null
      //try {
      //  pr = getBranchOpenPr(projectRoot, branch)
      //} catch( error) {
      //
      //}

      //if (note) append a note using sendUserMessage

      // TODO: for now get the PR from the cirrent branch
      startPrCheckPolling(projectRoot)      
    },
  })

  // Detect the completion marker in assistant chat replies.
  // Accepts "[FEATURE N COMPLETED]" or "[BUGFIX N COMPLETED]" (N may be a float, e.g. 7.2);
  // a number must match the active pending item.
  pi.on('turn_end', (event: TurnEndEvent) => {
    if (!pending) return
    const { type, number: pendingNumber } = pending
    const msg = event.message
    if (msg?.role !== 'assistant') return
    const text = msg.content
      .filter((b:any): b is { type: 'text'; text: string } => b.type === 'text')
      .map(b => b.text).join('')
    // strip common model decorations (backticks/bold/whitespace) around the marker
    const cleaned = text.replace(/[\s`*_]+/g, ' ')
    let match: RegExpExecArray | null
    if (type === 'feature') {
      match = /\[FEATURE( \d+(?:\.\d+)?)? COMPLETED\]/i.exec(cleaned)
    } else {
      match = /\[BUGFIX( \d+(?:\.\d+)?)? COMPLETED\]/i.exec(cleaned)
    }
    if (!match) return
    // if a number was given it must refer to the active pending item
    if (match[1] !== undefined && parseFloat(match[1]) !== pendingNumber) return
    completed = true
  })

  // Finalize once the run has fully settled (no retries/compactions/queued continuations
  // pending) so sendUserMessage does not hit "Agent is already processing".
  // If the run ended without a completion signal (e.g. the agent asked a question),
  // the timer keeps running until the marker is seen or /feature end / /bug end cancels it.
  pi.on('agent_settled', async (_event: AgentSettledEvent, ctx: ExtensionContext) => {
    latestCtx = ctx
    if (!pending || !completed) return
    await finishActivity(ctx)
  })
}

async function finishActivity(ctx: ExtensionContext): Promise<void> {  
  if (!pending || !completed) return
  latestCtx=ctx

  const endTime = Date.now()
  const elapsedMs = endTime - pending.startTime
  const elapsedMinutes = (elapsedMs / 60000).toFixed(1)

  const fileName = pending.type === 'feature' ? `feature_${pending.number}.txt` : `bug_${pending.number}.txt`
  const filePath = path.join(TODO_FEATURES_DIR, fileName)

  // Get model info
  const modelName = await resolveModelName()
  let tokens: number | null = null
  try {
    // ctx may have gone stale during the awaited calls above; token count is best-effort
    tokens = ctx.getContextUsage()?.tokens ?? null
  } catch (err) {
    console.error(`${EXTENSION} ❌ getContextUsage() `, err)
  }

  const label = pending.type === 'feature' ? 'Feature' : 'Bug'
  const report = 
    `## AI agent execution report \n
    _(first push only, without following reviews rework)_ \n
     🤖 Model: ${modelName} \n
     ⏲️ Time: ${elapsedMinutes} minutes \n
     💰 Tokens: ${tokens??"n/a"}`

  // Append to the file
  try {
    const existing = await fs.readFile(filePath, 'utf8')
    await fs.writeFile(filePath, existing + report, 'utf8')
  } catch {
    await fs.writeFile(filePath, report, 'utf8')
  }

  // ctx was used after awaits above — guard via helpers (skip only when null, log otherwise)
  safeNotify(`✅ ${label} ${pending.number} completed in ${elapsedMinutes} minutes.`, 'info')
  stopStatusTimer()
  safeSetStatus(ctx, STATUS_KEY_TASK, undefined)

  if (!taskProjectRoot) {
    console.error(`[${EXTENSION}] ❌ finishActivity(). Unexpected taskProjectRoot: '${taskProjectRoot}'.`)
  }

  // Write the report directly into the open PR description (no chat pollution)
  if (taskProjectRoot && appendReportToPr(taskProjectRoot, report)) {
    //safeNotify(ctx, `📝 Execution report added to the PR description.`, 'info')
  } else {
    safeNotify(`⚠️ No open PR found on the current branch — execution report not attached to a PR.`, 'warning')
  }

  pending = null
  completed = false
}
