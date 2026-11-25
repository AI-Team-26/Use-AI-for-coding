#!/usr/bin/env bash
# Tests for the clone menu in start_common.sh (select_org_repo / clone_repo).
# Runs the repo copies of the scripts with gh, check_repo_access and start_project
# stubbed out: no network, no real clone. Run: bash scripts/tests/test_clone_menu.sh
set -uo pipefail
repo=$(cd "$(dirname "$0")/../.." && pwd)
tmp=$(mktemp -d)
mkdir -p "$tmp/projects/ExistingRepo"

# Rewrite the container paths (/scripts/...) to the repo copies.
sed "s|source /scripts/utils.sh|source $repo/scripts/utils.sh|; s|github_pat_file=\"/scripts/github_pat\"|github_pat_file=\"$tmp/github_pat\"|" \
    "$repo/scripts/git_common.sh" > "$tmp/git_common.sh"
sed "s|^source /scripts/git_common.sh|source $tmp/git_common.sh|" "$repo/scripts/start_common.sh" > "$tmp/start_common.sh"

export GITHUB_AGENT_ACCOUNT=agent-account GITHUB_COMMIT_EMAIL=x@y.z GITHUB_ORG=TestOrg
printf 'TestOrg:ghp_fakeorgpat\nagent-account:ghp_fakeagentpat\n' > "$tmp/github_pat"
source "$tmp/start_common.sh"
project_folder="$tmp/projects"

API_FAIL=0
API_EMPTY=0
gh() {
    if [[ "$1" == "api" && "$2" == "--paginate" ]]; then
        (( API_FAIL )) && return 1
        (( API_EMPTY )) && return 0
        printf '%s\n' repo-z alpha ExistingRepo
        return 0
    fi
    if [[ "$1" == "repo" && "$2" == "clone" ]]; then
        echo "CLONE_CALLED url=$3 dir=$4"
        mkdir -p "$4"
        return 0
    fi
    echo "UNEXPECTED_GH_CALL: $*" >&2
    return 1
}
check_repo_access() { return "$REPO_ACCESS_OK"; }
start_project() { echo "START_PROJECT $1"; }

pass=0; fail=0
check() { # check <name> <expect-present> <expect-absent> <output>
    local name=$1 present=$2 absent=$3 out=$4 ok=1
    [[ -n "$present" && "$out" != *"$present"* ]] && ok=0
    [[ -n "$absent" && "$out" == *"$absent"* ]] && ok=0
    if (( ok )); then echo "PASS: $name"; pass=$((pass+1)); else echo "FAIL: $name"; echo "--- output ---"; echo "$out"; echo "---"; fail=$((fail+1)); fi
}

run() { printf '%b' "$1" | clone_repo 2>&1; }

out=$(run '3\n')
check "select repo skips existing folders" "CLONE_CALLED url=https://github.com/TestOrg/repo-z.git dir=$tmp/projects/repo-z" "ExistingRepo" "$out"
check "selected repo starts project" "START_PROJECT repo-z" "" "$out"

out=$(run '1\nhttps://github.com/other/proj.git\n\n')
check "manual item keeps URL input" "CLONE_CALLED url=https://github.com/other/proj.git dir=$tmp/projects/proj" "" "$out"

out=$(run '\e')
check "ESC cancels" "(cancelled)" "CLONE_CALLED" "$out"

out=$(run '4\n')
check "Exit item cancels" "(cancelled)" "CLONE_CALLED" "$out"
check "Exit item shown" "❌ Exit" "" "$out"

API_EMPTY=1
out=$(run '\n')
check "empty org listing message" "No repositories found for 'TestOrg'" "already in" "$out"
API_EMPTY=0

out=$(run '')
check "EOF cancels without loop" "(cancelled)" "CLONE_CALLED" "$out"

out=$(run '9\n2\n')
check "invalid then valid selection" "CLONE_CALLED url=https://github.com/TestOrg/alpha.git" "" "$out"
check "invalid selection warns" "Invalid selection" "" "$out"

API_FAIL=1
out=$(run 'https://github.com/other/proj.git\ncustomdir\n')
check "API failure falls back to manual" "Cannot list the repositories" "" "$out"
check "API failure manual clone works" "CLONE_CALLED url=https://github.com/other/proj.git dir=$tmp/projects/customdir" "" "$out"
API_FAIL=0

mkdir -p "$tmp/projects/alpha" "$tmp/projects/repo-z"
out=$(run '\n')
check "all cloned falls back to manual" "All repositories of 'TestOrg' are already" "" "$out"
check "all cloned then empty URL cancels" "(cancelled)" "CLONE_CALLED" "$out"
rm -rf "$tmp/projects/alpha" "$tmp/projects/repo-z"

out=$(GITHUB_ORG=NoPatOrg run 'https://github.com/other/proj3.git\n\n')
check "missing org PAT explains skipped menu" "Enter the URL manually" "" "$out"
check "missing org PAT manual clone works" "CLONE_CALLED url=https://github.com/other/proj3.git" "" "$out"

rc=0
out=$(GITHUB_ORG= select_org_repo 2>&1) || rc=$?
[[ $rc -eq 1 && -z "$out" ]] && { echo "PASS: empty GITHUB_ORG returns quietly"; pass=$((pass+1)); } || { echo "FAIL: empty GITHUB_ORG (rc=$rc)"; fail=$((fail+1)); }

unset GITHUB_ORG
out=$(run 'https://github.com/other/proj2.git\n\n')
check "no GITHUB_ORG keeps old manual flow" "CLONE_CALLED url=https://github.com/other/proj2.git" "Repositories of" "$out"
export GITHUB_ORG=TestOrg

# set_github_auth_for_repo still behaves as before (delegates to owner helper)
rc=0
set_github_auth_for_repo "https://github.com/TestOrg/repo-z.git" > "$tmp/auth.out" 2>&1 || rc=$?
check "repo auth still sets org token" "set for" "" "$(cat "$tmp/auth.out")"
[[ $rc -eq $GIT_AUTH_OK && "$GITHUB_TOKEN" == "ghp_fakeorgpat" ]] && { echo "PASS: repo auth token value"; pass=$((pass+1)); } || { echo "FAIL: repo auth token value"; fail=$((fail+1)); }
rc=0
set_github_auth_for_repo "https://github.com/unknown/repo.git" > "$tmp/auth.out" 2>&1 || rc=$?
[[ $rc -eq $GIT_AUTH_NO_OWNER_PAT ]] && { echo "PASS: missing owner PAT code kept"; pass=$((pass+1)); } || { echo "FAIL: missing owner PAT code kept (rc=$rc)"; fail=$((fail+1)); }
check "missing PAT: one neutral message" "No PAT record for owner 'unknown'" "Failed to get PAT" "$(cat "$tmp/auth.out")"

echo "=== $pass passed, $fail failed ==="
rm -rf "$tmp"
exit $(( fail > 0 ))
