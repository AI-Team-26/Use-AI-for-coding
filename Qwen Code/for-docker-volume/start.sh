#!/bin/bash
# script for the Docker Container

# Start Qwen in the selected  project

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Emojis
FOLDER_EMOJI="📁"
ROCKET_EMOJI="🚀"
WARNING_EMOJI="⚠️"

# Navigate to /projects
#cd /projects || { echo -e "${RED}${WARNING_EMOJI} Failed to enter /projects directory!${NC}"; exit 1; }


# List available projects (folders)
projects=($(ls -d */ | tr -d '/'))

# Function to display projects and prompt selection
select_project() {
    echo -e "${YELLOW}${FOLDER_EMOJI} Available projects:${NC}"
    select proj in "${projects[@]}"; do
        if [[ -n "$proj" ]]; then
            echo -e "${GREEN}${ROCKET_EMOJI} Running project: $proj${NC}"
            cd "$proj" || { echo -e "${RED}${WARNING_EMOJI} Failed to enter $proj!${NC}"; exit 1; }
            qwen
            break
        else
            echo -e "${RED}${WARNING_EMOJI} Invalid selection. Try again.${NC}"
        fi
    done
}

# Check if an argument is provided
if [ $# -gt 0 ]; then  # number of argumen > 0 ?
    if [[ " ${projects[@]} " =~ " $1 " ]]; then   # =~  is a regex for "contains"
        echo -e "${GREEN}${ROCKET_EMOJI} Running project: $1${NC}"
        cd "$1" || { echo -e "${RED}${WARNING_EMOJI} Failed to enter $1!${NC}"; exit 1; }
        qwen
    else
        echo -e "${RED}${WARNING_EMOJI} Project '$1' does not exist!${NC}"
        select_project
    fi
else
    select_project
fi
