 #!/usr/bin/env python3
import os
import sys

# The agent stores the session in a JSON file in ~/.pi/agent/sessions/<session_id>.json
SESSION_DIR = os.path.expanduser("~/.pi/agent/sessions")

def delete_current_session():
    # The current session id is passed as an env var by the agent runtime
    session_id = os.getenv("PI_SESSION_ID")
    if not session_id:
        print("No active session found.")
        return

    session_file = os.path.join(SESSION_DIR, f"{session_id}.json")
    if os.path.exists(session_file):
        os.remove(session_file)
        print(f"Session {session_id} deleted.")
    else:
        print(f"Session file {session_file} not found.")

    # Tell the agent to start a new session
        # (the agent runtime will automatically create a new session after the skill exits)
        sys.exit(0)

if __name__ == "__main__":
    delete_current_session()