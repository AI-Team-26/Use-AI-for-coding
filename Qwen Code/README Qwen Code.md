# Qwen Code

** PAUSED **  

Docs:
- Qwen Code: https://github.com/QwenLM/qwen-code
- Docker image: https://github.com/QwenLM/qwen-code/pkgs/container/qwen-code


## Use a custom Docker image

QwenCode Dockerfile: https://github.com/QwenLM/qwen-code/blob/main/Dockerfile  

- Use the qwen-code image as base image
- Add GitHub credentials
- Add the .net 10 SDK
- Pass the configuration file whithin a volume (so secrets are not stored in the image and settings are easily editable)
- Pass the /projects directory into a volume (so changes can be seen also from the host machine)
- Start Qwen from /projects with an automated script

### Build the Image
```bash
docker build \
    --label "Qwen Code for coding" \
    -t qwencode:6 \
    .
```

### Run the Container

We run the container passing 2 Volumes:
- /root/.quen   -> for the settings.json file
- /projects     -> for the GIT repositories and other files (start.sh, README)

#### Setup
```bash

cd "/d/Programming/AI/Use AI for coding/Qwen Code"

# Prepare settings file and other utilities
docker_volume=/d/Programming/PROJECTS/QwenCode_Container
mkdir -p "$docker_volume/.qwen"
mkdir -p "$docker_volume/projects"

cp for-docker-volume/README.md "$docker_volume/projects/README.md"
cp for-docker-volume/start.sh "$docker_volume/projects/start.sh"
cp for-docker-volume/git_hook_pre_push.sh "$docker_volume/projects/git_hook_pre_push.sh"

cp for-docker-volume/system.md "$docker_volume/.qwen/system.md"
cp for-docker-volume/settings.json $docker_volume/.qwen/settings.json
sed -i "s/{{MISTRAL_API_KEY_1}}/$MISTRAL_API_KEY_QWEN_CODE_DOCKER_LOCAL/g" $docker_volume/.qwen/settings.json
sed -i "s/{{MISTRAL_CODESTRAL_API_KEY_1}}/$MISTRAL_CODESTRAL_API_KEY_QWEN_CODE_DOCKER_LOCAL/g" $docker_volume/.qwen/settings.json
sed -i "s/{{ALIBABA_API_KEY}}/$ALIBABA_QWEN_CODE_FOR_DOCKER_2/g" $docker_volume/.qwen/settings.json
sed -i "s/{{XIAOMI_API_KEY}}/$XIAOMI_API_KEY_QWEN_CODE_LOCAL/g" $docker_volume/.qwen/settings.json
sed -i "s/{{DEEPSEEK_API_KEY}}/$DEEPSEEK_API_KEY_QWEN_CODE_1/g" $docker_volume/.qwen/settings.json
sed -i "s/{{OPENROUTER_API_KEY}}/$OPENROUTER_API_KEY_QWEN_CODE_LOCAL/g" $docker_volume/.qwen/settings.json
sed -i "s/{{OFOX_API_KEY}}/$OFOX_API_KEY_QWEN_CODE_DOCKER_LOCAL/g" $docker_volume/.qwen/settings.json
sed -i "s/{{EDENAI_API_KEY}}/$EDENAI_API_KEY_QWEN_CODE_DOCKER_LOCAL/g" $docker_volume/.qwen/settings.json
sed -i "s/{{TOKENMIX_API_KEY}}/$TOKENMIX_API_KEY_QWEN_CODE_DOCKER_LOCAL/g" $docker_volume/.qwen/settings.json

# to check if API keys were actually replaced
cat $docker_volume/.qwen/settings.json | grep API_KEY
```

#### Run

```bash
export MSYS_NO_PATHCONV=1  # Disable path conversion (otherwise on GitBash in Windows /data becomes C:/data which is not desired here)

# calling with ICode argument as starting project
# It will ask for GitHub credentials immediately, be ready with GitHunb username, email and PAT ❗
# see main README for instruction to modify .git-ceredentials file

docker run -it \
    --name QwenCode_v6 \
    --label "description=Qwen Code for GitHub projects" \
    -v /$docker_volume/.qwen:/root/.qwen \
    -v /$docker_volume/projects:/projects \
    qwencode:6
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

