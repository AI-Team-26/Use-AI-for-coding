# Investigation: /new command model preservation (Feature 23)

## Problem
When the user invokes `/new` to start a fresh Pi session, Pi reads the model from `settings.json` (`defaultModel` / `defaultProvider`) instead of maintaining the currently selected model.

## Root Cause
Pi's built-in `/new` command creates a new session by loading the model configuration from `~/.pi/agent/settings.json`. It does not reference the model that was active in the previous session.

## Solution Approach
Create a `new.ts` extension that:
1. **Before switch** (`session_before_switch` event with `reason === "new"`): Save the current model (`ctx.model`) to a persistent file (`~/.pi/agent/last-model.json`).
2. **After new session starts** (`session_start` event with `reason === "new"`): Read the saved model and call `pi.setModel()` to restore it.

## API Used
- `ExtensionContext.model`: Current model object (provider, name, id)
- `ExtensionAPI.setModel(model)`: Sets the model for the current session
- `session_before_switch` event: Fires before a session switch, receives `reason: "new" | "resume"`
- `session_start` event: Fires after a session starts, receives `reason: "startup" | "reload" | "new" | "resume" | "fork"`

## Files Changed
- `Pi Agent/for-docker-volume/agent/extensions/new.ts` — New extension
- `~/.pi/agent/extensions/new.ts` — Runtime copy

## Verification
The extension is deployed to `~/.pi/agent/extensions/new.ts` and will be loaded by Pi on startup. When `/new` is invoked, the previously selected model will be restored automatically.
