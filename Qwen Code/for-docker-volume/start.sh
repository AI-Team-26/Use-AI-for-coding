#!/bin/bash
# 📁 Qwen Project Manager: Select or clone a GitHub project, then run it with `qwen`.
#   - Sets up Git credentials if missing.
#   - Lists projects in /projects (bind-mounted from host).
#   - Allows cloning new repos interactively.

cd /projects
source start_common.sh

echo -e "${BOLD_PURPLE}QWEN code${NC}\n"

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