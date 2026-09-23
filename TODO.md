# TODO

Last feature number: 23
Last bug: 5

## Backlog

- Bug 4: todo-feature extension
  The last message from agent was "[FEATURE 7.2 COMPLETED]" but the status still has "FEATURE 7.2".
  Is the "." a problem in the regex

- Bug 5: todo-feature extension
  " Extension "<runtime>" error: Agent is already processing. Specify streamingBehavior ('steer' or 'followUp') to queue the message."
  This error apepared after a review was done.

- Feature 23: /new command should maintain the selected model, not switch to the default one set in settings.json or the first one found in models.json
  This requires an investigation. Use the branch doc/8_investigate_new_command to store gathered info and possible solutions

- Feature 21: agent get confused when another agent with same GH account leave comments/reviews:
  From agent thinking: " Hmm, that issue comment is by alex-cyber-75 (my own account?) saying "Review from 🍊 Pi Orange"?? Weird, but whatever. "
  Add to the AGENTS.md the fact that the GH account is shared between multiple agents, so there are possibly reviews as comments in the PR.

- Feature 20: the /quit command exit Pi completely, ok.
  There is a simple way to switch project instead ? Investigate.

- Feature 18: todo-feature extension review watcher stop should add PR link to the message
  "⏸️ Stopped watching for PR review (2h limit reached)." Add "Waiting for the review of PR #NN (<PR link>)".

- Feature 19: todo-feature extension notified teh stop of review watch after 2 hous but the feature was still active
  How is possible the review is active ("Feature N" is shown in hte status) and there is a review watcher running?
  If the review watcher is running it means the agent_settled was triggered and the feature was updated ?!
  That trigger also "ends" the timer and calculate the elapsed dime for hte feature/task. At least that is the desired logic, no?

- Feature 11: 
  todo-feature: it should show teh elapsed time (00:00) and update the status every 15 or 30 seconds,

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

- POC 1: https://pi.dev/packages/pi-voice-stt

- POC 2: Try SmallCode tool: https://github.com/Doorman11991/smallcode IF IT IS WORTH

## Backlog - Pending

- Feature 8: [TBD - clarification needed from user]
