#!/usr/bin/env bash
# gh_app_token.sh — print a GitHub App installation token on stdout (valid 1 h).
#
#   GH_TOKEN="$(scripts/gh_app_token.sh)" gh pr review 104 --approve -b "✅ by 🥝 Pi Kiwi"
#   scripts/gh_app_token.sh --check          # print the bot identity it resolves to
#
# Env:
#   GITHUB_APP_ID               App ID (numeric)                [required]
#   GITHUB_APP_PEM_FILE         path to the .pem private key    [required]
#   GITHUB_APP_INSTALLATION_ID  installation ID                 [optional, looked up if unset]
#   GITHUB_AGENT_ORG            org the App is installed on     [optional, used for the lookup]

set -euo pipefail

: "${GITHUB_APP_ID:?GITHUB_APP_ID is not set}"
: "${GITHUB_APP_PEM_FILE:?GITHUB_APP_PEM_FILE is not set}"
[[ -r "$GITHUB_APP_PEM_FILE" ]] || { echo "⛔ Cannot read $GITHUB_APP_PEM" >&2; exit 1; }

b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }

# JWT: iat backdated 60 s for clock skew, exp 9 min (GitHub max is 10 min)
now=$(date +%s)
header=$(printf '{"alg":"RS256","typ":"JWT"}' | b64url)
payload=$(printf '{"iat":%d,"exp":%d,"iss":"%s"}' "$((now - 60))" "$((now + 540))" "$GITHUB_APP_ID" | b64url)
signature=$(printf '%s.%s' "$header" "$payload" | openssl dgst -sha256 -sign "$GITHUB_APP_PEM" -binary | b64url)
jwt="$header.$payload.$signature"

call() {
    curl -sS --max-time 15 \
        -H "Authorization: Bearer $jwt" \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "https://api.github.com$@"
}

fail() { echo "⛔ $*" >&2; exit 1; }

installation_id="${GITHUB_APP_INSTALLATION_ID:-}"
if [[ -z "$installation_id" ]]; then
    list=$(call /app/installations)
    grep -q '"message"' <<<"$list" && fail "App API rejected the key: $(jq -r .message <<<"$list")"

    if [[ -n "${GITHUB_AGENT_ORG:-}" ]]; then
        installation_id=$(jq -r --arg o "$GITHUB_AGENT_ORG" '.[] | select(.account.login == $o) | .id' <<<"$list" | head -1)
        [[ -n "$installation_id" ]] || fail "The App is not installed on '$GITHUB_AGENT_ORG'. Install it, or set GITHUB_APP_INSTALLATION_ID."
    else
        count=$(jq length <<<"$list")
        [[ "$count" == "1" ]] || fail "App has $count installations ($(jq -r '[.[].account.login] | join(", ")' <<<"$list")). Set GITHUB_AGENT_ORG or GITHUB_APP_INSTALLATION_ID."
        installation_id=$(jq -r '.[0].id' <<<"$list")
    fi
fi

token=$(curl -sS --max-time 15 -X POST \
    -H "Authorization: Bearer $jwt" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/app/installations/$installation_id/access_tokens" | jq -r '.token // empty')

[[ -n "$token" ]] || fail "Could not mint a token for installation $installation_id (is the installation suspended?)"

if [[ "${1:-}" == "--check" ]]; then
    login=$(curl -sS --max-time 15 -H "Authorization: Bearer $token" https://api.github.com/user | jq -r '.login // "unknown"')
    echo "✅ installation $installation_id → acting as '$login'" >&2
fi

printf '%s\n' "$token"