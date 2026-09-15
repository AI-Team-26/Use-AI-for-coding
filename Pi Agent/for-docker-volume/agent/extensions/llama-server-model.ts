// ~/.pi/agent/extensions/llama-server-model.ts
/**
 * llama-server-model extension
 * Displays the model currently running on llama-server in the footer,
 * taken from /scripts/llama-server-current-model.txt.
 */

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'
import { readFileSync } from 'node:fs'

const STATUS_KEY = "pi-llama-model"
const MODEL_FILE = "/scripts/llama-server-current-model.txt"
const REFRESH_MS = 30_000

function readCurrentModel(): string | null {
  try {
    const content = readFileSync(MODEL_FILE, "utf8")
    // Prefer the alias field if present; fall back to model filename
    const aliasMatch = content.match(/alias=(\S+)/m)
    if (aliasMatch) return aliasMatch[1]
    const match = content.match(/^model=(\S+)/m)
    if (!match) return null
    return match[1].replace(/\.gguf$/, "")
  } catch {
    return null
  }
}

export default function llamaServerModelExtension(pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    let last = ""
    const refresh = () => {
      const model = readCurrentModel() ?? ""
      if (model !== last) {
        last = model
        if (model) ctx.ui.setStatus(STATUS_KEY, `🦙 ${model}`)
      }
    }
    refresh()
    setInterval(refresh, REFRESH_MS)
  })
}
