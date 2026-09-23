// ~/.pi/agent/extensions/todo-feature.ts
/**
 * /feature N — Implements a feature from the TODO backlog and measures elapsed time.
 * /feature end — Ends the current feature without saving timing (unreliable).
 *
 * Only one feature can be active at a time. Starting a new feature
 * auto-cancels the previous one without saving timing.
 *
 * Usage:
 *   /feature 10    — Start implementing feature 10 from the TODO backlog.
 *   /feature 7.1   — Start implementing a sub-feature (float numeration supported).
 *   /feature end   — End the current feature without saving timing data.
 *
 * The extension:
 *   1. Runs `git checkout main && git pull` to ensure up-to-date code
 *   2. Writes START:<timestamp> to ~/.pi/agent/feature-times/feature_<N>.txt
 *   3. Injects a message to the agent: "Implement feature N..."
 *   4. When the agent signals "[FEATURE N COMPLETED]" on turn_end,
 *      on agent_settled writes END:<timestamp> and ELAPSED MINUTES to the file
 *   5. Injects a follow-up message: "Write in the PR that this task required NN minutes."
 *   6. Clears the status bar entry for the completed feature.
 *
 * While a feature session is active it also polls GitHub every ~20s (max 2h):
 * if the reviewer APPROVED the PR a notification is shown (the user usually merges);
 * if CHANGES_REQUESTED the agent is told to follow the AGENTS.md review workflow;
 * when the PR is MERGED the watcher stops. Polling ends on `/feature end`.
 */

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI, ExtensionContext, TurnEndEvent, AgentSettledEvent } from '@earendil-works/pi-coding-agent'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'

const FEATURE_DIR = path.join(process.env.HOME ?? '', '.pi', 'agent', 'todo-features')
const STATUS_KEY = "alex-piccione-todo-feature"

interface FeatureTiming {
  featureNumber: number
  startTime: number
}

let pendingFeature: FeatureTiming | null = null
let featureCompleted = false

// PR review polling cadence — keeps the agent working without user prompts.
const POLL_INTERVAL_MS = 20_000
// Safenet: stop polling after this long even if no decision was made (can be increased later).
const POLL_MAX_MS = 2 * 60 * 60 * 1000

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

function ensureFeatureDir(): Promise<void> {
  try {
    return fs.mkdir(FEATURE_DIR, { recursive: true })
  } catch {
    return Promise.resolve()
  }
}

// Checkout main + pull so we read the latest TODO.md; notifies with the real error on failure.
function pullLatestMain(ctx: ExtensionContext, cwd: string): boolean {
  try {
    execSync('git checkout main && git pull', {
      cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    return true
  } catch (err) {
    const e = err as { stderr?: string; message: string }
    const detail = (e.stderr ?? '').trim() || e.message
    ctx.ui.notify(`❌ Git update failed: ${detail}`, 'error')
    return false
  }
}

function clearPendingFeature(ctx: ExtensionContext): void {
  if (!pendingFeature) return
  ctx.ui.setStatus(STATUS_KEY, undefined)
  pendingFeature = null
}

interface PrView {
  number: number
  state: string
  reviewDecision: string | null
  reviews: Array<{ state: string; body: string }>
}

export default function todoFeatureExtension(pi: ExtensionAPI) {
  // PR review polling — simple timer pattern (see llama-server-model.ts):
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
        } catch {
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
    } catch {
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
  })

  pi.registerCommand('feature', {
    description: 'Implement a feature from the TODO backlog. Usage: /feature <number> or /feature end',
    handler: async (args, ctx) => {
      const trimmed = args.trim()
      const projectRoot = ctx.repoPath ?? process.cwd()

      // /feature end — cancel current feature without saving timing
      if (trimmed === 'end' || trimmed === 'clean') {
        if (!pendingFeature) {
          ctx.ui.notify('ℹ️ No active feature to end.', 'info')
          return
        }
        const featureNumber = pendingFeature.featureNumber
        stopPrPolling()
        clearPendingFeature(ctx)
        ctx.ui.notify(`⛔ Feature ${featureNumber} cancelled — no timing saved.`, 'info')
        return
      }

      const featureNumber = parseFloat(trimmed)
      if (isNaN(featureNumber) || featureNumber <= 0) {
        ctx.ui.notify('❌ Usage: /feature <number>  —  e.g. /feature 10 or /feature 7.1', 'error')
        return
      }

      // Auto-clean any pending feature before starting a new one
      if (pendingFeature) 
        clearPendingFeature(ctx)      

      await ensureFeatureDir()

      const startTime = Date.now()
      const featureFile = path.join(FEATURE_DIR, `feature_${featureNumber}.txt`)
      const startContent = `START: ${formatTime(startTime)}\n`
      await fs.writeFile(featureFile, startContent, 'utf8')

      // Run git checkout main && git pull before sending the prompt
      const onMain = pullLatestMain(ctx, projectRoot)

      pendingFeature = { featureNumber, startTime }
      featureCompleted = false

      startPrPolling(projectRoot)

      ctx.ui.notify(`⏱️ Feature ${featureNumber} started. Elapsed time will be recorded.`, 'info')
      ctx.ui.setStatus(STATUS_KEY, `☑️ Feature ${featureNumber}`)

      // Inject the task to the agent — code is already up to date
      pi.sendUserMessage(
        `Implement feature ${featureNumber}.\n If the feature is not present in the TODO backlog or the task is not 100% clear, ask for clarification from the user. ` +
         (onMain ? `The code is already on main and up to date. ` : "") +
        `The feature number is ${featureNumber}. ` +
        `**IMPORTANT**: after you publish or update the PR, include "[FEATURE ${featureNumber} COMPLETED]" in your reply to the user (not only in the PR description) so the timer can record the elapsed time.`
      )
    },
  })

  // Detect the completion marker in assistant chat replies.
  // Accepts "[FEATURE COMPLETED]" or "[FEATURE N COMPLETED]"; a number must match the active feature.
  pi.on('turn_end', (event: TurnEndEvent) => {
    const n = pendingFeature?.featureNumber
    if (n === undefined || featureCompleted) return
    const msg = event.message
    if (msg?.role !== 'assistant') return
    const text = msg.content
      .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
      .map(b => b.text).join('')
    // strip common model decorations (backticks/bold/whitespace) around the marker
    const cleaned = text.replace(/[\s`*_]+/g, ' ')
    const match = /\[FEATURE( \d+)? COMPLETED\]/i.exec(cleaned)
    if (!match) return
    // if a number was given it must refer to the active feature
    if (match[1] !== undefined && parseInt(match[1], 10) !== n) return
    featureCompleted = true
  })

  // Finalize once the run has fully settled (no retries/compactions/queued continuations
  // pending) so sendUserMessage does not hit "Agent is already processing".
  // If the run ended without a completion signal (e.g. the agent asked a question),
  // the timer keeps running until the marker is seen or /feature end cancels it.
  pi.on('agent_settled', async (_event: AgentSettledEvent, ctx: ExtensionContext) => {
    if (!pendingFeature || !featureCompleted) return
    await finishFeature(ctx, pi)
  })
}

async function finishFeature(ctx: ExtensionContext, pi: ExtensionAPI): Promise<void> {
  if (!pendingFeature || !featureCompleted) return

  const endTime = Date.now()
  const elapsedMs = endTime - pendingFeature.startTime
  const elapsedMinutes = (elapsedMs / 60000).toFixed(1)

  const filePath = path.join(FEATURE_DIR, `feature_${pendingFeature.featureNumber}.txt`)
  const endContent = `START: ${formatTime(pendingFeature.startTime)}\nEND: ${formatTime(endTime)}\nELAPSED MINUTES: ${elapsedMinutes}\n`

  // Get model info
  const modelName = ctx.model?.name ?? 'unknown'
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

  ctx.ui.notify(`✅ Feature ${pendingFeature.featureNumber} completed in ${elapsedMinutes} minutes.`, 'info')
  ctx.ui.setStatus(STATUS_KEY, undefined)

  // Inject follow-up message to write the PR timing
  pi.sendUserMessage(
    `Write in the PR that this feature required ${elapsedMinutes} minutes. ` +
    `Write also that is used the model ${modelName} and used ${tokens} tokens.`,
    { streamingBehavior: "followUp" }
  )

  pendingFeature = null
  featureCompleted = false
}
