#!/bin/bash
# 📁 Pi Agent Project Manager: Select or clone a GitHub project, then run it with Pi Agent.
#   - Sets up Git credentials if missing.
#   - Lists projects in /projects (bind-mounted from host).
#   - Allows cloning new repos interactively.

cd /projects
source start_common.sh

# export to the current session all the variabled in .env
#set -a; source .env; set +a
source .env

if [[ -z "$GITHUB_ACCOUNT" ]]; then
    echo -e "${RED}⛔ GITHUB_ACCOUNT is not found. Set it in the .env file${NC}"
    exit 1
fi

if [[ -z "$EXA_API_KEY" ]]; then
    echo -e "${RED} EXA_API_KEY is not found. Set it in the .env file or some functionalities will not work${NC}"
fi

echo -e "\n${BOLD_PURPLE}================${NC}"
echo -e "${BOLD_PURPLE}=== Pi Agent ===${NC}"
echo -e "${BOLD_PURPLE}================${NC}"


start_project() {
    local proj=$1

    clear

    echo ""
    echo -e "${GREEN}${ROCKET_EMOJI} Running Pi Agent in project: $proj${NC}"
    cd "/projects/$proj" || exit 1

    setup_github_cli

    ### Pass over the current llama.cpp loaded model
    # TODO add another remote model for the quick switch (CTRL+P), --models "Llama.cpp/aaa , Novita.AI/xxx"  (models... plural)
    local model_param=""
    local llamacpp_model=$(get_llamacpp_loaded_model)
    if [[ -n "$llamacpp_model" ]]; then
        # "Llama.cpp" is the provider used for local llama.cpp server
        # --model.... singular, for a single model
        model_param="--model Llama.cpp/$llamacpp_model"
        echo ""
        echo -e "Found this llama.cpp model loaded: ${YELLOW} $llamacpp_model ${NC}"
    fi

    # Launch Pi Agent    
    echo -e "\e[34m-------------------\e[0m"
    PS3=$'\e[34mSelect an option: \e[0m'
    select choice in Continue Resume New No-session; do
        #clear
        if [[ "$choice" == "Continue" ]]; then
            pi $model_param --continue ; break
        elif [[ "$choice" == "Resume" ]]; then
            pi $model_param --resume ; break
        elif [[ "$choice" == "New" ]]; then
            pi $model_param --name "Main" ; break
        else
            pi $model_param --no-session ; break
        fi
    done
            
    echo -e "Pi Agent session closed. Bye!"
}


# --- Main ---
setup_git

#while true; do
    select_project
#done