# COMMON script for the start.sh script in the different tools folders (pi.dev, Qwen-Coder ...)
# The start_project function is defined in the single tool because it needs to use specific commands of the tool

set -euo pipefail

source /scripts/git_common.sh

# --- Config ---
LLAMACPP_URL=${LLAMACPP_HOST:-"http://host.docker.internal:8001"} # host.docker.internal: syntax to get the localhost from the docker container

project_folder="/projects"

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; BLUE=$'\033[0;34m'; PURPLE=$'\033[0;35m'; BOLD_PURPLE=$'\033[1;35m'; NC=$'\033[0m'
HIGHLIGHT_AZURE=$'\033[0;44m'; HIGHLIGHT_PINK=$'\033[0;45m';
FOLDER_EMOJI="📁"; MENU_EMOJI="📜"; ROCKET_EMOJI="🚀"; WARNING_EMOJI="⚠️"; GIT_EMOJI="🐙"; DOCKER_EMOJI="🐳"; INFO_EMOJI="ℹ️"


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


# Prints a numbered menu, one item per line (same look as `select` with COLUMNS=1).
print_menu() {
    local i=1 item
    for item in "$@"; do
        printf '%2d) %s\n' "$i" "$item"
        i=$((i + 1))
    done
}

# Reads a menu answer like `select` did, but a lone ESC cancels.
# The raw answer is put in MENU_REPLY. Return codes tell the caller how to end:
#   0 = answer read (may be empty)
#   1 = stdin closed (EOF): terminal gone, caller reports interruption and exits
#   2 = ESC pressed: deliberate cancel, caller treats it as the "❌ Exit" item
# Only the first char is read raw (to catch ESC); the rest of the line keeps
# normal terminal editing. Arrow/function keys also start with ESC, so their
# sequence is drained and ignored instead of cancelling.
read_menu_input() {
    local prompt=$1 first rest seq
    MENU_REPLY=""
    while true; do
        printf '%s' "$prompt"
        IFS= read -rsn1 first || return 1
        if [[ "$first" == $'\e' ]]; then
            seq=""
            IFS= read -rsn5 -t 0.05 seq 2>/dev/null || :
            printf '\n'
            if [[ -z "$seq" ]]; then
                return 2
            fi
            continue
        fi
        if [[ -z "$first" ]]; then
            printf '\n'
            return 0
        fi
        printf '%s' "$first"
        IFS= read -r rest || return 1
        MENU_REPLY="$first$rest"
        return 0
    done
}

# --- Select or Clone a Project ---
select_project() {
    #sleep 10
    #clear

    if [[ ! -d "$project_folder" ]]; then
        # create projects directory
        mkdir "$project_folder"
    fi

    local projects proj action_done=0 rc=0

    # Loop instead of recursing: an unguarded tail-recursion spins forever
    # when stdin hits EOF (terminal closed at the prompt), because the read
    # aborts without running its body and would re-enter the function endlessly.
    while true; do
        #mapfile -t projects < <(find "$project_folder" -mindepth 1 -maxdepth 1 -type d ! -name ".pnpm-store" -printf "%f\n")
        mapfile -t projects < <(find "$project_folder" -mindepth 1 -maxdepth 1 -type d -printf "%f\n")

        echo $'\n\e[34m------------------------------------------------\e[0m'

        #echo -e "${YELLOW}${MENU_EMOJI} Select a project/action:${NC}"
        PS3=$'\e[34mSelect a project/action: \e[0m'

        # ≫ ══ • ⬩➤ ⇢╰┈➤ ➝🏝️💥➕➔🌟✨
        # 🗑️

        projects+=(
           "🧩 Clone a repository"
           "🏝️ Create a new project"
           "🗑️ Delete a project"
           ">_ Shell"
           "🔑 Manage GitHub credentials"
           #"🔑 Add GitHub PAT for a repo"
           #"🐙 Check GIT credentials"       
           "❌ Exit"
        )

        action_done=0
        print_menu "${projects[@]}"
        while true; do
            rc=0
            read_menu_input "$PS3" || rc=$?
            if [[ $rc -eq 1 ]]; then
                break      # stdin closed: handled after the loop
            elif [[ $rc -eq 2 ]]; then
                return 0   # ESC acts like "❌ Exit"
            elif [[ -z "$MENU_REPLY" ]]; then
                continue 2 # empty line: redraw the menu, like `select` did
            fi
            proj=""
            if [[ "$MENU_REPLY" =~ ^[0-9]+$ ]] && (( 10#$MENU_REPLY >= 1 && 10#$MENU_REPLY <= ${#projects[@]} )); then
                proj=${projects[10#$MENU_REPLY - 1]}
            fi
            if [[ "$proj" == "🧩 Clone a repository" ]]; then
                # clone_repo returns 1 on failure; keep the menu alive under errexit
                clone_repo || :
                action_done=1
                break
            elif [[ "$proj" == "🏝️ Create a new project" ]]; then
                create_new_proj
                action_done=1
                break
            elif [[ "$proj" == "🗑️ Delete a project" ]]; then
                # delete_proj returns 1 on EOF; keep the menu alive under errexit
                delete_proj || :
                action_done=1
                break
            elif [[ "$proj" == ">_ Shell" ]]; then 
                /bin/bash
                action_done=1
                break  
            elif [[ "$proj" == "🔑 Manage GitHub credentials" ]]; then
                manage_git_credentials || :
                action_done=1
                break
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
                action_done=1
                break
            else
                echo -e "${WARNING_EMOJI} Invalid selection. Retry."
            fi
        done

        # The prompt loop exited without any handled action = stdin closed (EOF):
        # stop cleanly instead of redrawing the menu forever.
        if [[ $action_done -eq 0 ]]; then
            echo -e "\n${WARNING_EMOJI} Input interrupted or terminal closed. Exiting."
            return 1
        fi
    done
}


# --- Clone a repository and create a new Project ---
clone_repo() {
    echo ""
    read -p "GitHub repo URL (MUST BE THE HTTPS PATH): " repo_url
    read -p "Directory name (leave blank for repo name): " proj_dir
    local proj_dir; proj_dir=${proj_dir:-$(basename "$repo_url" .git)}
    if [ -d "$project_folder/$proj_dir" ]; then
        echo -e "${RED}${WARNING_EMOJI} Directory '$project_folder/$proj_dir' already exists!${NC}"
        return 1
    fi

    set_github_auth_for_repo "$repo_url" || return 1

    # "https://github.com/account/repo.git" -> "account/repo"
    local repo_path; repo_path=$(echo "$repo_url" | sed 's|.*github.com[/:]||' | sed 's|\.git$||')

    # Guard the call: a bare non-zero return would abort the script under errexit.
    # Running it in a `||` context also disables errexit inside check_repo_access,
    # so its internal `check_and_accept_invite` + `case $?` works as intended.
    local rc=0
    check_repo_access "$repo_path" || rc=$?   # rc holds the non-zero exit status

    case $rc in
        "$REPO_ACCESS_OK")
            # OK, Owner or collaborator, can use it
        ;;
        "$REPO_ACCESS_READ_ONLY")
            echo -e "Check if ${YELLOW}$repo_path${NC} is public..."
            local api_url="https://api.github.com/repos/$repo_path"

            # Query the GitHub API to check if the repo is public
            local response=$(curl -s -o /dev/null -w "%{http_code}" "$api_url")

            if [ "$response" -eq 200 ]; then
                # Repository is public
                echo -e "${GREEN}Repository is public. Proceeding with clone...${NC}"
            else
                # check_repo_access already looked for a pending invitation and
                # reported it as not found (that is the READ_ONLY code), so a second
                # lookup here would only repeat the same API call.
                echo "⛔ You cannot access this repo. You need to set credentials or be a collaborator."
                return 1
            fi
        ;;
        *)
            return "$REPO_ACCESS_ERROR"
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
    local projects
    mapfile -t projects < <(find "$project_folder" -mindepth 1 -maxdepth 1 -type d -printf "%f\n")

    echo $'\n\e[34m------------------------------------------------\e[0m'

    PS3=$'\e[34mSelect the project to delete: \e[0m'

    local items=("${projects[@]}" "❌ Exit")
    print_menu "${items[@]}"

    local action_done=0 rc=0 proj
    while true; do
        rc=0
        read_menu_input "$PS3" || rc=$?
        if [[ $rc -eq 1 ]]; then
            break
        elif [[ $rc -eq 2 ]]; then
            return 0   # ESC acts like "❌ Exit": back to the main menu
        elif [[ -z "$MENU_REPLY" ]]; then
            print_menu "${items[@]}"
            continue
        fi
        proj=""
        if [[ "$MENU_REPLY" =~ ^[0-9]+$ ]] && (( 10#$MENU_REPLY >= 1 && 10#$MENU_REPLY <= ${#items[@]} )); then
            proj=${items[10#$MENU_REPLY - 1]}
        fi
        if [[ "$proj" == "❌ Exit" ]]; then
            return 0
        elif [[ -n "$proj" ]]; then
            rm -rf "$project_folder/$proj"
            echo -e "${GREEN}✔️ Project '$proj' deleted.${NC}"
            action_done=1
            break
        else
            echo -e "${WARNING_EMOJI} Invalid selection. Retry."
        fi
    done

    # stdin closed (EOF) at this prompt: bail out, caller re-shows main menu
    if [[ $action_done -eq 0 ]]; then
        echo -e "${WARNING_EMOJI} Input interrupted or terminal closed."
        return 1
    fi
}
