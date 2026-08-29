github_pat_file="/scripts/github_pat"

if [[ ! -r "$github_pat_file" ]]; then
   echo -e "${RED}❌ The PAT file '${github_pat_file}' is not readable.${NC}"
   #return 1
fi

# Since GIT uses GITHUB CLI authentication, we set the GITHUB_TOKEN that will be used by GitHub CLI 
# <repo_url> argument must be in format "https://github.com/account/repo.git"
set_github_auth_for_repo() {
    local repo_url=${1:?The repository URL must be specified}

    # Check that repository URL us in HTTP format
    if [[ ! "$repo_url" =~ ^https://github.com ]]; then
        echo -e "${RED}❌ Repository URL must start with https://github.com (it was '$repo_url') ${NC}"
        return 1
    fi

    # "https://github.com/account/repo.git" -> "account/repo"
    local repo_path=$(echo "$repo_url" | sed 's|.*github.com[/:]||' | sed 's|\.git$||')

    if [[ -z "$repo_path" ]]; then
        echo -e "${RED}❌ Failed to extract <account/repo> from \"${repo_url}\" ${NC}"
        return 1
    fi

    local owner=$(echo "$repo_path" | awk -F'/' '{print $1}' )

    local pat=$(grep "^${owner}:" "$github_pat_file" | cut -d':' -f2 | sed 's|[[:space:]]*$||' || true)
    if [[ -z "$pat" ]]; then
        echo -e "${RED}❌ Failed to get PAT from file '${github_pat_file}' for owner '${owner}' ${NC}"
        return 1
    fi

    if [[ "$pat" == *github.com ]]; then
        echo -e "${RED}❌ The PAT for '${owner}' ends with 'github.com', check '${github_pat_file}'.${NC}"
        return 1
    fi

    local obfuscated_pat="$(obfuscate_pat $pat)"
    echo "GITHUB_TOKEN (${PURPLE}${obfuscated_pat}${NC}) set for ${YELLOW}${owner}${NC}"
    export GITHUB_TOKEN=$pat

    # TODO: is it worth to do this check?
    #check_repo_access "$repo_path"
}

set_default_github_token() {
    #echo "set_default_github_token"
    local pat=$(grep "^${GITHUB_ACCOUNT}:" "$github_pat_file" | cut -d':' -f2 || true)
    if [ -z "$pat" ]; then
        echo -e "${RED}❌ Failed to get PAT from file '${github_pat_file}' for '${GITHUB_ACCOUNT}' ${NC}"
        return 1
    fi

    local obfuscated_pat="$(obfuscate_pat $pat)"
    echo "GITHUB_TOKEN (${PURPLE}${obfuscated_pat}${NC}) set for ${YELLOW}${GITHUB_ACCOUNT}${NC}"
    export GITHUB_TOKEN=$pat
}


check_repo_access() {
    #echo "check_repo_access()"
    local repo_path=$1   # "owner/repo"
    local me
    me=$(gh api user --template '{{.login}}')

    local resp
    resp=$(gh api "repos/$repo_path" \
        --template '{{.owner.login}}|{{.owner.type}}|{{.permissions.push}}|{{.permissions.admin}}' \
        2>/dev/null)

    if [[ -z "$resp" ]]; then
        echo -e "${RED}❌ Could not fetch repo info for $repo_path${NC}"
        return 1
    fi

    local owner owner_type push admin
    IFS='|' read -r owner owner_type push admin <<< "$resp"

    echo "Logged in as: ${YELLOW}$me${NC}"

    if [[ "$owner_type" == "User" && "$me" == "$owner" ]]; then
        echo -e "✔️ You are the ${YELLOW}owner${NC} of $repo_path"
        return 0
    fi

    if [[ "$owner_type" == "Organization" ]]; then
        local org_role
        org_role=$(gh api "orgs/$owner/memberships/$me" --template '{{.role}}' 2>/dev/null)
        if [[ "$org_role" == "admin" ]]; then
            echo -e "✔️ You are an ${YELLOW}org owner${NC} of $owner (organization owner)"
            return 0
        fi
    fi

    if [[ "$push" == "true" ]]; then
        echo -e "✔️ You are a ${YELLOW}collaborator${NC} (write access) on $repo_path"
        return 0
    fi

    check_and_accept_invite "$repo_path"
    case $? in
        0)
            # invite accepted. Continue.
            return 0
        ;;
        2)
            # invite not found... continue
            echo "Invite not found"
        ;;
        *)
            echo "⛔ You cannot access this repo. You need to set credentials or be a collaborator."
            return 1
        ;;
    esac

    #echo -e "${RED}⚠️ You only have read access to $repo_path (not a collaborator)${NC}"
    return 2
}


check_and_accept_invite() {
    #echo "check_and_accept_invite()"
    local repo_path=$1   # "owner/repo"

    #local invitation_id
    #invitation_id=$(gh api /user/repository_invitations \
    #    --template '{{range .}}{{.id}}|{{.repository.full_name}}
#{{end}}' \
#        | awk -F'|' -v repo="$repo_path" '$2 == repo {print $1}')

    #local invitation_id
    #invitation_id=$(gh api /user/repository_invitations \
    #    --jq --arg repo "$repo_path" '.[] | select(.repository.full_name == $repo) | .id')

    set_default_github_token  # required to get the invitation for GitHub agent account
    local response=$(gh api /user/repository_invitations)
    local http_status=$(echo "$response" | jq .status)
    if [[ "$http_status" != "200" ]]; then
        echo -e "${RED}❌ Failed to get invitations ${NC}"
        echo -e "Response:\n $response"
        return 1
    fi

    local invitation_id=$(echo "$response" | jq -r ".[] | select(.repository.full_name == \"$repo_path\") | .id")
    #local invitation_id=$(echo "$response" | jq -r "...")
    #invitation_id=$(gh api /user/repository_invitations \
    #    --jq ".[] | select(.repository.full_name == \"$repo_path\") | .id")

    if [[ -n "$invitation_id" ]]; then
        echo "DEBUG invitation_id=[$invitation_id]"
        echo -e "${YELLOW}Pending invitation found for $repo_path — accepting...${NC}"

        if error_output=$(gh api -X PATCH "/user/repository_invitations/$invitation_id" 2>&1); then
            echo -e "✔️ Invitation accepted for $repo_path"
            return 0
        else
            echo -e "${RED}❌ Failed to accept invitation for $repo_path${NC}"
            echo -e "${RED}   → $error_output${NC}"
            return 1
        fi
    else
        # no invite found
        return 2
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
# [OBSOLETE] we switched from using .git-credentials to github_pat file to store GitHub PAT
_setup_git_global() {
    local force=${1:-0}

    if [ "$force" -eq 1 ] || [[ -z "$(git config --global user.name 2>/dev/null)" ]]; then
        echo -e "${YELLOW}${GIT_EMOJI} GIT is not configured for \"${GITHUB_ACCOUNT}\". Set up credentials:${NC}"

        read -p "GitHub user name (name used for commits, use the Agent name): " git_username
        read -p "GitHub email (leave empty yo use ${GITHUB_ACCOUNT_EMAIL}): " git_email
        read -s -p "GitHub account PAT (hidden): " git_pat

        if [[ -n "$git_email" ]]; then
            git_email=${GITHUB_ACCOUNT_EMAIL}
        fi

        if [[ "$git_pat" != github_pat_* ]]; then 
            echo -e "${RED}❌ The provided one is not a fine-grained PAT (fine-grained PT starts by \"github_pat_\")"
            return 1
        fi

        git config --global user.name "$git_username"
        git config --global user.email "$git_email"


        # Set the default credentials (repository owner)
        echo "https://xxx:$git_pat@github.com/$GITHUB_ACCOUNT" > ~/.git-credentials
        echo ""
        echo -e "${YELLOW}GIT credentials${NC}"

        i=1
        while IFS= read -r line; do
            if [[ -n "$line" ]]; then
                # Obfuscate PAT
                if [[ "$line" =~ (://[^:]+:)([^@]+)(@) ]]; then
                    #echo "PAT"
                    user_pass="${BASH_REMATCH[1]}"
                    pat="${BASH_REMATCH[2]}"
                    obfuscated="$(obfuscate_pat $pat)"
                    #echo "obfustaced=${obfuscated}"
                    obfuscated_line="${line/$pat/$obfuscated}"
                else
                    #echo "NOT PAT"
                    obfuscated_line="$line"
                fi

                echo "${i}) ${YELLOW}${obfuscated_line}${NC}"
          
                ((i++))
            fi
        done < ~/.git-credentials

        echo ""
        echo -e "${GREEN}${GIT_EMOJI} GIT configured! ${NC}"
    fi

    #return 0
}


# [OBSOLETE] we switched from using .git-credentials to github_pat file to store GitHub PAT
_set_default_github_token() {
    #echo "set_github_token()"
    local token=$(grep "@github.com/${GITHUB_ACCOUNT}$" ~/.git-credentials | sed -n 's|.*:\([^@]*\)@.*|\1|p')  # "@github.com$", note the final "$"
    if [[ -z "$token" ]]; then
        echo -e "${RED}❌ Failed to get GitHub token from .git-credentials ${NC}"
        return 1
    fi

    export GITHUB_TOKEN="$token"
    #echo "GITHUB_TOKEN set ($token)"
}


# [OBSOLETE] # [OBSOLETE] we switched from using .git-credentials to github_pat file to store GitHub PAT
_manage_gitcredentials_file() {
    local cred_file="$HOME/.git-credentials"

    # Helper function to load and obfuscate the list without modifying the original file
    load_and_print_list() {
        declare -a temp_list
        if [[ ! -f "$cred_file" ]]; then
            echo -e "${YELLOW}(No credentials found)${NC}"
            return
        fi

        echo ""
        echo -e "${YELLOW}GIT Credentials:${NC}"

        local i=1
        while IFS= read -r line || [[ -n "$line" ]]; do
            [[ -z "$line" ]] && continue

            # Obfuscate PAT using your existing logic
            if [[ "$line" =~ (://[^:]+:)([^@]+)(@) ]]; then
                local prefix="${BASH_REMATCH[1]}"
                local pat="${BASH_REMATCH[2]}"
                local suffix="${BASH_REMATCH[3]}"
                local obfuscated="$(obfuscate_pat "$pat")"
                # Replace ONLY the specific PAT instance
                local obfuscated_line="${line/$pat/$obfuscated}"
                temp_list+=("$obfuscated_line")
            else
                temp_list+=("$line")
            fi
            ((i++))
        done < $cred_file

        for idx in "${!temp_list[@]}"; do
            printf "%2d): %s\n" "$((idx + 1))" "${temp_list[$idx]}"
        done
    }

    # MAIN LOOP: This solves Problem #2 (Menu disappearing/not updating)
    while true; do
        # Refresh the visual list every time the loop repeats
        load_and_print_list

        echo -e "\n${BLUE}------------------------${NC}"
        PS3=$'\e[34mSelect an option: \e[0m'

        # Use select inside the while loop
        select choice in "Show-not-obfuscated" "Add" "Remove" "Exit"; do
            case "$choice" in
                "Show-not-obfuscated")
                    echo -e "\n${GREEN}Raw File Content:${NC}" 
                    cat $cred_file
                    break # Break out of 'select', but stay in 'while' to refresh
                ;;
                "Add")
                    read -p "GitHub owner (user or org): " owner
                    read -p "GitHub repository (leave blank for all repos): " repo
                    read -s -p "GitHub account PAT (hidden): " pat
                    echo "" # New line after hidden input

                    local owner_repo="$owner"
                    [[ -n "$repo" ]] && owner_repo="$owner/$repo"

                    # Append new credential
                    echo "https://xxx:$pat@github.com/$owner_repo" >> "$cred_file"
                    echo -e "${GREEN}✓ Credential added!${NC}"
                    break # Break out of 'select' to trigger reload via 'while'
                ;;
                "Remove")
                    # Re-run print so they see current numbers before choosing
                    load_and_print_list
                    read -p "Enter number to remove: " index

                    if [[ "$index" =~ ^[0-9]+$ ]]; then
                        sed -i "${index}d" "$cred_file"
                        echo -e "${RED}⚠ Removed.${NC}"
                    else
                        echo -e "${RED}Invalid number.${NC}"
                    fi
                    break # Break out of 'select' to trigger reload via 'while'
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


# --- set GIT credentials and GitHub CLI auth token for the repository --- 
# <repo_url> argument must be in format "github.com/account/repo.git"
_setup_git_for_repo() {
    local repo_url=${1:?The repository URL must be specified}

    # Check git_repo starts with "https://", if not error message
    if [[ ! "$repo_url" =~ ^https://github.com ]]; then
        echo -e "${RED}❌ Error: Repository URL must start with https://github.com (it was '$repo_url') ${NC}"
        return 1
    fi

    local repo_path=$(echo "$repo_url" | sed 's|.*github.com[/:]||' | sed 's|\.git$||')

    if [[ -z "$repo_path" ]]; then
        echo -e "${RED}❌ Error: Failed to extract account/repo_path from \"${repo_url}\" ${NC}"
        return 1
    fi

    local git_account_of_repo=$(echo "$repo_path" | awk -F'/' '{print $1}' )

    # from git_common
    set_default_github_token $git_account_of_repo


    # [OBSOLETE: keep for reference]
    # check for GIT credentials of this repo account (account or organization)
    #if [[ ! -f ~/.git-credentials ]]; then
    #    touch ~/.git-credentials
    #fi

    #local git_pat=$(grep "@github.com/$git_account_of_repo" ~/.git-credentials | sed -n 's|.*:\([^@]*\)@.*|\1|p')  

    if [[ -z "$git_pat" ]]; then
        # Asking every time if want to set credentials in annoying and confusing so we just try to use default auth
        echo ""
        echo -e "GIT specific credentials for ${YELLOW}$repo_path${NC} were not found. Use account default GitHub token."

        # try just @github.com  # "@github.com$", note the final "$"
        git_pat=$(grep "@github.com$" ~/.git-credentials | sed -n 's|.*:\([^@]*\)@.*|\1|p')  # "@github.com$", note the final "$"
        # then try get the first one # "@github.com/", note the final "$"
        if [[ -z "$git_pat" ]]; then
            git_pat=$(grep "@github.com" ~/.git-credentials | sed -n 's|.*:\([^@]*\)@.*|\1|p')  # "@github.com"
        fi

        if [[ -z "$git_pat" ]]; then
            echo -e "${RED}❌ Error: Failed to find a record for github.con in GIT credentials ${NC}"
            return 1
        fi
    else
        echo ""
        echo -e "✔️ GIT credentials found for \"github.com/$git_account_of_repo\" ${NC}"
    fi
   
    # set the auth token for GitHub CLI, override existing one
    export GITHUB_TOKEN="$git_pat"
    gh auth status
    if [[ ! $(gh auth status) ]]; then
        local pat_obfuscated=$(obfuscate_pat "$git_pat")
        echo -e "${RED}❌ Error: Failed to authenticate GitHub CLI with found token ($pat_obfuscated) ${NC}"
        return 1
    fi
    
    return 0
}

