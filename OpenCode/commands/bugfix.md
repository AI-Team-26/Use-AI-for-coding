---
description: Fix Bug N from the TODO backlog (fresh session, branch + PR)
subagent: true
---

Fix **Bug $1** of this repository.

Arguments passed: `$ARGUMENTS`
- First argument = bug number (may include sub-numbers, e.g. `27.1`). If no number was given, ask which bug to fix.
- Any remaining text is an optional user note: extra context or constraints for the task.

TODO.md content (latest from main, falls back to local):

!`git fetch origin main && git show origin/main:TODO.md || cat TODO.md`

Steps:
1. Find the `Bug $1` entry in the Backlog above (match sub-numbered variants too) and read its full description.
   If the entry does not exist, or is marked SUSPENDED/BLOCKED/DONE, stop and report it instead of guessing.
2. Follow AGENTS.md and implement the fix: create a new branch (`fix/<N>_<short_name>`), make the changes, open a PR with a short description, and remove the task from the Backlog in the PR.

Do nothing beyond that: no timing or status tracking, no reports, no completion markers, no PR polling, no completion handling.
