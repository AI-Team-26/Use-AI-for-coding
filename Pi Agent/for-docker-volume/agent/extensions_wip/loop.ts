// ~/.pi/agent/extensions/loop.ts
/**
 * /loop [cap] — launch the autonomous agent loop for this project.
 * Thin LAUNCHER only: validates state, spawns /scripts/run_loop.sh detached,
 * returns instantly. The bash script is the engine (survives session close).
 */

/// <reference types="@earendil-works/pi-coding-agent" />

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

const DEFAULT_CAP = 20
const DRIVER = '/scripts/run_loop.sh'

export default function loopExtension(pi: ExtensionAPI) {
  pi.registerCommand('loop', {
    description: 'Launch the agent loop on this project: /loop [max_iterations]',
    handler: async (args, ctx) => {
      const root = ctx.repoPath ?? process.cwd()
      const capRaw = parseInt((args ?? '').trim(), 10)
      const cap = Number.isFinite(capRaw) && capRaw > 0 ? capRaw : DEFAULT_CAP

      // 1) TODO.md must exist
      let todo: string
      try {
        todo = await fs.promises.readFile(path.join(root, 'TODO.md'), 'utf8')
      } catch {
        ctx.ui.notify('❌ No TODO.md in this project. Write the plan first, then run /loop.', 'error')
        return
      }

      // 2) Anything left to do?
      const section = todo.split(/^# In Progress/m)[1]?.split(/^# Backlog/)[0] ?? ''
      const remaining = (section.match(/\[ \]/g) ?? []).length
      if (remaining === 0) {
        ctx.ui.notify('✅ All In Progress steps are checked — nothing to loop.', 'info')
        return
      }
      // Real marker = a line STARTING with "BLOCKED:" (mentions inside prose must not trigger)
      const blockedMarker = /^\s*(?:[-*+>]\s+)?BLOCKED:/m
      if (blockedMarker.test(todo)) {
        ctx.ui.notify('⛔ TODO.md contains a BLOCKED marker. Resolve it before looping.', 'error')
        return
      }

      // 2b) A pending, never-consumed stop flag would make the loop exit instantly — surface it
      const stopFlag = path.join(root, '.LOOP_STOP')
      if (fs.existsSync(stopFlag)) {
        ctx.ui.notify(
          '⚠️ Pending stop flag (.LOOP_STOP) found — the loop would exit immediately.\n' +
          '   Run it anyway? Remove the flag first: rm .LOOP_STOP',
          'warning',
        )
        return
      }

      // 3) Spawn driver DETACHED so it outlives this Pi session
      const log = path.join(root, 'loop.log')
      const out = fs.openSync(log, 'a')
      const child = spawn(DRIVER, [root, String(cap)], {
        detached: true,
        stdio: ['ignore', out, out],
      })
      child.unref()
      fs.closeSync(out)

      ctx.ui.notify(
        `🔁 Loop started: ${remaining} step(s), cap ${cap}\n` +
        `   Monitor: tail -f ${log}\n` +
        `   Stop:    /loop-stop  (or: pkill -f run_loop.sh)`,
        'info',
      )
    },
  })

  pi.registerCommand('loop-stop', {
    description: 'Ask the agent loop to stop after the current iteration',
    handler: async (_args, ctx) => {
      const root = ctx.repoPath ?? process.cwd()
      await fs.promises.writeFile(path.join(root, '.LOOP_STOP'), new Date().toISOString())
      ctx.ui.notify('🛑 Stop requested — loop will halt after the current iteration.', 'info')
    },
  })
}
