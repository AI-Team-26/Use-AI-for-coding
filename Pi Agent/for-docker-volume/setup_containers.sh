docker_volumes=${1:?The path to docker volumes folder is required}
#shared_pi=${2:?It must have defined if this Agent container share the .pi folder or not}

#set -a; source .env; set +a
source .env

set -e  # Exit on error

# check required environment variables are set
required_vars=("GITHUB_ACCOUNT" "GITHUB_ORG" "GITHUB_REVIEWER" "GITHUB_ACCOUNT_EMAIL")
#required_vars=("NOVITAAI_API_KEY" "OPENROUTER_API_KEY")
# PAT for PI AGENT GitHub account and Organization
required_vars=("PI_AGENT_GITHUB_ACCOUNT_PAT" "PI_AGENT_GITHUB_ORG_PAT")
required_vars=("NOVITAAI_API_KEY_PI_AGENT" "OPENROUTER_API_KEY_PI_AGENT" "OFOX_API_KEY_PI_AGENT" "GEMINI_API_KEY_PI_AGENT" "ALIBABA_API_KEY_PI_AGENT")

for var in "${required_vars[@]}" ; do
    if [[ -z "${!var}" ]]; then
        echo -e "${RED}⛔ $var is not found. Set it in the .env file${NC}"
        exit 1
    else
        echo "✅ $var is set."
    fi
done


# Create the shared scripts folder
mkdir -p "$docker_volumes/scripts"

# Copy common startup scripts and configurations
cp ../../scripts/start_common.sh "$docker_volumes/scripts/start_common.sh"
cp ../../scripts/git_common.sh "$docker_volumes/scripts/git_common.sh"
cp start.sh "$docker_volumes/scripts/start.sh"
cp .env "$docker_volumes/scripts/.env"
cp run_loop.sh "$docker_volumes/scripts/run_loop.sh"

# Set GitHub PAT (for Agent Account and Organization)
account_pat="$GITHUB_ACCOUNT_PAT"  # Read from .env
if [[ $account_pat == ENV:* ]]; then
    var_name="${account_pat#ENV:}"  # Remove "ENV:"
    account_pat="${!var_name}"
fi

if [[ -z "$account_pat" ]]; then
    echo -e "${RED}⛔ Failed to get GitHub Account PAT from GITHUB_ACCOUNT_PAT ${NC}"
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

echo "$GITHUB_ACCOUNT:$account_pat" > "$docker_volumes/scripts/github_pat"  # Write
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

# Agent names
for agent in "Manager" "Dev-1" "Dev-2" "Dev-3" "QA"; do

    echo ""
    echo "=== Processing agent ${agent} ==="
    echo "Target: ${docker_volumes}/${agent}"

    # Create target directory structure
    mkdir -p "$docker_volumes/$agent/projects"
    docker_volume_pi_agent="$docker_volumes/$agent/.pi/agent"
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
    sed -i "s/{{OFOX_API_KEY}}/$OFOX_API_KEY_PI_AGENT/g" "$docker_volume_pi_agent/models.json"    
    sed -i "s/{{GEMINI_API_KEY}}/$GEMINI_API_KEY_PI_AGENT/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{ALIBABA_API_KEY}}/$ALIBABA_API_KEY_PI_AGENT/g" "$docker_volume_pi_agent/models.json"
    sed -i "s/{{GROQ_API_KEY}}/$GROQ_API_KEY_PI_AGENT/g" "$docker_volume_pi_agent/models.json"

    echo "✓ Done copying for ${agent}"
done

