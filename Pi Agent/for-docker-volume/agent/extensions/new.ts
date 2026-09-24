// ~/.pi/agent/extensions/new.ts
/**
 * /new command model preservation extension.
 *
 * When the user invokes /new to start a fresh session, Pi reads the model
 * from settings.json instead of keeping the currently selected model.
 * This extension saves the current model before the switch and restores it
 * after the new session starts, using a temporary file that is deleted
 * immediately after reading so that normal Pi startup is unaffected.
 */

/// <reference types="@earendil-works/pi-coding-agent" />

import fs from "node:fs/promises"
import path from "node:path"
import type { ExtensionAPI, ExtensionContext, SessionStartEvent, SessionBeforeSwitchEvent } from "@earendil-works/pi-coding-agent"

/** Temporary file path — only exists during a /new command flow. */
const MODEL_TEMP_FILE = path.join(process.env.HOME ?? "", ".pi", "agent", "new_command_model_to_use.txt")

/** Save the current model to a temporary file. */
async function saveModel(model: Record<string, unknown>): Promise<void> {
  try {
    await fs.mkdir(path.dirname(MODEL_TEMP_FILE), { recursive: true })
    await fs.writeFile(MODEL_TEMP_FILE, JSON.stringify(model), "utf8")
  } catch {
    // non-fatal
  }
}

/** Load and immediately delete the saved model, so default behavior at Pi start is preserved. */
async function loadAndDeleteModel(): Promise<Record<string, unknown> | null> {
  try {
    const content = await fs.readFile(MODEL_TEMP_FILE, "utf8")
    // Delete the temp file immediately — default Pi startup is unaffected
    await fs.unlink(MODEL_TEMP_FILE)
    return JSON.parse(content) as Record<string, unknown>
  } catch {
    return null
  }
}

export default function newExtension(pi: ExtensionAPI) {
  // Before switching to a new session, save the current model to a temp file.
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

  // After the new session starts, restore the previously selected model
  // from the temp file and immediately delete it.
  pi.on("session_start", async (event: SessionStartEvent, ctx: ExtensionContext) => {
    if (event.reason !== "new") return
    const savedModel = await loadAndDeleteModel()
    if (!savedModel) return

    const model = ctx.model
    if (!model) return

    const targetModel = {
      ...model,
      provider: savedModel.provider ?? model.provider,
      name: savedModel.name ?? model.name,
      id: savedModel.id ?? model.id,
    }

    try {
      const ok = await pi.setModel(targetModel as Parameters<ExtensionAPI["setModel"]>[0])
      if (!ok) {
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
