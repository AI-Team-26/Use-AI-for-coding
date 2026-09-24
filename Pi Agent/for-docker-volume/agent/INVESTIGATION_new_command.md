# Investigation: /new command model preservation — 2026-09-24

## Context
Feature 23 investigation: how the `/new` command in Pi affects session cleanup and model selection.

## Problem
When the user invokes `/new` to start a fresh Pi session, Pi reads the model from `settings.json` (`defaultModel` / `defaultProvider`) instead of maintaining the currently selected model.

## Root Cause
Pi's built-in `/new` command creates a new session by loading the model configuration from `~/.pi/agent/settings.json`. It does not reference the model that was active in the previous session.

## Solution Approach
Create a `new.ts` extension that:
1. **Before switch** (`session_before_switch` event with `reason === "new"`): Save the current model (`ctx.model`) to a temporary file (`new_command_model_to_use.txt`)
2. **After new session starts** (`session_start` event with `reason === "new"`): Read the saved model and call `pi.setModel()` to restore it, then immediately delete the temp file
3. **Normal Pi startup is unaffected** because the temp file only exists during a `/new` command flow

## Key Events Used
- `session_before_switch` (reason: "new"): Fires before the session switch
- `session_start` (reason: "new"): Fires after the new session starts
- `session_before_switch` (reason: "resume"): Not handled — resume keeps the same model

## API Used
- `ExtensionContext.model`: Current model object (provider, name, id)
- `ExtensionAPI.setModel(model)`: Sets the model for the current session
- `fs.unlink()`: Deletes the temp file immediately after reading

## Files Changed
- `Pi Agent/for-docker-volume/agent/extensions/new.ts` — New extension
- `TODO.md` — Removed Feature 23 from backlog (moved to done)
