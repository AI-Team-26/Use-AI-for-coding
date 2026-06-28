# Pi Agent

A minimalist terminal coding agent.  
It lets use root user to Pi Agent. Container is not accessible/exposed to internet.  
It shares settings and projects folder (using a bind mount volume) within the host, so settings and code are easy to read and change.  

## Build the Docker Image
```bash
cd "Pi Agent"
docker build \
    --label description="Pi Agent for coding" \
    -t pi-agent:5 \
    -f Dockerfile \
    .
```

## Run the Container

### Setup

Run the _setup.sh_ script.  
```bash
cd "Pi Agent"
cd "for-docker-volume"
docker_volumes="/p/PiAgent_Container"
./setup.sh "$docker_volumes"
```

### Run the Container

We create the container within two volumes:
- /root/.pi   -> for the settings, skills etc...
- /projects   -> for the GIT repositories, local projects and other utility files (start script, .env, README etc...)

```bash
cd "Pi Agent"
docker_volumes="/p/PiAgent_Container"

# Docker runs as root  (don't forget the -it parameters)
docker run \
    -it \
    --name PiAgent \
    --label "description=Pi Agent for GitHub projects" \
    --mount type=bind,src="$docker_volumes/.pi",dst=/root/.pi \
    --mount type=bind,src="$docker_volumes/projects",dst=/projects \
    pi-agent:5

# legacy syntax
# -v "$docker_volume/.pi:/root/.pi" \
# -v "$docker_volume/projects:/projects" \
```
