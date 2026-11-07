// ~/.pi/agent/extensions/todo.ts
/**
* Provide the "/todo" command. 
* It will ask the agent to check the current branch sttaus, PR comments and uncommitted changes.
* It will then ask the agent to recap the TODO and suggest the next step.
* It asks it also to create a table of the TODO content.
* 
* /todo      -> base command
* /todo show -> base command plus print of the TODO.md 
*/

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent'
import { execSync } from 'node:child_process'

const EXTENSION = "TODO-TASK"
const MAX_CHARS = 4096

type TodoLoadResult = { ok: boolean; content?: string; detail?: string }

// Read the latest TODO.md from origin/main WITHOUT switching branches or
// mutating the working tree. The previous implementation ran
// `git checkout main && git pull`, which (a) yanked the user off their current
// branch as a side effect and (b) threw whenever there were uncommitted local
// changes ("Your local changes ... would be overwritten by merge"), surfacing
// as the ❌ Git update failed error. Fetching + `git show` avoids both.
function loadLatestMainTodo(cwd: string): TodoLoadResult {
  try {
    execSync('git fetch origin main', { cwd, encoding: 'utf-8', stdio: 'pipe' })
    const content = execSync('git show origin/main:TODO.md', { cwd, encoding: 'utf-8', stdio: 'pipe' })
    return { ok: true, content }
  } catch (err) {
    const e = err as { stderr?: string; message: string }
    // Show up to 3 lines: enough context without flooding the notification.
    const detail = (((e.stderr ?? '').trim() || e.message).split('\n').slice(0, 3)).join('\n')
    return { ok: false, detail }
  }
}

// Helper to parse command arguments
// return number as 0 when command it is called with "end" argument
function parseCommandArgs(args: string): { showTodo:boolean } {
    const trimmed = args.trim()
    return { showTodo: trimmed === "show" }
}

export default function todoExtension(pi: ExtensionAPI) {
  pi.registerCommand('todo', {
    description: 'Shows the TODO.md Backlog from the latest main branch (fresh fetch)',
      handler: async (args, ctx) => {
        const { showTodo } = parseCommandArgs(args)
        const projectRoot = ctx.cwd ?? process.cwd()

      // Load the latest TODO.md from origin/main before reading it. Failing to
      // fetch the freshest copy is a blocker: we must NOT show potentially stale
      // local content, so bail out after notifying.
      const loaded = loadLatestMainTodo(projectRoot)
      if (!loaded.ok) {
        ctx.ui.notify(`❌ Failed to fetch latest TODO.md: ${loaded.detail}`, 'error')
        return
      }

      if (showTodo) {
        const displayContent = loaded.content ?? ''

        if (!displayContent.trim()) {
          ctx.ui.notify('📄 TODO.md exists but is empty.', 'warning')
          return;
        }

        // Truncate very large files
        let truncated = displayContent.length > MAX_CHARS
          ? `${displayContent.slice(0, MAX_CHARS)}\n\n... [truncated]`
          : displayContent

        // Option A: paste into editor (you get full Pi formatting when you submit)
        // ctx.ui.pasteToEditor(truncated)  // nice but needs an ENTER to be printed in the editor !!!

        pi.sendMessage({
            customType: 'markdown-block',
            content: `${truncated}`,
            display: true,
            details: {},
        })
      }

      pi.sendMessage({ 
        customType: `${EXTENSION}`, 
        content: 
"Show all the Features and Bugs of the TODO backlog in a simple table.\n Use these icons to identify the tasks:\n \
🟢 Feature (backlog, available), \
🐞 Bug (backlog), \
⏳ In progress (open PR),\
⏸️ Suspended, \
🔴 Blocked (dependency unmet), \
❌ Dropped/rejected, \
📋 Epic (group header).\n \
Show the Feature and Bug number clearly (`Feature N`, `Bug N`).\n \
Show only relevant data, don't show info that are not useful (like done things).\n \
Suggest to use `/feature <N> [note]` or `/bugfix <N> [note]` to start a task, `/pr <PR>` to review a PR and `/continue <N>` to continue the work of a task.",
        display: false
      })

      // Second message: recap prompt
      pi.sendUserMessage("Do a summary of the TODO and propose the next step. (Shows the link of open PRs, if there are)") },
  })
}
