import type { Plugin } from "@opencode-ai/plugin"
import { openSync, writeSync, closeSync } from "fs"

/**
 * OpenCode plugin that sets the title of the Terminal.
 * Inspired by https://gitlab.com/yaruchyk.o/terminal-tab-status/-/blob/master/src/standalone-plugin.ts?ref_type=heads
 */
export const TerminalAgentTitlePlugin: Plugin = async ({ directory, client }) => {
  const agentName = process.env.AI_AGENT_NAME?.trim() || "agent"

  // Controlling-terminal fd, opened lazily once. -1 means /dev/tty is permanently
  // unavailable for this session (no controlling tty), so it is not retried on every event.
  let ttyFd: number | undefined

  function getTtyFd(): number {
    if (ttyFd !== undefined) return ttyFd
    try {
      const fd = openSync("/dev/tty", "w")
      ttyFd = fd
      return fd
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code
      // Cache only permanent failures; transient ones (e.g. EMFILE) retry next time
      if (code === "ENOENT" || code === "ENXIO" || code === "ENOTTY" || code === "ENODEV") {
        ttyFd = -1
      }
      return -1
    }
  }

  let lastSeq = ""

  function writeTitle(text: string) {
    // Strip control chars (C0, DEL, C1): an ESC/BEL/ST inside the title would terminate
    // the OSC sequence early and leak raw escapes into the terminal state
    const title = text.replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
    if (!title) return
    // OSC 2 = window title (some terminals), OSC 0 = icon + window title (others)
    const seq = `\x1b]2;${title}\x07\x1b]0;${title}\x07`
    if (seq === lastSeq) return

    // /dev/tty targets the controlling terminal regardless of where stdout goes,
    // so titles still work when stdout is redirected or piped
    const fd = getTtyFd()
    if (fd >= 0) {
      try {
        writeSync(fd, seq)
        lastSeq = seq
        return
      } catch {
        ttyFd = undefined // stale/dead pty: force re-resolution next time
      }
    }
    // No controlling tty: only useful when stdout itself IS the terminal
    if (process.stdout.isTTY) {
      try {
        process.stdout.write(seq)
        lastSeq = seq
      } catch {
        // no terminal anywhere; drop silently
      }
    }
  }

  return {
    dispose: async () => {
      if (ttyFd !== undefined && ttyFd >= 0) {
        try {
          closeSync(ttyFd)
        } catch {
          // already closed
        }
        ttyFd = undefined
      }
    },

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
