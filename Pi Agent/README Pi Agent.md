# Pi Agent

A minimalist terminal coding agent setup for F# development, optimized for graphic card 16GB RAM.  
It lets use root user to Pi Agent. Container is not accessible/exposed to internet.  
It shares settings and projects folder (using a bind mount volume) within the host so settings and code are easy to read and change.  

## Build the Docker Image
```bash
docker build \
    --label description="Pi Agent for coding" \
    -t pi-agent:3 \
    -f v3.Dockerfile \
    .
```

## Run the Container

We run the container passing 2 Volumes:
- /root/.pi   -> for the settings, skills etc...
- /projects   -> for the GIT repositories, local projects and other files (start.sh, set_api_keys.sh, README)

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
cp for-docker-volume/system.md "$docker_volume/.pi/system.md"
cp -r for-docker-volume/agent/skills/* "$docker_volume/.pi/agent/skills/"
cp -r for-docker-volume/agent/skills-disabled/* "$docker_volume/.pi/agent/skills-disabled/"
# cp for-docker-volume/.env "$docker_volume/.pi/.env"

cp for-docker-volume/agent/models.json "$docker_volume/.pi/agent/models.json"
# set secret keys
sed -i "s/{{NOVITAAI_API_KEY}}/$NOVITAAI_API_KEY_PI_AGENT_LOCAL/g" "$docker_volume/.pi/agent/models.json"

```

### Run the Container
```bash
#export MSYS_NO_PATHCONV=1  setup in .bashrc
    #-e OLLAMA_HOST=http://host.docker.internal:11434 \

docker run \
    --name PiAgent_v3 \
    --label "description=Pi Agent for GitHub projects" \
    --mount type=bind,src="$docker_volume/.pi",dst=/root/.pi \
    --mount type=bind,src="$docker_volume/projects",dst=/projects \
    pi-agent:3

# legacy syntax
# -v "$docker_volume/.pi:/root/.pi" \
# -v "$docker_volume/projects:/projects" \
```

