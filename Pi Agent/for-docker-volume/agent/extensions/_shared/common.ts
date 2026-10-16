// Shared utility functions for Pi extensions
// This file contains functions and constants that are duplicated across multiple extension files

import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent'

// ANSI colors — passed straight into the status line (the footer does not strip escapes)
export const CYAN = "\x1b[36m"
export const BLUE = "\x1b[34m"
export const GREEN = "\x1b[32m"
export const GRAY = "\x1b[90m"    // bright gray / dim white
export const DIM = "\x1b[2m"      // dim (renders as darker version of current fg)
export const RESET = "\x1b[0m"

/**
 * Build an OSC 8 hyperlink escape sequence wrapping `text` so terminals that
 * support it (iTerm2/Kitty/WezTerm/VS Code) render it as a clickable link.
 * Degrades gracefully to plain text in unsupported terminals.
 */
export function osc8Link(url: string, text: string): string {
  if (!url) return text
  return `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`
}

/**
 * Guarded UI access for calls made outside a fresh handler/event scope
 * (timers, post-await code). Skips only when no ctx arrived yet; any other
 * failure is logged, never silenced.
 */
export function safeSetStatus(ctx: ExtensionContext | null, key: string, text: string | undefined): void {
  if (!ctx) {
    console.error('[Shared] ❌ safeSetStatus() got a null ctx.')
    return
  }
  try {
    ctx.ui.setStatus(key, text)
  } catch (err) {
    console.error('[Shared] ❌ safeSetStatus() failed.', err)
  }
}

/**
 * Safe notification function that handles null context gracefully.
 * Falls back to console.info if ctx is null.
 */
export function safeNotify(message: string, type: 'info' | 'warning' | 'error', extensionName: string = 'EXTENSION'): void {
  if (!message || typeof message !== 'string') {
    console.error('[Shared] ❌ safeNotify() called with invalid message:', message)
    return
  }
  
  // For extensions, they should provide the latestCtx and use this function
  // This is a generic version that requires context to be passed in
  
  try {
    console.info(`[${extensionName}] ${message}`)
  } catch (err) {
    console.error('[Shared] ❌ safeNotify() failed:', err)
  }
}

/**
 * Create a debug logger function with the given name and enabled flag.
 * Returns a debug function that logs messages only when enabled.
 */
export function createDebug(name: string, enabled: boolean = false): (msg: string) => void {
  return (msg: string) => {
    if (enabled) {
      console.debug(`\n[DEBUG][${name}] ${msg}`)
    }
  }
}

/**
 * Format timestamp to YYYY-MM-DD HH:mm:ss.fff
 */
export function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

/**
 * Format elapsed milliseconds to MM:SS format.
 */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`
}