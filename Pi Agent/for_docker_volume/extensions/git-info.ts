// ~/.pi/agent/extensions/git-info.ts
/**
 * git-info extension
 * Displays the current Git repository as <owner>/<repo> (<branch>) in the footer,
 * with the owner and the repo name rendered in different colors.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent"
import { execSync } from "node:child_process"
import { CYAN, BLUE, GREEN, RESET, safeNotify, safeSetStatus } from "./_shared/common.ts"

const STATUS_KEY = "alex-piccione-git-info"
const EXTENSION = "GIT-INFO"
const REFRESH_MS = 5_000

function run(cmd: string): string | null {
    try {
        const out = execSync(cmd, {
            cwd: process.cwd(),
            stdio: ["ignore", "pipe", "ignore"],
        })
            .toString()
            .trim()
        return out || null
    } catch {
        return null
    }
}

function isGitRepo(): boolean {
    return run("git rev-parse --is-inside-work-tree") === "true"
}

export default function gitInfoExtension(pi: ExtensionAPI) {
    // A captured ctx goes stale after session replacement or reload; always use the most
    // recent one delivered by events and never touch a possibly-stale ctx outside try/catch.
    let latestCtx: ExtensionContext | null = null
    let lastText = ""
    let lastError = ""
    let intervalId: ReturnType<typeof setInterval> | null = null

    const reportError = (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg === lastError || !latestCtx) return
        lastError = msg
        console.error(`[${EXTENSION}] ${msg}`)
        safeNotify(() => latestCtx, `${EXTENSION}: ${msg}`, "warning", EXTENSION)
    }

    const buildStatus = (): string | undefined => {
        const branch = run("git branch --show-current")
        const url = run("git remote get-url origin")

        if (url !== null) {
            // Accept https://host/owner/repo(.git), ssh git@host:owner/repo(.git) and scp-style host:owner/repo
            const match = url.match(/[:/]([^/:]+)\/([^/]+?)(?:\.git)?$/)
            if (match) {
                const base = `${CYAN}${match[1]}${RESET}/${BLUE}${match[2]}${RESET}`
                return branch ? `${base} (🌿 ${GREEN}${branch}${RESET})` : base
            }
            reportError(new Error(`unrecognized remote URL format: ${url}`))
        } else {
            // We are inside a Git repo but there is no 'origin' remote: an error worth surfacing.
            reportError(new Error("no 'origin' remote configured"))
        }

        // Fall back to branch only when the remote could not be resolved
        return branch ? `🌿 ${GREEN}${branch}${RESET}` : undefined
    }

    const stopRefresh = () => {
        if (intervalId !== null) {
            clearInterval(intervalId)
            intervalId = null
        }
    }

    const refresh = () => {
        if (!latestCtx) return

        const text = buildStatus()
        if ((text ?? "") !== lastText) {
            lastText = text ?? ""
            safeSetStatus(() => latestCtx, STATUS_KEY, text, EXTENSION)
        }
    }

    pi.on("session_start", (_event, ctx: ExtensionContext) => {
        latestCtx = ctx
        // A new session needs a fresh status write even if the text is unchanged.
        lastText = ""

        if (!isGitRepo()) {
            stopRefresh()
            safeSetStatus(() => latestCtx, STATUS_KEY, undefined, EXTENSION)
            return
        }

        refresh()
        if (intervalId === null) {
            intervalId = setInterval(refresh, REFRESH_MS)
        }
    })

    pi.on("agent_settled", (_event, ctx: ExtensionContext) => {
        latestCtx = ctx
    })

    // "session_end" does not exist in the extension API; the real teardown event is
    // "session_shutdown". A new session_start always follows replacement reasons, so
    // clearing here cannot leave the status permanently empty.
    pi.on("session_shutdown", () => {
        stopRefresh()
    })
}
