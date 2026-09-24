# Extensions


- [pi-token-speed](https://github.com/gsanhueza/pi-token-speed)
  ``pi install https://github.com/gsanhueza/pi-token-speed``
  Displays tokens-per-second (tok/s) in the footer with colored text reflecting high or low speed. 

- [pi-status](https://github.com/AI-Team-26/pi-status)
  ``pi install npm:pi-idle``
  Fork of [pi-idle](https://github.com/ZoRDoK/pi-idle)
  Shows a ✓ checkmark in the terminal title when Pi is idle and displays a spinner while Pi is actively working.
  It also show the agent name first character (emoji) in the title bar.

- [pi-llama-cpp-stats](https://pi.dev/packages/pi-llama-cpp-stats)
  ``pi install npm:pi-llama-cpp-stats``
  Shows a progress bar and and estimation of duration when llama.cpp is "Prefilling".

- agent-name
  Show the Agent name (from env Pi_AGENT_NAME) in the footer

- git-info
  Show the current Git repository as `<owner>/<repo> (<branch>)` in the footer,
  with the owner and the repo name rendered in different colors.
  Falls back to branch-only display when the remote cannot be resolved (a warning is shown).

- todo
  Add the `/todo` command that shows the TODO.md file on hte UI and ask the agent to check it ans propose the next step.
  Before reading, it runs `git checkout main && git pull` so the shown backlog is always loaded from a fresh main branch.
  It also ask the Agent to look for unfinished jobs and open PRs.
  
- todo-feature
  ASk the agent to implements a feature from the TODO backlog and measures elapsed time.
  Usage: `/feature <number>` — starts implementing feature N (float numeration supported, e.g. `/feature 7.1`).
  Runs `git checkout main && git pull` before the agent starts.
  Writes START/END timestamps and elapsed minutes to `~/.pi/agent/feature-times/feature_<N>.txt`.
  Also tracks model name and token usage.
  Injects follow-up message to write timing into the PR.
  Completion marker: `[FEATURE N COMPLETED]`