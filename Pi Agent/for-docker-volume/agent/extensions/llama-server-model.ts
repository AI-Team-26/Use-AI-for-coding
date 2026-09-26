// ~/.pi/agent/extensions/llama-server-model.ts
/**
 * llama-server-model extension
 * Displays the model currently running on llama-server in the footer,
 * taken from /scripts/llama-server-current-model.txt.
 */

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent'
import { readFileSync } from 'node:fs'

const STATUS_KEY = "alex-piccione-llama-model"
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
  // A captured ctx goes stale after session replacement or reload; always use the most
  // recent one delivered by events and never touch a possibly-stale ctx outside try/catch.
  let latestCtx: ExtensionContext | null = null
  let last = ""
  let intervalId: ReturnType<typeof setInterval> | null = null

  const refresh = () => {
    const ctx = latestCtx
    if (!ctx) return
    try {
      const model = readCurrentModel() ?? ""
      if (model !== last) {
        last = model
        if (model) ctx.ui.setStatus(STATUS_KEY, `🦙 ${model}`)
      }
    } catch {
      // ctx became stale between capture and call — session_start / agent_settled will replace it
    }
  }

  pi.on("session_start", (_event, ctx: ExtensionContext) => {
    latestCtx = ctx
    if (intervalId === null) {
      refresh()
      intervalId = setInterval(refresh, REFRESH_MS)
    }
  })

  pi.on("agent_settled", (_event, ctx: ExtensionContext) => {
    latestCtx = ctx
  })

  // "session_end" does not exist in the extension API; the real teardown event is
  // "session_shutdown". A new session_start always follows replacement reasons, so
  // clearing here cannot leave the status permanently empty.
  pi.on("session_shutdown", () => {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  })
}
