---
description: Implement Bug N (incl. sub-numbers) from TODO. Clean/fresh session if possible (no history carry-over). Follow AGENTS.md for branch+PR only.
---

Read the task for "Bug $ARGUMENTS" (supports sub-numbers e.g. 36 or 64) from the latest TODO.md.

Latest TODO.md content:

!`git fetch origin main && git show origin/main:TODO.md || cat TODO.md`

Implement that exact task.

Follow AGENTS.md to the letter: create branch (use numeric prefix e.g. fix/36_...), implement following small-steps protocol, open PR, update the TODO backlog entry. Sign as 🍊 Pi Orange.

If $ARGUMENTS contains extra note after the number, treat it as additional context for the task.
