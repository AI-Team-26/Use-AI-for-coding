# Setup the OpenCode containers
# - Copy the scripts

docker_volumes=${1:?The path to docker volumes folder is required}

set -euo pipefail

source .env

# check required environment variables are set
required_vars=("GITHUB_AGENT_ACCOUNT" "GITHUB_ORG" "GITHUB_REVIEWER" "GITHUB_MAIN_ACCOUNT_EMAIL")
# PAT for PI AGENT GitHub account and Organization
required_vars=("GITHUB_AGENT_ACCOUNT_PAT" "GITHUB_ORG_PAT")


mkdir -p "$docker_volumes/scripts"

# Copy common startup scripts and configurations
cp ../scripts/start_common.sh "$docker_volumes/scripts/start_common.sh"
cp ../scripts/git_common.sh "$docker_volumes/scripts/git_common.sh"
cp start.sh "$docker_volumes/scripts/start.sh"
cp .env "$docker_volumes/scripts/.env"



# === Set GitHub PAT (for Agent Account and Organization) ===

account_pat="$GITHUB_AGENT_ACCOUNT_PAT"  # Read from .env
if [[ $account_pat == ENV:* ]]; then
    var_name="${account_pat#ENV:}"  # Remove "ENV:"
    account_pat="${!var_name}"
fi

if [[ -z "$account_pat" ]]; then
    echo -e "${RED}⛔ Failed to get GitHub Account PAT from GITHUB_AGENT_ACCOUNT_PAT ${NC}"
    exit 1
fi

org_pat="$GITHUB_ORG_PAT"  # Read from .env
if [[ $org_pat == ENV:* ]]; then
    var_name="${org_pat#ENV:}"  # Remove "ENV:"
    org_pat="${!var_name}"
fi

if [[ -z "$org_pat" ]]; then
    echo -e "${RED}⛔ Failed to get GitHub Organiation PAT from GITHUB_ORG_PAT ${NC}"
    exit 1
fi

echo "$GITHUB_AGENT_ACCOUNT:$account_pat" > "$docker_volumes/scripts/github_pat"  # Write
echo "$GITHUB_ORG:$org_pat" >> "$docker_volumes/scripts/github_pat"  # Append

# GITHUB_MAIN_ACCOUNT is optional (it allows access to personal GitHub account repositories)
if [[ -n "$GITHUB_MAIN_ACCOUNT" ]]; then

    main_account_pat="$GITHUB_MAIN_ACCOUNT_PAT"  # Read from .env
    if [[ $main_account_pat == ENV:* ]]; then
        var_name="${main_account_pat#ENV:}"  # Remove "ENV:"
        main_account_pat="${!var_name}"
    fi

    if [[ -z "$main_account_pat" ]]; then
        echo -e "${RED}⛔ Failed to get optional GitHub MAIN account PAT from GITHUB_MAIN_ACCOUNT_PAT ${NC}"
        exit 1
    fi

    echo "$GITHUB_MAIN_ACCOUNT:$main_account_pat" >> "$docker_volumes/scripts/github_pat"  # Append
fi

chmod 600 "$docker_volumes/scripts/github_pat"


# === Setup Agents ===

# Agent names (have to match the ones defined in README_Pi_Agent.md)
declare -A agents

# 🍌 🍇 🍆 🍉 🍎
# ♍ Virgo  ♊ Gemini ♉ Taurus ♈ Aries
# 🔵 🟣 🟤
# Ⓜ️ M 🅿️ P
#agents["Dev-1"]="💦 Water"
#agents["Dev-2"]="💨 Wind" 
#agents["Dev-3"]="🔥 Fire" 
agents["OpenCode-1"]="🔵 Blu-AI"
agents["OpenCode-2"]="🟣 Purple-AI" 

for agent in "${!agents[@]}"; do

    AI_AGENT_NAME=${agents[$agent]}

    echo ""
    echo "=== Processing agent ${agent} ==="
    echo "AI_AGENT_NAME: ${AI_AGENT_NAME}"
    echo "Target: ${docker_volumes}/${agent}"

    # Create target directory structure
    mkdir -p "$docker_volumes/$agent/projects"
    docker_volume_opencode="$docker_volumes/$agent/opencode"
    mkdir -p "$docker_volume_opencode"
    #mkdir -p "$docker_volume_ai_agent/skills"
    #mkdir -p "$docker_volume_ai_agent/extensions"

    # Copy configuration files
    cp AGENTS.md "$docker_volume_opencode/AGENTS.md"
    cp SYSTEM.md "$docker_volume_opencode/SYSTEM.md"
    #cp Hardware_and_Software.md "$docker_volume_opencode/Hardware_and_Software.md"

    # Set accounts on SYSTEM.md
    sed -i "s/{{GITHUB_AGENT_ACCOUNT}}/$GITHUB_AGENT_ACCOUNT/g" "$docker_volume_opencode/SYSTEM.md" 
    sed -i "s/{{GITHUB_REVIEWER}}/$GITHUB_REVIEWER/g" "$docker_volume_opencode/SYSTEM.md"

    # Set accounts on AGENTS.md
    sed -i "s/{{GITHUB_AGENT_ACCOUNT}}/$GITHUB_AGENT_ACCOUNT/g" "$docker_volume_opencode/AGENTS.md"
    sed -i "s/{{GITHUB_REVIEWER}}/$GITHUB_REVIEWER/g" "$docker_volume_opencode/AGENTS.md"

    # Set AI Agent name
    sed -i "s/{{AI_AGENT_NAME}}/$AI_AGENT_NAME/g" "$docker_volume_opencode/SYSTEM.md" 
    sed -i "s/{{AI_AGENT_NAME}}/$AI_AGENT_NAME/g" "$docker_volume_opencode/AGENTS.md"

    echo "✓ Done copying for ${agent}"
done
