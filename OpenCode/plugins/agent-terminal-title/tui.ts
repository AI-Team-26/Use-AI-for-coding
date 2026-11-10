import { Plugin } from "@opencode/plugin/tui"

const RUNNING_ICON = "⏳"
const IDLE_ICON = "🖐️"
const ROUTE_POLL_MS = 1_000

/**
 * Terminal title showing whether the active session is working or idle.
 * The title must be written from the TUI part: the background server has no
 * controlling terminal. OpenCode's own title writer is disabled in cli.json.
 *
 * `session.viewed` is published only for unread sessions and the TUI publishes no
 * event for a route change, so the active route is also polled: switching between
 * two tabs emits nothing, which would otherwise leave the previous session's icon.
 */
export default Plugin.define({
  id: "agent-terminal-title",
  setup(context) {
    const agentName = process.env.AI_AGENT_NAME?.trim() || "agent"
    let lastTitle: string | undefined

    const write = (running: boolean) => {
      if (context.renderer.isDestroyed) return
      const title = `${running ? RUNNING_ICON : IDLE_ICON} ${agentName}`
      if (title === lastTitle) return
      lastTitle = title
      context.renderer.setTerminalTitle(title)
    }

    const activeRoute = () => {
      const route = context.ui.router.current()
      return route.type === "session" ? { key: `session:${route.sessionID}`, sessionID: route.sessionID } : { key: route.type, sessionID: undefined }
    }

    const activeSessionID = () => activeRoute().sessionID

    const refresh = () => {
      const sessionID = activeSessionID()
      write(sessionID !== undefined && context.data.session.status(sessionID) === "running")
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

    let lastRouteKey = activeRoute().key
    const routePollTimer = setInterval(() => {
      const { key } = activeRoute()
      if (key === lastRouteKey) return
      lastRouteKey = key
      refresh()
    }, ROUTE_POLL_MS)

    return () => {
      clearInterval(routePollTimer)
      stopStatus()
      stopViewed()
      stopIdle()
      lastTitle = undefined
      if (!context.renderer.isDestroyed) context.renderer.setTerminalTitle("")
    }
  },
})
