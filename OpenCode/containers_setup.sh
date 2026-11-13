# Setup the OpenCode containers
# - Copy the scripts

set -euo pipefail

source .env
source ../scripts/utils.sh
source constants.sh

# check required environment variables are set
required_vars "GITHUB_AGENT_ACCOUNT" "GITHUB_ORG" "GITHUB_REVIEWER" "GITHUB_COMMIT_EMAIL"
# PAT for GitHub accounts
required_vars "GITHUB_AGENT_ACCOUNT_PAT" "GITHUB_ORG_PAT"


#mkdir -p "$docker_volumes"
mkdir -p "$docker_volumes/scripts"

# Copy common startup scripts and configurations
cp ../scripts/start_common.sh "$docker_volumes/scripts/start_common.sh"
cp ../scripts/git_common.sh "$docker_volumes/scripts/git_common.sh"
cp ../scripts/utils.sh "$docker_volumes/scripts/utils.sh"
cp start.sh "$docker_volumes/scripts/start.sh"
#cp .env "$docker_volumes/scripts/.env"
cat << EOF > "$docker_volumes/scripts/.env"
GITHUB_AGENT_ACCOUNT=$GITHUB_AGENT_ACCOUNT
GITHUB_COMMIT_EMAIL=$GITHUB_COMMIT_EMAIL
EXA_API_KEY=$EXA_API_KEY
AELDER_API_KEY=$AELDER_API_KEY
EOF


# Set GitHub PAT (for Agent Account and Organization) =============================================

account_pat="$GITHUB_AGENT_ACCOUNT_PAT"  
org_pat="$GITHUB_ORG_PAT"
echo "$GITHUB_AGENT_ACCOUNT:$account_pat" > "$docker_volumes/scripts/github_pat"  # Write
echo "$GITHUB_ORG:$org_pat" >> "$docker_volumes/scripts/github_pat"               # Append

# GITHUB_MAIN_ACCOUNT is optional (it allows access to personal GitHub account repositories)
if [[ -n "$GITHUB_MAIN_ACCOUNT" ]]; then
    main_account_pat="$GITHUB_MAIN_ACCOUNT_PAT"
    echo "$GITHUB_MAIN_ACCOUNT:$main_account_pat" >> "$docker_volumes/scripts/github_pat"  # Append
fi

chmod 600 "$docker_volumes/scripts/github_pat"


# Setup Agents ====================================================================================

for agent in "${!agents[@]}"; do

    AI_AGENT_NAME=${agents[$agent]}
    AI_AGENT_COLOR=${agent_colors[$agent]}

    echo ""
    echo "=== Processing agent ${agent} ==="
    echo "AI_AGENT_NAME: ${AI_AGENT_NAME}"
    echo "Target: ${docker_volumes}/${agent}"

    # Create target directory structure
    mkdir -p "$docker_volumes/$agent/projects"
    docker_volume_opencode="$docker_volumes/$agent/opencode"
    mkdir -p "$docker_volume_opencode"

    # Copy opencode config
    cp opencode.json "$docker_volume_opencode/opencode.json"
    cp tui.json "$docker_volume_opencode/tui.json"
    #cp opencode.json "$docker_volume_opencode/cli.json"

# I checked your config files — and found the likely problem: neither of your opencode.json files contains a providers block at all:
#- /root/.config/opencode/opencode.json — no providers
#- /projects/Use-AI-for-coding/OpenCode/opencode.json — no providers
#So the file you edited isn't the one OpenCode is loading (or the change wasn't saved). Check where you made the edit.
#Checklist for a custom provider to show in /models
#1. Right file + location. OpenCode only loads:
#- ~/.config/opencode/opencode.json(c) (global)
#- opencode.json(c) or .opencode/opencode.json(c) in the directory you launch OpenCode from, or any of its ancestors (project)
#Your file at /projects/Use-AI-for-coding/OpenCode/opencode.json only applies if you start OpenCode from /projects/Use-AI-for-coding/OpenCode or a subdirectory of it.


    # Copy commands
    mkdir -p "$docker_volume_opencode/commands"
    cp commands/*.md "$docker_volume_opencode/commands/" 2>/dev/null || true

    # Copy plugins
    mkdir -p "$docker_volume_opencode/plugins"
    cp plugins/*.ts "$docker_volume_opencode/plugins/" 2>/dev/null || true


    # Copy configuration files
    cp AGENTS.md "$docker_volume_opencode/AGENTS.md"
    #cp SYSTEM.md "$docker_volume_opencode/SYSTEM.md"
    #cp Hardware_and_Software.md "$docker_volume_opencode/Hardware_and_Software.md"

    # Set accounts on SYSTEM.md
    #sed -i "s/{{GITHUB_AGENT_ACCOUNT}}/$GITHUB_AGENT_ACCOUNT/g" "$docker_volume_opencode/SYSTEM.md" 
    #sed -i "s/{{GITHUB_REVIEWER}}/$GITHUB_REVIEWER/g" "$docker_volume_opencode/SYSTEM.md"

    # Set accounts on AGENTS.md
    sed -i "s/{{GITHUB_AGENT_ACCOUNT}}/$GITHUB_AGENT_ACCOUNT/g" "$docker_volume_opencode/AGENTS.md"
    sed -i "s/{{GITHUB_REVIEWER}}/$GITHUB_REVIEWER/g" "$docker_volume_opencode/AGENTS.md"

    # Set AI Agent name
    #sed -i "s/{{AI_AGENT_NAME}}/$AI_AGENT_NAME/g" "$docker_volume_opencode/SYSTEM.md" 
    sed -i "s/{{AI_AGENT_NAME}}/$AI_AGENT_NAME/g" "$docker_volume_opencode/AGENTS.md"
    sed -i "s/{{AI_AGENT_COLOR}}/$AI_AGENT_COLOR/g" "$docker_volume_opencode/AGENTS.md"

    # Set Proviuder API keys
    sed -i "s/{{ALIBABA_API_KEY_PLAN}}/$ALIBABA_API_KEY_PLAN/g" "$docker_volume_opencode/opencode.json"
    sed -i "s/{{AELDER_API_KEY}}/${AELDER_API_KEY:-}/g" "$docker_volume_opencode/opencode.json"

    echo -e "✔️  Done copying for ${agent}"
done
