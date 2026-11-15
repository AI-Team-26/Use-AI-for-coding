---
description: Implement Feature N from the TODO backlog (fresh session, branch + PR)
subagent: true
---

Implement **Feature $1** of this repository.

Arguments passed: `$ARGUMENTS`
- First argument = feature number (may include sub-numbers, e.g. `27.1`). If no number was given, ask which feature to implement.
- Any remaining text is an optional user note: extra context or constraints for the task.

TODO.md content (latest from main, falls back to local):

!`git fetch origin main && git show origin/main:TODO.md || cat TODO.md`

Steps:
1. Find the `Feature $1` entry in the Backlog above (match sub-numbered variants too) and read its full description.
   If the entry does not exist, or is marked SUSPENDED/BLOCKED/DONE, stop and report it instead of guessing.
2. Follow AGENTS.md and implement it: create a new branch (`feat/<N>_<short_name>`), make the changes, open a PR with a short description, and remove the task from the Backlog in the PR.

Do nothing beyond that: no timing or status tracking, no reports, no completion markers, no PR polling, no completion handling.
