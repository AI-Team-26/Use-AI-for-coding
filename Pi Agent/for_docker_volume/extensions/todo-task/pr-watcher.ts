// ~/.pi/agent/extensions/todo-task/pr-watcher.ts
/**
 * Follows one PR until it is merged/closed or the watch is stopped, announcing reviewer decisions.
 *
 * Pi-facing side effects arrive through injected deps; GitHub and git are called directly.
 */

import { execSync, spawnSync } from "node:child_process"
import { GRAY, RESET, osc8Link, type NotifyType } from "../_shared/common.ts"
import { getOpenPrListOfBranch, viewPr as githubViewPr } from "../_shared/github.ts"

export interface PrView {
    number: number
    state: string
    mergeable: string // 'CONFLICTING'
    reviewDecision: string | null
    reviews: Array<{ id: string; submittedAt: string; state: string; body?: string }>
    url: string
    headRefOid: string
}

export interface WatchedPr {
    number: number
    url: string
}

export type PrStatus = "APPROVED" | "REJECTED" | "WAITING_REVIEW"

interface CustomMessage {
    customType: string
    content: string
    display: boolean
    details: Record<string, unknown>
}

export interface PrWatcherDeps {
    /** Extension name, shared with its owner so customType prefixes cannot drift apart. */
    extension: string
    notify(message: string, type?: NotifyType): void
    setPrStatus(text: string | undefined): void
    sendUserMessage(content: string, options?: { deliverAs?: "steer" | "followUp" }): Promise<void>
    sendMessage(message: CustomMessage): Promise<void>
    debug(message: string): void
}

export interface PrWatcherApi {
    startPrCheckPolling(cwd: string, pr?: WatchedPr | null): void
    stopPrCheckPolling(): void
    /** Drop the watched identity and dedup state without touching timers: a new task must not inherit the previous task's PR. */
    clearWatch(): void
    getWatchedPr(): WatchedPr | null
}

const PR_CHECK_INTERVAL_MS = 20_000
const PR_CHECKING_MAX_MS = 4 * 60 * 60 * 1000 // 4 hours | Safenet: stop polling after this long even if no decision was made (can be increased later).
const PR_FIELDS = "number,state,mergeable,reviewDecision,reviews,url,headRefOid"

export function createPrWatcher(deps: PrWatcherDeps): PrWatcherApi {
    let prCheckTimer: ReturnType<typeof setInterval> | null = null
    let watchGeneration = 0
    let prCheckStartedAt = 0
    let firstTick = true
    let watchedPr: WatchedPr | null = null
    let consecutiveGhFailures = 0
    let consecutiveSendFailures = 0
    const handledReviewDecisions = new Map<string, string>() // track reviews to not "resend" messages/action multiple time for the same

    // A watch arms with a number (or a URL); both resolve to the same PR from any branch, which
    // branch discovery cannot do once the PR is merged or the checkout moved to main.
    const viewPr = (cwd: string, ref: number | string): PrView | null =>
        githubViewPr<PrView>(cwd, ref, PR_FIELDS, () => {
            console.error(`❌ [${deps.extension}] Failed to parse result of viewPr() call.`)
            deps.notify("❌ Failed to parse result of viewPr() call", "error")
        })

    const listBranchOpenPr = (cwd: string, branch: string): PrView | null => getOpenPrListOfBranch<PrView>(cwd, branch, PR_FIELDS)[0] ?? null

    const currentBranch = (cwd: string): string => execSync("git branch --show-current", { cwd, encoding: "utf-8" }).trim()

    const getHeadCommitDateInMs = (cwd: string, slug: string, oid: string): number | null => {
        const res = spawnSync("gh", ["api", `repos/${slug}/commits/${oid}`, "--jq", ".commit.committer.date"], { cwd, encoding: "utf-8" })
        if (res.status !== 0) return null
        const ms = Date.parse(res.stdout.trim())
        return Number.isFinite(ms) ? ms : null
    }

    // Transient send failures are notified once per run (the first tick), then demoted to debug:
    // a single error must not spam the user every poll.
    const onSendError = (what: string, err: unknown): void => {
        consecutiveSendFailures++
        if (consecutiveSendFailures === 1) deps.notify(`❌ Failed to deliver message (${what}). ${err}`, "error")
        else deps.debug(`Failed to deliver message (${what}) (${consecutiveSendFailures}x): ${err}`)
    }

    // Swallow both sync throws and async rejections from a possibly-stale sender:
    // an uncaught error inside the setInterval callback would crash Pi.
    // Resolves true only when the send actually completed; callers use that to
    // decide whether a review event counts as delivered (undelivered events retry next tick).
    const safeSendUserMessage = async (content: string, options?: { deliverAs?: "steer" | "followUp" }): Promise<boolean> => {
        try {
            await deps.sendUserMessage(content, options)
            consecutiveSendFailures = 0
            return true
        } catch (err) {
            onSendError("safeSendUserMessage", err)
            return false
        }
    }

    const safeSendMessage = async (message: CustomMessage): Promise<boolean> => {
        try {
            await deps.sendMessage(message)
            consecutiveSendFailures = 0
            return true
        } catch (err) {
            onSendError("safeSendMessage", err)
            return false
        }
    }

    // Transient gh failures are notified once per run, then demoted to debug: a single network,
    // auth or rate-limit error must not end the watch (PR_CHECKING_MAX_MS bounds it instead).
    const onGhFailure = (context: string, err: unknown): void => {
        consecutiveGhFailures++
        deps.setPrStatus(`⚠️ ${GRAY}PR check failing (${consecutiveGhFailures}x)${RESET}`)
        if (consecutiveGhFailures === 1) deps.notify(`❌ ${context} (will retry).`, "error")
        deps.debug(`${context} failed (${consecutiveGhFailures}x): ${err}`)
    }

    // Announce a finished PR and stop the watch.
    const stopIfPrFinished = (pr: { number: number; url?: string; state: string }): boolean => {
        if (pr.state !== "MERGED" && pr.state !== "CLOSED") return false

        stopPrCheckPolling()
        watchedPr = null

        const link = osc8Link(pr.url ?? "", `PR #${pr.number}`)
        if (pr.state === "MERGED") {
            deps.notify(`✅ PR MERGED. ${link}`, "info")
            void safeSendUserMessage(`PR #${pr.number} was merged (delete the branch if it wasn't).`, { deliverAs: "followUp" })
        } else {
            deps.notify(`⏹️ PR CLOSED. ${link}`, "info")
            void safeSendUserMessage(
                `PR #${pr.number} was closed. Do not push further commits to that branch; ask the user whether the branch should be deleted.`,
                { deliverAs: "followUp" },
            )
        }
        return true
    }

    // Resolve which state the PR is currently in. A non-null aggregate reviewDecision is authoritative;
    // GitHub leaves it null when there is no classic branch-protection review requirement (or it comes
    // from a ruleset), so fall back to the newest decisive individual review then (an older round is
    // superseded by any newer one).
    const resolvePrStatus = (pr: PrView): PrStatus => {
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
        const headMs = getHeadCommitDateInMs(cwd, slug, pr.headRefOid)
        // null (transient gh failure or unparseable date) fails toward notifying rather than swallowing the rejection
        return headMs !== null && Number.isFinite(latest) && headMs > latest
    }

    // Discovery + follow loop. Runs once immediately when armed, then every PR_CHECK_INTERVAL_MS.
    const checkPrReview = async (cwd: string): Promise<void> => {
        const isFirst = firstTick
        firstTick = false
        deps.debug(`checkPrReview() ${isFirst ? "(first tick)" : ""}`)
        deps.setPrStatus(`👀 ${GRAY}(checking PR)${RESET}`)

        // Safenet: stop polling after PR_CHECKING_MAX_MS even without a reviewer decision.
        if (Date.now() - prCheckStartedAt > PR_CHECKING_MAX_MS) {
            stopPrCheckPolling()
            const prRef = watchedPr ? ` Waiting for the review of ${osc8Link(watchedPr.url, `PR #${watchedPr.number}`)}.` : ""
            await safeSendMessage({
                customType: `${deps.extension}-stop-pr-check-polling`,
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
                pr = viewPr(cwd, watchedPr.url || watchedPr.number)
                if (pr === null) return onGhFailure(`Failed to fetch PR #${watchedPr.number}`, "gh pr view returned no data")
                // /pr <number> arms with an empty URL; it is stable per PR number, so backfill it
                // here — otherwise the status bar link and the time-limit message lose the reference.
                if (pr.url && pr.url !== watchedPr.url) watchedPr.url = pr.url
            } else {
                let branch = ""
                try {
                    branch = currentBranch(cwd)
                } catch (err) {
                    return onGhFailure("Failed to read the current branch", err)
                }
                if (branch && branch !== "main" && branch !== "master") {
                    try {
                        pr = listBranchOpenPr(cwd, branch)
                    } catch (err) {
                        return onGhFailure(`Failed to fetch PR of branch "${branch}"`, err)
                    }
                } else pr = null

                if (pr === null) {
                    deps.setPrStatus(`👀 ${GRAY}(NO PR)${RESET}`)
                    deps.debug(`No open PR on branch '${branch || "(detached)"}' yet`)
                    return
                }
                deps.debug(`PR "#${pr.number}" found on the branch "${branch}"`)

                // Identity fixed here (or handed in at arm time); the URL never changes for a PR number.
                watchedPr = { number: pr.number, url: pr.url }
            }

            consecutiveGhFailures = 0

            // 👀🔍📢👁️🏷️🔔📌📦🚩🎫
            deps.setPrStatus(`🚩 ${osc8Link(watchedPr.url, `PR #${watchedPr.number} (${pr.state})`)}`)

            if (stopIfPrFinished(pr)) return

            if (pr.state !== "OPEN") return deps.notify(`⚠️ Unmanaged PR state: ${pr.state}`, "warning")

            const myGeneration = watchGeneration // to distinguish proper value and avoid use wrong values in case of colliding concurrent runs

            const prStatus = resolvePrStatus(pr)
            deps.debug(`PR status: '${prStatus}'`)

            const hasConflicts = pr.mergeable === "CONFLICTING"

            // Conflicts are tracked separately from review events: a PR can turn CONFLICTING *after*
            // its verdict was already announced, so this must run before the dedup early return below.
            // Keyed by head commit: a rebase (new head) starts a fresh notice, the same conflicted
            // head notifies only once, and a failed handoff releases the key so it retries next tick.
            if (hasConflicts) {
                const conflictKey = `${pr.number}:CONFLICTS:${pr.headRefOid ?? ""}`
                if (!handledReviewDecisions.has(conflictKey)) {
                    handledReviewDecisions.set(conflictKey, "CONFLICTING")
                    const ok = await safeSendUserMessage(`PR #${pr.number} has conflicts with base — rebase and push`, { deliverAs: "followUp" })
                    if (!ok && myGeneration === watchGeneration) handledReviewDecisions.delete(conflictKey)
                }
            }

            // Keep track of already-notified events to avoid resending the same message on every poll.
            // Dedup per REVIEW EVENT, not per status value: two successive rejections share the
            // same status but have distinct review ids.
            // ignore COMMENTED and DISMISSED
            const decisiveReviews = (pr.reviews ?? []).filter((r) => r.state === "APPROVED" || r.state === "CHANGES_REQUESTED")
            const latestEventId = decisiveReviews.length ? decisiveReviews.reduce((a, b) => (b.submittedAt > a.submittedAt ? b : a)).id : ""
            const key = `${pr.number}:${prStatus}:${latestEventId}`
            if (handledReviewDecisions.has(key)) {
                deps.debug(`key already mapped: ${key}. Status:${prStatus}. NOTHING TO DO`)
                return
            }

            // An overlapping tick must not announce the same event twice: reserve before awaiting.
            // Released only when the handoff failed, so an undelivered event is retried next tick.
            const reserve = prStatus !== "WAITING_REVIEW"

            if (reserve) handledReviewDecisions.set(key, prStatus)

            let delivered = false

            try {
                switch (prStatus) {
                    case "APPROVED": {
                        delivered = await safeSendMessage({
                            customType: `${deps.extension}-approved`,
                            content: `✅ ${osc8Link(pr.url, `PR #${pr.number}`)} approved — can be merged.`,
                            display: true,
                            details: {},
                        })
                        break
                    }
                    case "REJECTED": {
                        if (isStaleRejection(cwd, pr))
                            delivered = await safeSendUserMessage(
                                `ℹ️ The rejection of ${osc8Link(pr.url, `PR #${pr.number}`)} was already reworked — new commits since the review, awaiting re-review. No action needed.`,
                                { deliverAs: "followUp" },
                            )
                        else
                            delivered = await safeSendUserMessage(`❌ PR was reviewed and Rejected. Follow the instructions in AGENTS.md`, {
                                deliverAs: "followUp",
                            })
                        break
                    }
                    case "WAITING_REVIEW": {
                        deps.debug("NOTHING TO DO")
                        break
                    }
                }
            } finally {
                if (reserve && !delivered && myGeneration === watchGeneration) {
                    handledReviewDecisions.delete(key)
                    deps.debug(`notification not delivered — will retry next tick`)
                }
            }

            deps.debug(`checkPrReview() END`)
        } catch (err) {
            onGhFailure("checkPrReview() failed", err)
        }
    }

    // A caller that already knows the PR hands it in, so the watch starts by number instead of
    // falling back to branch discovery (which cannot see a PR that is already merged or closed).
    function startPrCheckPolling(cwd: string, pr?: WatchedPr | null): void {
        stopPrCheckPolling()
        deps.notify(`Start PR check...`, "info") // after stopPrCheckPolling, so not overridden
        prCheckStartedAt = Date.now()
        firstTick = true
        handledReviewDecisions.clear()
        watchedPr = pr ?? null
        watchGeneration++
        consecutiveGhFailures = 0
        consecutiveSendFailures = 0
        prCheckTimer = setInterval(() => void checkPrReview(cwd), PR_CHECK_INTERVAL_MS)
        void checkPrReview(cwd)
    }

    function stopPrCheckPolling(): void {
        if (prCheckTimer) clearInterval(prCheckTimer)
        prCheckTimer = null
        firstTick = true
        deps.setPrStatus(undefined)
        deps.notify(`Stop PR check.`, "info")
        // Deliberately NOT clearing watchedPr here: this also runs on re-arm (session replacement),
        // where the number must survive to keep following the same PR instead of re-discovering by branch.
    }

    const clearWatch = (): void => {
        watchedPr = null
        handledReviewDecisions.clear()
    }

    return {
        startPrCheckPolling,
        stopPrCheckPolling,
        clearWatch,
        getWatchedPr: () => watchedPr,
    }
}
