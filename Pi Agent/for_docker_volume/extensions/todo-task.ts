// ~/.pi/agent/extensions/todo-task.ts
/**
 * /feature N — Implements a feature from the TODO backlog and measures elapsed time.
 * /feature N [note] — Optionally includes a note with the feature start.
 * /feature end — Ends the current feature without saving timing (unreliable).
 *
 * /bugfix N — Fixes a bug from the TODO backlog and measures elapsed time.
 * /bugfix N [note] — Optionally includes a note with the bug fix start.
 * /bugfix end — Ends the current bug without saving timing (unreliable).
 *
 * /pr [N | PR URL] - Check PR status and reviews. When on the default branch it moves
 * to the open PR branch first (asking to stash uncommitted changes when needed).
 *
 * Only one activity (feature or bug) can be active at a time. Starting a new one
 * auto-cancels the previous one without saving timing.
 *
 * Usage:
 *   /feature 10                      — Start implementing feature 10 from the TODO backlog.
 *   /feature 10 ignore existing PR   — Start implementing feature 10 with note "ignoring existing PR".
 *   /feature 10 "ignore existing PR" — Start implementing feature 10 with note "ignoring existing PR".
 *   /feature 7.1                     — Start implementing feature 7.1 .
 *   /feature end                     — End the current feature without saving timing data.
 *
 *   /bugfix 7                        — Start fixing bug 7 from the TODO backlog.
 *   /bugfix 7 ignore existing PR     — Start fixing bug 7 with note "ignoring existing PR".
 *   /bugfix 7 "my custom note"       — Start fixing bug 7with note "ignoring existing PR"
 *   /bugfix end                      — End the current bug without saving timing data.
 *
 * The extension:
 *   1. Move to updated main branch to look at up-to-date TODO
 *   2. Writes START:<timestamp> to ~/.pi/agent/todo-tasks/task_<N>.txt or bug_<N>.txt
 *   3. Injects a message to the agent: "Implement feature N..." or "Fix bug N..."
 *   4. When the agent signals "[PR N CREATED]" on turn_end, verifies the PR with `gh pr view`
 *      and starts the PR review watch pinned to that PR number/URL
 *   5. When the agent signals "[FEATURE N COMPLETED]" or "[BUGFIX N COMPLETED]" on turn_end,
 *      on agent_settled writes END:<timestamp> and ELAPSED MINUTES to the file
 *   6. Appends the unified execution report directly to the open PR description (via gh)
 *   7. Clears the status bar entry for the completed activity.
 *
 * While a feature/bug runs the status bar shows the live elapsed time (MM:SS), refreshed every 15s.
 *
 * Once started (by the "[PR N CREATED]" marker, or manually with /pr) the watch polls GitHub every ~20s (max 4h):
 * if the reviewer APPROVED the PR a notification is shown (the user usually merges);
 * if CHANGES_REQUESTED the agent is told to follow the AGENTS.md review workflow;
 * when the PR is MERGED the watcher stops.
 * If the agent never emits the marker, start the watch manually with /pr [N].
 * Polling is forced to ends on `/feature end` or `/bugfix end` (useful for stale polling).
 */

import type { ExtensionAPI, ExtensionContext, ExtensionCommandContext, TurnEndEvent, AgentSettledEvent } from "@earendil-works/pi-coding-agent"
import fs from "node:fs/promises"
import path from "node:path"
import { execSync, spawnSync } from "node:child_process"
import { getOpenPrList, getOpenPrListOfBranch, viewPr as githubViewPr, editPrBody, type PrSummary } from "./_shared/github.ts"
import {
    osc8Link,
    safeNotify as sharedSafeNotify,
    safeSetStatus as sharedSafeSetStatus,
    createDebug,
    pullLatestMain,
    type NotifyType,
} from "./_shared/common.ts"
import { createPrWatcher, type PrView } from "./todo-task/pr-watcher.ts"

const EXTENSION = "TODO-TASK"
const DEBUG = false
const debug = createDebug(EXTENSION, DEBUG)
const TODO_FEATURES_DIR = path.join(process.env.HOME ?? "", ".pi", "agent", "todo-tasks")
const STATUS_KEY_TASK = "alex-piccione-todo-task-task"
const STATUS_KEY_PR = "alex-piccione-todo-task-pr"
const LOCAL_LLAMA_CPP_PROVIDER = "Llama.cpp" // Provider id used for local LLMs served by llama-server (in models.json Pi file)

let latestCtx: ExtensionContext | null = null
let currentTask: CurrentTask | null = null
// Project root of the running task — needed by finishActivity to locate the branch's PR.
let taskProjectRoot: string | null = null

// Status-bar elapsed-time ticker — refreshes the status while a feature/bug runs.
let taskStatusTimer: ReturnType<typeof setInterval> | null = null
const STATUS_UPDATE_MS = 15_000

// A context capable of injecting messages into the agent stream: either the `pi` API
// (stale after any session replacement) or a fresh ReplacedSessionContext.
type MessageSender = {
    sendMessage(message: Parameters<ExtensionAPI["sendMessage"]>[0], options?: Parameters<ExtensionAPI["sendMessage"]>[1]): void | Promise<void>
    sendUserMessage(content: Parameters<ExtensionAPI["sendUserMessage"]>[0], options?: Parameters<ExtensionAPI["sendUserMessage"]>[1]): void | Promise<void>
}

// Sender state is module-scope for the same reason as the polling state below:
// Pi can re-instantiate the extension factory on session replacement without
// shutting the previous instance down, so per-instance copies would disagree
// about which context is still usable.
let messageSender: MessageSender | null = null // fresh ctx from our own withSession; falls back to the plain pi API
let newSessionForStartTask = false // ctx.newSession() is in flight for start a new task
// pi API of the most recently created extension instance — fallback sender when no fresh
// ReplacedSessionContext is available (mirrors how latestCtx tracks the newest context).
let activePi: ExtensionAPI | null = null

// Ojects
// -------------------------------------------------------------------------------------------------------------------------------------------

interface CurrentTask {
    type: "feature" | "bug"
    number: number
    startTime: number
    completed: boolean
    //name: () => `${type} ${number}`
}


// Helper functions
// -------------------------------------------------------------------------------------------------------------------------------------------

/**
 * Resolve the model actually serving requests, formatted as `<provider>/<model>`.
 * For the local Llama.cpp provider the configured name may be stale,
 * so we query the OpenAI-compatible `${baseUrl}/models` endpoint instead.
 */
async function resolveModelName(): Promise<string> {
    const m = latestCtx?.model
    if (!m) return "unknown"
    if (m.provider === LOCAL_LLAMA_CPP_PROVIDER && m.baseUrl) {
        try {
            // Assumption: ONLY ONE model is loaded on llama-server at a time — pick it.
            const res = await fetch(`${m.baseUrl}/models`)
            const data = (await res.json()) as { data?: Array<{ id: string }> }
            const id = data.data?.[0]?.id
            if (id) return `${m.provider}/${id}`
        } catch {
            safeNotify("Could not reach llama-server /models — using configured model name.", "info")
        }
    }
    return `${m.provider}/${m.name ?? "unknown"}`
}

function safeNotify(message: string, type: NotifyType = "info"): void {
    sharedSafeNotify(() => latestCtx, message, type, EXTENSION)
}

function safeSetStatus(key: string, text: string | undefined): void {
    sharedSafeSetStatus(() => latestCtx, key, text, EXTENSION)
}

function startStatusTimer(): void {
    stopStatusTimer()
    if (currentTask === null) return
    const refresh = () => {
        if (!currentTask) {
            stopStatusTimer()
            return
        }
        const emoji = currentTask.type === "feature" ? "☑️" : "🐛"
        safeSetStatus(
            STATUS_KEY_TASK,
            `${emoji} ${currentTask.type === "feature" ? "Feature" : "Bug"} ${currentTask.number} (${formatElapsed(Date.now() - currentTask.startTime)})`,
        )
    }
    refresh()
    taskStatusTimer = setInterval(refresh, STATUS_UPDATE_MS)
}

function stopStatusTimer(): void {
    if (taskStatusTimer) clearInterval(taskStatusTimer)
    taskStatusTimer = null
}

// timestamp -> YYYY-MM-DD HH:mm:ss.fff (milliseconds disambiguate report log entries)
function formatTime(ts: number): string {
    const d = new Date(ts)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}`
}

function formatElapsed(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`
}

const ensureTodoDir = (): Promise<void> =>
    fs
        .mkdir(TODO_FEATURES_DIR, { recursive: true })
        .catch((err) => {
            safeNotify(`❌ Failed to create features directory. ${err}`, "error")
        })
        .then((_) => {})

// Built once at module load — Pi never disposes an old extension instance on session swap, so per-instance
// copies would disagree about which watch is live (same reason as messageSender above). The closures read
// latestCtx/messageSender lazily, so they always reach the newest usable context.
const prWatcher = createPrWatcher({
    extension: EXTENSION,
    notify: (message, type) => safeNotify(message, type),
    setPrStatus: (text) => safeSetStatus(STATUS_KEY_PR, text),
    sendUserMessage: async (content, options) => {
        const sender = messageSender ?? activePi
        if (!sender) throw new Error("no session context available")
        await sender.sendUserMessage(content, options)
    },
    sendMessage: async (message) => {
        const sender = messageSender ?? activePi
        if (!sender) throw new Error("no session context available")
        await sender.sendMessage(message)
    },
    debug: (m) => debug(m),
})

async function finishActivity(ctx: ExtensionContext): Promise<void> {
    if (!currentTask?.completed) return
    latestCtx = ctx

    const endTime = Date.now()
    const elapsedMs = endTime - currentTask.startTime
    const elapsedMinutes = (elapsedMs / 60_000).toFixed(1)

    const fileName = currentTask.type === "feature" ? `feature_${currentTask.number}.txt` : `bug_${currentTask.number}.txt`
    const filePath = path.join(TODO_FEATURES_DIR, fileName)

    // Get model info
    const modelName = await resolveModelName()
    let tokens: number | null = null
    try {
        // ctx may have gone stale during the awaited calls above; token count is best-effort
        tokens = ctx.getContextUsage()?.tokens ?? null
    } catch (err) {
        safeNotify(`❌ getContextUsage() failed. ${err}`, "error")
    }

    const label = currentTask.type === "feature" ? "Feature" : "Bug"
    const report = `## AI agent execution report  

_(first push only, without following reviews rework)_  
🤖 Model: ${modelName}  
⏲️ Time: ${elapsedMinutes} minutes  
💰 Tokens: ${tokens ?? "n/a"}  `

    // Append to the file
    try {
        const existing = await fs.readFile(filePath, "utf8")
        await fs.writeFile(filePath, existing + report, "utf8")
    } catch {
        await fs.writeFile(filePath, report, "utf8")
    }

    // ctx was used after awaits above — guard via helpers (skip only when null, log otherwise)
    safeNotify(`✅ ${label} ${currentTask.number} completed in ${elapsedMinutes} minutes.`, "info")
    stopStatusTimer()
    safeSetStatus(STATUS_KEY_TASK, undefined)

    if (taskProjectRoot === null) safeNotify(`❌ finishActivity(). TaskProjectRoot is null.`, "error")
    else appendReportToPr(taskProjectRoot, report)

    currentTask = null
}

function appendReportToPr(cwd: string, report: string) {
    try {
        const branch = execSync("git branch --show-current", { cwd, encoding: "utf-8" }).trim()
        if (!branch || branch === "main" || branch === "master") return false

        const prs = getOpenPrListOfBranch<{ number: number; body?: string }>(cwd, branch, "number,body")
        const pr = prs[0] ?? null
        if (pr === null) {
            safeNotify(`❌ No open PR found on branch '${branch}'.`, "error")
            return
        }

        const body = (pr.body ?? "").trimEnd()

        // First push only — do not duplicate the report after review rework
        if (/^### (Feature|Bug) agent work report$/m.test(body)) return true

        editPrBody(cwd, pr.number, `${body}\n\n${report}`)
    } catch (err) {
        safeNotify(`❌ Failed to attach report to PR. ${err}`, "error")
    }
}

// Extension
// -------------------------------------------------------------------------------------------------------------------------------------------

export default function todoFeatureExtension(pi: ExtensionAPI) {
    activePi = pi // newest instance wins; poller deps fall back to it when no fresh ReplacedSessionContext exists

    const clearCurrentTask = (reason: string): void => {
        if (currentTask === null) return
        stopStatusTimer()
        prWatcher.stopPrCheckPolling()
        safeNotify(`Stop check task ${currentTask.number}. ${reason}`, "warning")
        safeSetStatus(STATUS_KEY_TASK, undefined)
        currentTask = null
    }

    pi.on("session_start", (_event, ctx: ExtensionContext) => {
        latestCtx = ctx

        // Our own /feature|/bugfix replacement → withSession re-arms sender + timers.
        if (newSessionForStartTask) {
            newSessionForStartTask = false
            return
        }

        // External replacement (/new, /resume, /fork): session_shutdown already stopped the timers,
        // pi already cleared the footer. Only a still-open task needs the user's attention.
        if (currentTask !== null) safeNotify("⚠️ PR watch paused after session switch. Run /pr to resume the watch.", "warning")
    })

    pi.on("session_shutdown", () => {
        prWatcher.stopPrCheckPolling()
        stopStatusTimer()
        messageSender = null
    })

    // Helper to parse command arguments for feature/bug
    // return number as 0 when command it is called with "end" argument
    function parseCommandArgs(args: string): { number: number; note: string | undefined; error: string | null } {
        const trimmed = args.trim()
        if (trimmed === "end") return { number: 0, note: undefined, error: null } // special case handled outside

        // Try to parse feature/bug number
        const numberMatch = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)\s*(.*)$/)
        if (!numberMatch)
            return { number: -1, note: undefined, error: "❌ Usage: /feature <number> [optional note]  —  e.g. /feature 10 or /feature 10 ignore existing PR" }

        let number: number
        let note: string | undefined

        number = parseFloat(numberMatch[1])
        if (isNaN(number) || number <= 0)
            return { number: -1, note: undefined, error: "❌ Usage: /feature <number> [optional note]  —  e.g. /feature 10 or /feature 10 ignore existing PR" }

        // Group 2 may be absent depending on the regex engine — guard before accessing.
        const notePart = numberMatch.length > 2 ? (numberMatch[2] ?? "").trim() : ""
        if (notePart) {
            // Remove surrounding quotes if present
            if ((notePart.startsWith('"') && notePart.endsWith('"')) || (notePart.startsWith("'") && notePart.endsWith("'"))) {
                note = notePart.slice(1, -1).trim()
            } else {
                note = notePart
            }
        }

        return { number, note, error: null }
    }

    // Shared logic for starting a feature/bug activity (used by /feature and /bugfix).
    async function startTask(ctx: ExtensionCommandContext, type: "feature" | "bug", number: number, note: string | undefined): Promise<void> {
        latestCtx = ctx // handler-delivered ctx is fresh
        const projectRoot = ctx.cwd ?? process.cwd()
        taskProjectRoot = projectRoot
        const END = 0 // "end" command argument is managed to send "0"

        if (number === END) {
            if (currentTask === null) {
                safeNotify("❌ No active feature or bug to end.", "info")
                return
            }
            const { type: pendingType, number: pendingNumber } = currentTask
            prWatcher.stopPrCheckPolling()
            clearCurrentTask("Forceed END of task.")
            safeNotify(`${pendingType === "feature" ? "Feature" : "Bug"} ${pendingNumber} cancelled - no timing saved.`, "info")
            return
        }

        // Cancel any currentTask activity before starting a new one
        if (currentTask) clearCurrentTask(`Start new task (${type} ${number}).`)

        // A new task must not inherit the previous task's PR: the marker is ignored while a PR
        // is already watched, so a stale watchedPr would silently drop the new task's signal.
        prWatcher.clearWatch()

        await ensureTodoDir()

        const startTime = Date.now()
        const fileName = `${type}_${number}.txt`
        const filePath = path.join(TODO_FEATURES_DIR, fileName)
        const startContent = `START: ${formatTime(startTime)}\n`
        await fs.writeFile(filePath, startContent, "utf8")

        // Run git checkout main && git pull before sending the prompt
        if (pullLatestMain(() => latestCtx, projectRoot) == false) return

        // Check the number refers to an exising Feature or Bug entry in TODO.md
        let content: string
        try {
            content = await fs.readFile(path.join(projectRoot, "TODO.md"), "utf8")
        } catch {
            safeNotify(`❌ Could not read TODO.md - cannot check if the feature/bug ${number} exists.`, "error")
            return
        }

        const matches = [...content.matchAll(/^[ \t]*[-*]\s+(Feature|Bug)\s+(\d+(?:\.\d+)?)\b/gm)].filter((m) => parseFloat(m[2]) === number)
        if (matches.length === 0) {
            safeNotify(`❌ No "Feature ${number}" or "Bug ${number}" found in the TODO backlog.`, "error")
            return
        }

        currentTask = { type, number, startTime, completed: false }

        const label = type === "feature" ? "Feature" : "Bug"
        const emoji = currentTask.type === "feature" ? "☑️" : "🐛"
        try {
            pi.setSessionName(`${emoji} ${label} ${currentTask.number}`)
        } catch {
            safeNotify(`❌ Failed to set the session name.`, "error")
        }

        startStatusTimer()

        // Inject the task to the agent

        const typeData =
            type === "feature"
                ? {
                      init: `Implement feature ${number}.`,
                      complete: `[FEATURE ${number} COMPLETED]`,
                      extra: "If the feature is too big or need to work on different areas, split it in multiple tasks and add them to the TODO. ",
                  }
                : {
                      init: `Fix bug ${number}.`,
                      complete: `[BUGFIX ${number} COMPLETED]`,
                  }

        // After you publish or update the PR, resolve conflicts with main (if there are any).\n\
        let agentMessage = `${typeData.init}\n\
If the bug is not present in the TODO backlog or the task is not 100% clear, ask for clarification from the user.\n\
While you do the code changes, **consider side effects** and required rework or refactoring**. Leave "TODO" comments in the code if needed.\n\
Test it when possible.\n\
${typeData.extra ?? ""}\n\
**IMPORTANT**: after you publish the PR, include "[PR N CREATED]" (replace N with the PR number) in your reply to the user. That precise message is used as a signal by a Pi extension to start watching the PR.\n\
**IMPORTANT**: after you complete the work, include "${typeData.complete}" in your reply to the user. That precise message is used as a signal by a Pi extension.\n`

        // Optional note: simply append to the instruction message.
        if (note == "repeat") note = "Do not read, reuse, or modify any existing PR/branch for this task. Create a brand-new branch and PR."

        if (note) agentMessage = agentMessage + `\n${note}`

        // Start a fresh session so the agent begins the task on clean state, State (todo-task, timers, START file) survives the switch.
        //const abortStart = (freshCtx: ExtensionContext | null): void => {
        const abortStart = (): void => {
            try {
                prWatcher.stopPrCheckPolling()
                stopStatusTimer()
                currentTask = null
                safeSetStatus(STATUS_KEY_TASK, undefined)
                safeSetStatus(STATUS_KEY_PR, undefined)
            } catch (err) {
                safeNotify(`❌ Failed abortStart(). ${err}`, "error")
            }
        }

        newSessionForStartTask = true
        try {
            const result = await ctx.newSession({
                withSession: async (newCtx) => {
                    latestCtx = newCtx
                    messageSender = newCtx
                    // session_shutdown stopped the ticker before the replacement; re-arm it here
                    // so it does not depend on whether session_start ran first.
                    startStatusTimer()
                    try {
                        await newCtx.waitForIdle()
                        safeNotify(`${emoji} ${label} ${number} started. Elapsed time will be recorded.`, "info")
                        await newCtx.sendUserMessage(agentMessage, { deliverAs: "steer" })
                    } catch (err) {
                        abortStart()
                        throw err
                    }
                },
            })

            if (result.cancelled) abortStart()
        } catch (err) {
            abortStart()
            safeNotify(`❌ Failed to start fresh session for ${label} ${number}: ${err instanceof Error ? err.message : String(err)}`, "error")
        } finally {
            newSessionForStartTask = false
        }
    }


// ### Register commands -------------------------------------------------------------------------------------

    pi.registerCommand("feature", {
        description: "Implement a feature from the TODO backlog. Usage: /feature <number> [note] or /feature end",
        handler: async (args, ctx) => {
            const { number, note, error } = parseCommandArgs(args)
            if (error) {
                ctx.ui.notify(error, "error")
                return
            }
            await startTask(ctx, "feature", number, note)
        },
    })

    // "/bug" is a built-in Pi interactive command, cannot be used.
    pi.registerCommand("bugfix", {
        description: "Implement the fix for a bug from the TODO backlog. Usage: /bugfix <number> [note] or /bugfix end",
        handler: async (args, ctx) => {
            const { number, note, error } = parseCommandArgs(args)
            if (error) {
                ctx.ui.notify(error, "error")
                return
            }
            await startTask(ctx, "bug", number, note)
        },
    })

    pi.registerCommand("pr", {
        description: "Check PR reviews. Continue to work on a PR. Usage: /pr [number | PR URL]",
        handler: async (args, ctx) => {
            debug("/pr command")
            latestCtx = ctx
            const projectRoot = ctx.cwd ?? process.cwd()
            taskProjectRoot = projectRoot

            const trimmed = (args ?? "").trim()
            const prNumberArg = trimmed ? parsePrArgument(trimmed) : null
            if (trimmed && prNumberArg === null) {
                safeNotify("❌ Usage: /pr [number | PR URL] — e.g. /pr, /pr 42 or /pr https://github.com/<owner>/<repo>/pull/42", "warning")
                return
            }

            try {
                //debug("/pr command  check branch")
                const branch = execSync("git branch --show-current", { cwd: projectRoot, encoding: "utf-8" }).trim()
                const onDefaultBranch = !branch || branch === "main" || branch === "master"

                // On a working branch with no explicit target: watch the current branch's PR.
                if (!onDefaultBranch && prNumberArg === null) {
                    debug("/pr command  startPrCheckPolling")
                    prWatcher.startPrCheckPolling(projectRoot)
                    return
                }

                // On the default branch (or with an explicit number/URL): move to the PR branch first.
                //debug("/pr command  resolveOpenPr")
                const pr = await resolveOpenPr(ctx, projectRoot, prNumberArg ?? undefined)
                //debug(`/pr command  resolveOpenPr ${pr}`)
                if (pr === null) return
                if (!(await switchToPrBranch(ctx, projectRoot, pr))) return

                prWatcher.startPrCheckPolling(projectRoot, { number: pr.number, url: "" })
            } catch (err) {
                safeNotify(`❌ /pr failed. ${err instanceof Error ? err.message : String(err)}`, "error")
            }
        },
    })

    // Accepts a bare number ("125"), "#125" or a full PR URL — trailing paths included:
    // https://github.com/<owner>/<repo>/pull/125 and .../pull/125/changes
    const parsePrArgument = (input: string): number | null => {
        const trimmed = input.trim()
        if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10)
        const fromUrl = /\/pull\/(\d+)/i.exec(trimmed)
        if (fromUrl) return parseInt(fromUrl[1], 10)
        const fromHash = /^#(\d+)$/.exec(trimmed)
        return fromHash ? parseInt(fromHash[1], 10) : null
    }

    const viewPr = <T = PrSummary & { state: string; url?: string }>(
        cwd: string,
        ref: number | string,
        fields = "number,state,title,headRefName,url",
    ): T | null => githubViewPr<T>(cwd, ref, fields, () => {
        console.error(`❌ [${EXTENSION}] Failed to parse result of viewPr() call.`)
        safeNotify(`❌ Failed to parse result of viewPr() call`, "error")
    })

    // Resolve which PR to watch: one open PR is picked automatically, several are offered through a dialog,
    // and an explicit number/URL always targets that specific PR — even when it is no longer open, in which case the user is told its state.
    const resolveOpenPr = async (ctx: ExtensionCommandContext, cwd: string, prNumberArg?: number): Promise<PrSummary | null> => {
        const prs = getOpenPrList<PrSummary>(cwd, "number,headRefName,title")

        if (prNumberArg !== undefined) {
            const pr = prs.find((p) => p.number === prNumberArg)
            if (pr) return pr

            const other = viewPr(cwd, prNumberArg)
            if (!other) {
                safeNotify(`❌ PR #${prNumberArg} was not found in this repository.`, "error")
                return null
            }
            // still open but outside the listed window
            if (other.state === "OPEN") return { number: other.number, headRefName: other.headRefName, title: other.title }
            const outcome = other.state === "MERGED" ? "already merged" : `closed (${other.state})`
            safeNotify(`ℹ️ ${osc8Link(other.url ?? "", `PR #${other.number}`)} is ${outcome} — nothing to poll.`, "warning")
            return null
        }

        if (prs.length === 0) {
            safeNotify("No open PR found on this repository.", "warning")
            return null
        }
        if (prs.length === 1) return prs[0]

        if (!ctx.hasUI) {
            safeNotify(`Multiple open PRs — run "/pr <number>" to pick one:\n${prs.map((p) => `#${p.number} ${p.headRefName}`).join("\n")}`, "warning")
            return null
        }
        const options = prs.map((p) => `#${p.number} ${p.headRefName} — ${p.title}`)
        const choice = await ctx.ui.select("Which open PR do you want to work on?", options)
        return prs[options.indexOf(choice ?? "")] ?? null
    }

    // Move to the branch of the PR to watch. Uncommitted changes would silently follow the
    // checkout and pollute the PR branch, so report them and ask (stash-and-continue vs abort).
    const switchToPrBranch = async (ctx: ExtensionCommandContext, cwd: string, pr: PrSummary): Promise<boolean> => {
        const current = execSync("git branch --show-current", { cwd, encoding: "utf-8" }).trim()
        if (current === pr.headRefName) return true

        const status = execSync("git status --porcelain", { cwd, encoding: "utf-8" }).trim()
        if (status) {
            const files = status
                .split("\n")
                .slice(0, 10)
                .map((l) => l.trim())
                .join("\n")
            safeNotify(`⚠️ Uncommitted changes present — they would follow the branch switch:\n${files}`, "warning")
            if (!ctx.hasUI) {
                safeNotify("Commit or stash your changes first, then run /pr again.", "warning")
                return false
            }
            const stash = await ctx.ui.confirm(
                "Switch to PR branch",
                `PR #${pr.number} (${pr.headRefName}) needs a branch switch. Stash your uncommitted changes and continue? (run "git stash pop" to restore them later)`,
            )
            if (!stash) {
                safeNotify("Aborted — nothing was stashed.", "info")
                return false
            }
            const stashRes = spawnSync("git", ["stash", "push", "-u", "-m", "pi /pr auto-stash before branch switch"], { cwd, encoding: "utf-8" })
            if (stashRes.status !== 0) {
                safeNotify(`❌ git stash failed: ${stashRes.stderr}`, "error")
                return false
            }
            safeNotify('Changes stashed — run "git stash pop" when back on your branch.', "info")
        }

        const checkoutRes = spawnSync("gh", ["pr", "checkout", String(pr.number)], { cwd, encoding: "utf-8" })
        if (checkoutRes.status !== 0) {
            safeNotify(`❌ Failed to switch to PR #${pr.number}: ${checkoutRes.stderr}`, "error")
            return false
        }
        safeNotify(`Switched to branch '${pr.headRefName}' (PR #${pr.number}).`, "info")
        return true
    }

    // Detect the task completion marker in agent chat reply.
    pi.on("turn_end", (event: TurnEndEvent, ctx: ExtensionContext) => {
        const msg = event.message
        if (msg?.role !== "assistant") return

        const text = msg.content
            .filter((b: any): b is { type: "text"; text: string } => b.type === "text")
            .map((b) => b.text)
            .join("")

        // "[FEATURE N COMPLETED]" or "[BUGFIX N COMPLETED]"
        if (currentTask !== null) {
            const { type, number: pendingNumber } = currentTask
            // N may be a float (e.g. 7.2); a number must match the active pending item
            const completionRegex =
                type === "feature" ? /\[FEATURE(?:\s+(\d+(?:\.\d+)?))?\s+COMPLETED\]/i : /\[BUGFIX(?:\s+(\d+(?:\.\d+)?))?\s+COMPLETED\]/i
            const match = completionRegex.exec(text)
            if (match && (match[1] === undefined || parseFloat(match[1]) === pendingNumber)) currentTask.completed = true
        }

        // "[PR N CREATED]"
        if (prWatcher.getWatchedPr() === null) {
            const created = /\[PR\s+(\d+)\s+CREATED\]/i.exec(text)
            if (created) {
                const prNumber = parseInt(created[1], 10)
                const cwd = taskProjectRoot ?? ctx.cwd
                const pr = viewPr<{ number: number; state: string; url: string }>(cwd, prNumber, "number,state,url")
                if (pr) prWatcher.startPrCheckPolling(cwd, { number: pr.number, url: pr.url })
                else safeNotify(`⚠️ "[PR ${prNumber} CREATED]" seen but the PR could not be verified — run /pr ${prNumber} to start the watch.`, "warning")
            }
        }
    })

    // Finalize once the run has fully settled (no retries/compactions/queued continuations
    // pending) so sendUserMessage does not hit "Agent is already processing".
    // If the run ended without a completion signal (e.g. the agent asked a question),
    // the timer keeps running until the marker is seen or /feature end / /bug end cancels it.
    pi.on("agent_settled", async (_event: AgentSettledEvent, ctx: ExtensionContext) => {
        latestCtx = ctx
        if (currentTask?.completed) await finishActivity(ctx)
    })
}
