#!/usr/bin/env python3
"""Clean-session skill: remove all messages from the current session file,
keeping only the session header so pi still recognises the session."""

import os
import glob
import json


SESSION_DIR = os.path.expanduser("~/.pi/agent/sessions")


def encode_cwd(cwd):
    """Replicate pi's session directory encoding."""
    safe = cwd.lstrip("/\\").replace("/", "-").replace("\\", "-").replace(":", "-")
    return os.path.join(SESSION_DIR, f"--{safe}--")


def main():
    project_dir = encode_cwd(os.getcwd())
    files = sorted(glob.glob(os.path.join(project_dir, "*.jsonl")), key=os.path.getmtime)

    if not files:
        print("No session file found.")
        return

    current = files[-1]

    # Read the first line (session header) and keep it
    with open(current, "r") as f:
        first_line = f.readline().strip()

    # Validate it's a session header
    try:
        header = json.loads(first_line)
        if header.get("type") != "session":
            print("Unexpected session format (first line is not a session header).")
            print("Aborting to avoid data corruption.")
            return
    except (json.JSONDecodeError, KeyError):
        print("Could not parse session header. Aborting.")
        return

    # Rewrite file with only the session header
    with open(current, "w") as f:
        f.write(first_line + "\n")

    print(f"Session cleaned: {os.path.basename(current)}")
    print("All messages removed. Session header preserved.")
    print("Exit pi and restart to begin with a clean context.")


if __name__ == "__main__":
    main()