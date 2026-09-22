# TODO

## Backlog

- Bug: feature extension error:
   Extension "/root/.pi/agent/extensions/feature-timer.ts" error: pi is not defined

- Feature: add a single extension to show current GIT repo as <owner>/<repo> (<branch>) with owner/repo in different colors

- Select the Pi container should show the Agent name and icon (ai-start script)

- Complete the documentation for GIT and GitHub setup

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

- 5 proxy bridge to start requested model on llama-server
  step 1: the script that used defined model in the models_configuration,json
  step 2: proxy that intercepts the request and start the server with the new model.

- 3 https://pi.dev/packages/pi-voice-stt

- 3 [Qwen Code huge initial context] document the problem properly an study possible solutions

- 1 Organize Qwen Code settings to use different providers, if possible
- 1 Try SmallCode tool: https://github.com/Doorman11991/smallcode IF IT IS WORTH

- In the menu of existing projects format the record for the projects to show:
  + folder icon
  + Name/Folder 
  + Private/Public repo (if is a repo)
  + Repo account (if is a repo)
  + "not a GIT repo" if it is not a repo


