set_github_token() {
    #echo "set_github_token()"
    local token=$(grep "@github.com/${GITHUB_ACCOUNT}$" ~/.git-credentials | sed -n 's|.*:\([^@]*\)@.*|\1|p')  # "@github.com$", note the final "$"
    if [[ -z "$token" ]]; then
        echo -e "${RED}❌ Failed to get GitHub token from .git-credentials ${NC}"
        return 1
    fi

    export GITHUB_TOKEN="$token"
    #echo "GITHUB_TOKEN set ($token)"
}

# --- Global GIT setup ---
setup_git_global() {
    local force=${1:-0}

    if [ "$force" -eq 1 ] || [[ -z "$(git config --global user.name 2>/dev/null)" ]]; then
        echo -e "${YELLOW}${GIT_EMOJI} GIT is not configured for \"${GITHUB_ACCOUNT}\". Set up credentials:${NC}"

        read -p "GitHub user name (Commit author username): " git_username
        read -p "GitHub email: " git_email
        read -s -p "GitHub account PAT (hidden): " git_pat

        if [[ "$git_pat" != github_pat_* ]]; then 
            echo -e "${RED}❌ The provided one is not a fine-grained PAT (fine-grained PT starts by \"github_pat_\")"
            return 1
        fi

        git config --global user.name "$git_username"
        git config --global user.email "$git_email"
        git config --global credential.helper store
        git config --global credential.useHttpPath true

        # Set the default credentials (repository owner)
        echo "https://xxx:$git_pat@github.com/$GITHUB_ACCOUNT" > ~/.git-credentials
        echo ""
        echo -e "${YELLOW}GIT credentials${NC}"
        cat ~/.git-credentials
        echo ""
        echo -e "${GREEN}${GIT_EMOJI} GIT configured!${NC}"
    fi

    #return 0
}




manage_git_credentials() {
    #echo "manage_git_credentials()"

    # map credentials
    declare -a cred_list
    i=1
    while IFS= read -r line; do
        if [[ -n "$line" ]]; then
            # Obfuscate PAT
            if [[ "$line" =~ (://[^:]+:)([^@]+)(@) ]]; then
                #echo "PAT"
                user_pass="${BASH_REMATCH[1]}"
                pat="${BASH_REMATCH[2]}"
                obfuscated="${pat:0:10}...${pat: -5}"
                #echo "obfustaced=${obfuscated}"
                obfuscated_line="${line/$pat/$obfuscated}"
            else
                #echo "NOT PAT"
                obfuscated_line="$line"
            fi
            cred_list+=("$obfuscated_line")
            ((i++))
        fi
    done < ~/.git-credentials

    # Print the list
    for ((j=0; j<${#cred_list[@]}; j++)); do
        echo "$((j+1)): ${cred_list[$j]}"
    done

    # Menu 
    echo -e "\e[34m-------------------\e[0m"
    PS3=$'\e[34mSelect an option: \e[0m'
    select choice in Add Remove Renew Exit ; do
        # use exec so when the host shell close the pi process is killed
        case "$choice" in
            Add)  
                read -p "GitHub account/organization: " owner
                read -p "GitHub repository (you can leave blank): " repo
                read -s -p "GitHub account PAT (hidden): " pat

                ### TODO: add a check for the PAT 

                local owner_repo="$owner"
                if [[ -n "$repo" ]]; then
                    owner_repo="$owner/$repo"
                fi
                echo "https://xxx:$pat@github.com/$owner_repo" >> ~/.git-credentials
                echo ""
                echo -e "${GREEN} GIT credentials added!${NC}"
            ;;
            Remove) 
                for ((j=0; j<${#cred_list[@]}; j++)); do
                    echo "$((j+1)): ${cred_list[$j]}"
                done

                read -p "Which one do you want to remove? (Enter the number): " index
                sed -i "${index}d" ~/.git-credentials
                echo -e "${GREEN} GIT credentials removed!${NC}"
            ;;
            Renew)
                # TODO
                echo "Not implemented"
            ;;
            Exit|*) break ;;
        esac
    done
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

    local invitation_id
    invitation_id=$(gh api /user/repository_invitations \
        --jq ".[] | select(.repository.full_name == \"$repo_path\") | .id")

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