#!/bin/bash
# 📁 Pi Agent Project Manager: Select or clone a GitHub project, then run it with Pi Agent.
#   - Sets up Git credentials if missing.
#   - Lists projects in /projects (bind-mounted from host).
#   - Allows cloning new repos interactively.

cd /projects
source start_common.sh
if [[ -f set_api_keys.sh ]]; then 
    source set_api_keys.sh
fi

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
        git config --global credential.useHttpPath true
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
        echo -e "Repository: $repo_path\n"

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
        echo "exit setup_github_cli"
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

    sleep 2
    cd "/projects/$dir_name"
    pi --name "Start"
    # Optional: Add Git hooks (e.g., pre-push) if needed
    # cp git_hook_pre_push.sh "/projects/$dir_name/.git/hooks/pre-push"
    # chmod +x "/projects/$dir_name/.git/hooks/pre-push"
}

# --- Main ---
setup_git
select_project