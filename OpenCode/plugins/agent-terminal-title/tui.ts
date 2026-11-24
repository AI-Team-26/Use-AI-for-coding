import { Plugin } from "@opencode/plugin/tui"

const RUNNING_ICON = "⏳"
const IDLE_ICON = "🖐️"

const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g

/**
 * Terminal title showing whether the active session is working or idle.
 * The title must be written from the TUI part: the background server has no
 * controlling terminal. OpenCode's own title writer is disabled in cli.json.
 */
export default Plugin.define({
  id: "agent-terminal-title",
  setup(context) {
    const agentName = (process.env.AI_AGENT_NAME ?? "").replace(CONTROL_CHARS, "").trim() || "agent"
    let lastTitle: string | undefined

    const write = (running: boolean) => {
      if (context.renderer.isDestroyed) return
      const title = `${running ? RUNNING_ICON : IDLE_ICON} ${agentName}`
      if (title === lastTitle) return
      lastTitle = title
      context.renderer.setTerminalTitle(title)
    }

    const activeSessionID = () => {
      const route = context.ui.router.current()
      return route.type === "session" ? route.sessionID : undefined
    }

    // The TUI data API collapses the server status union (idle | busy | retry)
    // to "idle" | "running"; "not idle" is the single running predicate.
    const refresh = () => {
      const sessionID = activeSessionID()
      write(sessionID !== undefined && context.data.session.status(sessionID) !== "idle")
    }

    refresh()

    const stopStatus = context.data.on("session.status", (event) => {
      if (event.data.sessionID !== activeSessionID()) return
      write(event.data.status.type !== "idle")
    })
    const stopViewed = context.data.on("session.viewed", refresh)
    const stopIdle = context.data.on("session.idle", (event) => {
      if (event.data.sessionID !== activeSessionID()) return
      write(false)
    })

    // Route switches do not always emit an event, so re-check the active session;
    // write() skips unchanged titles.
    const timer = setInterval(refresh, 1000)

    return () => {
      clearInterval(timer)
      stopStatus()
      stopViewed()
      stopIdle()
      lastTitle = undefined
      if (!context.renderer.isDestroyed) context.renderer.setTerminalTitle("")
    }
  },
})
