# Pi Agent

A minimalist terminal coding agent.  
It lets use root user to Pi Agent. Container is not accessible/exposed to internet.  
It shares settings and can share projects folder (using a bind mount volume) within the host, so settings and code are easy to read and change.  

TODO:
- Add a simple and light web-ui:  https://github.com/ygncode/pi-web
- Add a multi-sesison web-ui manager: https://github.com/04mg/caw


## Build the Docker Image

Use the "Pi Agent" text in the label, because the script to start ai agents looks for that.

```bash
cd "Pi Agent"
docker build \
    --label description="Pi Agent" \
    -t pi-agent:7 \
    -f Dockerfile \
    .
```


## Run the Containers

### Setup of Container

Run the _setup.sh_ script.  
```bash
cd "Pi Agent"
cd "for-docker-volume"
docker_volumes="/p/PiAgent_Container"
./setup.sh "$docker_volumes"
cd ..
```

### Run the Container

The container share the *projects* folder and CAN share also the *Pi agent* folder.  
Sharing the Pi folder allows to have direct acess to Pi skills, extension and SYSTEM.md and AGENTS.md file for auto-edit from the Agent itself.  
`shared-pi` parameter define this behaviour.

The two volumes:
- /projects   -> for the GIT repositories, local projects and other utility files (start script, .env, README etc...)
- /root/.pi   -> for the settings, skills etc...

```bash
cd "Pi Agent"
docker_volumes="/p/PiAgent_Container"

# Docker runs as root  (don't forget the -it parameters)

### TODO: 2 way: shared Pi folder and not, so we have an Agent with separate isolated settings

## KEEP READY   GIT Username, GIT account email, and PAT !!

# Agent Dev-1
docker run \
    -it \
    --name PiAgent \
    --label "description=Pi Agent Dev 1" \
    --mount type=bind,src="$docker_volumes/.pi",dst=/root/.pi \
    --mount type=bind,src="$docker_volumes/projects",dst=/projects \
    pi-agent:6

# Agent DEV-2
docker run \
    -it \
    --name PiAgent-Dev-2 \
    --label "description=Pi Agent Dev 2" \
    --mount type=bind,src="$docker_volumes/Dev-2/.pi",dst=/root/.pi \
    --mount type=bind,src="$docker_volumes/scripts",dst=/scripts \
    --mount type=bind,src="$docker_volumes/projects",dst=/projects \
    pi-agent:7

# Agent DEV-3 (no shared projects)
docker run \
    -it \
    --name PiAgent-Dev-3-independent \
    --label "description=Pi Agent Dev 3 (independent)" \
    --mount type=bind,src="$docker_volumes/Dev-3/.pi",dst=/root/.pi \
    --mount type=bind,src="$docker_volumes/scripts",dst=/scripts \
    pi-agent:7


# legacy syntax
# -v "$docker_volume/.pi:/root/.pi" \
# -v "$docker_volume/projects:/projects" \
```
