// ~/.pi/agent/extensions/todo-feature.ts
/**
 * /feature N — Implements a feature from the TODO backlog and measures elapsed time.
 * /feature N [note] — Optionally includes a note with the feature start.
 * /feature end — Ends the current feature without saving timing (unreliable).
 *
 * /bugfix N — Fixes a bug from the TODO backlog and measures elapsed time.
 * /bugfix N [note] — Optionally includes a note with the bug start.
 * /bugfix end — Ends the current bug without saving timing (unreliable).
 *
 * Only one activity (feature or bug) can be active at a time. Starting a new one
 * auto-cancels the previous one without saving timing.
 *
 * Usage:
 *   /feature 10                      — Start implementing feature 10 from the TODO backlog.
 *   /feature 10 ignore existing PR   — Start feature 10 with note "ignoring existing PR".
 *   /feature 10 "ignore existing PR" — Start feature 10 with note "ignoring existing PR".
 *   /feature 7.1                     — Start implementing a feature 7.1.
 *   /feature end                     — End the current feature without saving timing data.
 *
 *   /bugfix 7                        — Start fixing bug 7 from the TODO backlog.
 *   /bugfix 7 ignore existing PR     — Start bug 7 with note "ignoring existing PR".
 *   /bugfix 7 "my custom note"       — Start bug 7 with note "ignoring existing PR"
 *   /bugfix end                      — End the current bug without saving timing data.
 *
 * The extension:
 *   1. Move to updated main branch to look at up-to-date TODO
 *   2. Writes START:<timestamp> to ~/.pi/agent/todo-features/feature_<N>.txt or bug_<N>.txt
 *   3. Injects a message to the agent: "Implement feature N..." or "Fix bug N..."
 *   4. When the agent signals "[FEATURE N COMPLETED]" or "[BUGFIX N COMPLETED]" on turn_end,
 *      on agent_settled writes END:<timestamp> and ELAPSED MINUTES to the file
 *   5. Injects a follow-up message: "Write in the PR that this task required NN minutes."
 *   6. Clears the status bar entry for the completed activity.
 *
 * While a feature/bug runs the status bar shows the live elapsed time (MM:SS), refreshed every 15s.
 *
 * While a feature/bug session is active it also polls GitHub every ~20s (max 2h):
 * if the reviewer APPROVED the PR a notification is shown (the user usually merges);
 * if CHANGES_REQUESTED the agent is told to follow the AGENTS.md review workflow;
 * when the PR is MERGED the watcher stops. 
 * Polling is forced to ends on `/feature end` or `/bug end` (useful for stale polling).
 */

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI, ExtensionContext, TurnEndEvent, AgentSettledEvent } from '@earendil-works/pi-coding-agent'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'

const TODO_FEATURES_DIR = path.join(process.env.HOME ?? '', '.pi', 'agent', 'todo-features')
const STATUS_KEY = "alex-piccione-todo-feature"
const LOCAL_LLAMA_CPP_PROVIDER = 'Llama.cpp'  // Provider id used for local LLMs served by llama-server (in models.json Pi file)

/**
 * Resolve the model actually serving requests, formatted as `<provider>/<model>`.
 * For the local Llama.cpp provider the configured name may be stale,
 * so we query the OpenAI-compatible `${baseUrl}/models` endpoint instead.
 */
async function resolveModelName(ctx: ExtensionContext): Promise<string> {
  const m = ctx.model
  if (!m) return 'unknown'
  if (m.provider === LOCAL_LLAMA_CPP_PROVIDER && m.baseUrl) {
    try {
      // Assumption: ONLY ONE model is loaded on llama-server at a time — pick it.
      const res = await fetch(`${m.baseUrl}/models`)
      const data = (await res.json()) as { data?: Array<{ id: string }> }
      const id = data.data?.[0]?.id
      if (id) return `${m.provider}/${id}`
    } catch {
      ctx.ui.notify('ℹ️ Could not reach llama-server /models — using configured model name.', 'info')
    }
  }
  return `${m.provider}/${m.name ?? 'unknown'}`
}

interface TimingItem {
  type: 'feature' | 'bug'
  number: number
  startTime: number
}

let pending: TimingItem | null = null
let completed = false

// Status-bar elapsed-time ticker — refreshes the ☑️ status while a feature/bug runs.
const STATUS_UPDATE_MS = 15_000
let statusTimer: ReturnType<typeof setInterval> | null = null

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`
}

function stopStatusTimer(): void {
  if (statusTimer) clearInterval(statusTimer)
  statusTimer = null
}

function startStatusTimer(ctx: ExtensionContext): void {
  stopStatusTimer()
  if (!pending) return
  const refresh = () => {
    if (!pending) { stopStatusTimer(); return }
    const emoji = pending.type === 'feature' ? '☑️' : '🐛'
    ctx.ui.setStatus(STATUS_KEY, `${emoji} ${pending.type === 'feature' ? 'Feature' : 'Bug'} ${pending.number} (${formatElapsed(Date.now() - pending.startTime)})`)
  }
  refresh()
  statusTimer = setInterval(refresh, STATUS_UPDATE_MS)
}

// PR review polling cadence — keeps the agent working without user prompts.
const POLL_INTERVAL_MS = 20_000
// Safenet: stop polling after this long even if no decision was made (can be increased later).
const POLL_MAX_MS = 2 * 60 * 60 * 1000

// TODO is the fff part really required or usefull ?
// timestamp -> YYYY-MM-DD HH:mm:ss.fff
function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

function ensureTodoDir(): Promise<void> {
  try {
    return fs.mkdir(TODO_DIR, { recursive: true })
  } catch {
    return Promise.resolve()
  }
}

// Checkout main + pull so we read the latest TODO.md; notifies with the real error on failure.
function pullLatestMain(ctx: ExtensionContext, cwd: string): boolean {
  try {
    // --rebase reconciles divergent branches without a merge commit;
    // --autostash keeps uncommitted work out of the way.
    execSync('git checkout main && git pull --rebase --autostash', {
      cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    ctx.ui.notify(`Moved to updated main branch`, 'info')
    return true
  } catch (err) {
    const e = err as { stderr?: string; message: string }
    const detail = (e.stderr ?? '').trim() || e.message
    ctx.ui.notify(`❌ Git update failed: ${detail}`, 'error')
    return false
  }
}

function clearPending(ctx: ExtensionContext): void {
  if (!pending) return
  stopStatusTimer()
  ctx.ui.setStatus(STATUS_KEY, undefined)
  pending = null
}

interface PrView {
  number: number
  state: string
  reviewDecision: string | null
  reviews: Array<{ state: string; body: string }>
}

export default function todoFeatureExtension(pi: ExtensionAPI) {
  // closure-local state, cleaned up when the session shuts down.
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let pollStartedAt = 0
  let pollInFlight = false
  const handledReviewDecisions = new Map<string, string>()

  const stopPrPolling = (): void => {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = null
  }

  const checkPrReview = async (cwd: string): Promise<void> => {
    if (pollInFlight) return
    // Safenet: stop polling after POLL_MAX_MS even without a reviewer decision.
    if (Date.now() - pollStartedAt > POLL_MAX_MS) {
      stopPrPolling()
      pi.sendMessage({ customType: 'todo-feature', content: '⏸️ Stopped watching for PR review (2h limit reached).', display: true, details: {} })
      return
    }
    pollInFlight = true
    try {
      const branch = execSync('git branch --show-current', { cwd, encoding: 'utf-8' }).trim()
      if (!branch || branch === 'main' || branch === 'master') return

      let pr: PrView
      try {
        pr = JSON.parse(execSync('gh pr view --json number,state,reviewDecision,reviews', {
          cwd,
          encoding: 'utf-8',
          stdio: 'pipe',
        }))
      } catch {
        return // no open PR on this branch yet
      }

      if (pr.state === 'MERGED') {
        // Nothing to do besides refreshing the TODO list; the agent never merges itself.
        try {
          pi.sendUserMessage('/todo', { streamingBehavior: 'followUp' })
        } catch (err) {
          console.error('todo-feature: error sending /todo command:', err)
          // /todo command not available — just stop watching
        }
        stopPrPolling()
        return
      }

      const decision = pr.reviewDecision ?? ''
      const key = `${pr.number}:${decision}`
      if ((decision !== 'APPROVED' && decision !== 'CHANGES_REQUESTED') || handledReviewDecisions.has(key)) return
      handledReviewDecisions.set(key, decision)

      if (decision === 'APPROVED') {
        // The user usually merges an approved PR themselves — just notify and keep watching until merged.
        pi.sendMessage({ customType: 'todo-feature', content: `✅ PR #${pr.number} approved — waiting for merge.`, display: true, details: {} })
      } else {
        pi.sendUserMessage(
          `PR was reviewed and Rejected. Follow the instructions in AGENTS.md`,
          { streamingBehavior: 'followUp' }
        )
      }
    } catch (err) {
      console.error('todo-feature: error in checkPrReview:', err)
      // transient git/gh failure — retry on next tick
    } finally {
      pollInFlight = false
    }
  }

  const startPrPolling = (cwd: string): void => {
    stopPrPolling()
    pollStartedAt = Date.now()
    handledReviewDecisions.clear()
    pollTimer = setInterval(() => { void checkPrReview(cwd) }, POLL_INTERVAL_MS)
  }

  pi.on('session_shutdown', () => {
    stopPrPolling()
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
  async function startTask(ctx: ExtensionContext, type: 'feature' | 'bug', number: number, note: string | undefined): Promise<void> {
    const projectRoot = ctx.repoPath ?? process.cwd()
    const END = 0 // "end" command argument is managed to send "0"

    if (number === END) {
      if (!pending) {
        ctx.ui.notify('❌ No active feature or bug to end.', 'info')
        return
      }
      const { type: pendingType, number: pendingNumber } = pending
      stopPrPolling()
      clearPending(ctx)
      ctx.ui.notify(`${pendingType === 'feature' ? 'Feature' : 'Bug'} ${pendingNumber} cancelled - no timing saved.`, 'info')
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
    const onMain = pullLatestMain(ctx, projectRoot)

    // Check the number refers to an exising Feature or Bug entry in TODO.md
    let content: string
    try {
      content = await fs.readFile(path.join(projectRoot, 'TODO.md'), 'utf8')
    } catch {
      ctx.ui.notify(`❌ Could not read TODO.md - cannot check if the feature/bug ${number} exists.`, 'error')
      return
    }
    
    const matches = [...content.matchAll(/^[-*]\s+(Feature|Bug)\s+(\d+(?:\.\d+)?)\b/mg)]
        .filter(m => parseFloat(m[2]) === number)
    if (matches.length === 0) {
      ctx.ui.notify(`❌ No "Feature ${number}" or "Bug ${number}" found in the TODO backlog.`, 'error')
      return
    }

    /*
    // Auto-detect if number refers to a Feature or a Bug
    if (new Set(matches.map(m => m[1])).size > 1) {
      ctx.ui.notify(`\u274c Ambiguous: "${number}" exists as both a Feature and a Bug in the TODO backlog. Use /feature or specify which one.`, 'error')
      return
    }
    */

    pending = { type, number, startTime }
    completed = false

    startPrPolling(projectRoot)

    const label = type === 'feature' ? 'Feature' : 'Bug'
    const emoji = pending.type === 'feature' ? '☑️' : '🐛'
    ctx.ui.notify(`${emoji} ${label} ${number} started. Elapsed time will be recorded.`, 'info')
    startStatusTimer(ctx)

    // Inject the task to the agent — code is already up to date
    let agentMessage = type === 'feature'
      ? `Implement feature ${number}.\nIf the feature is not present in the TODO backlog or the task is not 100% clear, ask for clarification from the user. ` +
        (onMain ? `The code is already on main and up to date. ` : "") +
        `The feature number is ${number}. ` +
        `**IMPORTANT**: after you publish or update the PR, include "[FEATURE ${number} COMPLETED]" in your reply to the user (not only in the PR description) so the timer can record the elapsed time.`
      : `Fix bug ${number}.\nIf the bug is not present in the TODO backlog or the task is not 100% clear, ask for clarification from the user. ` +
        (onMain ? `The code is already on main and up to date. ` : "") +
        `The bug number is ${number}. ` +
        `**IMPORTANT**: after you publish or update the PR, include "[BUGFIX ${number} COMPLETED]" in your reply to the user (not only in the PR description) so the timer can record the elapsed time.`

    // Optional note: simply prepended as a prefix.
    if (note) {
      agentMessage = `${note}. ` + agentMessage
    }

    pi.sendUserMessage(agentMessage)
  }

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
    description: 'Start a feature or bug from the TODO backlog (type auto-detected). Usage: /bugfix <number> [note] or /bugfix end',
    handler: async (args, ctx) => {
      const { number, note, error } = parseCommandArgs(args)
      if (error) {
        ctx.ui.notify(error, 'error')
        return
      }
      await startTask(ctx, 'bug', number, note)
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
      .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
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
    if (!pending || !completed) return
    await finishActivity(ctx, pi)
  })
}

async function finishActivity(ctx: ExtensionContext, pi: ExtensionAPI): Promise<void> {
  if (!pending || !completed) return

  const endTime = Date.now()
  const elapsedMs = endTime - pending.startTime
  const elapsedMinutes = (elapsedMs / 60000).toFixed(1)

  const fileName = pending.type === 'feature' ? `feature_${pending.number}.txt` : `bug_${pending.number}.txt`
  const filePath = path.join(TODO_FEATURES_DIR, fileName)
  const endContent = `START: ${formatTime(pending.startTime)}\nEND: ${formatTime(endTime)}\nELAPSED MINUTES: ${elapsedMinutes}\n`

  // Get model info
  const modelName = await resolveModelName(ctx)
  const contextUsage = ctx.getContextUsage()
  const tokens = contextUsage?.tokens ?? null

  const modelInfo = `MODEL: ${modelName}\n`
  const tokensInfo = tokens !== null ? `TOKENS: ${tokens}\n` : ''
  const finalContent = endContent + modelInfo + tokensInfo

  // Append to the file
  try {
    const existing = await fs.readFile(filePath, 'utf8')
    await fs.writeFile(filePath, existing + finalContent, 'utf8')
  } catch {
    await fs.writeFile(filePath, finalContent, 'utf8')
  }

  ctx.ui.notify(`✅ ${pending.type === 'feature' ? 'Feature' : 'Bug'} ${pending.number} completed in ${elapsedMinutes} minutes.`, 'info')
  stopStatusTimer()
  ctx.ui.setStatus(STATUS_KEY, undefined)

  // Inject follow-up message to write the PR timing
  const activityName = pending.type === 'feature' ? 'feature' : 'bug'
  pi.sendUserMessage(
    `Write in the PR that this ${activityName} required ${elapsedMinutes} minutes. ` +
    `Write also that is used the model ${modelName} and used ${tokens} tokens.` +
    `No need to share this info here in the chat. Remember again the PR number and link to the user.`,
    { streamingBehavior: "followUp" }
  )

  pending = null
  completed = false
}
