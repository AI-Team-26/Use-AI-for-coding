// ~/.pi/agent/extensions/git-branch.ts
/**
 * git-branch extension
 * Displays the current Git branch in the footer.
 */

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'
import { execSync } from 'node:child_process'

const STATUS_KEY = "pi-git-branch"
const REFRESH_MS = 5_000

function readCurrentBranch(): string | null {
  try {
    const output = execSync("git branch --show-current", {
      cwd: process.cwd(),
    }).toString().trim()
    return output || null
  } catch {
    return null
  }
}

export default function gitBranchExtension(pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    let last = ""
    let intervalId: ReturnType<typeof setInterval> | null = null

    const refresh = () => {
      try {
        const branch = readCurrentBranch() ?? ""
        if (branch !== last) {
          last = branch
          if (branch) ctx.ui.setStatus(STATUS_KEY, `🌿 ${branch}`)
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
