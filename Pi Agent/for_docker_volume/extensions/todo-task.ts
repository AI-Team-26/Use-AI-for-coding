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
 *   4. When the agent signals "[FEATURE N COMPLETED]" or "[BUGFIX N COMPLETED]" on turn_end,
 *      on agent_settled writes END:<timestamp> and ELAPSED MINUTES to the file
 *   5. Appends the unified execution report directly to the open PR description (via gh)
 *   6. Clears the status bar entry for the completed activity.
 *
 * While a feature/bug runs the status bar shows the live elapsed time (MM:SS), refreshed every 15s.
 *
 * While a feature/bug session is active it also polls GitHub every ~20s (max 4h):
 * if the reviewer APPROVED the PR a notification is shown (the user usually merges);
 * if CHANGES_REQUESTED the agent is told to follow the AGENTS.md review workflow;
 * when the PR is MERGED the watcher stops.
 * Polling is forced to ends on `/feature end` or `/bugfix end` (useful for stale polling).
 */

import type { ExtensionAPI, ExtensionContext, ExtensionCommandContext, TurnEndEvent, AgentSettledEvent } from "@earendil-works/pi-coding-agent"
import fs from "node:fs/promises"
import path from "node:path"
import { execSync, spawnSync } from "node:child_process"
import {
    GRAY,
    RESET,
    osc8Link,
    safeNotify as sharedSafeNotify,
    safeSetStatus as sharedSafeSetStatus,
    createDebug,
    pullLatestMain,
    type NotifyType,
} from "./_shared/common.ts"

const EXTENSION = "TODO-TASK"
const DEBUG = false
const debug = createDebug(EXTENSION, DEBUG)
const TODO_FEATURES_DIR = path.join(process.env.HOME ?? "", ".pi", "agent", "todo-tasks")
const STATUS_KEY_TASK = "alex-piccione-todo-task-task"
const STATUS_KEY_PR = "alex-piccione-todo-task-pr"
const LOCAL_LLAMA_CPP_PROVIDER = "Llama.cpp" // Provider id used for local LLMs served by llama-server (in models.json Pi file)

let latestCtx: ExtensionContext | null = null
let currentTask: CurrentTask | null = null
let watchedPr: WatchedPr | null = null
// Project root of the running task — needed by finishActivity to locate the branch's PR.
let taskProjectRoot: string | null = null
const handledReviewDecisions = new Map<string, string>() // track reviews to not "resend" messages/action multiple time for the same

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
let ownSessionReplacement = false // ctx.newSession() is in flight

// The timer lives at module scope because Pi never disposes the old extension instance on session swap,
// so only the new instance — sharing the same variables — can clear the leaked interval and keep a single watcher.
let prCheckTimer: ReturnType<typeof setInterval> | null = null
const PR_CHECK_INTERVAL_MS = 20_000
const PR_CHECKING_MAX_MS = 4 * 60 * 60 * 1000 // 4 hours | Safenet: stop polling after this long even if no decision was made (can be increased later).
let checkCounter = 0
let prCheckStartedAt = 0 // TODO: can be set in the  WatchedPr
// Transient gh failures are notified once per run (the first tick), then demoted to debug.
let consecutiveGhFailures = 0

// Ojects
// -------------------------------------------------------------------------------------------------------------------------------------------

interface CurrentTask {
    type: "feature" | "bug"
    number: number
    startTime: number
    completed: boolean
    //name: () => `${type} ${number}`
}

interface WatchedPr {
    number: number
    url: string
    // watchStartAt: number   // last watch start   // ms Epoch?
}

// Minimal PR info needed to pick and switch to a branch.
interface PrSummary {
    number: number
    headRefName: string
    title: string
}

interface PrView {
    number: number
    state: string
    mergeable: string // 'CONFLICTING'
    //statusCheckRollup: Array<{ status: 'IN_PROGRESS' | 'QUEUED' | 'COMPLETED', conclusion: string }>  // 'FAILURE' | 'CANCELLED'  ### NOTE: requires specific PAT permission that I can't find at teh moment.
    reviewDecision: string | null
    reviews: Array<{ id: string; submittedAt: string; state: string; body?: string }>
    url: string
    headRefOid: string
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
            safeNotify(`${EXTENSION} ❌ Failed to create features directory. ${err}`, "error")
            //console.error('Failed to create features directory.', err)
        })
        .then((_) => {})

function getOpenPrList<T>(cwd: string, branch: string, fields: string): T[] {
    const res = spawnSync("gh", ["pr", "list", "--head", branch, "--state", "open", "--json", fields], { cwd, encoding: "utf-8" })
    if (res.status !== 0) throw new Error(`gh pr list failed (${res.status}): ${res.stderr}`)
    return JSON.parse(res.stdout) as T[]
}

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
        safeNotify(`${EXTENSION} ❌ getContextUsage() failed. ${err}`, "error")
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

        const prs = getOpenPrList<{ number: number; body?: string }>(cwd, branch, "number,body")
        const pr = prs[0]
        if (pr === null) {
            safeNotify(`❌ PR not found on branch '${branch}'.`, "error")
            return
        }

        const body = (pr.body ?? "").trimEnd()

        // First push only — do not duplicate the report after review rework
        if (/^### (Feature|Bug) agent work report$/m.test(body)) return true

        const editRes = spawnSync("gh", ["pr", "edit", String(pr.number), "--body", `${body}\n\n${report}`], { cwd, encoding: "utf-8" })
        if (editRes.status !== 0) throw new Error(`gh pr edit failed (${editRes.status}): ${editRes.stderr}`)
    } catch (err) {
        safeNotify(`❌ Failed to attach report to PR. ${err}`, "error")
    }
}

// Extension
// -------------------------------------------------------------------------------------------------------------------------------------------

export default function todoFeatureExtension(pi: ExtensionAPI) {
    const clearCurrentTask = (reason: string): void => {
        if (currentTask === null) return
        stopStatusTimer()
        stopPrCheckPolling()
        safeNotify(`Stop check task ${currentTask.number}. ${reason}`, "warning")
        safeSetStatus(STATUS_KEY_TASK, undefined)
        currentTask = null
    }

    // Transient send failures are notified once per run (the first tick), then demoted to debug,
    // mirroring onGhFailure: a single error must not spam the user every poll.
    let consecutiveSendFailures = 0

    // Swallow both sync throws and async rejections from a possibly-stale sender:
    // an uncaught error inside the setInterval callback would crash Pi.
    // Resolves true only when the send actually completed; callers use that to
    // decide whether a review event counts as delivered (undelivered events retry next tick).
    const onSendError = (what: string, err: unknown): void => {
        consecutiveSendFailures++
        if (consecutiveSendFailures === 1) safeNotify(`❌ Failed to deliver message (${what}). ${err}`, "error")
        else debug(`Failed to deliver message (${what}) (${consecutiveSendFailures}x): ${err}`)
    }

    const safeSendUserMessage = async (
        content: Parameters<ExtensionAPI["sendUserMessage"]>[0],
        options?: Parameters<ExtensionAPI["sendUserMessage"]>[1],
    ): Promise<boolean> => {
        try {
            await (messageSender ?? pi).sendUserMessage(content, options)
            consecutiveSendFailures = 0
            return true
        } catch (err) {
            onSendError("safeSendUserMessage", err)
            return false
        }
    }

    const safeSendMessage = async (
        message: Parameters<ExtensionAPI["sendMessage"]>[0],
        options?: Parameters<ExtensionAPI["sendMessage"]>[1],
    ): Promise<boolean> => {
        try {
            await (messageSender ?? pi).sendMessage(message, options)
            consecutiveSendFailures = 0
            return true
        } catch (err) {
            onSendError("safeSendMessage", err)
            return false
        }
    }

    // Discovery: the open PR of a branch, used only until a PR has been watched once.
    const getBranchOpenPr = (cwd: string, branch: string): PrView | null => {
        const prs = getOpenPrList<PrView>(cwd, branch, "number,state,mergeable,reviewDecision,reviews,url,headRefOid")
        return prs[0] ?? null
    }

    // Watching: always the watched PR by number, whatever branch is checked out. The URL is
    // preferred so a re-arm from another repository cannot resolve a same-numbered PR.
    const viewPrForReview = (cwd: string, prNumber: number, url?: string): PrView | null =>
        viewPr<PrView>(cwd, url || prNumber, "number,state,mergeable,reviewDecision,reviews,url,headRefOid")

    // Transient gh failures are notified once per run, then demoted to debug: a single network,
    // auth or rate-limit error must not end the watch (PR_CHECKING_MAX_MS bounds it instead).
    const onGhFailure = (context: string, err: unknown): void => {
        consecutiveGhFailures++
        safeSetStatus(STATUS_KEY_PR, `⚠️ ${GRAY}PR check failing (${consecutiveGhFailures}x)${RESET}`)
        if (consecutiveGhFailures === 1) safeNotify(`❌ ${context} (will retry).`, "error")
        debug(`${context} failed (${consecutiveGhFailures}x): ${err}`)
    }

    // Announce a finished PR and stop the watch.
    const stopIfPrFinished = (pr: { number: number; url?: string; state: string }): boolean => {
        if (pr.state !== "MERGED" && pr.state !== "CLOSED") return false

        stopPrCheckPolling()
        watchedPr = null

        const link = osc8Link(pr.url ?? "", `PR #${pr.number}`)
        if (pr.state === "MERGED") {
            safeNotify(`✅ PR MERGED. ${link}`, "info")
            void safeSendUserMessage(`PR #${pr.number} was merged (delete the branch if it wasn't).`, { deliverAs: "followUp" }) // terminal announcement; polling stops here anyway
        } else {
            safeNotify(`⏹️ PR CLOSED. ${link}`, "info")
            void safeSendUserMessage(`PR #${pr.number} was closed without merge.`, { deliverAs: "followUp" }) // terminal announcement; polling stops here anyway
        }
        return true
    }

    type PR_STATUS = "APPROVED" | "REJECTED" | "WAITING_REVIEW"

    // Resolve which state the PR is currently in. A non-null aggregate reviewDecision is authoritative;
    // GitHub leaves it null when there is no classic branch-protection review requirement (or it comes
    // from a ruleset), so fall back to the newest decisive individual review then (an older round is
    // superseded by any newer one).
    const resolvePrStatus = (pr: PrView): PR_STATUS => {
        const decision = pr.reviewDecision ?? ""
        if (decision === "APPROVED") return "APPROVED"
        if (decision === "CHANGES_REQUESTED") return "REJECTED"
        if (decision !== "") return "WAITING_REVIEW" // PENDING / DISMISSED / REVIEW_REQUIRED ...
        const decisive = (pr.reviews ?? []).filter((r) => r.state === "APPROVED" || r.state === "CHANGES_REQUESTED")
        if (!decisive.length) return "WAITING_REVIEW"
        const latest = decisive.reduce((a, b) => (b.submittedAt > a.submittedAt ? b : a))
        return latest.state === "APPROVED" ? "APPROVED" : "REJECTED"
    }

    // A rejection older than the newest head commit means fixes were already pushed: GitHub keeps
    // showing CHANGES_REQUESTED until a fresh Approve, but we're merely waiting for re-review now.
    // Derived from GitHub each poll, so this survives extension restarts (the handled map resets per session).
    const isStaleRejection = (cwd: string, pr: PrView): boolean => {
        const rejections = (pr.reviews ?? []).filter((r) => r.state === "CHANGES_REQUESTED")
        if (!rejections.length || !pr.headRefOid) return false
        const slug = pr.url?.match(/github\.com\/([^/]+\/[^/]+)\/pull/)?.[1]
        if (!slug) return false
        const latest = Date.parse(rejections.reduce((a, b) => (b.submittedAt > a.submittedAt ? b : a)).submittedAt)
        const res = spawnSync("gh", ["api", `repos/${slug}/commits/${pr.headRefOid}`, "--jq", ".commit.committer.date"], { cwd, encoding: "utf-8" })
        if (res.status !== 0) return false // transient gh failure: fail toward notifying rather than swallowing the rejection
        const headDate = Date.parse(res.stdout.trim())
        return Number.isFinite(headDate) && Number.isFinite(latest) && headDate > latest
    }

    const checkPrReview = async (cwd: string): Promise<void> => {
        debug(`checkPrReview() ${checkCounter}`)
        safeNotify(`Checking PR review ...`, "info")
        checkCounter++
        safeSetStatus(STATUS_KEY_PR, `👀 ${GRAY}(checking PR)${RESET}`)

        // Safenet: stop polling after PR_CHECKING_MAX_MS even without a reviewer decision.
        if (Date.now() - prCheckStartedAt > PR_CHECKING_MAX_MS) {
            stopPrCheckPolling()
            const prRef = watchedPr ? ` Waiting for the review of ${osc8Link(watchedPr.url, `PR #${watchedPr.number}`)}.` : ""
            await safeSendMessage({
                customType: `${EXTENSION}-stop-pr-check-polling`,
                content: `⏸️ Stopped watching for PR review (time limit reached).${prRef}`,
                display: true,
                details: {},
            })
            return
        }

        try {
            // Two modes: discover the branch's open PR until one is found, then follow that PR by
            // number — so a merge or close is detected from any branch, including main/detached.
            let pr: PrView | null
            if (watchedPr) {
                pr = viewPrForReview(cwd, watchedPr.number, watchedPr.url)
                if (pr === null) return onGhFailure(`Failed to fetch PR #${watchedPr.number}`, "gh pr view returned no data")
            } else {
                let branch = ""
                try {
                    branch = execSync("git branch --show-current", { cwd, encoding: "utf-8" }).trim()
                } catch (err) {
                    return onGhFailure("Failed to read the current branch", err)
                }
                if (branch && branch !== "main" && branch !== "master") {
                    try {
                        pr = getBranchOpenPr(cwd, branch)
                    } catch (err) {
                        return onGhFailure(`Failed to fetch PR of branch "${branch}"`, err)
                    }
                } else pr = null

                if (pr === null) {
                    safeSetStatus(STATUS_KEY_PR, `👀 ${GRAY}(waiting for PR)${RESET}`)
                    debug(`No open PR on branch '${branch || "(detached)"}' yet (${checkCounter})`)
                    return
                }
                debug(`PR "#${pr.number}" found on the branch "${branch}"`)

                // Identity fixed here (or handed in at arm time); the URL never changes for a PR number.
                watchedPr = { number: pr.number, url: pr.url }
            }

            consecutiveGhFailures = 0

            // 👀🔍📢👁️🏷️🔔📌📦🚩🎫
            safeSetStatus(STATUS_KEY_PR, `🚩 ${osc8Link(watchedPr.url, `PR #${watchedPr.number} (${pr.state})`)}`)

            if (stopIfPrFinished(pr)) return

            if (pr.state !== "OPEN") return safeNotify(`⚠️ Unmanaged PR state: ${pr.state}`, "warning")

            const prStatus = resolvePrStatus(pr)
            debug(`PR status: '${prStatus}' (${checkCounter})`)

            const hasConflicts = pr.mergeable === "CONFLICTING"

            // Keep track of already-notified events to avoid resending the same message on every poll.
            // Dedup per REVIEW EVENT, not per status value: two successive rejections share the same status but have distinct review ids.
            const decisiveReviews = (pr.reviews ?? []).filter((r) => r.state === "APPROVED" || r.state === "CHANGES_REQUESTED") // ignore COMMENTED and DISMISSED
            const latestEventId = decisiveReviews.length ? decisiveReviews.reduce((a, b) => (b.submittedAt > a.submittedAt ? b : a)).id : ""
            const key = `${pr.number}:${prStatus}:${latestEventId}`
            if (handledReviewDecisions.has(key)) {
                debug(`checkPrReview() ${checkCounter} key already mapped: ${key}. Status:${prStatus}. NOTHING TO DO`)
                return
            }

            let delivered = false
            switch (prStatus) {
                case "APPROVED": {
                    delivered = await safeSendMessage({
                        customType: `${EXTENSION}-approved`,
                        content: `✅ ${osc8Link(pr.url, `PR #${pr.number}`)} approved — can be merged.`,
                        display: true,
                        details: {},
                    })
                    if (hasConflicts) void safeSendUserMessage(`PR #${pr.number} has conflicts with base — rebase and push`, { deliverAs: "followUp" })
                    break
                }
                case "REJECTED": {
                    if (isStaleRejection(cwd, pr))
                        delivered = await safeSendUserMessage(
                            `ℹ️ The rejection of ${osc8Link(pr.url, `PR #${pr.number}`)} was already reworked — new commits since the review, awaiting re-review. No action needed.`,
                            { deliverAs: "followUp" },
                        )
                    else delivered = await safeSendUserMessage(`❌ PR was reviewed and Rejected. Follow the instructions in AGENTS.md`, { deliverAs: "followUp" })
                    if (hasConflicts) void safeSendUserMessage(`PR #${pr.number} has conflicts with base — rebase and push`, { deliverAs: "followUp" })
                    break
                }
                case "WAITING_REVIEW": {
                    if (checkCounter == 1 && hasConflicts)
                        void safeSendUserMessage(`PR #${pr.number} has conflicts with base — rebase and push`, { deliverAs: "followUp" })
                    debug(`checkPrReview() ${checkCounter}  NOTHING TO DO`)
                    break
                }
            }

            // Marked handled only once the notification was actually handed off; 
            // an undelivered event is retried next tick since checkPrReview re-derives everything from GitHub.
            if (prStatus !== "WAITING_REVIEW") {
                if (delivered) handledReviewDecisions.set(key, prStatus)
                else debug(`checkPrReview() ${checkCounter} notification not delivered — will retry next tick`)
            }

            debug(`checkPrReview() END ${checkCounter}`)
        } catch (err) {
            onGhFailure("checkPrReview() failed", err)
        }
    }

    // A caller that already knows the PR hands it in, so the watch starts by number instead of
    // falling back to branch discovery (which cannot see a PR that is already merged or closed).
    const startPrCheckPolling = (cwd: string, pr: { number: number; url: string } | null = null): void => {
        stopPrCheckPolling()
        safeNotify(`Start PR check...`, "info") // after stopPrCheckPolling so we see the notification
        prCheckStartedAt = Date.now()
        handledReviewDecisions.clear()
        watchedPr = pr
        consecutiveGhFailures = 0
        prCheckTimer = setInterval(() => {
            void checkPrReview(cwd) // all errors are caught inside; a rejection cannot escape
        }, PR_CHECK_INTERVAL_MS)
        void checkPrReview(cwd)
    }

    const stopPrCheckPolling = (): void => {
        if (prCheckTimer) clearInterval(prCheckTimer)
        prCheckTimer = null
        checkCounter = 0
        safeSetStatus(STATUS_KEY_PR, undefined)
        safeNotify(`Stop PR check.`, "info")
        // Deliberately NOT clearing watchedPr here: this also runs on re-arm (session replacement),
        // where the number must survive to keep following the same PR instead of re-discovering by branch.
    }

    // Track the latest ctx from every event that delivers one; command handlers also
    // refresh it (see startTask). Timer callbacks never use a captured ctx directly.
    pi.on("session_start", (_event, ctx: ExtensionContext) => {
        latestCtx = ctx
        if (currentTask === null) return
        // ctx.newSession() emits session_shutdown and session_start BEFORE running the
        // withSession callback (see finishSessionReplacement in pi's agent-session-runtime),
        // so the session_start of our own replacement must not be mistaken for an external
        // one: withSession re-arms the sender and the timers.
        if (ownSessionReplacement) return
        // Any non-own session_start while a task runs is an external replacement (/new, model
        // switch, ...): session_shutdown already cleared messageSender, so the plain pi API is
        // stale too until we re-arm in our own withSession.
        if (messageSender !== null) {
            // The number survives the replacement: re-discovery would look for an open PR that may
            // have been merged or closed while the session was switched.
            startPrCheckPolling(ctx.cwd ?? process.cwd(), watchedPr)
            startStatusTimer()
        } else {
            stopPrCheckPolling()
            stopStatusTimer()
            safeNotify("⚠️ PR polling paused after session switch. Run /feature N or /bugfix N to resume.", "warning")
            safeSetStatus(STATUS_KEY_PR, undefined)
        }
    })

    pi.on("session_shutdown", () => {
        stopPrCheckPolling()
        stopStatusTimer()
        // Any session replacement invalidates the fresh ctx; our own withSession re-establishes it.
        // ownSessionReplacement is deliberately kept: its session_start fires before withSession.
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
            stopPrCheckPolling()
            clearCurrentTask("Forceed END of task.")
            safeNotify(`${pendingType === "feature" ? "Feature" : "Bug"} ${pendingNumber} cancelled - no timing saved.`, "info")
            return
        }

        // Cancel any currentTask activity before starting a new one
        if (currentTask) clearCurrentTask(`Start new task (${type} ${number}).`)

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

        /*
        // Auto-detect if number refers to a Feature or a Bug
        if (new Set(matches.map(m => m[1])).size > 1) {
        safeNotify(`\u274c Ambiguous: "${number}" exists as both a Feature and a Bug in the TODO backlog. Use /feature or specify which one.`, 'error')
        return
        }
        */

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
**IMPORTANT**: after you publish or update the PR, include "${typeData.complete}" in your reply to the user. That precise message is used as a signal by a Pi extension.\n`

        // Optional note: simply append to the instruction message.
        if (note == "repeat") note = "Do not read, reuse, or modify any existing PR/branch for this task. Create a brand-new branch and PR."

        if (note) agentMessage = agentMessage + `\n${note}`

        // Start a fresh session so the agent begins the task on clean state, State (todo-task, timers, START file) survives the switch.
        //const abortStart = (freshCtx: ExtensionContext | null): void => {
        const abortStart = (): void => {
            try {
                stopPrCheckPolling()
                stopStatusTimer()
                currentTask = null
                //safeSetStatus(freshCtx, STATUS_KEY_TASK, undefined)
                //safeSetStatus(freshCtx, STATUS_KEY_PR, undefined)
                //latestCtx = freshCtx
                safeSetStatus(STATUS_KEY_TASK, undefined)
                safeSetStatus(STATUS_KEY_PR, undefined)
            } catch (err) {
                safeNotify(`❌ Failed abortStart(). ${err}`, "error")
            }
        }

        let replacementCtx: ExtensionContext | null = null
        ownSessionReplacement = true
        try {
            const result = await ctx.newSession({
                withSession: async (newCtx) => {
                    replacementCtx = newCtx
                    latestCtx = newCtx
                    messageSender = newCtx
                    ownSessionReplacement = false
                    // session_shutdown stopped the ticker before the replacement; re-arm it here
                    // so it does not depend on whether session_start ran first.
                    startStatusTimer()
                    try {
                        await newCtx.waitForIdle()
                        safeNotify(`${emoji} ${label} ${number} started. Elapsed time will be recorded.`, "info")
                        await newCtx.sendUserMessage(agentMessage, { deliverAs: "steer" })

                        startPrCheckPolling(projectRoot)
                    } catch (err) {
                        abortStart()
                        throw err
                    }
                },
            })
            ownSessionReplacement = false
            //if (result.cancelled) abortStart(replacementCtx)

            if (result.cancelled) abortStart()
        } catch (err) {
            ownSessionReplacement = false
            //if (replacementCtx) latestCtx = replacementCtx
            abortStart()
            safeNotify(`❌ Failed to start fresh session for ${label} ${number}: ${err instanceof Error ? err.message : String(err)}`, "error")
        }
    }

    // ### register commands -------------------------------------------------------------------------------------

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
                    startPrCheckPolling(projectRoot)
                    return
                }

                // On the default branch (or with an explicit number/URL): move to the PR branch first.
                //debug("/pr command  resolveOpenPr")
                const pr = await resolveOpenPr(ctx, projectRoot, prNumberArg ?? undefined)
                //debug(`/pr command  resolveOpenPr ${pr}`)
                if (pr === null) return
                if (!(await switchToPrBranch(ctx, projectRoot, pr))) return

                startPrCheckPolling(projectRoot, { number: pr.number, url: "" })
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

    // Single-PR lookup, used when the PR is missing from the open list so merged and closed can be reported distinctly from "does not exist".
    // Single-PR lookup shared by `/pr` and the poller. Returns null when `gh` fails or the
    // output cannot be parsed; callers that must not mistake a failure for "PR gone" retry it.
    const viewPr = <T = PrSummary & { state: string; url?: string }>(
        cwd: string,
        ref: number | string,
        fields = "number,state,title,headRefName,url",
    ): T | null => {
        const res = spawnSync("gh", ["pr", "view", String(ref), "--json", fields], { cwd, encoding: "utf-8" })
        if (res.status !== 0) return null
        try {
            return JSON.parse(res.stdout) as T
        } catch {
            console.error(`❌ [${EXTENSION}] Failed to parse result of viewPr() call.`)
            safeNotify(`❌ Failed to parse result of viewPr() call`, "error")
            return null
        }
    }

    // Resolve which PR to watch: one open PR is picked automatically, several are offered through a dialog,
    // and an explicit number/URL always targets that specific PR — even when it is no longer open, in which case the user is told its state.
    const resolveOpenPr = async (ctx: ExtensionCommandContext, cwd: string, prNumberArg?: number): Promise<PrSummary | null> => {
        const listRes = spawnSync("gh", ["pr", "list", "--state", "open", "--json", "number,headRefName,title", "--limit", "100"], { cwd, encoding: "utf-8" })
        if (listRes.status !== 0) throw new Error(`gh pr list failed (${listRes.status}): ${listRes.stderr}`)
        const prs = JSON.parse(listRes.stdout) as PrSummary[]

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

    // Detect the completion marker in assistant chat replies.
    // Accepts "[FEATURE N COMPLETED]" or "[BUGFIX N COMPLETED]" (N may be a float, e.g. 7.2);
    // a number must match the active pending item.
    pi.on("turn_end", (event: TurnEndEvent) => {
        if (currentTask === null) return
        const { type, number: pendingNumber } = currentTask
        const msg = event.message
        if (msg?.role !== "assistant") return
        const text = msg.content
            .filter((b: any): b is { type: "text"; text: string } => b.type === "text")
            .map((b) => b.text)
            .join("")
        // strip common model decorations (backticks/bold/whitespace) around the marker
        const cleaned = text.replace(/[\s`*_]+/g, " ")
        let match: RegExpExecArray | null
        if (type === "feature") {
            match = /\[FEATURE( \d+(?:\.\d+)?)? COMPLETED\]/i.exec(cleaned)
        } else {
            match = /\[BUGFIX( \d+(?:\.\d+)?)? COMPLETED\]/i.exec(cleaned)
        }
        if (!match) return
        // if a number was given it must refer to the active pending item
        if (match[1] !== undefined && parseFloat(match[1]) !== pendingNumber) return
        currentTask.completed = true
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
