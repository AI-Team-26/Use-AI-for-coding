// ~/.pi/agent/extensions/update.ts
/**
 * Provide the "/pi-update" command.
 * Runs "pi update" then "pi update --extensions".
 *
 * The commands run in the background so Pi stays responsive.
 * Their output is streamed into a widget above the editor and a spinner
 * with the elapsed time is shown in the footer. Both are cleared at the end.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent"
import { spawn } from "node:child_process"

const EXTENSION = "PI-UPDATE"
const WIDGET_KEY = "pi-update"
const STATUS_KEY = "pi-update"
const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
const WIDGET_LINES = 8
const SUMMARY_LINES = 5
const MAX_SUMMARY_CHARS = 1500
const MAX_WAIT_MINUTES = 5

const STEPS = ["pi update", "pi update --extensions"]

const NOTICE = `Pi will now update (core + extensions). It can take up to ${MAX_WAIT_MINUTES} minutes. Please wait for the operation to finish.`

interface StepResult {
    command: string
    ok: boolean
    output: string
}

/** UI setters throw when the session was replaced while a command is running. */
function safe(ctx: ExtensionContext, action: () => void): void {
    try {
        action()
    } catch (err) {
        console.error("UPDATE UI call failed", err)
    }
}

function runStep(ctx: ExtensionContext, command: string, index: number, total: number): Promise<StepResult> {
    return new Promise((resolve) => {
        const child = spawn(command, { shell: true, stdio: ["ignore", "pipe", "pipe"] })
        const lines: string[] = []
        let tail = ""
        let frame = 0
        const startedAt = Date.now()

        const render = (label: string) => {
            safe(ctx, () => {
                ctx.ui.setStatus(STATUS_KEY, label)
                ctx.ui.setWidget(WIDGET_KEY, [NOTICE, label, ...lines.slice(-WIDGET_LINES)], { placement: "aboveEditor" })
            })
        }

        const tick = () => {
            frame++
            const elapsed = Math.round((Date.now() - startedAt) / 1000)
            render(`${SPINNER[frame % SPINNER.length]} ${command} (${index}/${total}) ${elapsed}s`)
        }

        const collect = (chunk: Buffer) => {
            tail += chunk.toString()
            const parts = tail.split("\n")
            tail = parts.pop() ?? ""
            for (const part of parts) {
                const line = part.trimEnd()
                if (line) lines.push(line)
            }
            if (lines.length > 500) lines.splice(0, lines.length - 500)
        }

        const timer = setInterval(tick, 120)
        tick()

        child.stdout?.on("data", collect)
        child.stderr?.on("data", collect)

        child.on("error", (err) => {
            clearInterval(timer)
            resolve({ command, ok: false, output: `failed to start: ${err.message}` })
        })

        child.on("close", (code) => {
            clearInterval(timer)
            if (tail.trim()) lines.push(tail.trimEnd())
            resolve({ command, ok: code === 0, output: lines.join("\n") })
        })
    })
}

function summarize(results: StepResult[]): string {
    const text = results
        .map((r) => {
            const tail = r.output.split("\n").slice(-SUMMARY_LINES).join("\n")
            return `$ ${r.command}${tail ? `\n${tail}` : ""}`
        })
        .join("\n\n")
    return text.length > MAX_SUMMARY_CHARS ? `${text.slice(0, MAX_SUMMARY_CHARS)}\n... [truncated]` : text
}

export default function updateExtension(pi: ExtensionAPI) {
    pi.registerCommand("pi-update", {
        description: "Update Pi core and all installed extensions (pi update && pi update --extensions)",
        handler: async (_args, ctx) => {
            pi.sendMessage({
                customType: EXTENSION,
                content: NOTICE,
                display: true,
                details: {},
            })

            const results: StepResult[] = []

            for (const [i, command] of STEPS.entries()) {
                const result = await runStep(ctx, command, i + 1, STEPS.length)
                results.push(result)
                if (!result.ok) break
            }

            safe(ctx, () => {
                ctx.ui.setStatus(STATUS_KEY, undefined)
                ctx.ui.setWidget(WIDGET_KEY, undefined)
            })

            const failed = results.find((r) => !r.ok)
            const summary = summarize(results)
            if (failed) {
                ctx.ui.notify(`❌ "${failed.command}" failed\n\n${summary}`, "error")
                return
            }

            ctx.ui.notify(`✅ Update finished. Restart Pi to load the new version.\n\n${summary}`, "info")
        },
    })
}