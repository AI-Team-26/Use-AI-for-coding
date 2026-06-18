#!/bin/bash
# 📁 Pi Agent Project Manager: Select or clone a GitHub project, then run it with Pi Agent.
#   - Sets up Git credentials if missing.
#   - Lists projects in /projects (bind-mounted from host).
#   - Allows cloning new repos interactively.

cd /projects
source start_common.sh

echo -e "${bold}=== Pi Agent ==="
echo -e "${bold}================${NC}"

git_account="(not set)"

# --- Git Setup ---
setup_git() {
    if ! git config --global user.name >/dev/null 2>&1; then
        echo -e "${YELLOW}${GIT_EMOJI} Git not configured. Set up credentials:${NC}"
        read -p "GitHub account: " git_account
        read -p "GitHub user name (Commit author username): " git_username
        read -p "GitHub email: " git_email
        read -s -p "GitHub PAT (hidden): " git_pat; echo

        export GITHUB_ACCOUNT=$git_account

        git config --global user.name "$git_username"
        git config --global user.email "$git_email"
        git config --global credential.helper store
        #echo "https://$git_account:$git_pat@github.com" > ~/.git-credentials
        # credentials.useHttpPath = true
        # Set the default credentials (repository owner)
        echo "https://$git_account:$git_pat@github.com" >> ~/.git-credentials
        echo -e "${GREEN}${GIT_EMOJI} Git configured!${NC}"
    fi
}

# --- GitHub CLI Setup ---
setup_github_cli() {
    if [[ -f ~/.git-credentials ]]; then
        local repo_path=$(git remote get-url origin 2>/dev/null | sed 's|.*github.com[/:]||' | sed 's|\.git$||')
        echo -e "Repository: $repo_path"

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
    select proj in "${projects[@]}" "➕ Clone a new project" "🔑 Add GitHub PAT for a repo" "😎 No-session Chat" ">_ Shell" "❌ Exit"; do
        if [[ "$proj" == "➕ Clone a new project" ]]; then
            clone_project; select_project; break
        elif [[ "$proj" == "🔑 Add GitHub PAT for a repo" ]]; then
            add_github_pat; select_project; break
        elif [[ "$proj" == "😎 No-session Chat" ]]; then
            pi --no-session
        elif [[ "$proj" == ">_ Shell" ]]; then 
            show_help
            /bin/bash
            #break
            #select_project
            break          
        elif [[ "$proj" == "❌ Exit" ]]; then
            exit 0
        elif [[ -n "$proj" ]]; then
            echo -e "${GREEN}${ROCKET_EMOJI} Running Pi Agent in project: $proj${NC}"
            cd "/projects/$proj" || exit 1

            setup_github_cli

            # Launch Pi Agent (adjust flags as needed)
            # Example: pi-agent --model <model_name> --api-key <your_key>
            #pi echo "use /resume to pick a previous session"

            echo "Select what to do:"
            select choice in continue resume new n0-session; do
                if [[ "$choice" == "continue" ]]; then
                    pi --continue ; break
                elif [[ "$choice" == "resume" ]]; then
                    pi --resume ; break
                elif [[ "$choice" == "new" ]]; then
                    pi --name "main" ; break
                else
                    pi --no-session ; break
                fi
            done
            
            echo -e "Pi Agent session closed. Bye!"
            break 
        else
            echo -e "${RED}${WARNING_EMOJI} Invalid selection.${NC}"
        fi
    done
}

# --- Main ---
setup_git
select_project