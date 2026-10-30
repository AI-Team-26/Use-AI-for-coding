# TODO

## Backlog

- Feature 49 | New Pi extension: API key rotation (pi-keyrouter alternative)
  Goal: rotate multiple API keys of the same provider automatically (e.g. several GEMINI keys under one "Google" provider), no manual model switching.
  Background: npm `pi-keyrouter` (v0.4.0) crashes on Pi 1.3.0 — it calls `ctx.modelRegistry.authStorage.setRuntimeApiKey(...)`, but @earendil-works/pi-coding-agent 1.3.0 does not expose `authStorage` (nor `setRuntimeApiKey`) to extensions at all.
  Key source (ideal): reuse the EXISTING `models.json` — no separate config file. Add support for a new optional provider-level property `additionalApiKeys`: an array of extra keys alongside the usual `apiKey`. The extension rotates over `apiKey` + all `additionalApiKeys` of the selected model's provider.
  Reference for the rotation logic idea: https://github.com/lowern1ght/pi-soly/blob/master/packages/pi-keyrouter/rotation.ts
  Build a local extension using the hooks that DO exist in 1.3.0:
  - Read the key pool from models.json (`apiKey` + `additionalApiKeys`); per-key cooldowns/maxRetries can live in the extension or as optional models.json fields
  - `before_provider_headers`: inject/override `Authorization` header from the currently selected key for `ctx.model.provider` before each provider HTTP call
  - `after_provider_response`: on status 429/401/403 mark current key bad (with cooldown) and advance to next key; verify whether Pi retries the failed request natively — if not, decide fallback (per-request round-robin vs notify user to resend)
  - Notify via ctx.ui.notify on rotation / exhaustion; runtime state only, never persisted
  Verify first: that Pi 1.3.0 tolerates the unknown `additionalApiKeys` field in models.json (ignores it without error)
  Constraints: single file under `extensions/`, reuse `_shared/common.ts` helpers where possible, well under 500 lines

- [x] Feature 39 | Extract shared UI helpers into `_shared/common.ts`
  Create `extensions/_shared/common.ts` containing:
  - `osc8Link(url, text)` — OSC 8 hyperlink formatter (pure)
  - `safeSetStatus(ctx, key, text)` — guarded status bar update
  - `safeNotify(getCtx, message, type)` — guarded notification
  - `createDebug(name, enabled)` — returns a `debug(msg)` logger
  Refactor `todo-task.ts`, `pr-review.ts`, and `todo.ts` to import from `_shared/common`.
  Remove duplicated definitions from each file.
  Constraints:
  - `_shared/` has no `index.ts` → Pi won't discover it as an extension
  - Keep behavior identical; pure extraction, no logic changes
  - Max ~10 files changed, well under 500 lines delta

  Also colors:
  // ANSI colors — passed straight into the status line (the footer does not strip escapes)
  const CYAN = "\x1b[36m"
  const BLUE = "\x1b[34m"
  const GREEN = "\x1b[32m"
  const RESET = "\x1b[0m"

- Feature 34 | todo-task extension: reuse PR lookup in appendReportToPr
  `appendReportToPr` duplicates the gh plumbing of `getBranchOpenPr`, which fetches heavy fields (`reviews`) it never uses.
  Generalize the field list into a shared low-level helper (`gh pr list --json <fields>`):
  - `getBranchOpenPr` keeps requesting `number,state,mergeable,statusCheckRollup,reviewDecision,reviews,url`
  - `appendReportToPr` requests only `number,body` — collapsing its two gh calls (`pr list` + `pr view`) into one.

- Feature 31 | todo-task extension
  Instead of asking the agent to save timing report, it should be executed directly using code, so that it is always the same format and the chat is not polluted!
  
- Bug 16 (remaining sub-issue) | todo-task polling keeps running when PR is closed
  Polling continues even when the PR is closed (debug says "PR was not found"); it should stop in that case,
  and polling start should be launched AFTER the PR is created.


- Bug 17 | todo-task fresh session crashes with stale ctx
  After starting a fresh session (Feature 32), Pi crashes:
  "This extension ctx is stale after session replacement or reload. Do not use a captured pi or command ctx after ctx.newSession(), ctx.fork(), ctx.switchSession(), or ctx.reload(). For newSession, fork, and switchSession, move post-replacement work into withSession and use the ctx passed to withSession."
  The fresh-session code must run its post-replacement logic inside `withSession` using the ctx passed there, not the captured ctx.

- Feature 30 | todo-task extension: unify status display
  Currently the elapsed-time timer (☑️ Feature N) and the PR polling indicator (🔍 PR #N) fight for the same status key (STATUS_KEY), causing flicker.
  Use two separate status keys:
  - STATUS_KEY = "alex-piccione-todo-task" → elapsed time (☑️ Feature N MM:SS)
  - POLLING_STATUS_KEY = "alex-piccione-todo-task-polling" → polling indicator (🔍 PR #N)
  Both show simultaneously; polling status auto-clears when polling stops (merge, timeout, /feature end, shutdown).

- Bug 3: When Pi start I have this warning message:
  "Warning: Could not restore model Llama.cpp/64K . Using Llama.cpp/64K"
  It appears in the Pi chat, when it restore the session.    
  It is probably generated by the /new command extension, when try to restore the model from the "new_command_model_to_use.txt" file.
  I remember there was a bug due to model id saved with a trail space ("96k ", "64k ") and the extensions was instead trimming it.
  I say this because hte error has suspect space after "Llama.cpp/96K", but can be not related.

- Feature 27.1: investigate a new pi extension to replace this built-in footer:
  ``/projects/Use-AI-for-coding (main)`` that is <folder>/<GIT branch> all printed in dark gray with this:
  ``Use-AI-for-coding`` in bright yellow removing the default prefix "/projects/"
  Also the branch is useless since it is printed in another extension.
  Investigate the built-in Pi footer (footer section) and write a document. It will be the base for the new extension.
- Feature 27.2: new pi extension to replace built-in footer described in Feature 27: implementation
- Feature 20: the /quit command exit Pi completely, ok.
  There is a simple way to switch project instead ? Investigate.

- Feature 19: todo-task extension notified the stop of review watch after 2 hous but the feature was still active
  How is possible the review is active ("Feature N" is shown in the status) and there is a review watcher running?
  If the review watcher is running it means the agent_settled was triggered and the feature was updated ?!
  That trigger also "ends" the timer and calculate the elapsed dime for hte feature/task. At least that is the desired logic, no?
- Feature 13: Select the Pi container should show the Agent name and icon (ai-start script)
- Feature 12: Complete the documentation for GIT and GitHub setup
- Feature 22: GIT credentials for not-owned repositories (replaces the obsolete Bug 2).
  The old interactive prompt ("Do you want to set the GIT credentials ... [Yy]es / [N]o") was removed by a refactor,
  but two issues remain in scripts/git_common.sh and scripts/start_common.sh:
  1. clone_repo ignores the failure of set_github_auth_for_repo and the invite-acceptance path silently switches
     GITHUB_TOKEN to the default agent account (the old "works if you are a collaborator" fallback, now implicit
     and not communicated to the user).
  2. Opening a not-owned project without a PAT record for its owner aborts with a terse error that does not
     suggest the remedy: add the owner's PAT via "🔑 Manage GitHub credentials" and retry.
- Feature 26: https://pi.dev/packages/pi-voice-stt tp add voice commands to Pi

- Feature 35 | "Select a project/action:" prompt should accept ESC

- Bug 36 | "Select a project/action:" prompt on crash and restart of the shell does not show the options

- Feature 37 | todo-task: add "/pr N" command. It should start the PR check polling of that PR

- Feature 38 | todo-task: The PR check polling should report a nice graphical view of passed time and remaining to me maximum.
  It should replace the current counter. It should use max 4 characters spaces. a sort of progress or actually countdown.

- Feature 40: extract common extensions helper function in a common .ts file

- Feature 41: Create a new Pi extension: /continue
  It should send a message like this: 
  + If it is NOT on main branch: 
    "Verify the branch status: is the job done and all the changes committed?\n There is a PR?\n There are unresolved review comments?"
  + If it is on main branch:
     "Verify branches. Do they have open PRs. If PRs are merged delete them. if there are open PRs, recap the status."

- Feature 42 | todo extension: use fresh session for /todo command
     The /todo command currently runs in the existing session context, carrying over all conversation history.
     This makes it slower, more expensive (more tokens), and risks triggering compaction.

     Modify `extensions/todo.ts` to use `ctx.newSession()` with `withSession` callback, so the agent starts with a clean context.
     Use `{ deliverAs: 'steer' }` for the initial prompt inside `withSession`.

     Constraints:
     - Keep behavior identical (same output format, same git pull, same PR status check)
     - Only one file changed (`todo.ts`)
     - Well under 500 lines delta

- Bug 43 | Pi agent todo-task extension
  "PR decision is 'CHANGES_REQUESTED' (87)" was printed but then this error:
  Error: ❌ checkPrReview() failed. Error: This extension ctx is stale after session replacement or reload. Do not use a captured pi or command ctx after ctx.newSession(), ctx.fork(), ctx.switchSession(), or
   ctx.reload(). For newSession, fork, and switchSession, move post-replacement work into withSession and use the ctx passed to withSession. For reload, do not use the old ctx after await ctx.reload().
  
  I think it is the pi (pi.sendMessage or pi.sendUserMessage) to be stale but... how to use a new one? and why was stale ?

- Bug 44 | Pi agent todo-task extension crash
  pi exiting due to uncaughtException:
    Error: This extension ctx is stale after session replacement or reload. Do not use a captured pi or command ctx after ctx.newSession(), ctx.fork(), ctx.switchSession(), or ctx.reload(). For newSession, fork, and switchSession, move post-replacement work into withSession and use the ctx passed to withSession. For reload, do not use the old ctx after await ctx.reload().
        at Object.assertActive (file:///usr/lib/node_modules/@earendil-works/pi-coding-agent/dist/bundle/chunks/chunk-OIM2DMFI.js:707:3578)
        at assertActive (file:///usr/lib/node_modules/@earendil-works/pi-coding-agent/dist/bundle/chunks/chunk-OIM2DMFI.js:708:6218)
        at Object.sendMessage (file:///usr/lib/node_modules/@earendil-works/pi-coding-agent/dist/bundle/chunks/chunk-OIM2DMFI.js:707:8976)
        at checkPrReview (/root/.pi/agent/extensions/todo-task.ts:316:10)
        at Timeout.<anonymous> (/root/.pi/agent/extensions/todo-task.ts:428:44)
            at listOnTimeout (node:internal/timers:683:17)
            at process.processTimers (node:internal/timers:620:7)

        That seems to be this line:
            prCheckTimer = setInterval(() => { void checkPrReview(cwd) }, PR_CHECK_INTERVAL_MS)

- Bug 46 [SUSPENDED: some other models with the slash work well] | todo-task model captured doesn't work well with "/"
  Llama.cpp/Qwen3.7-27B-AAA-BBB capture of proviider (Llama.cpp) and model (Qwen3.7-27B-AAA-BBB) works fine, 
  but is the model used by Pi is this: "(Openrouter) minimax/minimax-m3" it doesn't capture the model properly.  
  For some reason it captured "34 tok/s" that is the outpunf of the extension that print inference speed of the model.
  I believe it gets confused by the "/" in the model name when use something difefrent from local "Llama.cpp" provider.

- Bug 47 | git-info extension: probe `isGitRepo()` once on `session_start`; if not a Git repo, skip starting the refresh interval entirely (and remove the per-tick `isGitRepo()` call from `buildStatus()`)


- Feature 52 | Create a /feature command for OpenCode (take inspiration from Pi Agent todo-task.ts extension).
  Make the really easy and base job,ask the agent to implement the feature, and report time and tokens.
  Obviously it has to create a branch and a PR. 
  Maybe also print the "[FEATUE N COMPLETED]" message but no management of PR completion or other complicated stuff for now. REally minimal.
  Add TODO comments and new tasks in the TODO.md if needed.

- Bug 53 | OpenCode CTRL+C close it instead of Copy the selected text. Do something that avoid CTRL+C to close the program.
- Bug 54 | `opencode --continue` doesn't continue the previous session but always start a new one.

- Feature 999 | Test
  This is a fake feature, just to test the todo-task extension.
  Write an empty file.    
  DO NOT work on existing branch and existing PR. Ignore them and create a new branch and PR.
  Don't remove this feature from TODO in the PR.

## Latest 10 tasks completed
- Bug 16 [fix/16_successive_pr_rejection]: todo-task PR-review dedup now keyed by the latest decisive review event id instead of the decision value — successive rejections/approvals are detected again without re-notifying the same review; per-tick decision log gated behind debug()
- Bug 50 [fix/50_message_sender_session_start]: drop type-wrong `messageSender = ctx` from todo-task session_start handler (ExtensionContext has no send methods); keep only `pi` and withSession `newCtx` as valid senders
- Bug 48 [fix/48_stale_ctx_pr_rejected]: fix stale messageSender in todo-task on session_start so checkPrReview doesn't crash on PR rejection
- Bug 45 [fix/45_suppress_git_errors_in_git_info]: Suppress Git error messages in git-info extension when not in a Git repository
- Bug 38 [fix/38_pr_approval_detection_failing_checks]: detect approval from individual reviews when reviewDecision is null due to failing checks; remove debug spam
- Feature 35 [feat/35_pr_status_link]: todo-task polling status PR references are now clickable (OSC 8 hyperlinks)
- Feature 33 [feat/33_pr_extension]: pr-extension adds /review command for PR review sessions
- Feature 32 [feat/32_fresh_session_on_task_v2]: todo-task starts a fresh session on task start for context purity
- Bug 15 [fix/15_session_start_restart_timers]: todo-task restart PR polling + status timer on session_start
- Feature 18 [feat/18_todo_review_watcher_pr_link]: todo-task review watcher stop message includes PR link
