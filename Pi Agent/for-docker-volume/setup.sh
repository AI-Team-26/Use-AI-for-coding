docker_volumes=${1:?The path to docker volumes folder is required}

#set -a; source .env; set +a
source .env

required_vars=("GITHUB_ACCOUNT" "GITHUB_REVIEWER" "GITHUB_TOKEN")

for var in "${required_vars[@]}" ; do
    if [[ -z "${!var}" ]]; then
        echo -e "${RED}⛔ $var is not found. Set it in the .env file${NC}"
        exit 1
    else
        echo "✅ $var is set."
    fi
done


# Prepare the settings and projects volumes
mkdir -p "$docker_volumes/.pi"
mkdir -p "$docker_volumes/.pi/agent/skills"
mkdir -p "$docker_volumes/.pi/agent/extensions"
mkdir -p "$docker_volumes/projects"

# Copy startup scripts and configurations
cp ../../scripts/start_common.sh "$docker_volumes/projects/start_common.sh"
cp start.sh "$docker_volumes/projects/start.sh"
cp .env "$docker_volumes/projects/.env"
cp agent/AGENTS.md "$docker_volumes/.pi/agent/AGENTS.md"
cp agent/SYSTEM.md "$docker_volumes/.pi/agent/SYSTEM.md"
cp agent/models.json "$docker_volumes/.pi/agent/models.json"
cp -r agent/skills/* "$docker_volumes/.pi/agent/skills/"
cp -r agent/extensions/* "$docker_volumes/.pi/agent/extensions/"

# Set secret keys
# XXX_API_KEY_PI_AGENT are environment variables
sed -i "s/{{NOVITAAI_API_KEY}}/$NOVITAAI_API_KEY_PI_AGENT/g" "$docker_volumes/.pi/agent/models.json"
sed -i "s/{{GEMINI_API_KEY}}/$GEMINI_API_KEY_PI_AGENT/g" "$docker_volumes/.pi/agent/models.json"
sed -i "s/{{OPENROUTER_API_KEY}}/$OPENROUTER_API_KEY_PI_AGENT/g" "$docker_volumes/.pi/agent/models.json"
sed -i "s/{{ALIBABA_API_KEY}}/$ALIBABA_API_KEY_PI_AGENT/g" "$docker_volumes/.pi/agent/models.json"

# Set accounts on SYSTEM.md
sed -i "s/{{GITHUB_ACCOUNT}}/$GITHUB_ACCOUNT/g" "$docker_volumes/.pi/agent/SYSTEM.md"   
sed -i "s/{{GITHUB_REVIEWER}}/$GITHUB_REVIEWER/g" "$docker_volumes/.pi/agent/SYSTEM.md"

# Set accounts on AGENTS.md
sed -i "s/{{GITHUB_ACCOUNT}}/$GITHUB_ACCOUNT/g" "$docker_volumes/.pi/agent/AGENTS.md"
sed -i "s/{{GITHUB_REVIEWER}}/$GITHUB_REVIEWER/g" "$docker_volumes/.pi/agent/AGENTS.md"
