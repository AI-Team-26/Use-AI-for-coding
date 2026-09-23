// ~/.pi/agent/extensions/todo.ts
/**
* /todo extension
* Shows the TODO.md Backlog loaded from a fresh main branch (checkout + pull),
* so the agent always sees updated info, never a stale copy.
*/

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'

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
    const e = err as { stderr?: string; message: string }
    const detail = (e.stderr ?? '').trim() || e.message
    ctx.ui.notify(`❌ Git update failed: ${detail}`, 'error')
    return false
  }
}

const MAX_CHARS = 4096

export default function todoExtension(pi: ExtensionAPI) {
  pi.registerCommand('todo', {
    description: 'Shows the TODO.md Backlog from the latest main branch (fresh checkout + pull)',
      handler: async (_args, ctx) => {
        const projectRoot = ctx.repoPath ?? process.cwd()
        const filePath = path.join(projectRoot, 'TODO.md')

      // Load the TODO from a fresh main branch before reading it
      pullLatestMain(ctx, projectRoot)

      try {
        const content = await fs.readFile(filePath, 'utf8')

        if (!content.trim()) {
          ctx.ui.notify('📄 TODO.md exists but is empty.', 'warning')
          return;
        }

        // Truncate very large files
        let displayContent = content.length > MAX_CHARS
          ? `${content.slice(0, MAX_CHARS)}\n\n... [truncated]`
          : content

        // Option A: paste into editor (you get full Pi formatting when you submit)
        // ctx.ui.pasteToEditor(displayContent)  // nice but needs a ENTER to be printed in the editor !!!

        pi.sendMessage({
          customType: 'markdown-block',
          content: `${displayContent}`,
          display: true,
          details: {},
        })

        // Second message: recap prompt
        pi.sendUserMessage('Please recap the TODO and propose the next step. \
   Also, verify the current branch status: is the job done and all the changes committed? There is a PR? There are unresolved review comments?')

      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          ctx.ui.notify('❌ TODO.md not found in the current project.', 'error')
        } else {
          ctx.ui.notify(`⚠️ Error reading TODO.md: ${(err as Error).message}`, 'error')
        }
      }
    },
  })
}