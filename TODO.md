# TODO

## In Progress

## Backlog


- "Manage GitHub credentials" has to manage the new file instead of .git-credentials

- Remove this message: "No backup found at /root/.pi_backup.tar. Skipping restore."

- Remove this message: "Replace {{PI_AGENT_NAME}} with '🥝 Pi Kiwi'"

- Complete the documentation for GIT and GitHub setup

- 🐞 GIT token for not-owned repositories.
  Currently, when you open a project where the repository is not-owned, it presents a message like this: 
  "❌ Git credentials record for <an-account>/<a project> not found"
  "Do you want to set the GIT credentials for "an-account" (do you have the PAT)? [Yy]es / [N]o"

  I reply "No" and this is the next message: 
  The "default" account GIT credentials will be used, this works iif you are a colalborator of the repo

- 🐞 When "continue" and it requires project selection, it doesn't show the list !

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

## Done

- GIT credentials can be stored in a more clear file with owner-PAT-expiration date for each record (instead of .git-credentials)
- GIT credentials (.git-credentials) has to be autorenewed with a simple script
- GIT credentials (.git-credentials) has to be autofilled with tokens from environment variable
- Show the name of current Agent in Pi shell, on title (so it is visible in the taskbar) and in the footer.
- ai-coding launch script let you choose between launching Pi (attach to main process) or open and independent shell
- ai-coding launch script can ask for list the sessions, continue last session, etc... 
- Study Pi Agent skills
- Figure out how to set Shift+Enter as new-line command in the TUI of Pi Agent
- Figure out why Pi Agent is not able to use gh due to auth not working.
- Create models script
- Test models script
- Issue: Pi/Docker guest frooze when not used for a while. Solved switching to WSL (it uses VirtioFS I think)
- Pi: Added auto-select of the current locaed model in local llama.cpp provider
- Pi web-search skill to make parallel api calls (like the knowledge-search skill)
