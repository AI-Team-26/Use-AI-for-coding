// ~/.pi/agent/extensions/git-repo.ts
/**
 * git-repo extension
 * Displays the current Git repository as <owner>/<repo> (<branch>) in the footer,
 * with the owner and the repo name rendered in different colors.
 */

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'
import { execSync } from 'node:child_process'

const STATUS_KEY = "pi-git-repo"
const REFRESH_MS = 5_000

// ANSI colors — passed straight into the status line (the footer does not strip escapes)
const CYAN = "\x1b[36m"
const GREEN = "\x1b[32m"
const DIM = "\x1b[2m"
const RESET = "\x1b[0m"

interface RepoInfo {
  owner?: string
  repo?: string
}

function run(cmd: string): string | null {
  try {
    const out = execSync(cmd, { cwd: process.cwd() }).toString().trim()
    return out || null
  } catch {
    return null
  }
}

function readRemote(): RepoInfo {
  const url = run("git remote get-url origin") ?? ""
  // Accept https://host/owner/repo(.git), ssh git@host:owner/repo(.git) and scp-style host:owner/repo
  const match = url.match(/[:/]([^/:]+)\/([^/]+?)(?:\.git)?$/)
  if (!match) return {}
  return { owner: match[1], repo: match[2] }
}

export default function gitRepoExtension(pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    let last = ""
    let intervalId: ReturnType<typeof setInterval> | null = null

    const refresh = () => {
      try {
        const { owner, repo } = readRemote()
        const branch = run("git branch --show-current")

        let text: string
        if (owner && repo) {
          const base = `${CYAN}${owner}${RESET}/${GREEN}${repo}${RESET}`
          text = branch ? `${base} (${DIM}${branch}${RESET})` : base
        } else if (branch) {
          // No recognizable remote — fall back to branch only
          text = `🌿 ${branch}`
        } else {
          text = ""
        }

        if (text !== last) {
          last = text
          if (text) ctx.ui.setStatus(STATUS_KEY, text)
        }
      } catch {
        // ctx is stale — session ended, interval will be cleared
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
}
