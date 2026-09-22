// ~/.pi/agent/extensions/feature-timer.ts
/**
 * /feature N — Implements a feature from the TODO backlog and measures elapsed time.
 *
 * Usage:
 *   /feature 10    — Start implementing feature 10 from the TODO backlog.
 *
 * The extension:
 *   1. Runs `git checkout main && git pull` to ensure up-to-date code
 *   2. Writes START:<timestamp> to ~/.pi/agent/feature-times/feature_<N>_<timestamp>.txt
 *   3. Injects a message to the agent: "Implement feature N..."
 *   4. On turn_end/agent_end, writes END:<timestamp> and ELAPSED MINUTES to the file
 *   5. Injects a follow-up message: "Write in the PR that this task required NN minutes."
 *
 * Files are uniquely named with a timestamp suffix to support multiple concurrent features.
 */

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI, ExtensionContext, ExtensionCommandContext, TurnStartEvent, TurnEndEvent, AgentEndEvent } from '@earendil-works/pi-coding-agent'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'

const FEATURE_DIR = path.join(process.env.HOME ?? '', '.pi', 'agent', 'feature-times')

interface FeatureTiming {
  featureNumber: number
  startTime: number | null
  turnIndex: number | null
  fileKey: string
  fileId: string
}

let pendingFeature: FeatureTiming | null = null

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

function writeTimingFile(featureId: string, content: string): void {
  const filePath = path.join(FEATURE_DIR, `feature_${featureId}.txt`)
  fs.writeFile(filePath, content, 'utf8').catch((err) => {
    console.error(`Failed to write timing file ${filePath}:`, err)
  })
}

async function ensureFeatureDir(): Promise<void> {
  try {
    await fs.mkdir(FEATURE_DIR, { recursive: true })
  } catch {
    // directory already exists
  }
}

function runGitUpdate(): void {
  try {
    execSync('git checkout main && git pull', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: 'pipe',
    })
  } catch (err) {
    console.error('Git update failed:', err)
  }
}

export default function featureTimerExtension(pi: ExtensionAPI) {
  pi.registerCommand('feature', {
    description: 'Implement a feature from the TODO backlog. Usage: /feature <number>',
    handler: async (args, ctx) => {
      const featureNumber = parseInt(args.trim(), 10)
      if (isNaN(featureNumber) || featureNumber <= 0) {
        ctx.ui.notify('❌ Usage: /feature <number>  —  e.g. /feature 10', 'error')
        return
      }

      await ensureFeatureDir()

      const startTime = Date.now()
      const fileId = `${featureNumber}-${startTime}`
      const fileKey = `${featureNumber}_${startTime}`
      const featureFile = path.join(FEATURE_DIR, `feature_${fileKey}.txt`)
      const startContent = `START: ${formatTime(startTime)}\n`
      await fs.writeFile(featureFile, startContent, 'utf8')

      // Run git checkout main && git pull before sending the prompt
      runGitUpdate()

      pendingFeature = { featureNumber, startTime, turnIndex: null, fileKey, fileId }

      ctx.ui.notify(`⏱️ Feature ${featureNumber} started. Elapsed time will be recorded.`, 'info')
      ctx.ui.setStatus(`pi-feature-${fileKey}`, `⏱️ Feature ${featureNumber}`)

      // Inject the task to the agent — code is already up to date
      pi.sendUserMessage(
        `Implement feature ${featureNumber}. If the feature is not present in the TODO backlog or the task is not 100% clear, ask for clarification from the user. ` +
        `The code is already on main and up to date. ` +
        `The feature number is ${featureNumber}.`
      )
    },
  })

  // Track when a turn starts — if we have a pending feature, record the turn index
  pi.on('turn_start', (_event: TurnStartEvent, ctx: ExtensionContext) => {
    if (pendingFeature) {
      pendingFeature.turnIndex = _event.turnIndex
    }
  })

  // Track when a turn ends — calculate elapsed time
  pi.on('turn_end', async (event: TurnEndEvent, ctx: ExtensionContext) => {
    if (!pendingFeature || pendingFeature.turnIndex === null) return
    if (event.turnIndex !== pendingFeature.turnIndex) return

    await finishFeature(event, ctx)
  })

  // Fallback: if agent_end fires (covers cases where turn_end doesn't fire)
  pi.on('agent_end', async (event: AgentEndEvent, ctx: ExtensionContext) => {
    if (!pendingFeature) return
    await finishFeature(event, ctx)
  })
}

async function finishFeature(event: TurnEndEvent | AgentEndEvent, ctx: ExtensionContext): Promise<void> {
  if (!pendingFeature) return
  if (pendingFeature.turnIndex !== null && 'turnIndex' in event && event.turnIndex !== pendingFeature.turnIndex) return

  const endTime = Date.now()
  const elapsedMs = endTime - pendingFeature.startTime
  const elapsedMinutes = (elapsedMs / 60000).toFixed(1)

  const filePath = path.join(FEATURE_DIR, `feature_${pendingFeature.fileKey}.txt`)
  const endContent = `START: ${formatTime(pendingFeature.startTime)}\nEND: ${formatTime(endTime)}\nELAPSED MINUTES: ${elapsedMinutes}\n`

  // Append to the file
  try {
    const existing = await fs.readFile(filePath, 'utf8')
    await fs.writeFile(filePath, existing + endContent, 'utf8')
  } catch {
    await fs.writeFile(filePath, endContent, 'utf8')
  }

  // Get model info
  const modelName = ctx.model?.name ?? 'unknown'
  const contextUsage = ctx.getContextUsage()
  const tokens = contextUsage?.tokens ?? null

  const modelInfo = `MODEL: ${modelName}\n`
  const tokensInfo = tokens !== null ? `TOKENS: ${tokens}\n` : ''
  const finalContent = endContent + modelInfo + tokensInfo

  try {
    const existing = await fs.readFile(filePath, 'utf8')
    await fs.writeFile(filePath, existing + finalContent, 'utf8')
  } catch {
    await fs.writeFile(filePath, finalContent, 'utf8')
  }

  ctx.ui.notify(`✅ Feature ${pendingFeature.featureNumber} completed in ${elapsedMinutes} minutes.`, 'info')
  ctx.ui.setStatus(`pi-feature-${pendingFeature.fileKey}`, undefined)

  // Inject follow-up message to write the PR timing
  pi.sendUserMessage(
    `Write in the PR that this task required ${elapsedMinutes} minutes. ` +
    `Feature ${pendingFeature.featureNumber} is complete.`
  )

  pendingFeature = null
}
