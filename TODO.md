# TODO

## Backlog

- Feature 21: agent get confused when another agent with same GH account leave comments/reviews:
  From agent thinking: " Hmm, that issue comment is by alex-cyber-75 (my own account?) saying "Review from 🍊 Pi Orange"?? Weird, but whatever. "
  Add to the AGENTS.md the fact that the GH account is shared between multiple agents, so there are possibly reviews as comments in the PR.

- Feature 20: the /quit command exit Pi completely, ok.
  There is a simple way to switch project instead ? Investigate.

- Feature 17: the feature-timer extension should add a retry-function (every 15-30 seconds) that check if the user reviewed the PR (Accepted or Rejected)

- Feature 11: 
  todo-feature: it should show teh elapsed time (00:00) and update the status every 15 or 30 seconds,

- Feature 10: add a single extension to show current GIT repo as <owner>/<repo> (<branch>) with owner/repo in different colors

- Feature 13: Select the Pi container should show the Agent name and icon (ai-start script)

- Feature 12: Complete the documentation for GIT and GitHub setup

- Feature 16: todo-feature extension should work also with bugs

- 🐞 Bug 2: GIT token for not-owned repositories.
  Currently, when you open a project where the repository is not-owned, it presents a message like this: 
  "❌ Git credentials record for <an-account>/<a project> not found"
  "Do you want to set the GIT credentials for "an-account" (do you have the PAT)? [Yy]es / [N]o"

  I reply "No" and this is the next message: 
  The "default" account GIT credentials will be used, this works iif you are a colalborator of the repo

- POC 1: https://pi.dev/packages/pi-voice-stt

- POC 2: Try SmallCode tool: https://github.com/Doorman11991/smallcode IF IT IS WORTH

## Backlog - Pending

- Feature 8: [TBD - clarification needed from user]
