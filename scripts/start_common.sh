# COMMON script fo the start.sh in different tools

# --- Config ---
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'; BOLD_PURPLE='\033[1;35m'; bold=$(tput bold)
FOLDER_EMOJI="📁"; MENU_EMOJI="📜"; ROCKET_EMOJI="🚀"; WARNING_EMOJI="⚠️"; GIT_EMOJI="🐙"; DOCKER_EMOJI="🐳"; INFO_EMOJI="ℹ️"

LLAMACPP_URL=${LLAMACPP_HOST:-"http://host.docker.internal:8001"} # host.docker.internal: syntax to get the localhost from the docker container

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
            echo -e "${RED}❌ Error: A user name must be defined"
            return 1
        fi
    fi    
    
    read -p "GitHub repository (MUST be HTTPS): " git_repo

    # Check git_repo starts with "https://", if not error message
    if [[ ! "$git_repo" =~ ^https:// ]]; then
        echo -e "${RED}❌ Error: Repository URL must start with https://${NC}"
        return 1
    fi

    # Create the path for the credentials record = remove the initial "https://"
    local repo_path="${git_repo#https://}"

    read -s -p "GitHub PAT (hidden): " git_pat; echo    

    echo "https://$git_username:$git_pat@$repo_path" >> ~/.git-credentials
    echo -e "${GREEN}${GIT_EMOJI} GitHub repository credentials configured!${NC}"
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


get_llamacpp_loaded_gguf() {
    local gguf_loaded
    gguf_loaded=$(curl -s "$LLAMACPP_URL/models" | python3 -c '
import sys, json
data = json.load(sys.stdin)
models = data.get("models", [])
if models:
    print(models[0].get("model", ""))
')
    echo "$gguf_loaded"
}


# --- Select or Clone a Project ---
select_project() {

    # debug
    get_llamacpp_loaded_gguf 


    mapfile -t projects < <(find /projects -mindepth 1 -maxdepth 1 -type d -printf "%f\n")

    if [ ${#projects[@]} -eq 0 ]; then
        echo -e "${YELLOW}No projects found. Clone one first!${NC}"
        clone_project
        return 0
    fi

    echo -e "${YELLOW}${MENU_EMOJI} Select a project/action:${NC}"
    COLUMNS=1  # ← force one item per line
    select proj in "${projects[@]}" "➕ Clone a new project" "🔑 Add GitHub PAT for a repo" "😎 No-session Chat" ">_ Shell" "❌ Exit"; do
        if [[ "$proj" == "➕ Clone a new project" ]]; then
            clone_project; break
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

            ### Pass over the current llama.cpp loaded model
            # TODO add another remote model for the quick switch (CTRL+P), --models "Llama.cpp/aaa , Novita.AI/xxx"  (models... plural)
            local model_param=""
            local llamacpp_model=$(get_llamacpp_loaded_gguf)
            if [[ -n "$llamacpp_model" ]]; then
                # "Llama.cpp" is the provider used for local llama.cpp server
                # --model.... singular, for a single model
                model_param="--model Llama.cpp/$llamacpp_model"
                echo -e "Found this llama.cpp model loaded: ${YELLOW} $llamacpp_model ${NC}"
            fi

            # Launch Pi Agent

            echo "Select what to do:"
            select choice in continue resume new no-session; do
                #clear
                if [[ "$choice" == "continue" ]]; then
                    pi $model_param --continue ; break
                elif [[ "$choice" == "resume" ]]; then
                    pi $model_param --resume ; break
                elif [[ "$choice" == "new" ]]; then
                    pi $model_param --name "main" ; break
                else
                    pi $model_param --no-session ; break
                fi
            done
            
            echo -e "Pi Agent session closed. Bye!"
            break 
        else
            echo -e "${RED}${WARNING_EMOJI} Invalid selection.${NC}"
        fi
    done
}


# --- Clone a New Project ---
clone_project() {
    read -p "GitHub repo URL (MUST BE THE HTTPS PATH): " repo_url
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

    read -p "Do you want to add a GitHub PAT for this repo? (y/n): " add_pat
    if [[ "$add_pat" =~ ^[Yy]$ ]]; then
        add_github_pat
    fi

    # Optional: Add Git hooks (e.g., pre-push) if needed
    # cp git_hook_pre_push.sh "/projects/$dir_name/.git/hooks/pre-push"
    # chmod +x "/projects/$dir_name/.git/hooks/pre-push"
}