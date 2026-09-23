# TODO

## Backlog

- Feature 14: todo-feature command extension should work with float feature numeration (Feature 7, Feature 7.1, Feature 7.2)

- Feature 15: todo extension should move to main branch (copy the command from the todo-feature extension)

- Feature 11: 
  todo-feature: it should show teh elapsed time (00:00) and update the status every 15 or 30 seconds,

- Feature 10: add a single extension to show current GIT repo as <owner>/<repo> (<branch>) with owner/repo in different colors

- Feature 13: Select the Pi container should show the Agent name and icon (ai-start script)

- Feature 12: Complete the documentation for GIT and GitHub setup

- 🐞 Bug 1: Delete repo does not exit the loop, after the selection it wants another selection.
  ```sh
 1) ai.models-evaluator
 2) DANGER-Autonomys-Play-Copy
 3) family-tree
 4) ❌ Exit
Select the project to delete: 3
Select the project to delete:
```

- 🐞 Bug 2: GIT token for not-owned repositories.
  Currently, when you open a project where the repository is not-owned, it presents a message like this: 
  "❌ Git credentials record for <an-account>/<a project> not found"
  "Do you want to set the GIT credentials for "an-account" (do you have the PAT)? [Yy]es / [N]o"

  I reply "No" and this is the next message: 
  The "default" account GIT credentials will be used, this works iif you are a colalborator of the repo

- 🐞 Bug 3: When "continue" and it requires project selection, it doesn't show the list !

- POC 1: https://pi.dev/packages/pi-voice-stt

- POC 2: Try SmallCode tool: https://github.com/Doorman11991/smallcode IF IT IS WORTH

