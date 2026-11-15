---
description: Implement Bug N (incl. sub-numbers) from TODO. Fresh subagent session (no carry-over). Follow AGENTS.md for branch+PR only.
subagent: true
---

Read the task for "Bug $ARGUMENTS" (supports sub-numbers e.g. 36 or 64) from the latest TODO.md.

Latest TODO.md content:

!`git fetch origin main && git show origin/main:TODO.md || cat TODO.md`

Implement that exact task.

The injected instructions: follow AGENTS.md to the letter — create branch (numeric prefix), make the change (small steps), open PR, update TODO backlog entry. Sign as 🍊 Pi Orange.

Do exactly that and **nothing else**:
- No timing / status / elapsed time
- No execution reports or attachments
- No [BUG N COMPLETED] markers or similar
- No PR polling, watching, /pr, /review
- No completion handling beyond the PR

If $ARGUMENTS contains extra note after the number, treat it as additional user context for the implementation.

<!-- TODO (side effect): confirm subagent: true executes the !` shell in isolated context and that the agent can still access git/gh from subagent; if not, may need alternative fresh-session approach. Also ensure "Bug" lookup works for entries like "Bug 36 | ..." -->
