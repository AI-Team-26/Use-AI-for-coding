import { spawnSync } from "node:child_process"

export interface PrSummary {
    number: number
    headRefName: string
    title: string
}

function listPrs<T>(cwd: string, args: string[]): T[] {
    const res = spawnSync("gh", ["pr", "list", ...args], { cwd, encoding: "utf-8" })
    if (res.status !== 0) throw new Error(`gh pr list failed (${res.status}): ${res.stderr}`)
    return JSON.parse(res.stdout) as T[]
}

export function getOpenPrListOfBranch<T>(cwd: string, branch: string, fields: string): T[] {
    return listPrs<T>(cwd, ["--head", branch, "--state", "open", "--json", fields])
}

export function getOpenPrList<T>(cwd: string, fields: string): T[] {
    return listPrs<T>(cwd, ["--state", "open", "--json", fields, "--limit", "100"])
}

// Returns null on gh failure or invalid JSON; callers that need certainty should retry.
export function viewPr<T>(cwd: string, ref: number | string, fields: string, onParseError?: () => void): T | null {
    const res = spawnSync("gh", ["pr", "view", String(ref), "--json", fields], { cwd, encoding: "utf-8" })
    if (res.status !== 0) return null
    try {
        return JSON.parse(res.stdout) as T
    } catch {
        if (onParseError) onParseError()
        else console.error("Failed to parse gh pr view output.")
        return null
    }
}

export function editPrBody(cwd: string, number: number, body: string): void {
    const res = spawnSync("gh", ["pr", "edit", String(number), "--body", body], { cwd, encoding: "utf-8" })
    if (res.status !== 0) throw new Error(`gh pr edit failed (${res.status}): ${res.stderr}`)
}
