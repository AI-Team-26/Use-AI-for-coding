#!/bin/bash
# Bug 82: opening a project whose repository owner has no PAT record must not end the
# start script under `set -e`. It has to print the remedy and redraw the menu.
# Also guards the neighbour case: a project folder that is not a Git repository has no
# origin URL, so the token lookup is skipped and the project must still start.
#
# The scripts hardcode /scripts paths (they run inside the agent container), so this test
# copies them into a sandbox, rewrites those paths and drives `select_project` with canned
# menu answers. No GitHub, no Docker, no `gh` call is needed.

set -uo pipefail

tests_dir=$(cd "$(dirname "$0")" && pwd)
scripts_dir=$(cd "$tests_dir/.." && pwd)

failures=0

# Second argument is an exit status: 0 means the check passed.
check() {
    local what=$1
    if [[ "$2" -eq 0 ]]; then
        echo "  ✔️ $what"
    else
        echo "  ❌ $what"
        failures=$((failures + 1))
    fi
}

# Copies the scripts into <dir> with the container paths pointed at <dir> itself.
make_sandbox() {
    local dir=$1
    # shellcheck disable=SC2016
    sed "s|/scripts/|$dir/|g" "$scripts_dir/start_common.sh" > "$dir/start_common.sh"
    sed "s|/scripts/|$dir/|g" "$scripts_dir/git_common.sh" > "$dir/git_common.sh"
    cp "$scripts_dir/utils.sh" "$dir/utils.sh"
    # Only the agent account has a PAT: the project owner "NoPatOrg" has no record.
    echo "AgentAccount:ghp_agentPAT1234567890" > "$dir/github_pat"
    mkdir -p "$dir/projects"
}

# Runs select_project in a subshell with the given menu answers on stdin.
# The subshell keeps `set -e` (sourced with start_common.sh) away from this test.
run_select_project() {
    local dir=$1 answers=$2
    (
        export GITHUB_AGENT_ACCOUNT=AgentAccount GITHUB_COMMIT_EMAIL=agent@example.com TERM=xterm
        # shellcheck source=/dev/null
        source "$dir/start_common.sh"
        project_folder="$dir/projects"
        start_project() { echo "start_project called for $1"; }
        select_project
    ) <<< "$answers" 2>&1
}

# --- Scenario 1: repository owner without a PAT record -----------------------
echo "Scenario 1: project whose owner has no PAT record"
sandbox1=$(mktemp -d)
trap 'rm -rf "$sandbox1" "$sandbox2"' EXIT
make_sandbox "$sandbox1"
git -C "$sandbox1/projects" init -q DemoProj
git -C "$sandbox1/projects/DemoProj" remote add origin https://github.com/NoPatOrg/demo.git

# Menu with one project: 1 DemoProj, 2 Clone, 3 Create, 4 Delete, 5 Shell, 6 Manage
# credentials, 7 Exit.
output=$(run_select_project "$sandbox1" $'1\n7\n')
status=$?

echo "--- output ---"
printf '%s\n' "$output"
echo "--- end ---"

[[ $status -eq 0 ]]
check "select_project returns 0 instead of aborting (status=$status)" $?

grep -q "No PAT record for the owner of 'DemoProj'" <<< "$output"
check "names the missing PAT record" $?

grep -Fq '→ Use "🔑 Manage GitHub credentials" in the menu' <<< "$output"
check "suggests '🔑 Manage GitHub credentials'" $?

redraws=$(grep -c "1) DemoProj" <<< "$output")
[[ $redraws -eq 2 ]]
check "menu is redrawn after the failure (seen $redraws times)" $?

! grep -q "start_project called" <<< "$output"
check "start_project is not called for a project without a token" $?

# --- Scenario 2: project folder without a Git remote -------------------------
echo "Scenario 2: project folder that is not a Git repository"
sandbox2=$(mktemp -d)
make_sandbox "$sandbox2"
mkdir -p "$sandbox2/projects/PlainProj"

output=$(run_select_project "$sandbox2" $'1\n7\n')
status=$?

echo "--- output ---"
printf '%s\n' "$output"
echo "--- end ---"

grep -q "start_project called for PlainProj" <<< "$output"
check "start_project is called when there is no origin URL" $?

[[ $status -eq 0 ]]
check "select_project returns 0 for a plain folder (status=$status)" $?

if [[ $failures -gt 0 ]]; then
    echo "❌ $failures check(s) failed"
    exit 1
fi

echo "✅ all checks passed"