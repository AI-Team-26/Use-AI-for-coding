# Qwen Code

Docs:
- https://github.com/QwenLM/qwen-code
- Docker image: https://github.com/QwenLM/qwen-code/pkgs/container/qwen-code

``echo $GITHUB_TOKEN_PUBLIC | docker login ghcr.io -u alex-piccione --password-stdin``
``docker pull ghcr.io/qwenlm/qwen-code:0.14.5``


## Use a custom Docker image

QwenCode Dockerfile: https://github.com/QwenLM/qwen-code/blob/main/Dockerfile  

- Use the qwen-code image as base image
- Add GitHub credentials
- Add the .net 10 SDK
- Pass the configuration file whithin a volume (so secrets are not stored in the image and settings are easily editable)
- Pass the /projects directory into a volume (so changes can be seen also from the host machine)
- Start Qwen from /projects with an automated script

### Build the Image
(check Dockerfile !)  
```bash
docker build \
    --label "Qwen Code for AI coding" \
    -t qwencode:4 \
    .
```

### Run the Container

We run the container passing 2 Volumes:
- /root/.quen   -> for the settings.json file
- /projects     -> for the GIT repositories and other files (start.sh, README)

#### Setup
```bash
# Prepare settings file and other utilities
docker_volume=/d/Programming/PROJECTS/QwenCode_Container
mkdir -p "$docker_volume/.qwen"
mkdir -p "$docker_volume/projects"

cp for-docker-volume/README.md "$docker_volume/projects/README.md"
cp for-docker-volume/start.sh "$docker_volume/projects/start.sh"
cp for-docker-volume/git_hook_pre_push.sh "$docker_volume/projects/git_hook_pre_push.sh"

cp for-docker-volume/qwen-settings.json $docker_volume/.qwen/settings.json
sed -i "s/{{ALIBABA_API_KEY}}/$ALIBABA_QWEN_CODE_FOR_DOCKER_1/g" $docker_volume/.qwen/settings.json

# to check replace result
cat $docker_volume/.qwen/settings.json
```

#### Run

```bash
export MSYS_NO_PATHCONV=1  # Disable path conversion (otherwise on GitBash in Windows /data becomes C:/data which is not desired here)

label="description=Qwen Code for different projects"

# calling with ICode argument as starting project
# It will ask for GitHub credentials immediately, be ready ❗
docker run -it \
    --name QwenCode_4 \
    --label "$label" \
    -v /$docker_volume/.qwen:/root/.qwen \
    -v /$docker_volume/projects:/projects \
    qwencode:4 ICode
``` 

### Attach to an exising container

_docker attach_ can pickup the entrypoint script when it is in a selection wait state, waiting for user input but without printing the menu.  
To avoid this, use ``docker start -ai "$container_id"`` 
- The -a flag attaches to the container's output immediately.
- The -i flag keeps STDIN open for interactive input.
  
If you want to keep using _docker attach_, modify start.sh to force a new prompt when attached.  
Add this at the top of entrypoint script (start.sh):    
(not tested)  
```bash
# Force a new prompt if attached to a running container
if [ -z "$PS1" ]; then
    echo -e "\n🔄 Restarting project selection..."
fi
```

### Investigate the container

```bash
container = ...
docker exec -it $container //bin/bash
```

