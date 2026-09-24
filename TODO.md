# TODO

Last feature number: 28
Last bug: 

## Backlog
- Bug 8: git-infoxtension cause Pi to crash
  ```
  pi exiting due to uncaughtException:
Error: This extension ctx is stale after session replacement or reload. Do not use a captured pi or command ctx after ctx.newSession(), ctx.fork(), ctx.switchSession(), or ctx.reload(). For newSession, fork, and switchSession, move post-replacement work into withSession and use the ctx passed to withSession. For reload, do not use the old ctx after await ctx.reload().
    at ExtensionRunner.assertActive (file:///usr/lib/node_modules/@earendil-works/pi-coding-agent/dist/bundle/chunks/chunk-OJP47DM6.js:656:12257)
    at get ui (file:///usr/lib/node_modules/@earendil-works/pi-coding-agent/dist/bundle/chunks/chunk-OJP47DM6.js:656:14246)
    at Timeout.refresh [as _onTimeout] (/root/.pi/agent/extensions/git-info.ts:84:13)
    at listOnTimeout (node:internal/timers:685:17)
    at process.processTimers (node:internal/timers:618:7)

A stack frame came from loaded extension `/root/.pi/agent/extensions/git-info.ts`, which may be involved. Try disabling it with `pi config`, or run `pi -ne` to confirm.

To report this crash: run `pi -r` to resume the session, then run /bug. The crash details are attached automatically.
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
- Bug 6: the /new extension doesn't work. The default model was set again. Maybe we can add a notification, so we try to debug.
  [update]
  Collected info from logs/notify:
  ``` 
  🔍 /new: Loaded saved model Llama.cpp/64K

  Error: 🔍 /new: Could not find model Llama.cpp/64K in registry

  ✓ New session started
  ``` 

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