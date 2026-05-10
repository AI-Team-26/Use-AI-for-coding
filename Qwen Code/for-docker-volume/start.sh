#!/bin/bash
# 📁 Qwen Project Manager: Select or clone a GitHub project, then run it with `qwen`.
#   - Sets up Git credentials if missing.
#   - Lists projects in /projects (bind-mounted from host).
#   - Allows cloning new repos interactively.

# --- Config ---
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'; BOLD_PURPLE='\033[1;35m'
FOLDER_EMOJI="📁"; ROCKET_EMOJI="🚀"; WARNING_EMOJI="⚠️"; GIT_EMOJI="🐙"; DOCKER_EMOJI="🐳"


echo -e "${BOLD_PURPLE}QWEN code${NC}\n"

cd /projects

# --- Git Setup ---
setup_git() {
    if ! git config --global user.name >/dev/null 2>&1; then
        echo -e "${YELLOW}${GIT_EMOJI} Git not configured. Set up credentials:${NC}"
        read -p "GitHub username: " git_username
        read -p "GitHub email: " git_email
        read -s -p "GitHub PAT: " git_pat; echo
        git config --global user.name "$git_username"
        git config --global user.email "$git_email"
        git config --global credential.helper store
        echo "https://$git_username:$git_pat@github.com" > ~/.git-credentials
        echo -e "${GREEN}${GIT_EMOJI} Git configured!${NC}"      
    fi
}

# --- GitHub CLI Setup ---
setup_github_cli() {
    if [[ -f ~/.git-credentials ]]; then

        # can be HTTPS or git URL
        local repo_path=$(git remote get-url origin 2>/dev/null | sed 's|.*github.com[/:]||' | sed 's|\.git$||')

        if [[ -n "$repo_path" ]]; then
            #export GH_TOKEN=$(grep "$repo_path" ~/.git-credentials | sed -n 's|https://[^:]*:\([^@]*\)@github.com|\1|p' | head -1)
            #export GH_TOKEN=$(grep "$repo_path" ~/.git-credentials | awk -F'[:/]' '{print $3}' | head -1)
            export GH_TOKEN=$(grep "$repo_path" ~/.git-credentials | sed -n 's|.*:\([^@]*\)@.*|\1|p')
            echo -e "${GREEN}🐙 GitHub CLI configured for ${repo_path}!${NC}"
        fi
        
        #export GH_TOKEN=$(sed -n 's|https://[^:]*:\([^@]*\)@github.com|\1|p' ~/.git-credentials)
        #echo -e "${GREEN}🐙 GitHub CLI configured!${NC}"
    fi  
}

# --- Clone a New Project ---
clone_project() {
    read -p "GitHub repo URL: " repo_url
    read -p "Directory name (leave blank for repo name): " dir_name
    dir_name=${dir_name:-$(basename "$repo_url" .git)}
    if [ -d "/projects/$dir_name" ]; then
        echo -e "${RED}${WARNING_EMOJI} Directory '/projects/$dir_name' exists!${NC}"
        return
    fi
    echo -e "${YELLOW}${GIT_EMOJI} Cloning into /projects/$dir_name...${NC}"
    git clone "$repo_url" "/projects/$dir_name" || {
        echo -e "${RED}${WARNING_EMOJI} Clone failed!${NC}"; return
    }
    echo -e "${GREEN}${GIT_EMOJI} Cloned successfully!${NC}"


    # Set the Git pre-push to avoid push directly to main branch
    cp git_hook_pre_push.sh "/projects/$dir_name/.git/hooks/pre-push"
    # Make it executable (REQUIRED - Git ignores non-executable hooks)
    chmod +x "/projects/$dir_name/.git/hooks/pre-push"
}

# --- Select or Clone a Project ---
select_project() {

    # List available projects (folders in current directory)
    # $(...) perform word splitting, will not work with names with spaces
    #projects=($(ls -d */ 2>/dev/null | tr -d '/'))
    mapfile -t projects < <(find /projects -mindepth 1 -maxdepth 1 -type d -printf "%f\n")

    if [ ${#projects[@]} -eq 0 ]; then
    
        echo -e "${YELLOW}${FOLDER_EMOJI} No projects found. Clone one first!${NC}"
        clone_project
        select_project
        return
    fi
    
    echo -e "${YELLOW}${FOLDER_EMOJI} Select a projects:${NC}"   
    select proj in "${projects[@]}" "➕ Clone a new project" "💻 Shell" "⭕ Exit"; do
    
        if [[ "$proj" == "➕ Clone a new project" ]]; then
            clone_project; select_project; break
        elif [[ "$proj" == "💻 Shell" ]]; then            
            /bin/bash  
            #exit 1
        elif [[ "$proj" == "⭕ Exit" ]]; then
            exit 0
        elif [[ -n "$proj" ]]; then
            echo -e "${GREEN}${ROCKET_EMOJI} Running project: $proj${NC}"
            cd "/projects/$proj" || exit 1

            setup_github_cli

            # --no-sandbox: if sandbox is enabled — the Docker-in-Docker overhead adds latency
            # https://qwenlm.github.io/qwen-code-docs/en/users/features/sandbox/ 
            # QWEN_SANDBOX=true|false|docker|podman|sandbox-exec
            export QWEN_SANDBOX=false
            #  --debug
            qwen --continue; break
        else
            echo -e "${RED}${WARNING_EMOJI} Invalid selection.${NC}"
        fi
    done
}

# --- Main ---
setup_git
select_project