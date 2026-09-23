// ~/.pi/agent/extensions/agent-name.ts
/**
* /agent-name extension
* Displays the agent name, taken from env PI_AGENT_NAME.
*/

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'

const STATUS_KEY = "alex-piccione-agent-name"

export default function agentNameExtension(pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.setStatus(STATUS_KEY, process.env.PI_AGENT_NAME ?? "NO-NAME")
  })
}