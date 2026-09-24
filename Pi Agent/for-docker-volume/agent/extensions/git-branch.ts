// ~/.pi/agent/extensions/git-branch.ts
/**
 * git-branch extension
 * Displays the current Git repository as <owner>/<repo> (<branch>) in the footer,
 * with the owner and the repo name rendered in different colors.
 */

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI, ExtensionContext, AgentSettledEvent } from '@earendil-works/pi-coding-agent'
import { execSync } from 'node:child_process'

const STATUS_KEY = "alex-piccione-git-info"
const REFRESH_MS = 5_000

// ANSI colors — passed straight into the status line (the footer does not strip escapes)
const CYAN = "\x1b[36m"
const BLUE = "\x1b[34m"
const GREEN = "\x1b[32m"
//const DIM = "\x1b[2m"
const RESET = "\x1b[0m"

function run(cmd: string): string | null {
  try {
    const out = execSync(cmd, { cwd: process.cwd() }).toString().trim()
    return out || null
  } catch {
    return null
  }
}

function isGitRepo(): boolean {
  return run("git rev-parse --is-inside-work-tree") === "true"
}

export default function gitBranchExtension(pi: ExtensionAPI) {
  let latestCtx: ExtensionContext | null = null

  pi.on("session_start", async (_event, ctx: ExtensionContext) => {
    latestCtx = ctx
    
    let last = ""
    let lastError = ""
    let intervalId: ReturnType<typeof setInterval> | null = null

    // Surface failures so they are visible instead of silently swallowed.
    // Deduped per distinct message to avoid spamming every refresh tick.
    const reportError = (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg !== lastError) {
        lastError = msg
        console.error(`[${STATUS_KEY}] ${msg}`)
        ctx.ui.notify(`${STATUS_KEY}: ${msg}`, "warning")
      }
    }

    const refresh = () => {
      // Use the latest ctx we've received from session_start or agent_settled events
      if (!latestCtx) {
        return
      }

      let text: string | undefined

      if (!isGitRepo()) {
        // Not a Git working tree — nothing to show (expected, no error).
        text = undefined
      } else {
        const branch = run("git branch --show-current")
        const url = run("git remote get-url origin")

        if (url === null) {
          // We are inside a Git repo but there is no 'origin' remote: an error worth surfacing.
          reportError(new Error("no 'origin' remote configured"))
        } else {
          // Accept https://host/owner/repo(.git), ssh git@host:owner/repo(.git) and scp-style host:owner/repo
          const match = url.match(/[:/]([^/:]+)\/([^/]+?)(?:\.git)?$/)
          if (!match || match.length < 3) {
            reportError(new Error(`unrecognized remote URL format: ${url}`))
          } else {
            const base = `${CYAN}${match[1]}${RESET}/${BLUE}${match[2]}${RESET}`
            text = branch ? `${base} (🌿 ${GREEN}${branch}${RESET})` : base
          }
        }

        if (text === undefined && branch) {
          // Fall back to branch only when the remote could not be resolved
          text = `🌿 ${GREEN}${branch}${RESET}`
        }
      }

      if (text !== last) {
        last = text ?? ""
        latestCtx.ui.setStatus(STATUS_KEY, text)
      }
    }

    refresh()
    intervalId = setInterval(refresh, REFRESH_MS)

    pi.on("session_end", () => {
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
    })
  })

  // Also update ctx when agent settles, which provides fresh ctx for current session
  pi.on("agent_settled", async (_event: AgentSettledEvent, ctx: ExtensionContext) => {
    latestCtx = ctx
  })
}
