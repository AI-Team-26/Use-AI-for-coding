# COMMON script for the start.sh script in the different tools folders (pi.dev, Qwen-Coder ...)
# The start_project function is defined in the single tool because it needs to use specific commands of the tool

source /scripts/git_common.sh

# --- Config ---
LLAMACPP_URL=${LLAMACPP_HOST:-"http://host.docker.internal:8001"} # host.docker.internal: syntax to get the localhost from the docker container

project_folder="/projects"

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; BLUE=$'\033[0;34m'; PURPLE=$'\033[0;35m'; BOLD_PURPLE=$'\033[1;35m'; NC=$'\033[0m'
HIGHLIGHT_AZURE=$'\033[0;44m'; HIGHLIGHT_PINK=$'\033[0;45m';
FOLDER_EMOJI="📁"; MENU_EMOJI="📜"; ROCKET_EMOJI="🚀"; WARNING_EMOJI="⚠️"; GIT_EMOJI="🐙"; DOCKER_EMOJI="🐳"; INFO_EMOJI="ℹ️"


echo "Replace {{PI_AGENT_NAME}} with '$PI_AGENT_NAME'"
sed -i "s/{{PI_AGENT_NAME}}/$PI_AGENT_NAME/g" "$HOME/.pi/agent/AGENTS.md"


# Extract the "model" property from llama.cpp running API (from first model)
# curl -s http://localhost:8001/models | 
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

    if [[ ! -d "$project_folder" ]]; then
        # create projects directory
        mkdir "$project_folder"
    fi

    mapfile -t projects < <(find "$project_folder" -mindepth 1 -maxdepth 1 -type d -printf "%f\n")

    echo $'\n\e[34m------------------------------------------------\e[0m'

    #echo -e "${YELLOW}${MENU_EMOJI} Select a project/action:${NC}"
    PS3=$'\e[34mSelect a project/action: \e[0m'
    COLUMNS=1  # ← force one item per line

    projects+=(
       "➕ Clone a repository"
       "➕ Create a new project"
       "➖ Delete a project"
       ">_ Shell"
       "🔑 Manage GitHub credentials"
       # "🔑 Add GitHub PAT for a repo"
       #"🐙 Check GIT credentials"       
       "❌ Exit"
    )
    
    select proj in "${projects[@]}" ; do
        if [[ "$proj" == "➕ Clone a repository" ]]; then
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
        elif [[ "$proj" == "🔑 Manage GitHub credentials" ]]; then
            manage_git_credentials
            break
        #elif [[ "$proj" == "🐙 Check GIT credentials" ]]; then
        #    echo -e "${YELLOW}GIT credentials${NC}"
        #    cat ~/.git-credentials
        #
        #    echo ""
        #    read -p "Do you want to (re)set the global GIT credentials? [Yy]es/[N]o " choice
        #    case "$choice" in
        #        Y|y|Yes|yes) setup_git_global 1 ;;
        #    esac
        #
        #    break
        elif [[ "$proj" == "❌ Exit" ]]; then
            return 0
        elif [[ -n "$proj" ]]; then

            clear

            echo ""
            echo -e "${GREEN}${ROCKET_EMOJI} Project: ${YELLOW}$proj${NC}"
            cd "$project_folder/$proj" || exit 1

            #local repo_path=$(git remote get-url origin 2>/dev/null | sed 's|.*github.com[/:]||' | sed 's|\.git$||')            
            local repo_url=$(git remote get-url origin 2>/dev/null)   
            if [[ -n "$repo_url" ]]; then
                if ! set_github_auth_for_repo "$repo_url" ; then
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
    if [ -d "$project_folder/$proj_dir" ]; then
        echo -e "${RED}${WARNING_EMOJI} Directory '$project_folder/$dir_name' already exists!${NC}"
        return 1
    fi

    set_github_auth_for_repo "$repo_url"

    # "https://github.com/account/repo.git" -> "account/repo"
    local repo_path=$(echo "$repo_url" | sed 's|.*github.com[/:]||' | sed 's|\.git$||')

    check_repo_access "$repo_path"

    case $? in
        0)
            # OK, Owner or collaborator, can use it
        ;;
        2)
            echo -e "Check if ${YELLOW}$repo_path${NC} is public..."
            local api_url="https://api.github.com/repos/$repo_path"

            # Query the GitHub API to check if the repo is public
            local response=$(curl -s -o /dev/null -w "%{http_code}" "$api_url")

            if [ "$response" -eq 200 ]; then
                # Repository is public
                echo -e "${GREEN}Repository is public. Proceeding with clone...${NC}"
            else
                check_and_accept_invite
                case $? in
                    0)
                    # invite accepted. Continue.
                    ;;
                    *)
                        echo "⛔ You cannot access this repo. You need to set credentials or be a collaborator."
                        return 1
                    ;;
                esac
            fi
        ;;
        *)
            return 1
        ;;
    esac

    # if .git-credentials is not ok for this repo, it will ask username/password to authenticate !!!
    gh repo clone "$repo_url" "$project_folder/$proj_dir" || {
        # Error is PAT has no permission on this repo: 
        # > GraphQL: Could not resolve to a Repository with the name 'AI-Team-26/game.Creatures'. (repository)
        echo -e "❌ Failed to clone!"
        return 1
    }

    echo -e "✔️ GitHub repository cloned!"

    cd "$project_folder/$proj_dir" || exit 1
    start_project "$proj_dir"
}

# --- Create a new project that is not (yet) linked to a repository ---
create_new_proj() {
    echo ""
    read -p "Name of the new project: " proj_name
    if [[ -z "$proj_name" ]]; then
        echo "(cancelled)"
        return 0
    fi

    mkdir "$project_folder/$proj_name" 
    cd "$project_folder/$proj_name" || exit 1
    pi
}

# --- Delete the project ---
delete_proj() {
    mapfile -t projects < <(find "$project_folder" -mindepth 1 -maxdepth 1 -type d -printf "%f\n")

    echo $'\n\e[34m------------------------------------------------\e[0m'

    PS3=$'\e[34mSelect the project to delete: \e[0m'
    COLUMNS=1  # ← force one item per line

    select proj in "${projects[@]}" "❌ Exit" ; do
        if [[ "$proj" == "❌ Exit" ]]; then
            return 0
        elif [[ -n "$proj" ]]; then
            rm -rf "$project_folder/$proj"
        fi
    done
}