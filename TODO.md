# TODO

Last feature number: 29
Last bug: 10

## Backlog

- Feature 29: audit all pi extensions for stale-ctx usage (same crash class as Bug 8)
  Any extension that captures `ctx` and uses it later — in timer callbacks
  (`setInterval`/`setTimeout`) or after an `await` — can crash Pi with
  uncaughtException after newSession/fork/switch/reload (stale ctx throws on any use).
  Fix pattern (see merged PR #30): track latest ctx from `session_start`/`agent_settled`,
  try/catch around `ctx.ui.*` calls made from timers, clear intervals on
  `session_shutdown` (NOT `"session_end"` — that event does not exist).
  Known suspect: `todo-feature.ts` — `statusTimer` (~line 113) and `pollTimer`
  (~line 239) both capture ctx; check `checkPrReview` too.

- Bug 11: "/bug" is a reserved command, use something else for todo-feature
  ```
  [Extension issues]
  auto (user) ~/.pi/agent/extensions/todo-feature.ts
    Extension command '/bug' conflicts with built-in interactive command. Skipping in autocomplete.

   🔍 /new: Model restored successfully
  ✓ New session started
  ```

- Bug 10: todo-feature extension fails to update main branch
  ```
   Error: ❌ Git update failed: Already on 'main'
 hint: You have divergent branches and need to specify how to reconcile them.
 hint: You can do so by running one of the following commands sometime before
 hint: your next pull:
 hint:
 hint:   git config pull.rebase false  # merge
 hint:   git config pull.rebase true   # rebase
 hint:   git config pull.ff only       # fast-forward only
 hint:
 hint: You can replace "git config" with "git config --global" to set a default
 hint: preference for all repositories. You can also pass --rebase, --no-rebase,
 hint: or --ff-only on the command line to override the configured default per
 hint: invocation.
 fatal: Need to specify how to reconcile divergent branches.
 ```

- Feature 28: todoextension should accept an optional note.
  `/feature 10 ignore existing PR` should add "ignore exising PR" before the currently sent message to the prompt.
 `/feature 10 "ignore existing PR"` should work the same.
- Bug 7: todo-feature extension
  I see this notify in the chat:
  "⏸️ Stopped watching for PR review (2h limit reached)."
  But the Feature is still shown in the status and gets updated (the ttime).
  I've tarted a new feature, it reset the Featureand creatd a new one... but after a few miutes I see this:
  "⏸️ Stopped watching for PR review (2h limit reached)." 
  It seems that starting the new feture hasn't reset the 2h timer !!
  Also, the message shold saywhichPR it refers to !
- Feature 27.1: investigate a new pi extension to replace this built-in footer:
  ``/projects/Use-AI-for-coding (main)`` that is <folder>/<GIT branch> all printed in dark gray with this:
  ``Use-AI-for-coding`` in bright yellow removing the default prefix "/projects/"
  Also the branch is useless since it is printed in another extension.
  Investigate the built-in Pi footer (footer section) and write a document. It will be the base for the new extension.
- Feature 27.2: new pi extension to replace built-in footer described in Feature 27: implementation
- Feature 25: todo-feature extension, unify the Agent report:
  ```
  # Feature execution report 
  (first push only, without following reviews rework)
  Time required: 2.0 minutes 
  Model used: Llama.cpp/Qwen3.8-27B-ASCII-Condensed-IQ4_XS-3_troed_64k
  Tokens used: 8797
  ```

- Feature 24: investigate and document how the /new command of Pi cleanup  the session. It will be usefull to reuse the same mechanism in custom extensions
- Bug 5: todo-feature extension
  " Extension "<runtime>" error: Agent is already processing. Specify streamingBehavior ('steer' or 'followUp') to queue the message."
  This error apepared after a review was done.
  (2026-09-28 still relevant?)
- Feature 20: the /quit command exit Pi completely, ok.
  There is a simple way to switch project instead ? Investigate.
- Feature 18: todo-feature extension review watcher stop should add PR link to the message
  "⏸️ Stopped watching for PR review (2h limit reached)." Add "Waiting for the review of PR #NN (<PR link>)".
- Feature 19: todo-feature extension notified teh stop of review watch after 2 hous but the feature was still active
  How is possible the review is active ("Feature N" is shown in hte status) and there is a review watcher running?
  If the review watcher is running it means the agent_settled was triggered and the feature was updated ?!
  That trigger also "ends" the timer and calculate the elapsed dime for hte feature/task. At least that is the desired logic, no?
- Feature 13: Select the Pi container should show the Agent name and icon (ai-start script)
- Feature 12: Complete the documentation for GIT and GitHub setup
- Feature 16: todo-feature extension should work also with bugs
- Feature 22: GIT credentials for not-owned repositories (replaces the obsolete Bug 2).
  The old interactive prompt ("Do you want to set the GIT credentials ... [Yy]es / [N]o") was removed by a refactor,
  but two issues remain in scripts/git_common.sh and scripts/start_common.sh:
  1. clone_repo ignores the failure of set_github_auth_for_repo and the invite-acceptance path silently switches
     GITHUB_TOKEN to the default agent account (the old "works if you are a collaborator" fallback, now implicit
     and not communicated to the user).
  2. Opening a not-owned project without a PAT record for its owner aborts with a terse error that does not
     suggest the remedy: add the owner's PAT via "🔑 Manage GitHub credentials" and retry.
- Feature 26: https://pi.dev/packages/pi-voice-stt tp add voice commands to Pi

## Latest 10 tasks completed
- Bug 1 [bug/1_aaa]: Aaa (just an example)
- Feature 8 [feat/8_aaa]: Aaa (just an example)
