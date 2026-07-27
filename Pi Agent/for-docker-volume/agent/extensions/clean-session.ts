/**
 * Clean Session Extension
 *
 * Adds a /clean-session command that deletes the current session and starts a
 * fresh one. Instant — no LLM call, no restart needed.
 *
 * On Windows it uses fs.unlink (permanent delete).
 * On macOS/Linux it tries the `trash` CLI first (recycle bin), then falls
 * back to unlink.
 *
 * Usage:
 *   /clean-session   — replace the current session with a fresh one
 */

import { readdirSync, unlinkSync } from "fs"
import { execSync } from "child_process"
import { homedir } from "os"
import { join } from "path"
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"

/** Replicate pi's session directory encoding. */
function sessionDir(cwd: string): string {
  const safe = cwd
    .replace(/^[/\\]+/, "")
    .replace(/[/\\:]/g, "-")
  return join(homedir(), ".pi", "agent", "sessions", `--${safe}--`)
}

/** Find the most recent .jsonl session file. */
function currentSessionFile(cwd: string): string | null {
  const dir = sessionDir(cwd)
  let files: string[]
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".jsonl"))
  } catch {
    return null
  }
  if (files.length === 0) return null
  files.sort()
  return join(dir, files[files.length - 1])
}

/**
 * Delete a session file: try `trash` CLI first (recycle bin), then fall back to unlink.
 */
function deleteSessionFile(filePath: string): void {
  try {
    const trashArgs = filePath.startsWith("-") ? ["--", filePath] : [filePath]
    execSync("trash", trashArgs, { encoding: "utf-8", stdio: "ignore" })
    return;
  } catch {
    // trash not installed — fall through to unlink
  }
  unlinkSync(filePath)
}

export default function cleanExtension(pi: ExtensionAPI) {
  pi.registerCommand("clean-session", {
    description: "Delete current session and start a fresh one",
    handler: async (_args, ctx) => {
      const oldFile = currentSessionFile(ctx.cwd)

      if (!oldFile) {
        ctx.ui.notify("No session file found.", "error")
        return;
      }

      const result = await ctx.newSession({
        withSession: async (newCtx) => {
          try {
            deleteSessionFile(oldFile)
            newCtx.ui.notify("Fresh session started. Old session deleted.", "info")
          } catch {
            newCtx.ui.notify(
              "Fresh session started (could not delete old file).",
              "warning",
            )
          }
        },
      });

      if (result.cancelled) {
        ctx.ui.notify("Cancelled.", "error")
      }
    },
  })
}