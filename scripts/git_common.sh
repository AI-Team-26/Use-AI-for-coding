source /scripts/utils.sh

required_vars GITHUB_AGENT_ACCOUNT GITHUB_COMMIT_EMAIL

github_pat_file="/scripts/github_pat"


if [[ ! -r "$github_pat_file" ]]; then
   echo -e "${RED}❌ The PAT file '${github_pat_file}' is not readable.${NC}"
   #return 1
fi

# Exit codes returned by set_github_auth_for_repo()
GIT_AUTH_OK=0
GIT_AUTH_ERROR=1
GIT_AUTH_NO_OWNER_PAT=2

# Exit codes returned by check_and_accept_invite()
INVITE_ACCEPTED=0
INVITE_ERROR=1
INVITE_NOT_FOUND=2

# A repository URL the PAT file can serve: HTTPS on github.com, not SSH and not another host.
# The trailing slash keeps hosts such as github.com.example.org out. Only the plain form that git
# writes for an HTTPS clone is accepted: an explicit port, an uppercase scheme or userinfo
# (https://<user>@github.com/...) is not supported.
is_github_https_url() {
    [[ "${1:-}" =~ ^https://github\.com/ ]]
}

# Since GIT uses GITHUB CLI authentication, we set the GITHUB_TOKEN that will be used by GitHub CLI 
# <repo_url> argument must be in format "https://github.com/account/repo.git"
# <missing_pat_tone> is "error" (default) when the missing owner PAT ends the operation, or "info"
# when the caller can continue with another account: an error line followed by "continuing" reads
# like a failure that was ignored.
set_github_auth_for_repo() {
    local repo_url=${1:?The repository URL must be specified}
    local missing_pat_tone=${2:-error}

    if ! is_github_https_url "$repo_url"; then
        echo -e "${RED}❌ Repository URL must start with https://github.com/ (it was '$repo_url') ${NC}"
        return "$GIT_AUTH_ERROR"
    fi

    # "https://github.com/account/repo.git" -> "account/repo"
    local repo_path=$(echo "$repo_url" | sed 's|.*github.com[/:]||' | sed 's|\.git$||')

    if [[ -z "$repo_path" ]]; then
        echo -e "${RED}❌ Failed to extract <account/repo> from \"${repo_url}\" ${NC}"
        return "$GIT_AUTH_ERROR"
    fi

    local owner=$(echo "$repo_path" | awk -F'/' '{print $1}' )
    echo -e "Owner: $owner"

    local pat=$(grep "^${owner}:" "$github_pat_file" | cut -d':' -f2 | sed 's|[[:space:]]*$||' || true)
    if [[ -z "$pat" ]]; then
        if [[ "$missing_pat_tone" == "info" ]]; then
            echo -e "${BLUE}ℹ️ No PAT record for owner '${owner}' in '${github_pat_file}'.${NC}"
        else
            echo -e "${RED}❌ Failed to get PAT from file '${github_pat_file}' for owner '${owner}' ${NC}"
        fi
        return "$GIT_AUTH_NO_OWNER_PAT"
    fi

    if [[ "$pat" == *github.com ]]; then
        echo -e "${RED}❌ The PAT for '${owner}' ends with 'github.com', check '${github_pat_file}'.${NC}"
        return "$GIT_AUTH_ERROR"
    fi

    local obfuscated_pat="$(obfuscate_pat $pat)"
    echo "GITHUB_TOKEN (${PURPLE}${obfuscated_pat}${NC}) set for ${YELLOW}${owner}${NC}"
    export GITHUB_TOKEN=$pat

    # TODO: is it worth to do this check?
    #check_repo_access "$repo_path"
}

# Sets GITHUB_TOKEN for a repository that can be owned by an account without a PAT record.
# Invitations are addressed to the agent account, so its PAT replaces a missing owner PAT;
# the switch is announced because every later gh/git command then runs as that account.
# A bad URL or a malformed PAT stays a hard error.
set_github_auth_for_repo_or_agent() {
    local repo_url=${1:?The repository URL must be specified}
    local rc=0

    set_github_auth_for_repo "$repo_url" info || rc=$?

    case $rc in
        "$GIT_AUTH_OK")
            return "$GIT_AUTH_OK"
        ;;
        "$GIT_AUTH_NO_OWNER_PAT")
            echo -e "${YELLOW}⚠️ Continuing as the agent account '${GITHUB_AGENT_ACCOUNT}' (invitations are addressed to it).${NC}"
            set_default_github_token
            return $?
        ;;
        *)
            return "$rc"
        ;;
    esac
}

set_default_github_token() {
    #echo "set_default_github_token"
    local pat=$(grep "^${GITHUB_AGENT_ACCOUNT}:" "$github_pat_file" | cut -d':' -f2 || true)
    if [ -z "$pat" ]; then
        echo -e "❌ ${RED}Failed to get PAT from file '${github_pat_file}' for '${GITHUB_AGENT_ACCOUNT}' ${NC}"
        return 1
    fi

    # Already the agent's PAT: the callers switch it for their own reasons and say so,
    # so repeating the announcement would only add noise.
    if [[ "${GITHUB_TOKEN:-}" == "$pat" ]]; then
        return 0
    fi

    local obfuscated_pat="$(obfuscate_pat $pat)"
    echo "GITHUB_TOKEN (${PURPLE}${obfuscated_pat}${NC}) set for ${YELLOW}${GITHUB_AGENT_ACCOUNT}${NC}"
    export GITHUB_TOKEN=$pat
}


# Exit codes returned by check_repo_access()
REPO_ACCESS_OK=0
REPO_ACCESS_ERROR=1
REPO_ACCESS_READ_ONLY=2


check_repo_access() {
    #echo "check_repo_access()"
    local repo_path=$1   # "owner/repo"
    local me
    me=$(gh api user --template '{{.login}}')

    local resp
    resp=$(gh api "repos/$repo_path" \
        --template '{{.owner.login}}|{{.owner.type}}|{{.permissions.push}}|{{.permissions.admin}}' \
        2>/dev/null || true)

    if [[ -z "$resp" ]]; then
        # A pending invitation is the usual reason a private repository is still invisible,
        # so the invitation lookup runs before the access check gives up.
        local invite_rc=0
        check_and_accept_invite "$repo_path" || invite_rc=$?

        case $invite_rc in
            "$INVITE_ACCEPTED")
                # TODO(Feature 84): the role granted by the invitation is not verified here,
                # so an org invitation that is read-only still fails on the first push.
                echo -e "✔️ Access to $repo_path granted by the invitation, as the agent account '${GITHUB_AGENT_ACCOUNT}'"
                return "$REPO_ACCESS_OK"
            ;;
            "$INVITE_NOT_FOUND")
                echo -e "❌ ${RED}Could not fetch repo info for $repo_path${NC}"
            ;;
            *)
                return "$REPO_ACCESS_ERROR"
            ;;
        esac
        return "$REPO_ACCESS_ERROR"
    fi

    local owner owner_type push admin
    IFS='|' read -r owner owner_type push admin <<< "$resp"

    echo "Logged in as: ${YELLOW}$me${NC}"

    if [[ "$owner_type" == "User" && "$me" == "$owner" ]]; then
        echo -e "✔️ You are the ${YELLOW}owner${NC} of $repo_path"
        return "$REPO_ACCESS_OK"
    fi

    if [[ "$owner_type" == "Organization" ]]; then
        local org_role
        org_role=$(gh api "orgs/$owner/memberships/$me" --template '{{.role}}' 2>/dev/null || true)

        if [[ "$org_role" == "admin" ]]; then
            echo -e "✔️ You are an ${YELLOW}org owner${NC} of $owner (organization owner)"
            return "$REPO_ACCESS_OK"
        fi
    fi

    if [[ "$push" == "true" ]]; then
        echo -e "✔️ You are a ${YELLOW}collaborator${NC} (write access) on $repo_path"
        return "$REPO_ACCESS_OK"
    fi

    check_and_accept_invite "$repo_path"

    case $? in
        "$INVITE_ACCEPTED")
            return "$REPO_ACCESS_OK"
        ;;
        "$INVITE_NOT_FOUND")
            echo "Invite not found"
        ;;
        *)
            echo "⛔ You cannot access this repo. You need to set credentials or be a collaborator."
            return "$REPO_ACCESS_ERROR"
        ;;
    esac

    #echo -e "⚠️ ${RED}You only have read access to $repo_path (not a collaborator)${NC}"
    return "$REPO_ACCESS_READ_ONLY"
}


check_and_accept_invite() {
    local repo_path=$1
    local previous_token=${GITHUB_TOKEN:-}

    _lookup_and_accept_invite "$repo_path"
    local rc=$?

    # A successful accept must keep the agent PAT: it is the account that gained access, 
    # so the clone and later pushes run as it. 
    # Any other result means the agent token was borrowed for nothing and the previous one goes back.
    if [[ $rc -ne 0 && -n "$previous_token" ]]; then
        export GITHUB_TOKEN=$previous_token
    fi
    return $rc
}

_lookup_and_accept_invite() {
    local repo_path=$1   # "owner/repo"

    # Invitations are addressed to the shared agent account, not to the repository
    # owner, so the lookup runs under the agent PAT.
    echo -e "${BLUE}ℹ️ Checking pending invitation on ${YELLOW}$repo_path${NC}${BLUE} as ${YELLOW}'${GITHUB_AGENT_ACCOUNT}'${NC}${BLUE}: GITHUB_TOKEN is set to its PAT (restored when possible).${NC}"
    if ! set_default_github_token; then
        echo -e "${RED}❌ Cannot check invitations: switching GITHUB_TOKEN to '${GITHUB_AGENT_ACCOUNT}' failed.${NC}"
        return "$INVITE_ERROR"
    fi

    # gh api exits non-zero on HTTP 4xx/5xx. stderr goes to its own file: a warning
    # on a successful call would otherwise corrupt the JSON and hide the invitation.
    # The assignment stays on its own line: `local x=$(cmd)` hides the status.
    local response err_file
    err_file=$(mktemp)
    if ! response=$(gh api /user/repository_invitations 2>"$err_file"); then
        echo -e "${RED}❌ Failed to get invitations ${NC}"
        echo -e "Response:\n $response"
        echo -e "Error:\n $(cat "$err_file")"
        rm -f "$err_file"
        return "$INVITE_ERROR"
    fi
    rm -f "$err_file"

    local invitation_id
    if ! invitation_id=$(echo "$response" | jq -r --arg repo "$repo_path" \
        'first(.[] | select((.repository.full_name | ascii_downcase) == ($repo | ascii_downcase)) | .id)'); then
        echo -e "${RED}❌ Could not read the invitation list${NC}"
        echo -e "Response:\n $response"
        return "$INVITE_ERROR"
    fi

    if [[ -n "$invitation_id" ]]; then
        echo -e "${YELLOW}Pending invitation found for $repo_path — accepting...${NC}"

        if error_output=$(gh api -X PATCH "/user/repository_invitations/$invitation_id" 2>&1); then
            echo -e "✔️ Invitation accepted for $repo_path"
            return "$INVITE_ACCEPTED"
        else
            echo -e "${RED}❌ Failed to accept invitation for $repo_path${NC}"
            echo -e "${RED}   → $error_output${NC}"
            return "$INVITE_ERROR"
        fi
    else
        echo -e "${YELLOW}⚠️ No pending invitation for $repo_path under agent account '${GITHUB_AGENT_ACCOUNT}'. Nothing to accept.${NC}"
        return "$INVITE_NOT_FOUND"
    fi
}


# --- Add GitHub PAT ---
add_github_pat() {
    echo -e "${YELLOW}${GIT_EMOJI} Add a new PAT to the GIT credentials:${NC}"
    
    # look for current GitHub username
    local git_username_default=$(git config --global user.name)

    if [[ -n "$git_username_default" ]]; then
        read -p "GitHub username (leave empty to use $git_username_default): " git_username
        if [[ -z "$git_username" ]]; then
            git_username=$git_username_default
        fi
    else
        read -p "GitHub username (it is not required to match GitHub account): " git_username
        if [[ -z "$git_username" ]]; then
            echo -e "${RED}❌ Error: A user name must be defined ${NC}"
            return 1
        fi
    fi    
    
    read -p "GitHub repository (MUST be HTTPS): " git_repo

    # Check git_repo starts with "https://", if not error message
    if [[ ! "$git_repo" =~ ^https:// ]]; then
        echo -e "${RED}❌ Error: Repository URL must start with https:// ${NC}"
        return 1
    fi

    # Create the path for the credentials record = remove the initial "https://"
    local repo_path="${git_repo#https://}"

    read -s -p "GitHub PAT (hidden): " git_pat; echo    

    echo "https://$git_username:$git_pat@$repo_path" >> ~/.git-credentials
    echo -e "✔️ GitHub repository credentials configured!"
    #echo -e "${GREEN}${GIT_EMOJI} GitHub repository credentials configured!${NC}"
}


obfuscate_pat() {
    local pat=${1:?PAT is not provided}
    echo "${pat:0:10}...${pat: -5}"
}


manage_git_credentials() {
    echo -e "${YELLOW}We use a custom file to manage GitHub PAT (${BLUE}$github_pat_file${NC}${YELLOW}).\n \
(The usual .git-credentials file is not used because not easy to read and lead to mistakes due to not properly impemented per-HTTP functionality)\n \
Values are stored as <account>:<PAT>.${NC}"

    # Helper function to load and obfuscate the list without
    load_and_print_list() {
        declare -a temp_list
        if [[ ! -f "$github_pat_file" ]]; then
            echo -e "${YELLOW}(No credentials found)${NC}"
            return 0
        fi

        echo ""
        echo -e "${YELLOW}GIT Credentials:${NC}"

        local i=1
        while IFS= read -r line || [[ -n "$line" ]]; do
            [[ -z "$line" ]] && continue

            # Split the string by ':'
            IFS=':' read -r account pat <<< "$line"
            if [[ -z "$account" || -z "$pat" ]]; then
                echo "‼️ Line $1 in '$github_pat_file' does not have format 'account:PAT'" >&2
                return 1
            fi

            local obfuscated="$(obfuscate_pat "$pat")"
            # Replace ONLY the specific PAT instance
            local obfuscated_line="${line/$pat/$obfuscated}"
            temp_list+=("$obfuscated_line")

            ((i++))
        done < $github_pat_file

        for idx in "${!temp_list[@]}"; do
            printf "%2d) %s\n" "$((idx + 1))" "${temp_list[$idx]}"
        done
    }

    # MAIN LOOP
    while true; do
        # Refresh the visual list every time the loop repeats
        load_and_print_list

        echo -e "\n${BLUE}------------------------${NC}"
        PS3=$'\e[34mSelect an option: \e[0m'

        # Use select inside the while loop
        select choice in "Show-not-obfuscated" "Add" "Remove" "Exit"; do
            case "$choice" in
                "Show-not-obfuscated")
                    #echo -e "\n${GREEN}Raw File Content:${NC}" 
                    cat $github_pat_file
                    break # Break out of 'select', but stay in 'while' to refresh
                ;;
                "Add")
                    read -p "GitHub account (user or org): " account
                    read -s -p "GitHub account PAT (hidden): " pat
                    echo ""

                    local owner_repo="$owner"
                    if  [[ -n "$account" && -n "$pat" ]]; then 
                    # Append new credential
                        echo "${account}:${pat}" >> "$github_pat_file"
                        echo -e "${GREEN}✓ Credential added!${NC}"
                    fi
                    break
                ;;
                "Remove")
                    # Re-run print so they see current numbers before choosing
                    load_and_print_list
                    read -p "Enter number to remove: " index

                    if [[ "$index" =~ ^[0-9]+$ ]]; then
                        sed -i "${index}d" "$github_pat_file"
                        echo -e "${YELLOW}Removed.${NC}"
                    else
                        echo -e "${RED}Invalid number.${NC}"
                    fi
                    break
                ;;
                "Exit")
                    return 0
                    ;;
                *)
                    echo -e "${RED}Invalid selection.${NC}"
                    break ;;
            esac
        done
    done
}


# --- Global GIT setup ---
setup_git_global() {
    local AGENT_NAME=${1:-0}
    
    if [[ -z "$(git config --global user.name 2>/dev/null)" ]]; then
        echo -e "GIT is not configured. Set up name and email:${NC}"

        # GITHUB_COMMIT_EMAIL is the GitHub account that gets credited as the commit author
        read -p "GitHub user name (name used for commits author, leave blank for '${AGENT_NAME}'): " git_username
        read -p "GitHub user email (account credited for commits, leave blank for '${GITHUB_COMMIT_EMAIL}'): " git_email

        git_username="${git_username:-$AGENT_NAME}"
        git_email="${git_email:-$GITHUB_COMMIT_EMAIL}"

        git config --global user.name "$git_username"
        git config --global user.email "$git_email"

        echo ""
        echo -e "${YELLOW}GIT global set${NC}"
    fi
}
