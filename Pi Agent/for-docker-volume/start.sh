#!/bin/bash
# 📁 Pi Agent Project Manager: Select or clone a GitHub project, then run it with Pi Agent.
#   - Sets up Git credentials if missing.
#   - Lists projects in /projects (bind-mounted from host).
#   - Allows cloning new repos interactively.

cd /projects
source start_common.sh

echo -e "${bold}=== Pi Agent ==="
echo -e "${bold}================${NC}"


# --- Git Setup ---
setup_git() {
    if ! git config --global user.name >/dev/null 2>&1; then
        echo -e "${YELLOW}${GIT_EMOJI} Git not configured. Set up credentials:${NC}"
        read -p "GitHub username (does NOT require to match account): " git_username
        read -p "GitHub email: " git_email
        read -s -p "GitHub PAT (hidden): " git_pat; echo
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
        local repo_path=$(git remote get-url origin 2>/dev/null | sed 's|.*github.com[/:]||' | sed 's|\.git$||')
        if [[ -n "$repo_path" ]]; then
            export GH_TOKEN=$(grep "$repo_path" ~/.git-credentials | sed -n 's|.*:\([^@]*\)@.*|\1|p')
            echo -e "${GREEN}🐙 GitHub CLI configured for ${repo_path}!${NC}"
        fi
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

    # Optional: Add Git hooks (e.g., pre-push) if needed
    # cp git_hook_pre_push.sh "/projects/$dir_name/.git/hooks/pre-push"
    # chmod +x "/projects/$dir_name/.git/hooks/pre-push"
}

# --- Select or Clone a Project ---
select_project() {
    mapfile -t projects < <(find /projects -mindepth 1 -maxdepth 1 -type d -printf "%f\n")

    if [ ${#projects[@]} -eq 0 ]; then
        echo -e "${YELLOW}${FOLDER_EMOJI} No projects found. Clone one first!${NC}"
        clone_project
        select_project
        return
    fi

    echo -e "${YELLOW}${FOLDER_EMOJI} Select a project:${NC}"
    select proj in "${projects[@]}" "➕ Clone a new project" "🔑 Add GitHub PAT for a repo" "💻 Shell" "❌ Exit"; do
        if [[ "$proj" == "➕ Clone a new project" ]]; then
            clone_project; select_project; break
        elif [[ "$proj" == "🔑 Add GitHub PAT for a repo" ]]; then
            add_github_pat; select_project; break
        elif [[ "$proj" == "💻 Shell" ]]; then
            show_help
            /bin/bash
            #break
            #select_project
            exit 0            
        elif [[ "$proj" == "❌ Exit" ]]; then
            exit 0
        elif [[ -n "$proj" ]]; then
            echo -e "${GREEN}${ROCKET_EMOJI} Running Pi Agent in project: $proj${NC}"
            cd "/projects/$proj" || exit 1

            setup_github_cli

            # Launch Pi Agent (adjust flags as needed)
            # Example: pi-agent --model <model_name> --api-key <your_key>
            pi
            break
        else
            echo -e "${RED}${WARNING_EMOJI} Invalid selection.${NC}"
        fi
    done
}

# --- Main ---
setup_git
select_project