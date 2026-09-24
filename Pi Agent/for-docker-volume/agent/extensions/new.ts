// ~/.pi/agent/extensions/new.ts
/**
 * /new command model preservation extension.
 *
 * When the user invokes /new to start a fresh session, Pi reads the model
 * from settings.json instead of keeping the currently selected model.
 * This extension saves the current model before the switch and restores it
 * after the new session starts.
 */

/// <reference types="@earendil-works/pi-coding-agent" />

import fs from "node:fs/promises"
import path from "node:path"
import type { ExtensionAPI, ExtensionContext, SessionStartEvent, SessionBeforeSwitchEvent } from "@earendil-works/pi-coding-agent"

const MODEL_FILE = path.join(process.env.HOME ?? "", ".pi", "agent", "last-model.json")

/** Save the current model to a persistent file. */
async function saveModel(model: Record<string, unknown>): Promise<void> {
  try {
    await fs.mkdir(path.dirname(MODEL_FILE), { recursive: true })
    await fs.writeFile(MODEL_FILE, JSON.stringify(model), "utf8")
  } catch {
    // non-fatal
  }
}

/** Load the last saved model, or null if none exists. */
async function loadModel(): Promise<Record<string, unknown> | null> {
  try {
    const content = await fs.readFile(MODEL_FILE, "utf8")
    return JSON.parse(content) as Record<string, unknown>
  } catch {
    return null
  }
}

export default function newExtension(pi: ExtensionAPI) {
  // Before switching to a new session, save the current model.
  pi.on("session_before_switch", async (event: SessionBeforeSwitchEvent, ctx: ExtensionContext) => {
    if (event.reason !== "new") return
    if (!ctx.model) return
    const modelInfo: Record<string, unknown> = {
      provider: ctx.model.provider,
      name: ctx.model.name,
      id: ctx.model.id,
    }
    await saveModel(modelInfo)
  })

  // After the new session starts, restore the previously selected model.
  pi.on("session_start", async (event: SessionStartEvent, ctx: ExtensionContext) => {
    if (event.reason !== "new") return
    const savedModel = await loadModel()
    if (!savedModel) return

    const model = ctx.model
    if (!model) return

    // Build a model object matching what the current provider expects.
    const targetModel = {
      ...model,
      provider: savedModel.provider ?? model.provider,
      name: savedModel.name ?? model.name,
      id: savedModel.id ?? model.id,
    }

    try {
      const ok = await pi.setModel(targetModel as Parameters<ExtensionAPI["setModel"]>[0])
      if (!ok) {
        // Authentication may not be configured for that provider — try again with just provider info.
        const fallbackModel = {
          ...model,
          provider: savedModel.provider ?? model.provider,
        } as Record<string, unknown>
        await pi.setModel(fallbackModel as Parameters<ExtensionAPI["setModel"]>[0])
      }
    } catch {
      // Non-fatal: the session runs with the default model.
    }
  })
}
