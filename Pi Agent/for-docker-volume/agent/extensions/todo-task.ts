// ~.pi/agent/extensions/todo-task.ts
/**
 * /feature N — Implements a feature from the TODO backlog and measures elapsed time.
 * /feature N [note] — Optionally includes a note with the feature start.
 * /feature end — Ends the current feature without saving timing (unreliable).
 *
 * /bugfix N — Fixes a bug from the TODO backlog and measures elapsed time.
 * /bugfix N [note] — Optionally includes a note with the bug fix start.
 * /bugfix end — Ends the current bug without saving timing (unreliable).
 * 
 * /pr N - Check PR status and reviews
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
 * While a feature/bug session is active it also polls GitHub every ~20s (max 2h):
 * if the reviewer APPROVED the PR a notification is shown (the user usually merges);
 * if CHANGES_REQUESTED the agent is told to follow the AGENTS.md review workflow;
 * when the PR is MERGED the watcher stops.
 * Polling is forced to ends on `/feature end` or `/bugfix end` (useful for stale polling).
 */

import type { ExtensionAPI, ExtensionContext, ExtensionCommandContext, TurnEndEvent, AgentSettledEvent } from '@earendil-works/pi-coding-agent'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'

import { osc8Link, safeSetStatus, formatElapsed, formatTime, createDebug } from './_shared/common.ts'

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
 * /pr N - Check PR status and reviews
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
 * While a feature/bug session is active it also polls GitHub every ~20s (max 2h):
 * if the reviewer APPROVED the PR a notification is shown (the user usually merges);
 * if CHANGES_REQUESTED the agent is told to follow the AGENTS.md review workflow;
 * when the PR is MERGED the watcher stops.
 * Polling is forced to ends on `/feature end` or `/bugfix end` (useful for stale polling).
 */

/// <reference types="@earendil-works/pi-coding-agent" />

const EXTENSION = "TODO-TASK"
const TODO_FEATURES_DIR = path.join(process.env.HOME ?? '', '.pi', 'agent', 'todo-tasks')
const STATUS_KEY_TASK = "alex-piccione-todo-task-task"
const STATUS_KEY_PR = "alex-piccione-todo-task-pr"
const LOCAL_LLAMA_CPP_PROVIDER = 'Llama.cpp'  // Provider id used for local LLMs served by llama-server (in models.json Pi file)

// Project root of the running task — needed by finishActivity to locate the branch's PR.
let taskProjectRoot: string | null = null

let watchedPr: { number: number; url: string } | null = null
const handledReviewDecisions = new Map<string, string>()  // track reviews to not "resend" messages/action multiple time for the same

// Status-bar elapsed-time ticker — refreshes the status while a feature/bug runs.
let statusTimer: ReturnType<typeof setInterval> | null = null
const STATUS_UPDATE_MS = 15_000

// PR review-watcher state lives at module scope rather than per extension instance:
// Pi can instantiate the factory again on session replacement without shutting the
// previous one down, leaking a stale poll interval whose 2h clock never resets
// Sharing the state guarantees a single watcher process-wide; startPrPolling()
// clears any leaked interval before arming a fresh one.
let prCheckTimer: ReturnType<typeof setInterval> | null = null
const PR_CHECK_INTERVAL_MS = 20_000
// Safenet: stop polling after this long even if no decision was made (can be increased later).
const PR_CHECKING_MAX_MS = 4 * 60 * 60 * 1000  // 4 hours
let checkCounter = 0
// TODO... calculae MAX counter
let prCheckStartedAt = 0
let prCheckInFlight = false


const DEBUG = false
const debug = createDebug(EXTENSION, false)

/**
 * Resolve the model actually serving requests, formatted as `<provider>/<model>`.
 * For the local Llama.cpp provider the configured name may be stale,
 * so we query the OpenAI-compatible `${baseUrl}/models` endpoint instead.
 */
async function resolveModelName(): Promise<string> {
  const m = latestCtx?.model
  if (!m) return 'unknown'
  if (m.provider === LOCAL_LLAMA_CPP_PROVIDER && m.baseUrl) {
    try {
      // Assumption: ONLY ONE model is loaded on llama-server at a time — pick it.
      const res = await fetch(`${m.baseUrl}/models`)
      const data = (await res.json()) as { data?: Array<{ id: string }> }
      const id = data.data?.[0]?.id
      if (id) return `${m.provider}/${id}`
    } catch {
      safeNotify('Could not reach llama-server /models — using configured model name.', 'info')
    }
  }
  return `${m.provider}/${m.name ?? 'unknown'}`
}

interface TimingItem {
  type: 'feature' | 'bug'
  number: number
  startTime: number
}


/**
 * Build an OSC 8 hyperlink escape sequence wrapping `text` so terminals that
 * support it (iTerm2/Kitty/WezTerm/VS Code) render it as a clickable link.
 * Degrades gracefully to plain text in unsupported terminals.
 *
 * TODO(2026-10-15): If Approach A proves unreliable across terminals,
 * fall back to Approach B: custom footer via ctx.ui.setFooter(factory)
 * using <Link href={url}>PR #N</Link>. See Feature 35 in TODO.md.
 */
