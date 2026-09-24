# Investigation: /new command model preservation — 2026-09-24

## Context
How the `/new` command in Pi affects sessions and model selection, and how to preserve the selected model across it.

## Problem
When the user invokes `/new` to start a fresh Pi session, Pi reads the model from `~/.pi/agent/settings.json` (`defaultModel` / `defaultProvider`) instead of maintaining the currently selected model.

## How /new works (Pi core)
The `/new` command is built into Pi (slash-commands). Its implementation (`switchSession` with reason `"new"`):
1. Emits `session_before_switch` (reason `"new"`) — handlers can cancel the switch
2. Tears down the current session
3. **Creates a brand-new empty session file** (the old one stays on disk, reachable via resume)
4. Emits `session_start` (reason `"new"`, with `previousSessionFile`)

Our extension does not implement or replace `/new`. It only listens to these events, never cancels them, and never touches any session file — all original `/new` behavior is preserved.

## Solution Approach
Create a `new.ts` extension that:
1. **Before switch** (`session_before_switch` event with `reason === "new"`): Save the current model (`ctx.model.provider` + `ctx.model.id`) as plain text to `new_command_model_to_use.txt`
2. **After new session starts** (`session_start` event with `reason === "new"`): Read the temp file, **delete it immediately**, look up the full Model object via `ctx.modelRegistry.find(provider, id)`, and call `pi.setModel()` to restore it
3. **Normal Pi startup is unaffected** because the temp file only exists during a `/new` command flow (written before the switch, deleted right after being read)

No JSON is needed: the temp file holds just two lines (provider, model id), and the registry lookup reconstructs the complete Model object.

## Key Events Used
- `session_before_switch` (reason: "new"): Fired by Pi's built-in `/new` command before the session switch
- `session_start` (reason: "new"): Fired after the new session starts
- `session_before_switch` (reason: "resume"): Not handled — resume keeps the same model

## API Used
- `ExtensionContext.model`: Current model object (provider, name, id, ...)
- `ExtensionContext.modelRegistry.find(provider, id)`: Returns the full Model object for a provider/model id pair
- `ExtensionAPI.setModel(model)`: Sets the model for the current session
- `fs.unlink()`: Deletes the temp file immediately after reading

## Files Changed
- `Pi Agent/for-docker-volume/agent/extensions/new.ts` — New extension
- `TODO.md` — Removed Feature 23 from backlog
