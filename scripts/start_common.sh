# COMMON script fo the start.sh in different tools


# --- Git Setup ---
setup_git() {
    if ! git config --global user.name >/dev/null 2>&1; then
        echo -e "${YELLOW}${GIT_EMOJI} Git not configured. Set up credentials:${NC}"
        read -p "GitHub username (does NOT require to match account): " git_username
        read -p "GitHub email: " git_email
        read -s -p "GitHub PAT (hidden): " git_pat
        echo
        git config --global user.name "$git_username"
        git config --global user.email "$git_email"
        git config --global credential.helper store
        echo "https://$git_username:$git_pat@github.com" > ~/.git-credentials
        echo -e "${GREEN}${GIT_EMOJI} Git configured!${NC}"      
    fi
}


# --- Config ---
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'; BOLD_PURPLE='\033[1;35m'
FOLDER_EMOJI="📁"; ROCKET_EMOJI="🚀"; WARNING_EMOJI="⚠️"; GIT_EMOJI="🐙"; DOCKER_EMOJI="🐳"

echo -e "${BOLD_PURPLE}Pi Agent${NC}\n"

cd /projects


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