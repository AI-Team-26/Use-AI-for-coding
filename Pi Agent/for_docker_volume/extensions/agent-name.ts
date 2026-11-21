// ~/.pi/agent/extensions/agent-name.ts
/**
* /agent-name extension
* Displays the agent name, taken from env AI_AGENT_NAME.
*/

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'
import { safeSetStatus } from './_shared/common.ts'

const STATUS_KEY = "alex-piccione-agent-name"

export default function agentNameExtension(pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    safeSetStatus(() => ctx, STATUS_KEY, process.env.AI_AGENT_NAME ?? "NO-NAME", STATUS_KEY)
  })
}