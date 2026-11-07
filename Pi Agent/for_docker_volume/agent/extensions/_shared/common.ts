// ~/.pi/agent/extensions/_shared/common.ts
/**
 * Shared helpers for Pi extensions: status bar, notifications, OSC 8 links,
 * debug logging and ANSI colors.
 *
 * Lives in `_shared/` without an `index.ts` and without a `package.json`,
 * so Pi does not discover it as an extension (only `*.ts` files directly in
 * the extensions folder and `<dir>/index.ts` are loaded).
 */

import type { ExtensionContext } from '@earendil-works/pi-coding-agent'

// ANSI colors — passed straight into the status line (the footer does not strip escapes)
export const CYAN = "\x1b[36m"
export const BLUE = "\x1b[34m"
export const GREEN = "\x1b[32m"
export const GRAY = "\x1b[90m"    // bright gray / dim white
export const DIM = "\x1b[2m"      // dim (renders as darker version of current fg)
export const RESET = "\x1b[0m"

export type NotifyType = 'info' | 'warning' | 'error'
export type ContextGetter = () => ExtensionContext | null

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
 * Guarded UI notification for calls made outside a fresh handler/event scope
 * (timers, post-await code). The context is read lazily because it can be
 * replaced by a session swap while the caller is running.
 * Skips only when no ctx arrived yet; any other failure is logged, never silenced.
 */
export function safeNotify(
  getCtx: ContextGetter,
  message: string,
  type: NotifyType = 'info',
  source = 'EXTENSION',
): void {
  const ctx = getCtx()
  if (!ctx) {
    console.error(`${source} ❌ safeNotify() got a null ctx`)
    console.info(`${source} ${message}`)
    return
  }
  try {
    ctx.ui.notify(message, type)
  } catch (err) {
    console.error(`${source} ❌ safeNotify() failed.`, err)
  }
}

/**
 * Guarded status bar update for calls made outside a fresh handler/event scope.
 * Failures are reported through the provided `notify` so the extension prefix
 * and the delivery channel stay those of the calling extension.
 */
export function safeSetStatus(
  ctx: ExtensionContext | null,
  key: string,
  text: string | undefined,
  notify: (message: string, type: NotifyType) => void,
  source = 'EXTENSION',
): void {
  if (!ctx) {
    notify(`${source} ❌ safeSetStatus() got a null ctx.`, 'error')
    return
  }
  try {
    ctx.ui.setStatus(key, text)
  } catch (err) {
    notify(`${source} ❌ safeSetStatus() failed. ${err}.`, 'error')
  }
}

/**
 * Create a debug logger that logs only when `enabled`, tagged with the name
 * of the extension it belongs to.
 */
export function createDebug(name: string, enabled = false): (message: string) => void {
  return (message: string) => {
    if (enabled) console.debug(`\n[DEBUG][${name}] ${message}`)
  }
}
