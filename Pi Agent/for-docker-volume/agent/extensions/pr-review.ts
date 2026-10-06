// ~/.pi/agent/extensions/pr-review.ts
/**
 * /review N [note:optional] — Starts a fresh session to review a GitHub PR.
 *
 * Usage:
 *   /review 42                  — Review PR #42.
 *   /review 42 quick look       — Review PR #42 with note "quick look".
 *   /review 42 "quick look"     — Same, with quoted note.
 *   /review 42 'quick look'     — Same, with single-quoted note.
 */

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent'

const DEBUG = false
const EXTENSION = "PR-REVIEW"
let latestCtx: ExtensionContext | null = null

const debug = (msg:string) => DEBUG && console.debug(`\n[DEBUG][${EXTENSION}] ${msg}`)

function safeNotify(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
  if (!latestCtx) {
    console.error(`${EXTENSION} ❌ safeNotify got a null ctx`)
    return
  }
  try {
    latestCtx.ui.notify(message, type)
  } catch (err) {
    console.error(`${EXTENSION} ❌ safeNotify failed:`, err)
  }
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
    return { prNumber: 0, note: undefined, error: '❌ PR number must be a positive integer.' }
  }

  const notePart = (match[2] ?? '').trim()
  let note: string | undefined = notePart || undefined
  // Strip surrounding quotes if present
  if (note && ((note.startsWith('"') && note.endsWith('"')) ||
      (note.startsWith("'") && note.endsWith("'")))) {
    note = note.slice(1, -1).trim()
  }

  return { prNumber, note, error: null }
}

export default function prExtension(pi: ExtensionAPI) {
  pi.registerCommand('review', {
    description: 'Start a fresh session to review a GitHub PR. Usage: /review <pr-number> [optional note]',
    handler: async (args, ctx) => {
      latestCtx = ctx
      const { prNumber, note, error } = parseReviewArgs(args)
      if (error) return safeNotify(error, 'error')

      const prompt = `Please review the PR ${prNumber}. Leave a PR review comment, signed with your name. \n
      Use this icons to mark points: 🟥 heavy 🟧 blocking 🟨 trivial 🟦 info. \n
      ${note ?? ''}`

      try {
        await ctx.newSession({
          withSession: async (newCtx) => {
            latestCtx = newCtx
            await newCtx.sendUserMessage(prompt)
          },
        })
      } catch (err) {
        debug(`Failed to start new session. ${err}`)
        safeNotify(`❌ Failed to start fresh session for PR #${prNumber}: ${err instanceof Error ? err.message : String(err)}`, 'error')
      }
    },
  })
}