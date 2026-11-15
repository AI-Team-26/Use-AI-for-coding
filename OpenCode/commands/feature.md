---
description: Implement Feature N from the TODO backlog (branch + PR)
subagent: true
---

If `$1` is empty, reply with the usage `/feature <N> [note]` and do nothing else.

Otherwise, implement **Feature $1** of this repository.

- Number: `$1` (may include sub-numbers, e.g. `27.1`)
- Optional user note: `$2` (extra context or constraints for the task)

TODO.md content (latest from main, falls back to local):

!`git fetch origin main && git show origin/main:TODO.md || cat TODO.md`

Steps:
1. Find the `Feature $1` entry in the Backlog above (match sub-numbered variants too) and read its full description.
   If the entry does not exist, or is marked SUSPENDED/BLOCKED/DONE, stop and report it instead of guessing.
2. Invoking this command counts as approval to start; follow AGENTS.md and implement it: create a new branch (`feat/<N>_<short_name>`), make the changes, open a PR with a short description, remove the task from the Backlog and add a Done line in TODO.md. Sign any comments you post with your own agent name.
