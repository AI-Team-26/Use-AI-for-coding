import type { Plugin } from "@opencode-ai/plugin"
import { writeFileSync, openSync, closeSync, existsSync } from "fs"
//import { execFile } from "child_process"
//import { join, dirname } from "path"
//import { fileURLToPath } from "url"

/**
 * OpenCode plugin that set teh title of hte Terminal.
 * Inspired by https://gitlab.com/yaruchyk.o/terminal-tab-status/-/blob/master/src/standalone-plugin.ts?ref_type=heads
 */
export const TerminalAgentTitlePlugin: Plugin = async ({ directory, client }) => {
  //const project = directory.split("/").pop() || "opencode"
  const agent_name = process.env.AI_AGENT_NAME


  function writeTitle(text: string) {
    let fd: number | null = null
    try {
      fd = openSync("/dev/tty", "w")
      const title = `${agent_name} text`
      // OSC 2 = window title (PyCharm), OSC 0 = icon + window title (others)
      writeFileSync(fd, `\x1b]2;${title}\x07\x1b]0;${title}\x07`)
    } catch {
      // /dev/tty may not be available (e.g. in CI)
    } finally {
      if (fd !== null) {
        try {
          closeSync(fd)
        } catch {
          // ignore close errors
        }
      }
    }
  }
  

  return {
    event: async ({ event }) => {

      let title=agent_name
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