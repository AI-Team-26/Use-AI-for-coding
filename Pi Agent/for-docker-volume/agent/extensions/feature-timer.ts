// ~/.pi/agent/extensions/response-timer.ts
/**
 * /feature N — Measures elapsed time for agent responses and injects timing info into the PR.
 *
 * Usage:
 *   /feature 10    — Start implementing feature 10 from the TODO backlog.
 *
 * The extension:
 *   1. Writes START:<timestamp> to ~/.pi/agent/feature-times/feature_<N>.txt
 *   2. Injects a message to the agent: "Implement feature N..."
 *   3. On turn_end, writes END:<timestamp> and ELAPSED MINUTES to the file
 *   4. Injects a follow-up message: "Write in the PR that this task required NN minutes."
 */

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI, ExtensionContext, ExtensionCommandContext, TurnStartEvent, TurnEndEvent } from '@earendil-works/pi-coding-agent'
import fs from 'node:fs/promises'
import path from 'node:path'

const FEATURE_DIR = path.join(process.env.HOME ?? '', '.pi', 'agent', 'feature-times')
//const TIMESTAMP_FORMAT = 'yyyy-MM-dd HH:mm:ss.SSS'

interface FeatureTiming {
  featureNumber: number
  startTime: number | null
  turnIndex: number | null
}

let pendingFeature: FeatureTiming | null = null

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

function writeTimingFile(featureNumber: number, content: string): void {
  const filePath = path.join(FEATURE_DIR, `feature_${featureNumber}.txt`)
  fs.writeFile(filePath, content, 'utf8').catch((err) => {
    console.error(`Failed to write timing file ${filePath}:`, err)
  })
}

async function ensureFeatureDir(): Promise<void> {
  try {
    await fs.mkdir(FEATURE_DIR, { recursive: true })
  } catch {
    // directory already exists or can't be created
  }
}

export default function responseTimerExtension(pi: ExtensionAPI) {
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
      const featureFile = path.join(FEATURE_DIR, `feature_${featureNumber}.txt`)
      const startContent = `START: ${formatTime(startTime)}\n`
      await fs.writeFile(featureFile, startContent, 'utf8')

      pendingFeature = { featureNumber, startTime, turnIndex: null }

      ctx.ui.notify(`⏱️ Feature ${featureNumber} started. Elapsed time will be recorded.`, 'info')
      ctx.ui.setStatus(`pi-feature-${featureNumber}`, `⏱️ Feature ${featureNumber}`)

      // Inject the task to the agent
      pi.sendUserMessage(
        `Implement feature ${featureNumber}. If the feature is not present in the TODO backlog or the task is not 100% clear, ask for clarification from the user. ` +
        `Move to the main branch, pull, and start implementing. The feature number is ${featureNumber}.`
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

    const endTime = Date.now()
    const elapsedMs = endTime - pendingFeature.startTime
    const elapsedMinutes = (elapsedMs / 60000).toFixed(1)

    const filePath = path.join(FEATURE_DIR, `feature_${pendingFeature.featureNumber}.txt`)
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

    // Append model and tokens info
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
    ctx.ui.setStatus(`pi-feature-${pendingFeature.featureNumber}`, undefined)

    // Inject follow-up message to write the PR timing
    pi.sendUserMessage(
      `Write in the PR that this task required ${elapsedMinutes} minutes. ` +
      `Feature ${pendingFeature.featureNumber} is complete.`
    )

    pendingFeature = null
  })
}
