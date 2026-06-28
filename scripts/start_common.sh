# COMMON script fo the start.sh in the different tools

# --- Config ---
RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; PURPLE_LIGHT=$'\033[0;31m'; BOLD_PURPLE=$'\033[1;35m'; NC=$'\033[0m'
HIGHLIGHT_AZURE=$'\033[0;44m'; HIGHLIGHT_PINK=$'\033[0;45m';
FOLDER_EMOJI="📁"; MENU_EMOJI="📜"; ROCKET_EMOJI="🚀"; WARNING_EMOJI="⚠️"; GIT_EMOJI="🐙"; DOCKER_EMOJI="🐳"; INFO_EMOJI="ℹ️"

LLAMACPP_URL=${LLAMACPP_HOST:-"http://host.docker.internal:8001"} # host.docker.internal: syntax to get the localhost from the docker container


# --- Git Setup ---
setup_git() {
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
        echo "# GitHub Account (fallback)"
        echo "https://$GITHUB_ACCOUNT:$git_pat@github.com" > ~/.git-credentials
        echo ""
        echo -e "${YELLOW}GIT credentials${NC}"
        cat ~/.git-credentials
        echo ""
        echo -e "${GREEN}${GIT_EMOJI} Git configured!${NC}"
    fi
}


# --- GitHub CLI Setup ---
setup_github_cli() {
    if [[ -f ~/.git-credentials ]]; then
        local repo_path=$(git remote get-url origin 2>/dev/null | sed 's|.*github.com[/:]||' | sed 's|\.git$||')

        if [[ -z "$repo_path" ]]; then
            echo -e "${YELLOW}This is not a GIT repository ${NC}"
            return 1        
        fi

        echo -e "Repository: ${YELLOW}$repo_path${NC}\n"

        # look for ...project.git record in credentials
        export GITHUB_TOKEN=$(grep "$repo_path" ~/.git-credentials | sed -n 's|.*:\([^@]*\)@.*|\1|p')  

        if [[ -n "$GITHUB_TOKEN" ]]; then
            #echo $GH_TOKEN | gh auth login --with-token
            echo -e "${GREEN}🐙 GitHub CLI configured for ${repo_path}!${NC}"
        else
            # look for default credentials
            export GITHUB_TOKEN=$(grep '@github.com$' ~/.git-credentials | head -n1 | sed -n 's|.*:\([^@]*\)@.*|\1|p')
            echo -e "${GREEN}🐙 GitHub CLI configured with default credentials${NC}"
        fi

        #echo -e "GITHUB_TOKEN: ${GITHUB_TOKEN:0:15}***${GITHUB_TOKEN: -5}"
        gh auth status

        ### TEMP
        echo ""
        echo -e "${YELLOW}GIT credentials${NC}"
        cat ~/.git-credentials
    fi
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
    echo -e "${GREEN}${GIT_EMOJI} GitHub repository credentials configured!${NC}"
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
    clear

    mapfile -t projects < <(find /projects -mindepth 1 -maxdepth 1 -type d -printf "%f\n")

    if [ ${#projects[@]} -eq 0 ]; then
        echo -e "${YELLOW}No projects found. Clone a repo first!${NC}"
        clone_repo
        #continue
        #return 0
    fi

    echo $'\n\e[34m------------------------------------------------\e[0m'

    #echo -e "${YELLOW}${MENU_EMOJI} Select a project/action:${NC}"
    PS3=$'\e[34mSelect a project/action: \e[0m'
    COLUMNS=1  # ← force one item per line
    select proj in "${projects[@]}" "➕ Clone a repo" ">_ Shell"  "🔑 Add GitHub PAT for a repo" "🐙 Check GIT credentials" "❌ Exit" ; do
        if [[ "$proj" == "➕ Clone a repo" ]]; then
            clone_repo
            break
        elif [[ "$proj" == ">_ Shell" ]]; then 
            /bin/bash
            break  
        elif [[ "$proj" == "🔑 Add GitHub PAT for a repo" ]]; then
            add_github_pat
            #select_project
            break     
        elif [[ "$proj" == "🐙 Check GIT credentials" ]]; then
            echo -e "${YELLOW}GIT credentials${NC}"12
            cat ~/.git-credentials

            echo ""
            read -p "Do you want to set GIT crdentials? ([Yy]es/[N]o) " choice
            case "$choice" in
                Y|y|Yes|yes) setup_git 1 ;;
            esac

            break
        elif [[ "$proj" == "❌ Exit" ]]; then
            return 0
        elif [[ -n "$proj" ]]; then
            # custom tool function            
            start_project $proj
            break
        else
            echo -e "${RED}${WARNING_EMOJI} Invalid selection.${NC}"
        fi
    done

    # recursion
    select_project
}


# --- Clone a repository and create a new Project ---
clone_repo() {
    read -p "GitHub repo URL (MUST BE THE HTTPS PATH): " repo_url
    read -p "Directory name (leave blank for repo name): " proj_dir
    local proj_dir=${proj_dir:-$(basename "$repo_url" .git)}
    if [ -d "/projects/$proj_dir" ]; then
        echo -e "${RED}${WARNING_EMOJI} Directory '/projects/$dir_name' exists!${NC}"
        return 
    fi

    echo -e "${YELLOW}${GIT_EMOJI} Cloning into /projects/$proj_dir...${NC}"

    #read -p "Do you have a GitHub PAT for this repo? (y/n): " add_pat
    #if [[ "$add_pat" =~ ^[Yy]$ ]]; then
    #    add_github_pat
    #fi

    git clone "$repo_url" "/projects/$proj_dir" || {
        echo -e "${RED}${WARNING_EMOJI} Failed to clone!${NC}"
        return
    }
    echo -e "${GREEN}${GIT_EMOJI} Cloned successfully!${NC}"

    #read -p "Do you want to add a GitHub PAT for this repo? (y/n): " add_pat
    #if [[ "$add_pat" =~ ^[Yy]$ ]]; then
    #    add_github_pat
    #fi

    # Optional: Add Git hooks (e.g., pre-push) if needed
    # cp git_hook_pre_push.sh "/projects/$dir_name/.git/hooks/pre-push"
    # chmod +x "/projects/$dir_name/.git/hooks/pre-push"

    # call cuctom function of specific ai-tool
    start_project $proj_dir
}
