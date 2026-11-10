# TODO

## Backlog


- Bug 16 (remaining sub-issue) | todo-task polling should start AFTER the PR is created
  Polling is armed by `/feature N` / `/bugfix N`, i.e. long before a PR exists; the watcher then has to
  idle through a discovery phase (currently unbounded, bounded only by the 4 h `PR_CHECKING_MAX_MS`).
  Arm it from the creation event instead and delete the discovery machinery:
  - `pi.on("tool_execution_end")`: when `toolName === "bash"`, `!isError` and the command matches
    `\bgh\s+pr\s+create\b`, parse the PR number from the printed PR URL and call
    `startPrCheckPolling()` with `watchedPr` already set (checks by number from the first tick).
  - Guard: only when a task is `pending`, never re-arm while `prCheckTimer` is already running.
  - PRs created outside the bash tool (GH web UI, `gh api`, scripts) never raise the event: keep a slow
    fallback poll (~2-5 min instead of 20 s) and keep `/pr <number>` as manual arming.
  - Once landed, the `pr == null` wait branch and the whole default/detached-branch discovery path can go.
  - Known gap it closes: a PR merged/closed *before* discovery observed it is invisible (discovery lists
    open PRs only), so the watcher idles until the 4 h safenet without announcing the outcome.

- Feature 71 | todo-task: single watcher loop replacing the two independent timers
  `statusTimer` (elapsed time) and `prCheckTimer` (PR polling) are two module-level timers with duplicated stop/clear logic in `abortStart`, `session_shutdown`, `finishActivity`, `/feature end` and `clearPending` — the root cause of the Feature 30 flicker.
  Refactor into one watcher holding `{ pending, pr, startedAt, phase }` with explicit phases (`working` → `awaiting_review` → `ended`); the two status keys of Feature 30 stay separate.
  Spell out when a task-less watch ends (PR merged/closed, the 4 h `PR_CHECKING_MAX_MS` safenet, `/feature end`): an agent settle is deliberately **not** a stop condition, because `/pr <n>` arms the watch with no active task.

- Feature 27.1: investigate a new pi extension to replace this built-in footer:
  ``/projects/Use-AI-for-coding (main)`` that is <folder>/<GIT branch> all printed in dark gray with this:
  ``Use-AI-for-coding`` in bright yellow removing the default prefix "/projects/"
  Also the branch is useless since it is printed in another extension.
  Investigate the built-in Pi footer (footer section) and write a document. It will be the base for the new extension.
- Feature 27.2: new pi extension to replace built-in footer described in Feature 27: implementation
- Feature 20: the /quit command exit Pi completely, ok.
  There is a simple way to switch project instead ? Investigate.

- Feature 22: GIT credentials for not-owned repositories (replaces the obsolete Bug 2).
  The old interactive prompt ("Do you want to set the GIT credentials ... [Yy]es / [N]o") was removed by a refactor,
  but two issues remain in scripts/git_common.sh and scripts/start_common.sh:
  1. clone_repo ignores the failure of set_github_auth_for_repo and the invite-acceptance path silently switches
     GITHUB_TOKEN to the default agent account (the old "works if you are a collaborator" fallback, now implicit
     and not communicated to the user).
  2. Opening a not-owned project without a PAT record for its owner aborts with a terse error that does not
     suggest the remedy: add the owner's PAT via "🔑 Manage GitHub credentials" and retry.
- Feature 26 [SUSPENDED] | https://pi.dev/packages/pi-voice-stt tp add voice commands to Pi

- Feature 35 | "Select a project/action:" prompt should accept ESC

- Bug 36 | "Select a project/action:" prompt on crash and restart of the shell does not show the options

- Feature 37 | todo-task: add "/pr N" command. It should start the PR check polling of that PR

- Feature 38 | todo-task: The PR check polling should report a nice graphical view of passed time and remaining to me maximum.
  It should replace the current counter. It should use max 4 characters spaces. a sort of progress or actually countdown.

- Feature 40: extend `_shared/common.ts` (created by Feature 39) to the remaining extensions: `git-info.ts`, `agent-name.ts`, `llama-server-model.ts`, `new.ts` still define their own colors/status/notify helpers.
  Note (from the #125 review): the `~/.pi/agent/extensions/*.ts` copies are stale — they still use the pre-Feature-30 single `STATUS_KEY` and `prReview.ts` (lowercase `e`), while the repo moved to `Pi Agent/for_docker_volume/extensions/` with `pr-review.ts`. Only `todo-task.ts` is up to date there. Refresh the deployed folder (or the deploy step) together with this task.

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

- Feature 57 | todo-task: I see the log "effectiveDecision: '' (51)" as soon as the agent start to work on the PR.  
  Is it possible to delay this check start timer at the end ?

- Bug 64 (remaining) | todo-task execution report is not attached when the PR is not open
  `appendReportToPr()` and `finishActivity()` still look the branch PR up with `--state open`, so a
  merged/closed PR yields an empty list and the report is dropped. Reported as:
  ```
  Start PR check...
  Error: TODO-TASK ❌ PR not found on branch 'fix/39_executable_bit'.
  Warning: ⚠️ No open PR found on the current branch — execution report not attached to a PR.
  ```
  Only the poller half is fixed; this needs its own lookup plus a decision on whether a report should
  be appended to a merged PR. The poller cannot be reused: it resolves a PR by number/URL that it
  already knows, while `appendReportToPr()` starts from a branch name.

- Bug 61 | pi-agent errors break the TUI
  Error: ❌ Git update failed: error: Your local changes to the following files would be overwritten by checkout:
    Pi Agent/for_docker_volume/agent/extensions/_shared/common.ts
  Please commit your changes or stash them before you switch branches.
  Aborting

  After the word "Aborting" the TUI shows the footer and it prints there the error again (overwritting hte plugins text):  
  '\tPi Agent/for_docker_volume/....\n' + 'Please commit your changes... \n '. A repetition of the error. 

- Feature 63 | When the agent is started in a non-GIT folder, the GitHub token is not set.. so it cammot access to the repos, to make a review for example.
  It should. what is the problem... that we don't know what repo will it need to use ? So we don't know which PAT ?
  Solutions?

- Bug 73 | todo-task /pr must watch unresolved review threads (/pr + /review: use GitHub review threads (isResolved))

  Comment by Pi Lemon (qwen3.8-flash):
  """ 
  todo-task /pr + /review: use GitHub review threads (isResolved) as the review protocol
     /review posts each finding as an inline comment on file:line (a thread); /pr polls reviewThreads and wakes the
     agent while any thread is unresolved, then tells the human it is ready to merge. No numbering/body parsing.
     Also: with all agents on one account a formal APPROVE/REQUEST_CHANGES is impossible (GitHub 422 for the PR author),
     so reviewDecision stays REVIEW_REQUIRED forever and the current poller acts on nothing — it must switch to threads.
     Follow-up: set required_review_thread_resolution=true in the "main branch" ruleset (admin token).
  """

  Comamnt by Pi Orange ():
  """
  todo-task: `/pr N` must watch unresolved GitHub review threads
     All agents share one GitHub account, so formal APPROVED/CHANGES_REQUESTED reviews cannot be relied on.
     `/pr N` currently checks `reviewDecision` and reviews but can miss actionable inline review comments.
     Use GitHub GraphQL `reviewThreads` and the native `isResolved` field to detect unresolved findings.
     Notify the agent once per new review comment, deduplicating by comment ID, and stop notifying once
     the thread is resolved. Replies must use the native thread `/replies` endpoint.
     Actionable findings must be posted as inline review threads; review summaries remain informational.
     Do not add custom review numbering, titles, checkbox parsing, or comment-body state tracking.
     Repeated `REVIEW_REQUIRED` messages should be debug-only or logged only when the state changes.
  """"

- Feature 74 | todo-task: extract `_shared/github.ts` and `_shared/session-sender.ts` (from PR #129 review)
  `todo-task.ts` is ~990 lines with ~7 responsibilities. Three blocks are not todo-task's business:
  - GitHub layer: `getOpenPrList` / `viewPr` / `resolveOpenPr` / `switchToPrBranch` + `PrView`/`PrSummary`
    → `_shared/github.ts` (Feature 37 and Bug 64 will add callers; `viewPr()` already serves `/pr` and the poller).
  - session-sender machinery: `MessageSender`, `messageQueue`, `flushMessageQueue`, `safeSendUserMessage`,
    `safeSendMessage`, `hasValidSender` / `ownSessionReplacement` / `resetSender` (~100 lines)
    → `_shared/session-sender.ts` (generic "survive newSession/fork" plumbing; Bugs 43/44/48/50 fix it).
  - `parseCommandArgs` (`todo-task.ts`) and `parseReviewArgs` (`pr-review.ts`) are the same ~25 lines.
  ≈ −230 lines with zero behaviour change, so it must be a mechanical PR of its own.
  Keep the modules under `_shared/` (deployed by `containers_setup.sh`), never in the extensions root where Pi loads them.
  Also removes the 400-line forward reference to `viewPr()` in the poller.

- Feature 75 | todo-task: extract `todo-task/pr-poller.ts` with mocked `gh` tests (from PR #129 review)
  Polling is ~200 lines inside a 990-line file and has no automated coverage; every bug in it was found
  by live container runs. Move `checkPrReview` / `startPrCheckPolling` / `stopPrCheckPolling` / `watchedPr`
  into their own module and test it with a stubbed `gh`/`git`/`setInterval`: discovery with no PR yet,
  discovery → merge, reused branch with only old closed PRs, transient failure → retry → recovery,
  merge detected while on `main`/detached HEAD, closed without merge, and no per-tick toasts.
  A throwaway harness proving these seven scenarios passed was used to validate PR #129.
  Same PR can delete the ~45 zero-risk leftover lines in `todo-task.ts` (commented `agentMessage_old`
  block, commented "Auto-detect" block, `//console.error` / `//safeNotify` leftovers, `checkCounter`
  replaced by a `firstTick` boolean, and the empty `if` body next to the report attach where every
  `appendReportToPr` failure is reported as "no open PR" — real fix is Bug 64).

### OpenCode

- Feature 52 | Create a /feature command for OpenCode (take inspiration from Pi Agent todo-task.ts extension).
  Make the really easy and base job,ask the agent to implement the feature, and report time and tokens.
  Obviously it has to create a branch and a PR. 
  Maybe also print the "[FEATUE N COMPLETED]" message but no management of PR completion or other complicated stuff for now. REally minimal.
  Add TODO comments and new tasks in the TODO.md if needed.

- Bug 53 | OpenCode CTRL+C close it instead of Copy the selected text. Do something that avoid CTRL+C to close the program.
- Bug 54 | `opencode --continue` doesn't continue the previous session but always start a new one.

- Feature 55 | Add a custom OpenCode TUI keybind task: rebind `app.exit` in ~/.config/opencode/cli.json so Ctrl+C does not close the TUI (default is `ctrl+c,
     ctrl+d,<leader>q`). Keep an alternative exit chord (e.g. `ctrl+d` only) and document it in the team setup docs / setup script.

  Let me know if you want me to add it to TODO.md (it would be its own small branch + PR, or I can just add the line if you prefer).

  Option 2 rebinds it to "none", disabling app.exit entirely — no chord closes the app except <leader>q.

  I prefer Option 2 if /quit or /exit does the same.
  
  Allows copy "as normal":
     { "terminal": { "copy": "select" } }

- Feature 49 [SUSPENDED] | New Pi extension: API key rotation (pi-keyrouter alternative)
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
 
- Feature 66 | containers.sh: make `create_container` idempotent (Pi Agent + OpenCode)
  A re-run aborts with "name already in use" and, with `set -e`, leaves the remaining agents uncreated.
  Skip (or recreate) containers that already exist, so the step can be re-run safely.

- Feature 67 | OpenCode/containers.sh: apply the same hardening done for Pi Agent in Feature 65
  - add `#!/usr/bin/env bash` shebang (the file is executable, so `sh containers.sh` would die on `pipefail`)
  - `${1:?}` instead of `${1:-}` for the `<steps>` arg: a missing arg currently silently no-ops
  - strict step validation instead of substring matching (e.g. `create_containers` would run `create_image`)
  - resolve `constants.sh` / CWD against the script location, not the caller's CWD
  - quote `$docker_image`

- Feature 77 | Delete Feature 30, already implemented.

- Feature 999 | Test
  This is a fake feature, just to test the todo-task extension.
  Write an empty file.    
  DO NOT work on existing branch and existing PR. Ignore them and create a new branch and PR.
  Don't remove this feature from TODO in the PR.

## DONE (latest tasks completed)
- Bug 70 [obsolete]: "polling never stops" is the designed `/pr` watch — the timer ends on a merged/closed PR (#129), the 4 h `PR_CHECKING_MAX_MS` safenet or `/feature end`, and `stopPrCheckPolling()` clears the 🔍 status; stopping on `agent_settled` would kill `/pr <n>` (armed with no task). Coverage gap stays in Feature 75, ending rules noted on Feature 71
- Bug 17 [obsolete]: the fresh-session start already runs its post-replacement work inside `withSession` with the new ctx and every send goes through `messageSender ?? pi` guarded by try/catch (`0f79d0a`, 2026-11-10); the `fix/17_stale_ctx_after_newsession` branch only logged it, never fixed it
- Bug 72 [obsolete]: `pr-review.ts` no longer polls (it is only the `/review N` command) and `todo-task.ts` owns the single `prCheckTimer`, which stops the previous one before arming — the two-pollers scenario cannot happen
- Feature 12.3 [docs/12_3_troubleshooting]: filled the empty Troubleshooting section of 'GitHub access for Agent.md' with the symptom → cause → fix table (verified against scripts) + `REPO_ACCESS_*` exit codes
- Bug 16 (stop side, partial) [fix/69_todo_polling_stop]: todo-task PR polling stops as soon as it can see the watched PR is finished. The PR identity is kept across re-arms (`/pr <n>`, session replacement), a finished PR is resolved by URL/number so merged/closed is reported as fact, and an absent PR keeps waiting under the 4 h safenet instead of a guessed grace period. Transient gh failures are notified once and shown in the status line. Known gap, hence "partial": a PR merged/closed *before* discovery first observed it is never seen (discovery only lists open PRs) and the watcher idles to the safenet — arming at PR creation (Bug 16 backlog) closes it. Bug 64's report-attachment half stays in the Backlog
- Bug 47 [fix/47_git_info_isgit_repo_probe]: git-info probes `isGitRepo()` once on `session_start`, skips the refresh interval outside a Git repo, and removes the per-tick probe from `buildStatus()`
- Bug 46 [obsolete]: todo-task resolves the model from `ctx.model` (and `/models` for Llama.cpp), so it no longer parses footer text and cannot capture `34 tok/s`; removed from backlog
- Bug 62 [fix/62_pr_on_main_branch]: `/pr` works from the default branch: it moves to the open PR branch (auto-pick when one, dialog when several, `/pr <number>` targets a specific one) and reports uncommitted changes, asking to stash before switching
- Feature 65 [feat/65_pi_containers_reorg]: Pi Agent Docker work reorganized OpenCode-style: `containers.sh` steps (create_image/setup/create_container) + `constants.sh` (agents, default models, volumes) + `containers_setup.sh`; `setup_containers.sh` removed, README now only exposes the calls; 2 VS Code tasks to run `containers.sh setup` (Pi Agent + OpenCode)
- Feature 34 [feat/34_reuse_pr_lookup_in_append_report]: extracted shared `ghPrList<T>()` helper; `appendReportToPr` now makes one gh call instead of two
- Bug 59 [fix/59_todo_crash_on_main]: `/todo` now reads TODO.md via `git fetch` + `git show origin/main:TODO.md` instead of `git checkout main && git pull`, so it no longer switches branches or crashes on uncommitted local changes
- [fix/60_errexit_check_repo_access] `start_common.sh`: guard `check_repo_access`, its invite fallback, `set_github_auth_for_repo` and menu actions against `errexit`; name the `check_repo_access` exit codes (`REPO_ACCESS_*`); fix `$dir_name` typo
- Feature 39 [feat/39_shared_ui_helpers_v2]: `extensions/_shared/common.ts` holds `osc8Link`, `safeSetStatus`, `safeNotify`, `createDebug` and the ANSI colors; `todo-task.ts` and `pr-review.ts` import them instead of defining their own copies
- Bug 16 [fix/16_successive_pr_rejection]: todo-task PR-review dedup now keyed by the latest decisive review event id instead of the decision value — successive rejections/approvals are detected again without re-notifying the same review; per-tick decision log gated behind debug()
- Bug 50 [fix/50_message_sender_session_start]: drop type-wrong `messageSender = ctx` from todo-task session_start handler (ExtensionContext has no send methods); keep only `pi` and withSession `newCtx` as valid senders
- Bug 48 [fix/48_stale_ctx_pr_rejected]: fix stale messageSender in todo-task on session_start so checkPrReview doesn't crash on PR rejection
- Bug 60 [fix/60_deploy_shared_common]: `setup_containers.sh` now copies `extensions/_shared/` into the Pi docker volume (`*.ts` glob skipped subdirectories, breaking `./_shared/common.ts` imports)
- Bug 45 [fix/45_suppress_git_errors_in_git_info]: Suppress Git error messages in git-info extension when not in a Git repository
