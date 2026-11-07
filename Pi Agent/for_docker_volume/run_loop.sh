#!/usr/bin/env bash
# Agent loop driver: runs headless Pi sessions ("pi -p") until work is done.
# Usage: /scripts/run_loop.sh <project_dir> [iteration_cap]
# Prompt: default below, overridable by LOOP_PROMPT.md in the project root.
set -u
DIR=${1:?Usage: run_loop.sh <project_dir> [iteration_cap]}
CAP=${2:-20}
cd "$DIR" || { echo "Cannot cd to $DIR" >&2; exit 1; }
[[ -d .git ]] || { echo "Not a git repository: $(pwd)" >&2; exit 1; }
[[ -f TODO.md ]] || { echo "TODO.md not found in $(pwd)." >&2; exit 1; }

# Single-instance guard: refuse to start if another driver already holds the lock.
if command -v flock >/dev/null; then
    exec 9>"$DIR/.loop.lock"
    flock -n 9 || { echo "Another loop is already running for $DIR (lock held). Aborting." >&2; exit 1; }
else
    echo "WARNING: flock not found; single-instance guard disabled" >&2
fi

DEFAULT_PROMPT='Read TODO.md. Do the NEXT unchecked step under In Progress (only ONE step).
        After implementing, run ./verify.sh if it exists — fix failures before finishing.
        If your step added verifiable behavior, ADD its check to verify.sh (create it if missing); never remove existing checks.
        Mark the step [x] with a one-line note in TODO.md, commit, and push.
        If blocked after one honest attempt: write "BLOCKED: <reason>" in the Notes section of TODO.md, commit, and stop.'
PROMPT=$( [[ -f LOOP_PROMPT.md ]] && cat LOOP_PROMPT.md || printf '%s' "$DEFAULT_PROMPT" )

BACKOFF=${LOOP_BACKOFF:-60}
i=0
fails=0
while :; do
    # Operator stop flag (created by /loop-stop); consumed on sight
    [[ -f .LOOP_STOP ]] && { echo "STOP requested (.LOOP_STOP found)"; rm -f .LOOP_STOP; break; }
    sed -n '/^# In Progress/,/^# Backlog/p' TODO.md | grep -q '\[ \]' || { echo "ALL STEPS DONE"; break; }
    # Real marker = a line starting with BLOCKED: (doc mentions mid-sentence must not trigger)
    grep -Eq '^[[:space:]]*([-*+>][[:space:]]+)?BLOCKED:' TODO.md && { echo "STOPPED: BLOCKED marker found in TODO.md"; break; }
    [ "$i" -ge "$CAP" ] && { echo "ITERATION CAP ($CAP) REACHED"; break; }
    echo ""
    echo "=================== iteration $((i+1))/$CAP ==================="
    i=$((i+1))
    head_before=$(git rev-parse HEAD 2>/dev/null || true)
    iter_out=$(mktemp)
    pi -p "$PROMPT" 2>&1 | tee "$iter_out"
    rc=${PIPESTATUS[0]}
    head_after=$(git rev-parse HEAD 2>/dev/null || true)
    if [ -n "$head_before" ] && [ "$head_after" != "$head_before" ]; then
        rm -f "$iter_out"; fails=0; continue
    fi
    # No new commit this iteration — possible provider error or stalled worker
    fails=$((fails+1))
    if grep -qE '"(code|status)[":]+ *(4[0-9]{2}|5[0-9]{2})' "$iter_out" || [ "$rc" -ne 0 ]; then
        echo "[driver] error detected (rc=$rc); backing off ${BACKOFF}s (consecutive failures: $fails)"
    else
        echo "[driver] no commit produced; continuing (consecutive no-progress: $fails)"
    fi
    rm -f "$iter_out"
    [ "$fails" -ge 3 ] && { echo "ABORT: $fails consecutive iterations without a new commit"; break; }
    sleep "$BACKOFF"
done

echo ""
echo "Loop finished after $i iteration(s)."
echo "Remaining unchecked steps in In Progress: $(sed -n '/^# In Progress/,/^# Backlog/p' TODO.md | grep -c '\[ \]')"
