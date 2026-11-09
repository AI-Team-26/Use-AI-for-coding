#!/usr/bin/env bash
# Setup the Pi Agent docker volumes
# - Copy the shared scripts and the per-agent .pi configuration

set -eo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

# .env legitimately references environment variables (e.g. GITHUB_AGENT_PAT="${...}"),
# so nounset must be off while sourcing it
set +u
source .env
set -u

source ../scripts/utils.sh
source constants.sh

# check required environment variables for THIS script are set
required_vars GITHUB_AGENT_ACCOUNT GITHUB_ORG GITHUB_REVIEWER GITHUB_COMMIT_EMAIL EXA_API_KEY
required_vars GITHUB_AGENT_ACCOUNT_PAT GITHUB_ORG_PAT
# API keys of AI providers
required_vars NOVITAAI_API_KEY  OPENROUTER_API_KEY  OFOX_API_KEY  GEMINI_API_KEY_PI_AGENT  ALIBABA_API_KEY  ENTRIM_API_KEY_PI_AGENT
required_vars CLOUDFLARE_API_KEY  CLOUDFLARE_ACCOUNT_ID  INFERX_API_KEY   TOKENHARBOR_API_KEY   XAI_API_KEY   SAMBANOVA_API_KEY  MISTRAL_API_KEY


# Create the shared scripts folder
mkdir -p "$docker_volumes/scripts"
mkdir -p "$docker_volumes/share"

# Copy common startup scripts and configurations
cp ../scripts/start_common.sh "$docker_volumes/scripts/start_common.sh"
cp ../scripts/git_common.sh "$docker_volumes/scripts/git_common.sh"
cp ../scripts/utils.sh "$docker_volumes/scripts/utils.sh"
cp for_docker_volume/start.sh "$docker_volumes/scripts/start.sh"
#cp .env "$docker_volumes/scripts/.env"
#cp for-docker-volumes/run_loop.sh "$docker_volumes/scripts/run_loop.sh"
cat << EOF > "$docker_volumes/scripts/.env"
GITHUB_AGENT_ACCOUNT=$GITHUB_AGENT_ACCOUNT
GITHUB_COMMIT_EMAIL=$GITHUB_COMMIT_EMAIL
EXA_API_KEY=$EXA_API_KEY
EOF

# Set GitHub PAT (for Agent Account and Organization)
account_pat="$GITHUB_AGENT_ACCOUNT_PAT"
org_pat="$GITHUB_ORG_PAT"
echo "$GITHUB_AGENT_ACCOUNT:$account_pat" > "$docker_volumes/scripts/github_pat"  # Write
echo "$GITHUB_ORG:$org_pat" >> "$docker_volumes/scripts/github_pat"               # Append

# GITHUB_MAIN_ACCOUNT is optional (it allows access to personal GitHub account repositories)
if [[ -n "${GITHUB_MAIN_ACCOUNT:-}" ]]; then
    main_account_pat="${GITHUB_MAIN_ACCOUNT_PAT:-}"
    echo "$GITHUB_MAIN_ACCOUNT:$main_account_pat" >> "$docker_volumes/scripts/github_pat"  # Append
fi

chmod 600 "$docker_volumes/scripts/github_pat"

for agent in "${!agents[@]}"; do

    AI_AGENT_NAME=${agents[$agent]}

    echo ""
    echo "=== Processing agent ${agent} ==="
    echo "AI_AGENT_NAME: ${AI_AGENT_NAME}"
    echo "Target: ${docker_volumes}/${agent}"

    # Create target directory structure
    mkdir -p "$docker_volumes/$agent/projects"
    docker_volume_pi_agent="$docker_volumes/$agent/.pi/agent"
    mkdir -p "$docker_volume_pi_agent/skills"
    mkdir -p "$docker_volume_pi_agent/extensions"

    # Copy configuration files
    cp for_docker_volume/agent/AGENTS.md "$docker_volume_pi_agent/AGENTS.md"
    cp for_docker_volume/agent/SYSTEM.md "$docker_volume_pi_agent/SYSTEM.md"
    cp for_docker_volume/agent/Hardware_and_Software.md "$docker_volume_pi_agent/Hardware_and_Software.md"
    cp for_docker_volume/agent/models.json "$docker_volume_pi_agent/models.json"

    # Set accounts on SYSTEM.md
    sed -i "s/{{GITHUB_AGENT_ACCOUNT}}/$GITHUB_AGENT_ACCOUNT/g" "$docker_volume_pi_agent/SYSTEM.md"
    sed -i "s/{{GITHUB_REVIEWER}}/$GITHUB_REVIEWER/g" "$docker_volume_pi_agent/SYSTEM.md"

    # Set accounts on AGENTS.md
    sed -i "s/{{GITHUB_AGENT_ACCOUNT}}/$GITHUB_AGENT_ACCOUNT/g" "$docker_volume_pi_agent/AGENTS.md"
    sed -i "s/{{GITHUB_REVIEWER}}/$GITHUB_REVIEWER/g" "$docker_volume_pi_agent/AGENTS.md"

    # Set PI agent name
    sed -i "s/{{AI_AGENT_NAME}}/$AI_AGENT_NAME/g" "$docker_volume_pi_agent/SYSTEM.md"
    sed -i "s/{{AI_AGENT_NAME}}/$AI_AGENT_NAME/g" "$docker_volume_pi_agent/AGENTS.md"

    # Copy skills and extensions recursively
    cp -r for_docker_volume/skills/* "$docker_volume_pi_agent/skills/" || true
    # WARN careful to not copy node_modules !
    #cp -r agent/extensions/* "$docker_volume_pi_agent/extensions/" || true
    # Only top-level *.ts are shipped; WIP/ is intentionally excluded (keep it that way)
    cp for_docker_volume/extensions/*.ts "$docker_volume_pi_agent/extensions/" || true
    cp -r for_docker_volume/extensions/_shared "$docker_volume_pi_agent/extensions/" || true

    # Set secret keys
    sed -i "s/{{NOVITAAI_API_KEY}}/$NOVITAAI_API_KEY/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{OPENROUTER_API_KEY}}/$OPENROUTER_API_KEY/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{CLOUDFLARE_API_KEY}}/$CLOUDFLARE_API_KEY/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{CLOUDFLARE_ACCOUNT_ID}}/$CLOUDFLARE_ACCOUNT_ID/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{INFERX_API_KEY}}/$INFERX_API_KEY/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{TOKENHARBOR_API_KEY}}/$TOKENHARBOR_API_KEY/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{XAI_API_KEY}}/$XAI_API_KEY/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{SAMBANOVA_API_KEY}}/$SAMBANOVA_API_KEY/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{GROQ_API_KEY}}/${GROQ_API_KEY:-}/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{MISTRAL_API_KEY}}/$MISTRAL_API_KEY/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{DEEPSEEK_API_KEY}}/${DEEPSEEK_API_KEY:-}/g" "$docker_volume_pi_agent/models.json"

    sed -i "s/{{OFOX_API_KEY}}/$OFOX_API_KEY/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{GEMINI_API_KEY}}/$GEMINI_API_KEY_PI_AGENT/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{ALIBABA_API_KEY}}/$ALIBABA_API_KEY/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{ENTRIM_API_KEY}}/$ENTRIM_API_KEY_PI_AGENT/g" "$docker_volume_pi_agent/models.json"

    echo -e "✔️  Done copying for ${agent}"
done
