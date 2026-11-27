/**
 * /review-2 N [note:optional] — Starts a fresh session to review a GitHub PR.
 *
 * Usage:
 *   /review-2 42                  — Review PR #42.
 *   /review-2 42 quick look       — Review PR #42 with note "quick look".
 *   /review-2 42 "quick look"     — Same, with quoted note (also single quote works). 
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
        return { prNumber: 0, note: undefined, error: '❌ Usage: /review-2 <pr-number> [optional note]\nExample: /review-2 42 or /review-2 42 "quick look"' }
    }

    // Match a leading number, then optionally capture the rest as a note.
    const match = trimmed.match(/^([0-9]+)\s*(.*)$/)
    if (!match) {
        return { prNumber: 0, note: undefined, error: '❌ Usage: /review-2 <pr-number> [optional note]\nExample: /review-2 42 or /review-2 42 "quick look"' }
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
        description: "Start a fresh session to review a GitHub PR. Usage: /review-2 <pr-number> [optional note]",
        handler: async (args, ctx) => {
            latestCtx = ctx
            const { prNumber, note, error } = parseReviewArgs(args)
            if (error) return safeNotify(error, "error")

            const prompt = `Review **PR ${prNumber}** of this repository.
- Number: ${prNumber}
- Optional user note: ${note ?? "None"}

Follow the repository's AGENTS.md instructions.
Review only. Do not modify code.
If the PR is not open, highlight its state.

## Goal

Evaluate both:
1. Is this the right design for the task?
2. Is that design implemented correctly?

Do not limit the review to bugs in changed lines.
A technically correct implementation can still put responsibilities in the wrong place, represent domain states poorly, or add needless complexity.

Keep the review proportional to the task. Do not propose unrelated redesigns.

## 1. Understand the change

Read the PR description, task requirements, diff, and relevant existing review discussions.

Inspect enough surrounding code, callers, models, and tests to understand:
- What problem is being solved?
- What behavior must remain unchanged?
- Which existing boundaries and conventions apply?

Do not assume the PR description proves that the implementation is correct.
Identify missing context rather than inventing requirements.

## 2. Review the design FIRST

Before checking individual lines, evaluate:

- **Responsibilities:** Does each changed class or module own the right work? Has domain state become mixed with security policy, persistence, transport, or presentation concerns?
- **State and meaning:** Do types and values clearly express the intended domain states? Check null, empty strings, default values, sentinel values, and flags. Can invalid or contradictory states be prevented instead of handled later?
- **Boundaries and dependencies:** Is logic placed where the rest of the application can use it consistently? Does the change introduce duplication, coupling, or an inappropriate dependency direction?
- **Simplicity:** Is there a smaller, clearer design using existing code? Could changing or removing something avoid a new helper, flag, or workaround? Conversely, does a distinct responsibility need its own component?
- **Consistency:** Does the change fit the surrounding design? If it departs from that design, is there a clear reason?
- **Testability:** Can important rules be tested through clear boundaries without excessive setup?

Consider realistic consequences of this change, not hypothetical future features.

Do not recommend a pattern or a new class merely because it is conventional.
Explain the concrete benefit and the smallest reasonable alternative.
Do not assume null is always better than an empty string: check the meaning, callers, and storage contract.

## 3. Review the implementation

Check:
- Task requirements and behavior.
- Correctness and regressions.
- Security and handling of sensitive data.
- Error handling and relevant edge cases.
- API and storage compatibility, where affected.
- Tests for the important behavior and failure cases.

Run relevant checks when practical, following the repository's build instructions.
State what was and was not verified.

## 4. Validate every finding

Before posting, check each proposed finding again:
- Is the claim supported by the code and its callers?
- Is the issue introduced, worsened, or made directly relevant by this PR?
- Is it already addressed elsewhere?
- Is it a concrete defect, a design trade-off, or only a personal preference?
- Does the suggested alternative actually improve this change?
- Is it already covered by an existing review comment?

Remove false claims, unsupported certainty, and duplicate findings.
Do not invent findings to fill a checklist or reach a minimum count.
Verify external factual claims against reliable documentation.

## 5. Post the review

Use the GitHub CLI to leave a PR review signed with your name.

Give each review a sequential number per agent within this PR.
Read existing reviews and use your previous highest review number + 1.
If you have no numbered review yet, start at 1.

Start the review with:
<verdict> by <agent>
Review #<number>

Use review numbers as the main reference for humans.
Include the reviewed commit hash at the bottom as secondary technical detail.
Do not use a commit hash instead of a review number.

Number findings separately, starting at 1 in each review.

Verdicts:
- ✅ Approved — no actionable findings.
- ☑️ Approved (can be improved) — non-blocking findings only.
- ⛔ Rejected — at least one blocking finding.

Include a short **Design assessment** before the findings:
- State whether the responsibilities, state model, and boundaries are suitable.
- Briefly explain the main design concern or why the approach is reasonable.
- State any important limits to the assessment.

Number all findings across the review:
1. 🟧 ...
2. 🟨 ...

Severity:
- 🟥 Critical blocking defect: for example, a demonstrated security vulnerability or data-loss risk.
- 🟧 Blocking: missing task requirements, regressions, or concrete defects.
- 🟨 Non-blocking: design improvements, maintainability suggestions, or follow-up work.

Architecture concerns are not automatically blocking.
Block only when you can explain the concrete defect or unmet requirement.

For each finding:
- Identify the problem.
- Explain its practical consequence.
- Suggest the smallest useful improvement.
- Give the file and function or line when possible.
- For design trade-offs, explain why the proposed alternative is better here.

Put the most important findings first.
Make worthwhile design findings explicit; do not bury them under minor details.

Use the matching GitHub review status when allowed:
- APPROVE when there are no blocking findings.
- REQUEST_CHANGES when there are blocking findings.
- If reviewing a PR authored by the same GitHub account, use COMMENT with the verdict in the body instead.

If the PR state or permissions prevent the intended action, explain the limitation.
Do not claim a review was posted if posting failed.
Do not point out that the branch is behind main.

## 6. Report back

Give a short recap:
- Main design assessment.
- Whether blocking changes are required or the PR can be merged as it is, from this review's perspective.
- Any important verification limits.
- Link to the posted review, if posting succeeded.

The very last line of your response MUST be exactly:
[REVIEW FOR ${prNumber} DONE]`

            try {
                await ctx.newSession({
                    withSession: async (newCtx) => {
                        latestCtx = newCtx
                        //await newCtx.sendUserMessage(prompt)
                        await newCtx.sendMessage(
                            { customType: "pr-review-2-task", content: prompt, display: false },
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
