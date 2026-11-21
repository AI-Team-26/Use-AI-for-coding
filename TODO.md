# TODO

## Backlog

- Feature 38 | todo-task: The PR check polling should report a nice graphical view of passed time and remaining to me maximum.
  It should replace the current counter. It should use max 4 characters spaces. a sort of progress or actually countdown.

- Feature 97 | containers_setup.sh: the extension copy never removes stale files, so a docker volume can keep an extension the repo dropped.
  Make the copy a mirror of the shipped set (top-level `*.ts`, `_shared/`, `todo-task/`): remove files in the target that are not in the repo, and check the source folder exists before deleting anything.

- Feature 41: Create a new Pi extension: /continue
  It should send a message like this: 
  + If it is NOT on main branch: 
    "Verify the branch status: is the job done and all the changes committed?\n There is a PR?\n There are unresolved review comments?"
  + If it is on main branch:
     "Verify branches. Do they have open PRs. If PRs are merged delete them. if there are open PRs, recap the status."

- Feature 57 | todo-task: I see the log "effectiveDecision: '' (51)" as soon as the agent start to work on the PR.  
  Is it possible to delay this check start timer at the end ?

- Feature 63 | When the agent is started in a non-GIT folder, the GitHub token is not set.. so it cammot access to the repos, to make a review for example.
  It should. what is the problem... that we don't know what repo will it need to use ? So we don't know which PAT ?
  Solutions?

- Feature 74 | todo-task: extract `_shared/session-sender.ts` (from PR #129 review)
  `todo-task.ts` still contains session-sender machinery and duplicate argument parsing:
  - session-sender machinery: `MessageSender`, `messageQueue`, `flushMessageQueue`, `safeSendUserMessage`,
    `safeSendMessage`, `hasValidSender` / `ownSessionReplacement` / `resetSender` (~100 lines)
    → `_shared/session-sender.ts` (generic "survive newSession/fork" plumbing; Bugs 43/44/48/50 fix it).
  - `parseCommandArgs` (`todo-task.ts`) and `parseReviewArgs` (`pr-review.ts`) are the same ~25 lines.
  Keep this a mechanical PR with zero behaviour change.
  Keep the modules under `_shared/` (deployed by `containers_setup.sh`), never in the extensions root where Pi loads them.
  - Extract the remaining PR workflow (`resolveOpenPr`, `switchToPrBranch`, and `PrView`); consider a PR-specific utility module.
  - Remove the forward reference from the poller to `viewPr` if Feature 75 has not already done so.

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


### Pi Agent

- Feature 93 | (todo-task extension) One writer for the two status-bar keys
  Symptom it prevents: ghost footer entries (elapsed time shown for a task that no longer exists) when a stop path forgets one key.
  Fix: a single renderStatus() in todo-task.ts that writes STATUS_KEY_TASK and STATUS_KEY_PR from the current state; every other site updates state only. No behaviour change, no timer changes.
  Why it is useful now: Feature 38 (countdown display) adds a new status writer. Doing this first gives 38 one place to plug into instead of one more scattered writer.

- Feature 26 [SUSPENDED] | Pi agent: https://pi.dev/packages/pi-voice-stt tp add voice commands to Pi

- Feature 27.1 [SUSPENDED]: investigate a new pi extension to replace this built-in footer:
  ``/projects/Use-AI-for-coding (main)`` that is <folder>/<GIT branch> all printed in dark gray with this:
  ``Use-AI-for-coding`` in bright yellow removing the default prefix "/projects/"
  Also the branch is useless since it is printed in another extension.
  Investigate the built-in Pi footer (footer section) and write a document. It will be the base for the new extension.
- Feature 27.2 [SUSPENDED]: new pi extension to replace built-in footer described in Feature 27: implementation

- Feature 49 [SUSPENDED] | New Pi extension: API key rotation (pi-keyrouter alternative)
  Goal: rotate multiple API keys of the same provider automatically (e.g. several GEMINI keys under one "Google" provider), no manual model switching.
  Background: npm `pi-keyrouter` (v0.4.0) crashes on Pi 1.3.0 — it calls `ctx.modelRegistry.authStorage.setRuntimeApiKey(...)`, but @earendil-works/pi-coding-agent 1.3.0 does not expose `authStorage` (nor `setRuntimeApiKey`) to extensions at all.
  Key source (ideal): reuse the EXISTING `models.json` — no separate config file. Add support for a new optional provider-level property `additionalApiKeys`: an array of extra keys alongside the usual `apiKey`. The extension rotates over `apiKey` + all `additionalApiKeys` of the selected model's provider.
  Inspiration/mechanism: npm `@jeryjs/pi-keyrouter` (v1.4.0) — https://pi.dev/packages/@jeryjs/pi-keyrouter .
  NOTE: this is a DIFFERENT package than the broken `lowern1ght/pi-keyrouter`. Its key-injection mechanism works on Pi 1.3.0:
  it reaches `ModelRuntime.setRuntimeApiKey` through the ModelRegistry facade's private `runtime` field,
  with a capability check and graceful degradation (inert + warning) if the field disappears.
  Secondary reference for pure rotation state machine: https://github.com/lowern1ght/pi-soly/blob/master/packages/pi-keyrouter/rotation.ts
  Build a local extension using the hooks that DO exist in 1.3.0:
  - Read the key pool from models.json (`apiKey` + `additionalApiKeys`); per-key cooldowns/maxRetries can live in the extension or as optional models.json fields
  - Key injection: `modelRegistry.runtime.setRuntimeApiKey(providerId, key)` (capability-checked), so Pi's built-in retry picks up the new key automatically
  - `after_provider_response`: on status 429/401/403 mark current key bad (with cooldown) and rotate; classify account-wide quota errors separately (rotating cannot fix those)
  - Notify via ctx.ui.notify on rotation / exhaustion; runtime state only, never persisted
  Verify first: that Pi 1.3.0 tolerates the unknown `additionalApiKeys` field in models.json (ignores it without error)
  Constraints: single file under `extensions/`, reuse `_shared/common.ts` helpers where possible, well under 500 lines
 
- Bug 73 [SUSPENDED] | todo-task /pr: watch unresolved review threads

     ## Suspended 
     We want to test the GitHub App for create reviews, so a proper review will be possible from the agents.

     ## Problem
     All agents share the agent-account. GitHub does not allow approving or rejecting a PR
     opened by the same account, so agent-to-agent reviews are only plain comments.
     The PR watcher (`todo-task/pr-watcher.ts`) looks only at review verdicts
     (approved / rejected), so it never sees these comments — the PR author is not woken
     up and findings are missed. Example: PR #175 was merged with 1 of 5 review threads
     still unresolved.
     Reviews from the user-account do produce real verdicts, so the existing
     approved/rejected handling works and must stay.

     ## Proposed Solution
     Add watching of review threads next to the existing verdict checks.
     Files: `todo-task/pr-watcher.ts` and a new GraphQL helper in `_shared/github.ts`.

     - Fetch the PR with one GraphQL query per check (it replaces `gh pr view`):
       state, conflicts, verdict, head commit, plus all review threads with their
       resolved flag and comments (id, author, body, link). One subprocess call, as today.
     - Wake the agent once for each new comment in an unresolved thread. Remember the
       comment ids already reported so nothing is sent twice; if sending fails, try
       again on the next check. When a thread is resolved, stop reporting it.
     - Do not wake the agent for its own comments: recognise them by the agent's
       signature line (AI_AGENT_NAME).
     - The wake-up message lists the unresolved threads (file, line, link) and points
       to the reply endpoint described in AGENTS.md. When the last unresolved thread
       is resolved, send one "ready for merge" note.
     - Do not parse comment bodies or invent numbering to track state: GitHub's
       resolved flag is the only state.
     - Keep everything else as it is: verdict handling, conflict notices, and the
       watch end rules (merged/closed, 4-hour limit, /feature end, session shutdown).

     Order: before Feature 71 (it must not change what the watcher reads) and before
     Feature 80 (its multi-comment reviews produce the threads this task watches).
     Follow-up (separate task, needs admin token): enable
     required_review_thread_resolution in the "main branch" ruleset, so GitHub itself
     blocks merging while threads are unresolved. It is currently off.

     Done when: a new unresolved comment from another agent wakes the PR author once,
     resolving the thread stops the reports, and user-account verdicts work as today.


### OpenCode

- Bug 54 | `opencode --continue` doesn't continue the previous session but always start a new one.

- Feature 66 | containers.sh: make `create_container` idempotent (Pi Agent + OpenCode)
  A re-run aborts with "name already in use" and, with `set -e`, leaves the remaining agents uncreated.
  Skip (or recreate) containers that already exist, so the step can be re-run safely.

- Feature 67 | OpenCode/containers.sh: apply the same hardening done for Pi Agent in Feature 65
  - add `#!/usr/bin/env bash` shebang (the file is executable, so `sh containers.sh` would die on `pipefail`)
  - `${1:?}` instead of `${1:-}` for the `<steps>` arg: a missing arg currently silently no-ops
  - strict step validation instead of substring matching (e.g. `create_containers` would run `create_image`)
  - resolve `constants.sh` / CWD against the script location, not the caller's CWD
  - quote `$docker_image`

- Bug 89 | The icon for activity indication always shows it in idle (hand). 
  It doesn't care about sub-agents.  
  If there are sub-agents running it should bye "running". So should be "idle" only when there is NO activity at all.
  
- Feature 999 | Test
  This is a fake feature, just to test the todo-task extension.
  Write an empty file.    
  DO NOT work on existing branch and existing PR. Ignore them and create a new branch and PR.
  Don't remove this feature from TODO in the PR.

## DONE (latest tasks completed)
- Bug 98 [fix/98_osc8_st_terminator]: `osc8Link()` terminates OSC 8 hyperlinks with ST (`\x1b\\`) instead of BEL, so a broken render path can no longer ring the terminal bell; output is byte-identical to pi-tui `hyperlink()`
- Feature 40 [feat/40_shared_common_helpers]: `git-info.ts`, `agent-name.ts`, `llama-server-model.ts`, `new.ts` reuse `_shared/common.ts` (colors, safeNotify, safeSetStatus); deployed copies in `~/.pi/agent/extensions` are refreshed by the user's VS Code task
- Bug 96 [fix/96_abort_start_clears_watch]: a stale watched PR can no longer silence the next PR watch — every end path (failed start, task end, session switch, merge/close, 4-hour limit) goes through `endWatch()`, which stops polling and drops the watched PR, so the next `[PR N CREATED]` marker always arms a watch
- Feature 35.2 [feat/35_2_esc_credential_prompts]: credential prompts in `git_common.sh` use `read_input` (ESC cancels; `setup_git_global` keeps defaults); `read_input` moved to `utils.sh` and hardened (`-r`, arrow drain, `-s` + manual echo, Ctrl-D ends input, `hidden` mode for PATs)
- Bug 61 [fix/61_tui_notify_one_line]: error notifications are folded to one short line (`oneLine()` in `_shared/common.ts`, used by `safeNotify()`), and `pullLatestMain` no longer repeats the error text (`${err}` after stderr)
- Bug 95 [fix/95_stop_pr_check_twice]: `stopPrCheckPolling()` is idempotent — it returns silently when no timer runs, so `/feature end` (via `clearCurrentTask`), `abortStart` and `session_shutdown` no longer print "Stop PR check." more than once, and starting a watch no longer prints a spurious stop first
- Bug 53 [fix/53_opencode_ctrl_c_copy]: Ctrl+C no longer exits the OpenCode TUI — `app.exit` is `<leader>q` only and `terminal.copy: "select"` copies selected text without Ctrl+C; documented in README OpenCode.md (also completes Feature 55)
- Bug 90 [fix/90_clone_dir_name]: clone_repo uses the entered "Directory name" — `local repo_url proj_dir` is declared before the reads so the input is no longer reset to the repo basename; names containing `/` or starting with `-` are rejected
- Feature 84 [feat/84_no_access_guidance]: no-access paths print the remedies (invite agent account with Write role / move to org / add owner PAT); an accepted invitation is re-checked for push permission — read-only grants clone with a warning instead of a false OK
- Feature 42 [feat/42_todo_fresh_session]: /todo now runs in a fresh session (ctx.newSession + withSession) with the initial prompt delivered as steer — no conversation-history carryover
- Bug 82 [fix/82_stay_in_menu_when_no_pat]: opening a project without a PAT record stays in the menu — the auth failure is guarded in select_project, the script no longer exits under set -e, and the message suggests "🔑 Manage GitHub credentials"
- Bug 86 [fix/86_clone_without_owner_pat]: an invited repo clones without an owner PAT — `clone_repo` falls back to the agent PAT (named `GIT_AUTH_*` codes, announced switch, bad URL/malformed PAT still fatal), and `check_repo_access` runs the invitation lookup on the `REPO_ACCESS_ERROR` path too, because a private repo with a pending invitation answers 404 until it is accepted
- Feature 75 [feat/75_pr_poller_module]: PR-review watching moved out of `todo-task.ts` into `todo-task/pr-watcher.ts` (injected deps, module-scope watch); no automated test suite is planned for it
- Bug 81 [fix/81_accept_invite]: invitation acceptance works — the HTTP outcome comes from the `gh api` exit status instead of `jq .status` on a JSON array (always `null`), invitations match `full_name` case-insensitively, the first matching id is accepted, and `clone_repo` no longer repeats the invitation lookup that `check_repo_access` already did; the agent token is kept after a successful accept and the previous one is put back otherwise
- Feature 83 [fix/83_token_switch_notice]: check_and_accept_invite announces the agent-account token it uses for the invitation lookup and reports the no-invite case; guards token-switch failure (the `jq .status` bug it depended on was fixed by Bug 81)
- Feature 35 [feat/35_menu_accept_esc]: "Select a project/action:" (and delete-project) prompt accepts ESC = Exit; `select` replaced by a raw-first-char read loop
- Feature 52.2 [feat/52_2_opencode_review_command]: OpenCode /review N command implemented
- Feature 52 [feat/52_opencode_feature_bugfix_commands]: OpenCode /feature N and /bugfix N commands implemented
- Feature 79 [feat/79_pr_created_turn_end_marker]: todo-task PR watch is armed by the agent's "[PR N CREATED]" turn_end marker (verified via gh pr view) instead of eagerly at task start; /pr stays as manual arming
- Feature 58 [fix/61_terminal_title_v2]: terminal title ported to the OpenCode v2 TUI plugin API — shows ⏳ while the active session runs and 🖐️ when idle; built-in title disabled in `cli.json`
- Bug 70 [obsolete]: "polling never stops" is the designed `/pr` watch — the timer ends on a merged/closed PR (#129), the 4 h `PR_CHECKING_MAX_MS` safenet or `/feature end`, and `stopPrCheckPolling()` clears the 🔍 status; stopping on `agent_settled` would kill `/pr <n>` (armed with no task). The lack of automated coverage is an accepted gap (no test suite is planned), ending rules noted on Feature 71
- Bug 17 [obsolete]: the fresh-session start already runs its post-replacement work inside `withSession` with the new ctx and every send goes through `messageSender ?? pi` guarded by try/catch (`0f79d0a`, 2026-11-10); the `fix/17_stale_ctx_after_newsession` branch only logged it, never fixed it
- Bug 72 [obsolete]: `pr-review.ts` no longer polls (it is only the `/review N` command) and `todo-task.ts` owns the single `prCheckTimer`, which stops the previous one before arming — the two-pollers scenario cannot happen
- Feature 12.3 [docs/12_3_troubleshooting]: filled the empty Troubleshooting section of 'GitHub access for Agent.md' with the symptom → cause → fix table (verified against scripts) + `REPO_ACCESS_*` exit codes
