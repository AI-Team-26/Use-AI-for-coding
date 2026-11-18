# TODO

## Backlog

- Feature 71 | todo-task: one state owner + one idempotent teardown (keep both timers)
     Not the two timers — Feature 30 fixed its flicker by splitting one shared status key into `STATUS_KEY_TASK` and
     `STATUS_KEY_PR` (commit 883cfa8), so that split must be preserved, not undone. `taskStatusTimer` (15 s, string only)
     and `prCheckTimer` (20 s, `gh` subprocess) also have different lifetimes: `/pr <n>` arms the PR watch with no task.
     The real defect is the number of *owners*: `stopStatusTimer` / `stopPrCheckPolling` / `clearCurrentTask` / `abortStart` /
     `session_shutdown` / `finishActivity` each decide what "stop" means and disagree — `abortStart` clears both keys,
     `finishActivity` only the task key, `clearCurrentTask` stops both timers.

     Refactor, one file (`Pi Agent/for_docker_volume/extensions/todo-task.ts`):
  - one module-scope state object owning `currentTask`, `watchedPr`, `phase` (`working` → `awaiting_review` → `ended`),
       `startedAt`, `prCheckStartedAt`, `watchGeneration`, `handledReviewDecisions`, `consecutiveGhFailures`,
       `consecutiveSendFailures`, `taskProjectRoot`;
  - one `stopAll(reason)` — idempotent, clears both status keys — called by session shutdown, `abortStart`,
       `finishActivity` and `/feature end`; the low-level `stopStatusTimer` / `stopPrCheckPolling` stay internal;
  - one `renderStatus()` that writes both keys from the state, so no site writes a key from a stale local belief;
  - keep the 15 s / 20 s cadences and both timers. Do NOT merge them into one interval.
     The state must stay at module scope (Pi never disposes the old instance on session swap, hence `watchGeneration`).

     Watch ends only on: PR merged/closed, the 4 h `PR_CHECKING_MAX_MS` safenet, `/feature end`, session shutdown.
     An `agent_settled` is deliberately NOT a stop condition, because `/pr <n>` arms the watch with no active task.

     Order: after Feature 75 (tested poller module) — otherwise 75 rewrites the same code twice. Excludes Bug 73
     (`reviewThreads` switch): do not change what `checkPrReview` reads.
     Done when: behaviour identical (no change to what is shown, only fewer code paths writing it), no new files,
     `todo-task.ts` only.

- Feature 27.1: investigate a new pi extension to replace this built-in footer:
  ``/projects/Use-AI-for-coding (main)`` that is <folder>/<GIT branch> all printed in dark gray with this:
  ``Use-AI-for-coding`` in bright yellow removing the default prefix "/projects/"
  Also the branch is useless since it is printed in another extension.
  Investigate the built-in Pi footer (footer section) and write a document. It will be the base for the new extension.
- Feature 27.2: new pi extension to replace built-in footer described in Feature 27: implementation

- Feature 84 | Actionable no-access guidance: invite GITHUB_AGENT_ACCOUNT with write access / move to org / add owner PAT. Forks out of scope. Also: an accepted invitation is not re-checked for permission, and an org invitation can be read-only, so the first push may still fail
- Bug 85 | Invitation lookup: `gh api /user/repository_invitations` returns 30 items per page (needs `--paginate`); inviters should keep the shared agent account's invitation list short (invites expire after 7 days)
- Feature 85 | Commit the fake-`gh` harness for `check_repo_access` / `check_and_accept_invite` under `scripts/tests/` so the invitation cases are repeatable

- Feature 26 [SUSPENDED] | https://pi.dev/packages/pi-voice-stt tp add voice commands to Pi

- Feature 35.1 | free-text `read -p` prompts (clone repo URL, new project name) should accept ESC to cancel, like the menus do (needs the same raw-first-char read trick as `read_menu_input`)

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

- Feature 78 | Pi Agent: /feature  command returns this error:
  Error: ❌ Git update failed: error: Your local changes to the following files would be overwritten by checkout:
    OpenCode/plugins/tsconfig.json                                                                                                                              Please commit your changes or stash them before you switch branches.                                                                                                                            Aborting. Error: Command failed: git checkout main && git pull --rebase --autostash
  error: Your local changes to the following files would be overwritten by checkout:
    OpenCode/plugins/tsconfig.json
  Please commit your changes or stash them before you switch branches.                                                                                                                                Aborting 

  The agent should ask the user if stash or just loose local changes. ui.select is a possible comamnd 

- Feature 80 | pr-review.ts: A/B switch between single-comment and multi-comment reviews (`PR_REVIEW_MODE`)

     `/review N` only injects a prompt ("Leave a PR review comment, signed with your name"), so every agent posts
     one big comment. That breaks down on multi-point reviews:
    - you cannot see which *single* point was solved (one blob, no per-point state),
    - you cannot see whether the author processed the *whole* review,
    - replies interleave: one thread, N answers, unreadable,
    - there is no CHANGE_REQUEST / ACCEPTED state — with all agents on one account GitHub returns 422 for both
       APPROVE and REQUEST_CHANGES on a PR the same account authored,
    - the "last" review means "last comment posted", with no author and a lot of scrolling to find it.

     Add a flag next to `const DEBUG = false` (`pr-review.ts:15`), same style as `process.env.AI_AGENT_NAME` in
     `agent-name.ts:13`:
         type ReviewMode = "single" | "multi"
         const REVIEW_MODE: ReviewMode = (process.env.PR_REVIEW_MODE as ReviewMode) ?? "single"

     Today's prompt moves verbatim into `PROMPTS.single`; the arm is chosen when `/review` runs. Default `single`
     means no behaviour change when the flag is unset, so the PR can merge and the two arms are compared live.

     `PROMPTS.multi` (the A/B arm) instructs the agent to post ONE review with N inline threads:
    - `gh api repos/$OWNER/$REPO/pulls/N/reviews --input -` with a JSON heredoc (never `-f "body=..."`: a backtick or
       `$` inside a finding is replaced by the shell before `gh` sees it), `event: COMMENT` — the only review state a
       same-account reviewer may submit.
    - `body` = decision line + index, reusing the current conventions: decision first (✅ Approved / ☑️ Approved
       (can be improved) / ⛔ Rejected), numbered points with 🟥 heavy 🟧 blocking 🟨 trivial 🟦 info.
    - `comments[]` = one entry per finding (`path`, `line` on the new-file side, `side: RIGHT`); each thread body
       repeats its number (`🟧 **#2** — …`) so a reply can say "re: #2".
    - Identity and round stay in visible text: header `**🍊 Pi Orange** — review round 2`, where the round is the
       highest round the agent finds in the PR's existing reviews for that signature, plus one; and the closing
       signature `— 🍊 Pi Orange` on the review body and on every thread.
    - Findings with no diff anchor (no test added, PR-body *Files changed* table stale, Backlog entry not removed)
       cannot be inline comments: collect them and post one `gh pr comment N` summary instead. On HTTP 422 do not
       retry the same line.
    - Dedupe against existing `reviewThreads` (`isResolved`, `path`, `line`) so a re-run does not re-post findings.

     Both arms keep the recap and `[REVIEW N DONE]` so runs stay comparable, and the agent must write the arm used
     (`mode: single|multi`) in the PR's "AI agent execution report" — that is the A/B measurement: rounds to merge,
     unresolved threads at merge time, and time from review to human decision.

     Review threads stay the single source of state (Bug 73); the numbering above is for human reference only and is
     not parsed by any extension.

     Scope: `pr-review.ts` + this Backlog entry. No `todo-task.ts` changes, no PR-poller changes, no ruleset changes,
     no APPROVE/REQUEST_CHANGES, no labels in this round.
     Follow-up only if arm `multi` fails for execution reasons rather than review quality: `scripts/post_review.sh`
     taking the review JSON on stdin, to remove prompt-following from the equation.


### OpenCode

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

- Feature 999 | Test
  This is a fake feature, just to test the todo-task extension.
  Write an empty file.    
  DO NOT work on existing branch and existing PR. Ignore them and create a new branch and PR.
  Don't remove this feature from TODO in the PR.

## DONE (latest tasks completed)
- Feature 22 [obsolete]: GIT credentials for not-owned repositories is covered elsewhere — `clone_repo` checks the token lookup and announces the agent-account fallback (Bug 86), an invitation is accepted under the agent PAT (Bug 81), and the remaining permission re-check and no-access guidance are Feature 84
- Bug 82 [fix/82_project_without_pat_stays_in_menu]: opening a project whose repo owner has no PAT record no longer ends the start script — `select_project` guards `set_github_auth_for_repo`, names the remedy (**🔑 Manage GitHub credentials**) and redraws the menu
- Bug 86 [fix/86_clone_without_owner_pat]: an invited repo clones without an owner PAT — `clone_repo` falls back to the agent PAT (named `GIT_AUTH_*` codes, announced switch, bad URL/malformed PAT still fatal), and `check_repo_access` runs the invitation lookup on the `REPO_ACCESS_ERROR` path too, because a private repo with a pending invitation answers 404 until it is accepted
- Bug 81 [fix/81_accept_invite]: invitation acceptance works — the HTTP outcome comes from the `gh api` exit status instead of `jq .status` on a JSON array (always `null`), invitations match `full_name` case-insensitively, the first matching id is accepted, and `clone_repo` no longer repeats the invitation lookup that `check_repo_access` already did; the agent token is kept after a successful accept and the previous one is put back otherwise
- Feature 83 [fix/83_token_switch_notice]: check_and_accept_invite announces the agent-account token it uses for the invitation lookup and reports the no-invite case; guards token-switch failure (the `jq .status` bug it depended on was fixed by Bug 81)
- Feature 35 [feat/35_menu_accept_esc]: "Select a project/action:" (and delete-project) prompt accepts ESC = Exit; `select` replaced by a raw-first-char read loop
- Feature 52.2 [feat/52_2_opencode_review_command]: OpenCode /review N command implemented
- Feature 52 [feat/52_opencode_feature_bugfix_commands]: OpenCode /feature N and /bugfix N commands implemented
- Feature 79 [feat/79_pr_created_turn_end_marker]: todo-task PR watch is armed by the agent's "[PR N CREATED]" turn_end marker (verified via gh pr view) instead of eagerly at task start; /pr stays as manual arming
- Feature 58 [fix/61_terminal_title_v2]: terminal title ported to the OpenCode v2 TUI plugin API — shows ⏳ while the active session runs and 🖐️ when idle; built-in title disabled in `cli.json`
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
