// ~/.pi/agent/extensions/pr-extension.ts
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

import type { ExtensionAPI, ExtensionCommandContext } from '@earendil-works/pi-coding-agent'

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

  const prNumber = parseInt(match[1], 10)
  if (isNaN(prNumber) || prNumber <= 0) {
    return { prNumber: 0, note: undefined, error: '❌ PR number must be a positive integer.' }
  }

  const notePart = (match[2] ?? '').trim()
  let note: string | undefined
  if (notePart) {
    // Strip surrounding quotes if present
    if ((notePart.startsWith('"') && notePart.endsWith('"')) ||
        (notePart.startsWith("'") && notePart.endsWith("'"))) {
      note = notePart.slice(1, -1).trim()
    } else {
      note = notePart
    }
  }

  return { prNumber, note, error: null }
}

export default function prExtension(pi: ExtensionAPI) {
  pi.registerCommand('review', {
    description: 'Start a fresh session to review a GitHub PR. Usage: /review <pr-number> [optional note]',
    handler: async (args, ctx) => {
      const { prNumber, note, error } = parseReviewArgs(args)
      if (error) {
        ctx.ui.notify(error, 'error')
        return
      }

      const prompt = `Please review the PR ${prNumber}. Leave a PR review comment, signed with your name.${note ? ' ' + note : ''}`

      try {
        await ctx.newSession({
          withSession: async (newCtx) => {
            pi.sendUserMessage(prompt, { streamingBehavior: 'followUp' })
          },
        })
      } catch (err) {
        ctx.ui.notify(`❌ Failed to start fresh session for PR #${prNumber}: ${err instanceof Error ? err.message : String(err)}`, 'error')
      }
    },
  })
}
