// ~/.pi/agent/extensions/feature-timer.ts
/**
 * /feature N — Implements a feature from the TODO backlog and measures elapsed time.
 * /feature end — Ends the current feature without saving timing (unreliable).
 *
 * Only one feature can be active at a time. Starting a new feature
 * auto-cancels the previous one without saving timing.
 *
 * Usage:
 *   /feature 10    — Start implementing feature 10 from the TODO backlog.
 *   /feature end   — End the current feature without saving timing data.
 *
 * The extension:
 *   1. Runs `git checkout main && git pull` to ensure up-to-date code
 *   2. Writes START:<timestamp> to ~/.pi/agent/feature-times/feature_<N>.txt
 *   3. Injects a message to the agent: "Implement feature N..."
 *   4. On turn_end/agent_end, writes END:<timestamp> and ELAPSED MINUTES to the file
 *   5. Injects a follow-up message: "Write in the PR that this task required NN minutes."
 *   6. Clears the status bar entry for the completed feature.
 */

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI, ExtensionContext, ExtensionCommandContext, TurnStartEvent, TurnEndEvent, AgentEndEvent } from '@earendil-works/pi-coding-agent'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'

const FEATURE_DIR = path.join(process.env.HOME ?? '', '.pi', 'agent', 'feature-times')

interface FeatureTiming {
  featureNumber: number
  startTime: number
  turnIndex: number | null
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

function runGitUpdate(): boolean {
  try {
    execSync('git checkout main && git pull', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    return true
  } catch (err) {
    console.error('Git update failed:', err)
    return false
  }
}

function clearPendingFeature(ctx: ExtensionContext): void {
  if (!pendingFeature) return
  const featureNumber = pendingFeature.featureNumber
  //ctx.ui.setStatus(`todo-feature-${featureNumber}`, undefined)
  ctx.ui.setStatus(`todo-feature`, undefined)
  pendingFeature = null
}

export default function featureTimerExtension(pi: ExtensionAPI) {
  pi.registerCommand('feature', {
    description: 'Implement a feature from the TODO backlog. Usage: /feature <number> or /feature end',
    handler: async (args, ctx) => {
      const trimmed = args.trim()

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

      const featureNumber = parseInt(trimmed, 10)
      if (isNaN(featureNumber) || featureNumber <= 0) {
        ctx.ui.notify('❌ Usage: /feature <number>  —  e.g. /feature 10', 'error')
        return
      }

      // Auto-clean any pending feature before starting a new one
      if (pendingFeature) {
        clearPendingFeature(ctx)
      }

      await ensureFeatureDir()

      const startTime = Date.now()
      const featureFile = path.join(FEATURE_DIR, `feature_${featureNumber}.txt`)
      const startContent = `START: ${formatTime(startTime)}\n`
      await fs.writeFile(featureFile, startContent, 'utf8')

      // Run git checkout main && git pull before sending the prompt
      const onMain = runGitUpdate()

      pendingFeature = { featureNumber, startTime, turnIndex: null }
      featureCompleted = false

      ctx.ui.notify(`⏱️ Feature ${featureNumber} started. Elapsed time will be recorded.`, 'info')
      //ctx.ui.setStatus(`todo-feature-${featureNumber}`, `⏱️ Feature ${featureNumber}`)
      ctx.ui.setStatus(`todo-feature`, `🎯 Feature ${featureNumber}`)

      // Inject the task to the agent — code is already up to date
      pi.sendUserMessage(
        `Implement feature ${featureNumber}.\n If the feature is not present in the TODO backlog or the task is not 100% clear, ask for clarification from the user. ` +
         (onMain ? `The code is already on main and up to date. ` : "") +
        `The feature number is ${featureNumber}. ` +
        `**IMPORTANT**: when you complete the task and publish or update the PR write "[FEATURE COMPLETED]" or "[FEATURE ${featureNumber} COMPLETED]" in the message.`
      )
    },
  })

  // Track when a turn starts — if we have a pending feature, record the turn index
  pi.on('turn_start', (_event: TurnStartEvent, ctx: ExtensionContext) => {
    if (pendingFeature) {
      pendingFeature.turnIndex = _event.turnIndex
    }
  })

  /*
  // Track when a turn ends
  pi.on('turn_end', async (event: TurnEndEvent, ctx: ExtensionContext) => {
    
    if (!pendingFeature || pendingFeature.turnIndex === null) return
    if (event.turnIndex !== pendingFeature.turnIndex) return

    //await finishFeature(event, ctx, pi)    
   // ctx.ui.notify(`⏱️ turn_end (${pendingFeature.turnIndex}) Feature ${pendingFeature.featureNumber} turn_end.`, 'info')
  })
*/
  /*
   pi.on('turn_end', (event) => {
     const msg = event.message
     if (msg?.role !== 'assistant') return
     const text = msg.content
       .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
       .map(b => b.text).join('')
     if ( /\[FEATURE \d+ COMPLETED\]/i.test(text)) featureCompleted = true
   })
     */

   pi.on('turn_end', (event) => {
     const n = pendingFeature?.featureNumber
     if (n === undefined || featureCompleted) return
     const msg = event.message
     if (msg?.role !== 'assistant') return
     const text = msg.content
       .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
       .map(b => b.text).join('')
     // strip common model decorations (backticks/bold/whitespace) around the marker
     const cleaned = text.replace(/[\s`*_]+/g, ' ')
     if (new RegExp(`\\[FEATURE ${n} COMPLETED\\]`, 'i').test(cleaned)) {
       featureCompleted = true
     }
   })

  // Fallback: if agent_end fires (covers cases where turn_end doesn't fire)
  pi.on('agent_end', async (event: AgentEndEvent, ctx: ExtensionContext) => {
    if (!pendingFeature) return
    ctx.ui.notify(`⏱️ agent_end (${pendingFeature.turnIndex}) Feature ${pendingFeature.featureNumber} turn_end.`, 'info')

    //# how to know the feature is completed?

    event.message

    // if is not completed (agent has questions), should stop the timer?
    await finishFeature(event, ctx, pi)
  })
}

async function finishFeature(event: AgentEndEvent, ctx: ExtensionContext, pi: ExtensionAPI): Promise<void> {
  if (!pendingFeature || !featureCompleted) return
  //if (pendingFeature.turnIndex !== null && 'turnIndex' in event && event.turnIndex !== pendingFeature.turnIndex) return

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
  //ctx.ui.setStatus(`feature-${pendingFeature.featureNumber}`, undefined)
  ctx.ui.setStatus(`todo-feature`, undefined)

  // Inject follow-up message to write the PR timing
  pi.sendUserMessage(
    `Write in the PR that this task required ${elapsedMinutes} minutes. ` +
    `Feature ${pendingFeature.featureNumber} is complete.`,
    { streamingBehavior: "followUp" }
  )

  pendingFeature = null
  featureCompleted = false
}
