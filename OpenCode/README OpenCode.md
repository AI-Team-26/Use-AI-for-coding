# OpenCode

I'm trying this because hte OpenCode free models works only with opencode running app.  
  
https://opencode.ai/download  
https://opencode.ai/docs/#install  

## Docker

### Build the Image

Use the "Pi Agent" text in the label, because the script to start ai agents looks for that.

```bash
cd "OpenCode"
docker build \
    --label description="OpenCode" \
    -t opencode:2 \
    -f Dockerfile \
    .
```

### Setup the Containers

Run the _setup.sh_ script.  
```bash
cd "OpenCode"
mkdir -p "$docker_volumes"
./setup_containers.sh "$docker_volumes"

cd ..
```

### Run the containers

The containers share a common *scripts* folder and also share their own *opencode* and *projects* folders.  
The scripts folder contains general setup scripts.  
The .opencode folder is where each container has its distinctive instructions.    
The **projects** folder allows to work on the same code from the host, making possible agent-driven/pair programming.  
  
The bind-mount volumes:
- (shared)   /scripts    -> for common
- (container)/projects   -> for the GIT repositories, local projects and other utility files (start script, .env, README etc...)
- (container)/opencode   -> for the settings, skills etc...


```bash
cd "OpenCode"
docker_volumes="/p/OpenCode_Containers"
docker_image="opencode:2"

# Agent Dev-1
docker run \
    -it \
    --name "OpenCode-Dev-1" \
    --label "icon=🔵" \
    --label "alias=Blu-AI" \
    --label "description=OpenCode Dev-1" \
    -e AI_AGENT_NAME="🔵 Blu-AI" \
    --mount type=bind,src="$docker_volumes/scripts",dst=/scripts \
    --mount type=bind,src="$docker_volumes/Dev-1/opencode",dst=/opencode \
    --mount type=bind,src="$docker_volumes/Dev-1/projects",dst=/projects \
    $docker_image

docker run \
    -it \
    --name "OpenCode-Dev-2" \
    --label "icon=🟣" \
    --label "alias=Purple-AI" \
    --label "description=OpenCode Dev-2" \
    -e AI_AGENT_NAME="🟣 Purple-AI" \
    --mount type=bind,src="$docker_volumes/scripts",dst=/scripts \
    --mount type=bind,src="$docker_volumes/Dev-2/opencode",dst=/opencode \
    --mount type=bind,src="$docker_volumes/Dev-2/projects",dst=/projects \
    $docker_image

```