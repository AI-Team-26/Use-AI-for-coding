---
name: clean-session
description: Remove all conversation messages from the current session file, keeping only the session header. Use when the user says /clean.
---

# Clean session skill

## What it does

Reads the current session `.jsonl` file, preserves the **session header** (first line — session ID, timestamp, working directory), and removes **all subsequent messages** (user queries, assistant replies, tool calls, model changes, etc.).

After restarting `pi`, you get a clean, empty conversation context while keeping the same session identity.

## Why not truncate to zero?

Truncating the entire file removes the session header too, which can confuse pi. This skill preserves the header so the session remains valid.

## Usage

```bash
python3 clean.py
```

Then exit `pi` and restart it.