---
description: Show TODO.md backlog as a table
---

Read the TODO.md file and show all the Features and Bugs of the TODO backlog in a simple table.

Use these icons to identify the tasks:
🟢 Feature (backlog, available),
🐞 Bug (backlog),
⏳ In progress (open PR),
⏸️ Suspended,
🔴 Blocked (dependency unmet),
❌ Dropped/rejected,
📋 Epic (group header).

Show the Feature and Bug number clearly (`Feature N`, `Bug N`).
Show only relevant data, don't show info that are not useful (like done things).
Suggest to use `/feature <N> [note]` or `/bugfix <N> [note]` to start a task.

Fetch the latest TODO.md from origin/main (read-only, no branch switch):

!`git fetch origin main && git show origin/main:TODO.md`

After showing the table, do a summary of the TODO and propose the next step. Show the links of open PRs, if there are.
