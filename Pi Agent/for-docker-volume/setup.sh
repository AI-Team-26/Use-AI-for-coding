docker_volumes=${1:?The path to docker volumes folder is required}
#shared_pi=${2:?It must have defined if this Agent container share the .pi folder or not}

#set -a; source .env; set +a
source .env

set -e  # Exit on error

# check required environment variables are set
required_vars=("GITHUB_ACCOUNT" "GITHUB_REVIEWER" )
#required_vars=("NOVITAAI_API_KEY" "OPENROUTER_API_KEY")

for var in "${required_vars[@]}" ; do
    if [[ -z "${!var}" ]]; then
        echo -e "${RED}⛔ $var is not found. Set it in the .env file${NC}"
        exit 1
    else
        echo "✅ $var is set."
    fi
done


# Prepare the scripts and projects volumes folders

mkdir -p "$docker_volumes/projects"
mkdir -p "$docker_volumes/scripts"

# Agent default (TODO: to be replaced by DEv-1)
mkdir -p "$docker_volumes/.pi"
mkdir -p "$docker_volumes/.pi/agent/skills"
mkdir -p "$docker_volumes/.pi/agent/extensions"

# Copy startup scripts and configurations
cp ../../scripts/start_common.sh "$docker_volumes/scripts/start_common.sh"
cp ../../scripts/git_common.sh "$docker_volumes/scripts/git_common.sh"
cp start.sh "$docker_volumes/scripts/start.sh"
cp .env "$docker_volumes/scripts/.env"

### default agent 
cp agent/AGENTS.md "$docker_volumes/.pi/agent/AGENTS.md"
cp agent/SYSTEM.md "$docker_volumes/.pi/agent/SYSTEM.md"
cp agent/Hardware_and_Software.md "$docker_volumes/.pi/agent/Hardware_and_Software.md"
cp agent/models.json "$docker_volumes/.pi/agent/models.json"
cp -r agent/skills/* "$docker_volumes/.pi/agent/skills/"
cp -r agent/extensions/* "$docker_volumes/.pi/agent/extensions/"

# Set secret keys
# XXX_API_KEY_PI_AGENT are environment variables (because I have them centralized. You can use .env instead.)
sed -i "s/{{NOVITAAI_API_KEY}}/$NOVITAAI_API_KEY_PI_AGENT/g" "$docker_volumes/.pi/agent/models.json"
sed -i "s/{{OPENROUTER_API_KEY}}/$OPENROUTER_API_KEY_PI_AGENT/g" "$docker_volumes/.pi/agent/models.json"
sed -i "s/{{GEMINI_API_KEY}}/$GEMINI_API_KEY_PI_AGENT/g" "$docker_volumes/.pi/agent/models.json"
sed -i "s/{{ALIBABA_API_KEY}}/$ALIBABA_API_KEY_PI_AGENT/g" "$docker_volumes/.pi/agent/models.json"

# Set accounts on SYSTEM.md
sed -i "s/{{GITHUB_ACCOUNT}}/$GITHUB_ACCOUNT/g" "$docker_volumes/.pi/agent/SYSTEM.md"   
sed -i "s/{{GITHUB_REVIEWER}}/$GITHUB_REVIEWER/g" "$docker_volumes/.pi/agent/SYSTEM.md"

# Set accounts on AGENTS.md
sed -i "s/{{GITHUB_ACCOUNT}}/$GITHUB_ACCOUNT/g" "$docker_volumes/.pi/agent/AGENTS.md"
sed -i "s/{{GITHUB_REVIEWER}}/$GITHUB_REVIEWER/g" "$docker_volumes/.pi/agent/AGENTS.md"


required_vars=("NOVITAAI_API_KEY_PI_AGENT" "OPENROUTER_API_KEY_PI_AGENT" "GEMINI_API_KEY_PI_AGENT" "ALIBABA_API_KEY_PI_AGENT")

for agent in "Dev-1" "Dev-2" "Dev-3" ; do

    docker_volume_pi_agent="$docker_volumes/$agent/.pi/agent"

    echo ""
    echo "=== Processing agent ${agent} ==="
    echo "Target: ${docker_volume_pi_agent}"

    # Create target directory structure
    mkdir -p "$docker_volume_pi_agent/skills"
    mkdir -p "$docker_volume_pi_agent/extensions"

    # Copy configuration files
    cp agent/AGENTS.md "$docker_volume_pi_agent/AGENTS.md"
    cp agent/SYSTEM.md "$docker_volume_pi_agent/SYSTEM.md"
    cp agent/Hardware_and_Software.md "$docker_volume_pi_agent/Hardware_and_Software.md"
    cp agent/models.json "$docker_volume_pi_agent/models.json"
    
    # Set accounts on SYSTEM.md
    sed -i "s/{{GITHUB_ACCOUNT}}/$GITHUB_ACCOUNT/g" "$docker_volume_pi_agent/SYSTEM.md"   
    sed -i "s/{{GITHUB_REVIEWER}}/$GITHUB_REVIEWER/g" "$docker_volume_pi_agent/SYSTEM.md"

    # Set accounts on AGENTS.md
    sed -i "s/{{GITHUB_ACCOUNT}}/$GITHUB_ACCOUNT/g" "$docker_volume_pi_agent/AGENTS.md"
    sed -i "s/{{GITHUB_REVIEWER}}/$GITHUB_REVIEWER/g" "$docker_volume_pi_agent/AGENTS.md"

    # Copy skills and extensions recursively
    cp -r agent/skills/* "$docker_volume_pi_agent/skills/" || true
    cp -r agent/extensions/* "$docker_volume_pi_agent/extensions/" || true

    # Set secret keys
    # XXX_API_KEY_PI_AGENT are environment variables
    sed -i "s/{{NOVITAAI_API_KEY}}/$NOVITAAI_API_KEY_PI_AGENT/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{OPENROUTER_API_KEY}}/$OPENROUTER_API_KEY_PI_AGENT/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{GEMINI_API_KEY}}/$GEMINI_API_KEY_PI_AGENT/g" "$docker_volume_pi_agent/models.json"    
    sed -i "s/{{ALIBABA_API_KEY}}/$ALIBABA_API_KEY_PI_AGENT/g" "$docker_volume_pi_agent/models.json"

    echo "✓ Done copying for ${agent}"
done

