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
 */

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI, ExtensionContext, ExtensionCommandContext, TurnEndEvent, AgentSettledEvent } from '@earendil-works/pi-coding-agent'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'

const FEATURE_DIR = path.join(process.env.HOME ?? '', '.pi', 'agent', 'todo-features')
const STATUS_KEY = "alex-piccione-todo-feature"
// Provider id used for local LLMs served by llama-server
const LOCAL_LLAMA_CPP_PROVIDER = 'Llama.cpp'

/**
 * Resolve the real model name actually serving requests.
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
      if (id) return id
    } catch {
      // server unreachable or unexpected payload — fall back to configured name
    }
  }
  return m.name ?? 'unknown'
}

interface FeatureTiming {
  featureNumber: number
  startTime: number
}

let pendingFeature: FeatureTiming | null = null
let featureCompleted = false

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

export default function featureTimerExtension(pi: ExtensionAPI) {
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
