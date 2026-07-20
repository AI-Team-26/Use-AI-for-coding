# COMMON script fo the start.sh in the different tools (pi.dev, Qwen-Coder ...)
# The start_project function is defined in the single tool because it has to be tool-specific 

# --- Config ---
RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; PURPLE_LIGHT=$'\033[0;31m'; BOLD_PURPLE=$'\033[1;35m'; NC=$'\033[0m'
HIGHLIGHT_AZURE=$'\033[0;44m'; HIGHLIGHT_PINK=$'\033[0;45m';
FOLDER_EMOJI="📁"; MENU_EMOJI="📜"; ROCKET_EMOJI="🚀"; WARNING_EMOJI="⚠️"; GIT_EMOJI="🐙"; DOCKER_EMOJI="🐳"; INFO_EMOJI="ℹ️"

LLAMACPP_URL=${LLAMACPP_HOST:-"http://host.docker.internal:8001"} # host.docker.internal: syntax to get the localhost from the docker container


# --- Global GIT setup ---
setup_git_global() {
    local force=${1:-0}

    if [ "$force" -eq 1 ] || [[ -z "$(git config --global user.name 2>/dev/null)" ]]; then
        echo -e "${YELLOW}${GIT_EMOJI} Git is not configured for \"${GITHUB_ACCOUNT}\". Set up credentials:${NC}"

        read -p "GitHub user name (Commit author username): " git_username
        read -p "GitHub email: " git_email
        read -s -p "GitHub PAT (hidden): " git_pat

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
        echo -e "${GREEN}${GIT_EMOJI} Git configured!${NC}"                
    fi

    #return 0
}

# --- set GIT credentials and GitHub CLI auth token for the repository --- 
# <repo_url> argument must be in format "github.com/account/repo.git"
setup_git_for_repo() {    
    local repo_url=${1:?The repository URL must be specified}

    # Check git_repo starts with "https://", if not error message
    if [[ ! "$repo_url" =~ ^https:// ]]; then
        echo -e "${RED}❌ Error: Repository URL must start with https:// ${NC}"
        return 1
    fi

    local repo_path=$(echo "$repo_url" | sed 's|.*github.com[/:]||' | sed 's|\.git$||')

    if [[ -z "$repo_path" ]]; then
        echo -e "${RED}❌ Error: Failed to extract account/repo_path from \"${repo_url}\" ${NC}"
        return 1
    fi

    # check for GIT credentials of this repo account (account or organization)
    if [[ ! -f ~/.git-credentials ]]; then
        touch ~/.git-credentials
    fi

    local git_account_of_repo=$(echo "$repo_path" | awk -F'/' '{print $1}' )
    local git_pat=$(grep "@github.com/$git_account_of_repo" ~/.git-credentials | sed -n 's|.*:\([^@]*\)@.*|\1|p')  

    if [[ -z "$git_pat" ]]; then
        echo ""
        echo -e "❌ Git credentials record for ${YELLOW}$repo_path${NC} not found"

        echo ""
        read -p "Do you want to set the GIT credentials for \"$git_account_of_repo\" (do you have the PAT)? [Yy]es / [N]o " choice
        case "$choice" in
            Y|y|Yes|yes) 
            read -s -p "GitHub PAT (hidden): " git_pat
            echo "https://xxx:$git_pat@github.com/$git_account_of_repo" >> ~/.git-credentials
            echo ""
            echo -e "${YELLOW}GIT credentials${NC}"
            cat ~/.git-credentials
            echo ""
            echo -e "✔️ Git credentials set for \"@github.com/$git_account_of_repo\" ${NC}"
            ;; 
            *)
            git_pat=$(grep "@github.com$" ~/.git-credentials | sed -n 's|.*:\([^@]*\)@.*|\1|p')  # "@github.com$", note the final "$"
            echo -e "${YELLOW}The \"default\" account GIT credentials will be used, this works iif you are a colalborator of the repo${NC}"
            #return 1
        esac
    else
        echo ""
        echo -e "✔️ Git credentials found for \"@github.com/$git_account_of_repo\" ${NC}"
    fi

   
    # set the auth token for GitHub CLI, override existing one
    export GITHUB_TOKEN="$git_pat"
    gh auth status
    #if ! $(gh auth status 2>/dev/null); then
    if [[ ! $(gh auth status) ]]; then
        echo -e "${RED}❌ Error: Failed to authenticate GitHub CLI ${NC}"
        return 1
    fi
    
    return 0
}


# --- Add GitHub PAT ---
add_github_pat() {
    echo -e "${YELLOW}${GIT_EMOJI} Add a new PAT to the Git credentials:${NC}"
    
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


get_llamacpp_loaded_model() {
    local loaded_model
    loaded_model=$(curl -s "$LLAMACPP_URL/models" | python3 -c '
import sys, json
data = json.load(sys.stdin)
models = data.get("models", [])
if models:
    print(models[0].get("model", ""))
')
    echo "$loaded_model"
}


# --- Select or Clone a Project ---
select_project() {
    #sleep 10
    #clear

    mapfile -t projects < <(find /projects -mindepth 1 -maxdepth 1 -type d -printf "%f\n")

    if [ ${#projects[@]} -eq 0 ]; then
        echo -e "${YELLOW}No projects found. Clone a repository first!${NC}"
        clone_repo
        #continue
        #return 0
    fi

    echo $'\n\e[34m------------------------------------------------\e[0m'

    #echo -e "${YELLOW}${MENU_EMOJI} Select a project/action:${NC}"
    PS3=$'\e[34mSelect a project/action: \e[0m'
    COLUMNS=1  # ← force one item per line

    projects+=(
       "➕ Clone a repsitory"
       "➕ Create a new project"
       "➖ Delete a project"
       ">_ Shell"
       # "🔑 Add GitHub PAT for a repo"
       "🐙 Check GIT credentials"
       "❌ Exit"
    )
    
    select proj in "${projects[@]}" ; do
        if [[ "$proj" == "➕ Clone a repsitory" ]]; then
            clone_repo
            break
        elif [[ "$proj" == "➕ Create a new project" ]]; then
            create_new_proj
            break
        elif [[ "$proj" == "➖ Delete a project" ]]; then
            delete_proj
            break
        elif [[ "$proj" == ">_ Shell" ]]; then 
            /bin/bash
            break  
        # TODO: no more used (and updated)
        elif [[ "$proj" == "🔑 Add GitHub PAT for a repo" ]]; then
            add_github_pat
            #select_project
            break     
        elif [[ "$proj" == "🐙 Check GIT credentials" ]]; then
            echo -e "${YELLOW}GIT credentials${NC}"12
            cat ~/.git-credentials

            echo ""
            read -p "Do you want to set the global GIT credentials? [Yy]es/[N]o " choice
            case "$choice" in
                Y|y|Yes|yes) setup_git_global 1 ;;
            esac

            break
        elif [[ "$proj" == "❌ Exit" ]]; then
            return 0
        elif [[ -n "$proj" ]]; then

            clear

            echo ""
            echo -e "${GREEN}${ROCKET_EMOJI} Open project: ${YELLOW}$proj${NC}"
            cd "/projects/$proj" || exit 1

            #local repo_path=$(git remote get-url origin 2>/dev/null | sed 's|.*github.com[/:]||' | sed 's|\.git$||')            
            local repo_url=$(git remote get-url origin 2>/dev/null)   
            if [[ -n "$repo_url" ]]; then
                if ! setup_git_for_repo "$repo_url" ; then
                    return 1
                fi
            fi

            # custom tool function
            start_project "$proj"
            break
        else
            echo -e "${WARNING_EMOJI} Invalid selection. Retry."
        fi
    done

    # recursion
    select_project
}


# --- Clone a repository and create a new Project ---
clone_repo() {
    echo ""
    read -p "GitHub repo URL (MUST BE THE HTTPS PATH): " repo_url
    read -p "Directory name (leave blank for repo name): " proj_dir
    local proj_dir=${proj_dir:-$(basename "$repo_url" .git)}
    if [ -d "/projects/$proj_dir" ]; then
        echo -e "${RED}${WARNING_EMOJI} Directory '/projects/$dir_name' already exists!${NC}"
        return 1
    fi

    # Extract owner and repo from the URL
    local repo_path=$(echo "$repo_url" | sed -E 's|https://github\.com/([^/]+)/([^/.]+)(\.git)?|\1/\2|')
    #local repo_account = 
    local api_url="https://api.github.com/repos/$repo_path"

    # Query the GitHub API to check if the repo is public
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$api_url")

    if [ "$response" -eq 200 ]; then
        # Repository is public
        echo -e "${GREEN}Repository is public. Proceeding with clone...${NC}"        
    else
        #if ! setup_git_for_repo "$repo_url" >&2 
        setup_git_for_repo "$repo_url"
    fi

    # if .git-credentials is not ok for this repo, it will ask username/password to authenticate !!!
    #git clone "$repo_url" "/projects/$proj_dir" || {
    #    echo -e "❌ Failed to clone!"
    #    return 1
    #}

    gh repo clone "$repo_url" "/projects/$proj_dir" || {
        # Error is PAT has no permission on this repo: 
        # > GraphQL: Could not resolve to a Repository with the name 'AI-Team-26/game.Creatures'. (repository)
        echo -e "❌ Failed to clone!"
        return 1
    }

    echo -e "✔️ GitHub repository cloned!"

    cd "/projects/$proj_dir" || exit 1
    start_project "$proj_dir"
}

# --- Create a new project that is not (yet) linked to a repository ---
create_new_proj() {
    echo ""
    read -p "Name of the new project?" proj_name
    cd "/projects/$proj_name" || exit 1
    pi
}

# --- Delete the project ---
delete_proj() {
    mapfile -t projects < <(find /projects -mindepth 1 -maxdepth 1 -type d -printf "%f\n")

    echo $'\n\e[34m------------------------------------------------\e[0m'

    PS3=$'\e[34mSelect the project to delete: \e[0m'
    COLUMNS=1  # ← force one item per line

    select proj in "${projects[@]}" "❌ Exit" ; do
        if [[ "$proj" == "❌ Exit" ]]; then
            return 0
        elif [[ -n "$proj" ]]; then
            rm -f "/projects/$proj"
        fi
    done
}