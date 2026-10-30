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

TODO.md content (latest from main, falls back to local):

!`git fetch origin main && git show origin/main:TODO.md || cat TODO.md`
