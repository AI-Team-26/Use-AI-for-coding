#!/bin/bash
# Bug 82: opening a project whose repository owner has no PAT record must not end the
# start script under `set -e`. It has to print the remedy and redraw the menu.
# The neighbour cases are covered too: a project folder with no origin remote and one with a
# remote that is not an HTTPS GitHub URL (no PAT needed) must still start.
#
# The scripts hardcode /scripts paths (they run inside the agent container), so this test
# copies them into a sandbox, rewrites those paths and drives `select_project` with canned
# menu answers. No GitHub, no Docker, no `gh` call is needed.

set -uo pipefail

tests_dir=$(cd "$(dirname "$0")" && pwd)
scripts_dir=$(cd "$tests_dir/.." && pwd)

failures=0
sandboxes=()
trap 'rm -rf "${sandboxes[@]:-}"' EXIT

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

new_sandbox() {
    local dir
    dir=$(mktemp -d)
    sandboxes+=("$dir")
    echo "$dir"
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

# add_project <sandbox> <name> [origin-url]
add_project() {
    local dir=$1 name=$2 url=${3:-}
    mkdir -p "$dir/projects/$name"
    if [[ -n "$url" ]]; then
        git -C "$dir/projects/$name" init -q
        git -C "$dir/projects/$name" remote add origin "$url"
    fi
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
        start_project() { echo "start_project called for $1 in $PWD"; }
        select_project
    ) <<< "$answers" 2>&1
}

# Menu with one project: 1 <project>, 2 Clone, 3 Create, 4 Delete, 5 Shell, 6 Manage
# credentials, 7 Exit.
run_one_project() {
    local dir=$1
    run_select_project "$dir" $'1\n7\n'
}

# --- Scenario 1: repository owner without a PAT record -----------------------
echo "Scenario 1: project whose owner has no PAT record"
sandbox1=$(new_sandbox)
make_sandbox "$sandbox1"
add_project "$sandbox1" DemoProj https://github.com/NoPatOrg/demo.git

output=$(run_one_project "$sandbox1")
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
sandbox2=$(new_sandbox)
make_sandbox "$sandbox2"
add_project "$sandbox2" PlainProj

output=$(run_one_project "$sandbox2")
status=$?

echo "--- output ---"
printf '%s\n' "$output"
echo "--- end ---"

grep -q "start_project called for PlainProj in $sandbox2/projects/PlainProj" <<< "$output"
check "start_project is called inside the project folder" $?

[[ $status -eq 0 ]]
check "select_project returns 0 for a plain folder (status=$status)" $?

# --- Scenario 3: remote that is not an HTTPS GitHub URL ----------------------
echo "Scenario 3: project with a non-GitHub remote"
sandbox3=$(new_sandbox)
make_sandbox "$sandbox3"
add_project "$sandbox3" GitLabProj https://gitlab.com/someone/project.git

output=$(run_one_project "$sandbox3")
status=$?

echo "--- output ---"
printf '%s\n' "$output"
echo "--- end ---"

grep -q "is not an HTTPS GitHub URL: GITHUB_TOKEN is left unchanged" <<< "$output"
check "warns that no token was set" $?

grep -q "start_project called for GitLabProj" <<< "$output"
check "start_project is still called" $?

[[ $status -eq 0 ]]
check "select_project returns 0 for a non-GitHub remote (status=$status)" $?

# --- Scenario 4: malformed PAT record for the owner --------------------------
echo "Scenario 4: malformed PAT record"
sandbox4=$(new_sandbox)
make_sandbox "$sandbox4"
echo "NoPatOrg:ghp_badPAT1234567890@github.com" >> "$sandbox4/github_pat"
add_project "$sandbox4" DemoProj https://github.com/NoPatOrg/demo.git

output=$(run_one_project "$sandbox4")
status=$?

echo "--- output ---"
printf '%s\n' "$output"
echo "--- end ---"

[[ $status -eq 0 ]]
check "select_project returns 0 instead of aborting (status=$status)" $?

grep -q "Cannot set the GitHub token for 'DemoProj'" <<< "$output"
check "names the malformed record" $?

grep -Fq '→ Use "🔑 Manage GitHub credentials" in the menu' <<< "$output"
check "suggests '🔑 Manage GitHub credentials'" $?

redraws=$(grep -c "1) DemoProj" <<< "$output")
[[ $redraws -eq 2 ]]
check "menu is redrawn after the failure (seen $redraws times)" $?

! grep -q "start_project called" <<< "$output"
check "start_project is not called" $?

if [[ $failures -gt 0 ]]; then
    echo "❌ $failures check(s) failed"
    exit 1
fi

echo "✅ all checks passed"
