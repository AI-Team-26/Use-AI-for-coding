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

interface SavedModel {
  provider: string
  id: string
}

/** Save the current model as plain text (provider on line 1, model id on line 2). */
async function saveModel(model: { provider: string; id: string }): Promise<void> {
  try {
    await fs.mkdir(path.dirname(MODEL_TEMP_FILE), { recursive: true })
    await fs.writeFile(MODEL_TEMP_FILE, `${model.provider}\n${model.id}\n`, "utf8")
  } catch {
    // non-fatal
  }
}

/**
 * Notify via a possibly-stale ctx.
 * Event handlers here await filesystem work before touching ctx; if the session
 * gets replaced in that window any ctx.ui.* access throws (stale-ctx crash class).
 * Skips only when no ctx is available; any other failure is logged, never silenced.
 */
function safeNotify(ctx: ExtensionContext | null, message: string, type: "warning" | "error"): void {
  if (!ctx) return;
  try {
    ctx.ui.notify(message, type);
  } catch (err) {
    console.error("[new] notify failed:", err);
  }
}

/** Load and immediately delete the saved model, so default behavior at Pi start is preserved. */
async function loadAndDeleteModel(): Promise<SavedModel | null> {
  try {
    const content = await fs.readFile(MODEL_TEMP_FILE, "utf8")
    // Delete the temp file immediately — default Pi startup is unaffected
    await fs.unlink(MODEL_TEMP_FILE)
    const lines = content.trim().split("\n")
    if (lines.length < 2 || !lines[0] || !lines[1]) return null
    return { provider: lines[0], id: lines[1] }
  } catch {
    return null
  }
}

export default function newExtension(pi: ExtensionAPI) {
  // Before switching to a new session, save the current model to a temp file.
  pi.on("session_before_switch", async (event: SessionBeforeSwitchEvent, ctx: ExtensionContext) => {
    if (event.reason !== "new") return
    const model = ctx.model
    if (!model) {
      ctx.ui.notify("❌ /new: No current model to save", "warning")
      return
    }
    await saveModel({ provider: model.provider, id: model.id })
  })

  // After the new session starts, restore the previously selected model
  // from the temp file and immediately delete it.
  pi.on("session_start", async (event: SessionStartEvent, ctx: ExtensionContext) => {
    if (event.reason !== "new") return
    
    const saved = await loadAndDeleteModel()
    if (!saved) {
      safeNotify(ctx, "❌ /new: No saved model found (temp file missing or invalid)", "warning")
      return
    }

    // Look up the full Model object in the registry (no JSON needed —
    // plain text plus registry lookup is enough).
    const restored = ctx.modelRegistry.find(saved.provider, saved.id)
    if (!restored) {
      safeNotify(ctx, `❌ /new: Could not find model ${saved.provider}/${saved.id} in registry`, "error")
      return
    }

   
    try {
      await pi.setModel(restored)
    } catch (err) {
      safeNotify(ctx, `❌ /new: Failed to restore model: ${err instanceof Error ? err.message : String(err)}`, "error")
    }
  })
}