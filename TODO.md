# TODO

Last feature number: 26
Last bug: 5

## Backlog

- Feature 27.1: investigate new pi extension to replace this built-in footer:
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
- Bug 6: the /new extension doesn't work. The default model was set again. Maybe we can add a notification, so we try to debug.
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
- Feature 10: add a single extension to show current GIT repo as <owner>/<repo> (<branch>) with owner/repo in different colors
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

