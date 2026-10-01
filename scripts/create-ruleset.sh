#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# create-ruleset.sh — Apply the "main branch" ruleset to any repo
# ============================================================
# Usage:
#   bash scripts/create-ruleset.sh owner/repo [owner/repo ...]
#   echo "owner/repo" | bash scripts/create-ruleset.sh
#   cat repos.txt | bash scripts/create-ruleset.sh
#
# Optionally: pass --dry-run to preview without creating.
#
# Uses the same PAT as git_common.sh (~/scripts/github_pat).
# Handles GitHub's 307 redirect on POST by using curl -L.
# ============================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true && shift

# Get PAT for curl authentication
GITHUB_TOKEN="$(gh auth token 2>/dev/null)"
if [[ -z "$GITHUB_TOKEN" ]]; then
    echo -e "${RED}❌ Not authenticated with gh. Run 'gh auth login' first.${NC}"
    exit 1
fi

# --- Build the ruleset JSON payload ---
# Matches the "main branch" ruleset pattern.
# conditions.ref_name.include ["~DEFAULT_BRANCH"] targets the default branch.
RULESET_PAYLOAD='{
  "name": "main branch",
  "target": "branch",
  "source_type": "Repository",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "require_extra_approval_for_unattributed_changes": true,
        "dismissal_restriction": {
          "enabled": false,
          "allowed_actors": []
        },
        "required_reviewers": [],
        "allowed_merge_methods": ["merge", "rebase"]
      }
    },
    {
      "type": "copilot_code_review",
      "parameters": {
        "review_on_push": true,
        "review_draft_pull_requests": false
      }
    }
  ]
}'

process_repo() {
    local repo="$1"  # format: owner/repo

    # Check if ruleset already exists (by name)
    local existing_name
    existing_name=$(gh api "/repos/${repo}/rulesets" 2>/dev/null | jq -r '.[].name' 2>/dev/null || echo "")

    if echo "$existing_name" | grep -q "^main branch$"; then
        echo -e "${YELLOW}⊘  ${repo} — ruleset already exists, skipping${NC}"
        return 0
    fi

    if $DRY_RUN; then
        echo -e "${GREEN}DRY RUN${NC} — would create ruleset on ${repo}"
        return 0
    fi

    echo -e "→  Creating ruleset on ${repo} ..."

    # GitHub redirects POST /repos/{owner}/{repo}/rulesets → /repositories/{id}/rulesets
    # gh api doesn't follow redirects for POST, so use curl -L
    local response
    response=$(echo "$RULESET_PAYLOAD" | curl -s -L -X POST \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Content-Type: application/json" \
        --data @- \
        "https://api.github.com/repos/${repo}/rulesets" \
        2>&1)

    local status=$(echo "$response" | jq -r '.name // .message // "unknown"' 2>/dev/null)

    if echo "$response" | jq -e '.id' >/dev/null 2>&1; then
        echo -e "${GREEN}✓  Created: ${status}${NC}"
    else
        echo -e "${RED}❌  Failed on ${repo}: ${status}${NC}"
        return 1
    fi
}

# --- Main ---

# If repos are passed as args, use them; otherwise read from stdin
if [[ $# -gt 0 ]]; then
    for repo in "$@"; do
        process_repo "$repo"
    done
else
    while IFS= read -r repo; do
        [[ -z "$repo" || "$repo" =~ ^# ]] && continue
        process_repo "$repo"
    done
fi
