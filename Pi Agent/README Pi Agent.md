# Pi Agent

A minimalist terminal coding agent setup for F# development, optimized for graphic card 16GB RAM.  

## Build the Docker Image
```bash
docker build \
    --label "Pi Agent for coding" \
    -t pi-agent:2 \
    .
```

## Run the Container

We run the container passing 2 Volumes:
- /root/.pi   -> for the settings, skills etc...
- /projects   -> for the GIT repositories and other files (start.sh, README)

### Setup

```bash
cd "/d/Programming/AI/Use AI for coding/Pi Agent"

# 1. Prepare settings and project volumes
docker_volume=/d/Programming/PROJECTS/PiAgent_Container
mkdir -p "$docker_volume/.pi"
mkdir -p "$docker_volume/projects"

# 2. Copy startup scripts and configurations
cp ../scripts/start_common.sh "$docker_volume/projects/start_common.sh"
cp for-docker-volume/start.sh "$docker_volume/projects/start.sh"
# Copy any custom Pi skills or environment files to the config volume
cp for-docker-volume/agent/models.json "$docker_volume/.pi/agent/models.json"
cp for-docker-volume/system.md "$docker_volume/.pi/system.md"
# cp for-docker-volume/my_custom_skill.ts "$docker_volume/.pi/skills/"
# cp for-docker-volume/.env "$docker_volume/.pi/.env"

# set secret keys
sed -i "s/{{NOVITAAI_API_KEY}}/$NOVITAAI_API_KEY_PI_AGENT_LOCAL/g" "$docker_volume/.pi/agent/models.json"
#cat "$docker_volume/.pi/agent/models.json" | grep API_KEY
```

### Run the Container
```bash
export MSYS_NO_PATHCONV=1

docker run -it \
    --name PiAgent_v2 \
    --label "description=Pi Agent for GitHub projects" \
    --mount type=bind,src="$docker_volume/.pi",dst=/root/.pi \
    --mount type=bind,src="$docker_volume/projects",dst=/projects \    
    -e OLLAMA_HOST=http://host.docker.internal:11434 \
    pi-agent:2

# legacy syntax
# -v "$docker_volume/.pi:/root/.pi" \
# -v "$docker_volume/projects:/projects" \
```

