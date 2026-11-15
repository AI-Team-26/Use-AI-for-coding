---
description: Fix Bug N from the TODO backlog (branch + PR)
subagent: true
---

If no number was provided, reply with the usage `/bugfix <N> [note]` and do nothing else.

Otherwise, fix **Bug $1** of this repository.

- Number: `$1` (may include sub-numbers, e.g. `27.1`)
- Optional user note: `$2` (extra context or constraints for the task)

TODO.md content (latest from main, falls back to local):

!`git fetch origin main && git show origin/main:TODO.md || cat TODO.md`

Steps:
1. Check for duplicate work first: run `gh pr list --state open --json number,title,headRefName,labels`. If an open PR already covers Bug $1 and it is not yours, stop and report that PR instead of starting a new branch.
2. Find the `Bug $1` entry in the Backlog above and read its full description. Match the number exactly as a token followed by `|`, `:` or `.` (sub-numbers allowed, e.g. `27.1`) — never match `Bug-old N`, and never prefix-match (`5` must not hit `Bug 52`).
   If the entry does not exist, or is marked SUSPENDED/BLOCKED/DONE, stop and report it instead of guessing.
3. Invoking this command counts as approval to start; follow AGENTS.md and implement the fix: create a new branch (`fix/<N>_<short_name>`), make the changes, open a PR with a short description, remove the task from the Backlog and add a Done line in TODO.md. Sign any comments you post with your own agent name.
