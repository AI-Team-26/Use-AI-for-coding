#!/bin/bash
# Pi Agent Project Manager: Select or clone a GitHub project, then run it with Pi Agent.
#   - Sets up Git credentials if missing.
#   - Lists projects in /projects (bind-mounted from host).
#   - Allows cloning new repos interactively.

source /scripts/start_common.sh
source /scripts/.env
#cd /projects

# export to the current session all the variabled in .env
#set -a; source .env; set +a


if [[ -z "$GITHUB_ACCOUNT" ]]; then
    echo -e "${RED}⛔ GITHUB_ACCOUNT is not found. Set it in the .env file${NC}"
    exit 1
fi

if [[ -z "$EXA_API_KEY" ]]; then
    echo -e "${RED} EXA_API_KEY is not found. Set it in the .env file or some functionalities will not work${NC}"
fi

# set API KEYS and other secrets
export EXA_API_KEY=$EXA_API_KEY

start_project() {
    local proj=$1

    #clear

    ### Pass over the current llama.cpp loaded model
    # TODO add another remote model for the quick switch (CTRL+P), --models "Llama.cpp/aaa , Novita.AI/xxx"  (models... plural)
    local model_param=""
    local llamacpp_model=$(get_llamacpp_loaded_model)
    if [[ -n "$llamacpp_model" ]]; then
        # "Llama.cpp" is the provider used for local llama.cpp server (in models.json)
        # --model.... singular, for a single model
        model_param="--model Llama.cpp/$llamacpp_model"
        echo ""
        echo -e "Found this llama.cpp model running: ${YELLOW} $llamacpp_model ${NC}"
    fi

    # Launch Pi Agent
    exec pi $model_param --continue

    # user choice
    #echo -e "\e[34m-------------------\e[0m"
    #PS3=$'\e[34mSelect an option: \e[0m'
    #select choice in Continue Resume New ; do
    #    # use exec so when the host shell close the pi process is killed
    #    case "$choice" in
    #        Continue)  exec pi $model_param --continue ;;
    #        Resume)    exec pi $model_param --resume ;;
    #        New)       exec pi $model_param --name $(date +%y.%m.%d) ;; # YY.MM.DD
    #        #No-session|*) exec pi $model_param --no-session ;;
    #    esac
    #done
            
    echo -e "Pi Agent session closed. Bye!"
}


# --- Main ---
echo -e "\n${BOLD_PURPLE}================${NC}"
echo -e "${BOLD_PURPLE}=== Pi Agent ===${NC}"
echo -e "${BOLD_PURPLE}================${NC}"

setup_git_global

select_project