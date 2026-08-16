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
    -t pi-agent:13 \
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
./setup_containers.sh "$docker_volumes"
cd ..
```

### Run the Container

[TODO: review, update and complete]
The containers share a common *scripts* folder (the same), and also share their own *.pi* and *projects* folders.  
The scripts folder contains general setup scripts.  
The .pi folder is where each container has its skills, extensions and model settings (it is not common so the selected model is not inherited from last selection of another container).  
The projects folder allows to work on the same code from the host, allowing agent-driver/pair programming.  


The bind-mount volumes:
- (shared)   /scripts    -> for common
- (container)/projects   -> for the GIT repositories, local projects and other utility files (start script, .env, README etc...)
- (container)/root/.pi   -> for the settings, skills etc...

```bash
cd "Pi Agent"
docker_volumes="/p/PiAgent_Container"
docker_image="pi-agent:13"

# Agent Manager 
# Use shared /projects folder soit is accessible also from host for agent-driven coding
docker run \
    -it \
    --name PiAgent-Manager \
    --label "description=Pi Agent Manager" \
    -e PI_AGENT_NAME="🍓 Pi Manager" \
    --mount type=bind,src="$docker_volumes/scripts",dst=/scripts \
    --mount type=bind,src="$docker_volumes/Manager/.pi",dst=/root/.pi \
    --mount type=bind,src="$docker_volumes/Manager/projects",dst=/projects \
    $docker_image

# Agent Dev-1
docker run \
    -it \
    --name PiAgent-Dev-1 \
    --label "description=Pi Agent Dev 1" \
    -e PI_AGENT_NAME="🍋 Pi Lemon" \
    -e PI_AGENT_DEFAULT_MODEL="KAT-Coder-V2.5-Dev-Cerebellum (deucebucket) [160k]" \
    --mount type=bind,src="$docker_volumes/scripts",dst=/scripts \
    --mount type=bind,src="$docker_volumes/Dev-1/.pi",dst=/root/.pi \
    --mount type=bind,src="$docker_volumes/Dev-1/projects",dst=/projects \
    $docker_image

# Agent Dev-2
docker run \
    -it \
    --name PiAgent-Dev-2 \
    --label "description=Pi Agent Dev 2" \
    -e PI_AGENT_NAME="🥝 Pi Kiwi" \
    -e PI_AGENT_DEFAULT_MODEL="mindai/macaron-v1-venti" \
    --mount type=bind,src="$docker_volumes/scripts",dst=/scripts \
    --mount type=bind,src="$docker_volumes/Dev-2/.pi",dst=/root/.pi \
    --mount type=bind,src="$docker_volumes/Dev-2/projects",dst=/projects \
    $docker_image

# Agent Dev-3
docker run \
    -it \
    --name PiAgent-Dev-3 \
    --label "description=Pi Agent Dev 3" \
    -e PI_AGENT_NAME="🍊 Pi Orange" \
    -e PI_AGENT_DEFAULT_MODEL="inclusionai/ling-3.0-flash" \
    --mount type=bind,src="$docker_volumes/scripts",dst=/scripts \
    --mount type=bind,src="$docker_volumes/Dev-3/.pi",dst=/root/.pi \
    --mount type=bind,src="$docker_volumes/Dev-3/projects",dst=/projects \
    $docker_image

# Agent QA
docker run \
    -it \
    --name PiAgent-QA \
    --label "description=Pi Agent QA" \
    -e PI_AGENT_NAME="🍒 Pi QA" \
    --mount type=bind,src="$docker_volumes/scripts",dst=/scripts \
    --mount type=bind,src="$docker_volumes/QA/.pi",dst=/root/.pi \
    --mount type=bind,src="$docker_volumes/QA/projects",dst=/projects \
    $docker_image

```


## Analysis of NOT sharing the .pi folder

It contains: 
- AGENTS.md
- SYSTEM.md

**Setup**
Currently the setup is done with a script that copy the files in hte shared folder.  
Without the shared folder, they need to be 


**Update**
Hp