#!/bin/bash
# Pi Agent Project Manager: Select or clone a GitHub project, then run it with Pi Agent.
#   - Manage GIT credentials.
#   - Lists projects in /projects (bind-mounted folder from host).
#   - Allows cloning new repos interactively.

set -euo pipefail

source /scripts/.env
source /scripts/utils.sh
source /scripts/start_common.sh

# check required environment variables are set
required_vars "AI_AGENT_NAME" "GITHUB_AGENT_ACCOUNT" "EXA_API_KEY"

# set API KEYS and other secrets used by skills and extensions
export EXA_API_KEY=$EXA_API_KEY
export AI_AGENT_NAME="${AI_AGENT_NAME:-Pi Agent}" ## passed by docker run
export PNPM_STORE_DIR="/scripts"  ## set the folder wherne PNPM will set the .pmpm-store

# First run only
# Restore the .pi folder content that is "masked" by the bind mount 
if [[ -f /root/.pi_backup.tar ]]; then
    echo "Restoring /root/.pi from TAR backup..."

    # Ensure the target directory exists (it might be masked by volume)
    mkdir -p /root/.pi

    # Extract the tarball into /root/.pi
    # -x: Extract
    # -f: File name
    # -C: Destination directory
    if tar -xf /root/.pi_backup.tar -C /root/.pi ; then
        echo "... Done! Backup removed successfully."
        rm /root/.pi_backup.tar
    else
        echo "CRITICAL ERROR: Tar extraction failed!" >&2
        exit 1
    fi
#else
#    echo "No backup found at /root/.pi_backup.tar. Skipping restore."
fi


start_project() {
    local proj=$1
    #clear

    # Pi save the used model in ~/.pi/agent/settings.json file, in the "defaultModel" property
    # If that is NOT set, we can try to use the default model for this agent or peek the one that is running in local llama.cpp

    # [OBSOLETE] Removed to allow to use a previous selected model within this Pi agent
    if [[ 1 == 2 ]]; then 
        ### Pass over the current llama.cpp loaded model
        # TODO add another remote model for the quick switch (CTRL+P), --models "Llama.cpp/aaa , Novita.AI/xxx"  (models... plural)
        local model_param=""
        local llamacpp_model=$(get_llamacpp_loaded_model)
        if [[ -n "$llamacpp_model" ]]; then
            # "Llama.cpp" is the provider used for local llama.cpp server (in models.json)
            # --model.... singular, for a single model
            model_param="--model Llama.cpp/$llamacpp_model"
            echo ""
            echo -e "Found this llama.cpp model running: ${YELLOW}${llamacpp_model}${NC}"
        fi

        # Launch Pi Agent
        if [[ -n "$AI_AGENT_DEFAULT_MODEL" ]]; then 
            model_param="$AI_AGENT_DEFAULT_MODEL"
        fi

        exec pi "$model_param" --continue
    fi

    # pi-status extension
    # extract the initial EMOJI or take the first 2 characters
    local agent_icon=${AI_AGENT_NAME%%[[:ascii:]]*}
    [[ -z $agent_icon ]] && agent_icon=${AI_AGENT_NAME:0:2}
    export PI_STATUS_AGENT_ICON=$agent_icon
    export PI_STATUS_DONE_ICON="🎉"

    exec pi --continue

    echo -e "Pi Agent session closed. Bye!"
}


# --- Main ---
echo -e "\n${BOLD_PURPLE}================${NC}"
echo -e "${BOLD_PURPLE}=== Pi Agent ===${NC}"
echo -e "${BOLD_PURPLE}================${NC}"

setup_git_global "$AI_AGENT_NAME"

select_project
