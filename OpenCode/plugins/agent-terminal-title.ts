import type { Plugin } from "@opencode-ai/plugin"
import { openSync, writeSync } from "fs"

/**
 * OpenCode plugin that sets the title of the Terminal.
 * Inspired by https://gitlab.com/yaruchyk.o/terminal-tab-status/-/blob/master/src/standalone-plugin.ts?ref_type=heads
 */
export const TerminalAgentTitlePlugin: Plugin = async ({ directory, client }) => {
  const agentName = process.env.AI_AGENT_NAME ?? "agent"

  // Controlling-terminal fd, opened lazily once. -1 means /dev/tty is unavailable
  // (detached/headless), so it is not retried on every event.
  let ttyFd: number | undefined

  function getTtyFd(): number {
    if (ttyFd !== undefined) return ttyFd
    try {
      ttyFd = openSync("/dev/tty", "w")
    } catch {
      ttyFd = -1
    }
    return ttyFd
  }

  function writeTitle(text: string) {
    // Strip control chars: an ESC or BEL inside the title would terminate the
    // OSC sequence early and leak raw escapes into the terminal state
    const title = text.replace(/[\u0000-\u001f\u007f]/g, "")
    if (!title) return
    // OSC 2 = window title (some terminals), OSC 0 = icon + window title (others)
    const seq = `\x1b]2;${title}\x07\x1b]0;${title}\x07`

    // /dev/tty targets the controlling terminal regardless of where stdout goes,
    // so titles still work when stdout is redirected or piped
    const fd = getTtyFd()
    if (fd >= 0) {
      try {
        writeSync(fd, seq)
        return
      } catch {
        ttyFd = undefined // stale/dead pty: force re-resolution next time
      }
    }
    // No controlling tty: only useful when stdout itself IS the terminal
    if (process.stdout.isTTY) {
      try {
        process.stdout.write(seq)
      } catch {
        // no terminal anywhere; drop silently
      }
    }
  }

  return {
    event: async ({ event }) => {

      let title=agentName
      let event_type = ` (${event.type})`

      // Once server is ready, fetch the current session title
      if (event.type === "server.connected") {

      }

      // Track session title changes
      if (
        event.type === "session.updated" ||
        event.type === "session.created"
      ) {

      }

      // Session status changed
      if (event.type === "session.status") {
       
      }

      // AI finished -> show checkmark or plain depending on focus
      if (event.type === "session.idle") {
       
      }

      // On error, stop spinner and show plain title
      if (event.type === "session.error") {

      }

      writeTitle(title)
    },
  }

}
