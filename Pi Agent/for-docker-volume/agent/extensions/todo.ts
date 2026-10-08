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
import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'

const EXTENSION = "TODO-TASK"
const MAX_CHARS = 4096

// Checkout main + pull so we read the latest TODO.md; notifies with the real error on failure.
function pullLatestMain(ctx: ExtensionContext, cwd: string): boolean {
  try {
    execSync('git checkout main && git pull', {
      cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    return true
  } catch (err) {
    console.error(`❌ Git update failed`, 'error')
    const e = err as { stderr?: string; message: string }
    const detail = (e.stderr ?? '').trim() || e.message    
    ctx.ui.notify(`❌ Git update failed: ${detail}`, 'error')
    return false
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
    description: 'Shows the TODO.md Backlog from the latest main branch (fresh checkout + pull)',
      handler: async (args, ctx) => {
        const { showTodo } = parseCommandArgs(args)
        const projectRoot = ctx.cwd ?? process.cwd()
        const filePath = path.join(projectRoot, 'TODO.md')

        // Load the TODO from a fresh main branch before reading it
        pullLatestMain(ctx, projectRoot)

        await ctx.newSession({
          withSession: async (newCtx) => {
            if (showTodo) {
              try {
                const content = await fs.readFile(filePath, 'utf8')

                if (!content.trim()) {
                  newCtx.ui.notify('📄 TODO.md exists but is empty.', 'warning')
                  return
                }

                let displayContent = content.length > MAX_CHARS
                  ? `${content.slice(0, MAX_CHARS)}\n\n... [truncated]`
                  : content

                pi.sendMessage({
                    customType: 'markdown-block',
                    content: `${displayContent}`,
                    display: true,
                    details: {},
                })
              } catch (err) {
                if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                  newCtx.ui.notify('❌ TODO.md not found in the current project.', 'error')
                } else {
                  newCtx.ui.notify(`⚠️ Error reading TODO.md: ${(err as Error).message}`, 'error')
                }
              }
            }

            pi.sendMessage({ 
              customType: `${EXTENSION}`, 
              content: "Use this format to show the TODO (don't wrap it in markdown or it will be rendered badly from TUI): \n \
┌──────┬──────────────────────────────┐ \n \
│ 🟢   │ Feature (backlog, available) │ \n \
├──────┼──────────────────────────────┤ \n \
│ 🐞   │ Bug fix (backlog)            │ \n \
├──────┼──────────────────────────────┤ \n \
│ ⏳   │ In progress (open PR)        │ \n \
├──────┼──────────────────────────────┤ \n \
│ 🔴   │ Blocked (dependency unmet)   │ \n \
├──────┼──────────────────────────────┤ \n \
│ ❌   │ Dropped/rejected             │ \n \
├──────┼──────────────────────────────┤ \n \
│ 📋   │ Epic (group header)          │ \n \
└──────┴──────────────────────────────┘ \n \
(Show only relevant data, don't show info that are not useful)",
              display: false
            })

            await newCtx.sendUserMessage(
"Do a summary of the TODO and propose the next step.\n \
Shows the link of open PRs.",
              { deliverAs: 'steer' }
            )
          },
        })
    },
  })
}
