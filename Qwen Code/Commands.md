# Comamnds in Qwen code chat


/exit
/clear


/compress
/resume

/sumamry

/context




# Start fresh
qwen

# Continue last session
qwen --continue

# Choose which session to resume
qwen --resume

# Start/resume a named session
qwen --session my-feature-branch

# Inside session:
/clear        # Wipe chat history (stay in session)
/compress     # Summarize history to save tokens
/summary      # Generate project summary
/resume       # Load a previous session from within CLI
/exit         # Leave session (data auto-saved to ~/.qwen/sessions/)