// ~/.pi/agent/extensions/pr-review.ts
/**
 * /review N [note:optional] — Starts a fresh session to review a GitHub PR.
 *
 * Usage:
 *   /review 42                  — Review PR #42.
 *   /review 42 quick look       — Review PR #42 with note "quick look".
 *   /review 42 "quick look"     — Same, with quoted note (also single quote works). 
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent"
import { safeNotify as sharedSafeNotify, createDebug, type NotifyType } from "./_shared/common.ts"

const DEBUG = false
const EXTENSION = "PR-REVIEW"
let latestCtx: ExtensionContext | null = null

const debug = createDebug(EXTENSION, DEBUG)

function safeNotify(message: string, type: NotifyType = "info"): void {
    sharedSafeNotify(() => latestCtx, message, type, EXTENSION)
}

interface ParsedReviewArgs {
    prNumber: number
    note: string | undefined
    error: string | null
}

function parseReviewArgs(args: string): ParsedReviewArgs {
    const trimmed = args.trim()

    if (!trimmed) {
        return { prNumber: 0, note: undefined, error: '❌ Usage: /review <pr-number> [optional note]\nExample: /review 42 or /review 42 "quick look"' }
    }

    // Match a leading number, then optionally capture the rest as a note.
    const match = trimmed.match(/^([0-9]+)\s*(.*)$/)
    if (!match) {
        return { prNumber: 0, note: undefined, error: '❌ Usage: /review <pr-number> [optional note]\nExample: /review 42 or /review 42 "quick look"' }
    }

    // Regex guarantees digits, so only the zero case can fail here.
    const prNumber = parseInt(match[1], 10)
    if (prNumber <= 0) {
        return { prNumber: 0, note: undefined, error: "❌ PR number must be a positive integer." }
    }

    const notePart = (match[2] ?? "").trim()
    let note: string | undefined = notePart || undefined
    // Strip surrounding quotes if present
    if (note && ((note.startsWith('"') && note.endsWith('"')) || (note.startsWith("'") && note.endsWith("'")))) {
        note = note.slice(1, -1).trim()
    }

    return { prNumber, note, error: null }
}

export default function prExtension(pi: ExtensionAPI) {
    pi.registerCommand("review", {
        description: "Start a fresh session to review a GitHub PR. Usage: /review <pr-number> [optional note]",
        handler: async (args, ctx) => {
            latestCtx = ctx
            const { prNumber, note, error } = parseReviewArgs(args)
            if (error) return safeNotify(error, "error")

            const prompt = `Please review the PR ${prNumber}. Leave a PR review comment, numbered (for reference) and signed with your name. \n
      Use these icons to mark points: 🟥 heavy 🟧 blocking 🟨 suggestion. \n
      Also number the points to have a clear reference. \n
      Specify file and funcion or row (when possible). \n
      Example: \n
      "1.🟨 10,000 PBKDF2 iterations is low. OWASP recommends 600,000 for PBKDF2-HMAC-SHA256. No real hashes exist yet, so raising Iterations now costs nothing. Benchmark the login path first if latency worries you. (File: src/Monei.Core/Entities/Account.cs, row 26)" \n
      \n
      Block (🟧) only for missing task requirements, regressions or concrete defects. Everything else is a non-blocking 🟨 suggestion or a follow-up TODO. \n
      Add a verdict of the review: ✅ Approved ☑️ Approved (can be improved) ⛔ Rejected. \n
      The first line of the review should be like this: <verdict> by <agent>. \n
      Report here a recap specifying if there are blocking points (changes request) or PR can be merged as it is. \n
      Do not point that the branch is behind main. \n
      \n
      After you wrote your points, check them again, one by one, to verify it is not a false claim. \n
      \n
      **IMPORTANT**: The very last line of your response MUST be exactly this: "[REVIEW FOR ${prNumber} DONE]". \n
      ${note ?? ""}`

            try {
                await ctx.newSession({
                    withSession: async (newCtx) => {
                        latestCtx = newCtx
                        //await newCtx.sendUserMessage(prompt)
                        await newCtx.sendMessage(
                            { customType: "pr-review-task", content: prompt, display: false },
                            { triggerTurn: true }, // starts the agent run immediately
                        )
                    },
                })
            } catch (err) {
                debug(`Failed to start new session. ${err}`)
                safeNotify(`❌ Failed to start fresh session for PR #${prNumber}: ${err instanceof Error ? err.message : String(err)}`, "error")
            }
        },
    })
}
