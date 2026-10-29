#!/bin/bash
# OpenCode Project Manager: Select or clone a GitHub project, then run it with Pi Agent.
#   - Manage GIT credentials.
#   - Lists projects in /projects (bind-mounted folder from host).
#   - Allows cloning new repos interactively.

source /scripts/start_common.sh
source /scripts/.env

# check required environment variables are set
required_vars=("AI_AGENT_NAME" "GITHUB_AGENT_ACCOUNT" "EXA_API_KEY" )

for var in "${required_vars[@]}" ; do
    if [[ -z "${!var}" ]]; then
        echo -e "${RED}⛔ $var is not found. Set it in the .env file${NC}"
        exit 1
    fi
done

# set API KEYS and other secrets
export EXA_API_KEY=$EXA_API_KEY
export AI_AGENT_NAME="${AI_AGENT_NAME:-AI Agent}" ## passed by docker run

# First run only
# Restore the .opencode folder content that is "masked" by the bind mount 
if [[ -f /root/.opencode_backup.tar ]]; then
    echo setup customized agent files

    #sed -i "s/{{AI_AGENT_NAME}}/$AI_AGENT_NAME/g" "/.opencode/SYSTEM.md" 
    #sed -i "s/{{AI_AGENT_NAME}}/$AI_AGENT_NAME/g" "/.opencode/AGENTS.md" 

    echo "Restoring /root/.opencode from TAR backup..."

    # Ensure the target directory exists (it might be masked by volume)
    mkdir -p /root/.opencode

    # Extract the tarball into /root/.opencode
    # -x: Extract
    # -f: File name
    # -C: Destination directory
    if tar -xf /root/.opencode_backup.tar -C /root/.opencode ; then
        echo "... Done! Backup removed successfully."
        rm /root/.opencode_backup.tar
    else
        echo "CRITICAL ERROR: Tar extraction failed!" >&2
        exit 1
    fi
fi


start_project() {
    local proj=$1

    # --model

    #exec opencode web  --continue
    #exec opencode run --continue
    exec opencode 

    echo -e "OpenCode session closed. Bye!"
}


# --- Main ---
echo -e "\n${BOLD_PURPLE}================${NC}"
echo -e "${BOLD_PURPLE}=== OpenCode ===${NC}"
echo -e "${BOLD_PURPLE}================${NC}"

setup_git_global "$AI_AGENT_NAME"

select_project