---
description: Implement Feature N from the TODO backlog (branch + PR)
subagent: true
---

If no number was provided, reply with the usage `/feature <N> [note]` and do nothing else.

Otherwise, implement **Feature $1** of this repository.

- Number: `$1` (may include sub-numbers, e.g. `27.1`)
- Optional user note: `$2` (extra context or constraints for the task)

TODO.md content (latest from main, falls back to local):

!`git fetch origin main && git show origin/main:TODO.md || cat TODO.md`

Steps:
1. Check for duplicate work first: run `gh pr list --state open --json number,title,headRefName,labels`. If an open PR already covers Feature $1 and it is not yours, stop and report that PR instead of starting a new branch.
2. Find the `Feature $1` entry in the Backlog above and read its full description. Match the number exactly as a token followed by `|`, `:` or `.` (sub-numbers allowed, e.g. `27.1`) — never match `Feature-old N`, and never prefix-match (`5` must not hit `Feature 52`).
   If the entry does not exist, or is marked SUSPENDED/BLOCKED/DONE, stop and report it instead of guessing.
3. Invoking this command counts as approval to start; follow AGENTS.md and implement it: create a new branch (`feat/<N>_<short_name>`), make the changes, open a PR with a short description, remove the task from the Backlog and add a Done line in TODO.md. Sign any comments you post with your own agent name.
4. **IMPORTANT**: after you publish the PR, include "[PR N CREATED]" (replace N with the PR number) in the response.
5. **Simplify, don't pile on code**
  - A good fix makes the wrong state impossible, not adds a check that cleans it up later.
    Ask "can this state exist at all?" before "how do I clean it up?".
  - Before adding a function, call, or flag: can an existing one absorb the job?
    Two calls always used together are one function. Merge them.
  - Prefer changing what a function does over adding a second function beside it.
    Updating its callers and doc comment is part of the task, not extra scope.
  - Removing lines is a valid fix. If your change only adds code, stop once and look for a design that removes the problem instead.
  - Write the line delta (+N/−M) in the PR description. If it only grows, say in one sentence why shrinking was not possible.
  - Simplify only the code the task touches. No drive-by refactors.
