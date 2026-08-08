// ~/.pi/agent/extensions/todo.ts
/**
* /todo extension
* Reads and displays the project's TODO.md file.
*/

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'
import fs from 'node:fs/promises'
import path from 'node:path'

const MAX_CHARS = 4096

export default function todoExtension(pi: ExtensionAPI) {
  pi.registerCommand('todo', {
    description: 'Reads TODO.md from the current project',
      handler: async (_args, ctx) => {
        const projectRoot = ctx.repoPath ?? process.cwd()
        const filePath = path.join(projectRoot, 'TODO.md')

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