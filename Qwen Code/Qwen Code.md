# Qwen Code

Docs:
- https://github.com/QwenLM/qwen-code
- https://github.com/QwenLM/qwen-code/pkgs/container/qwen-code

``echo $GITHUB_TOKEN_PUBLIC | docker login ghcr.io -u alex-piccione --password-stdin``
``docker pull ghcr.io/qwenlm/qwen-code:0.14.5``


## Create custom image

- Pass the configuration file into a volume
- Pass the /projects directory into a volume
- Start Qwen from /projects

```bash
docker build \
    --label "Qwen Code for AI coding" \
    -t qwencode:3 \
    .
```

## Run the Container

We run the container passing 2 Volumes:
- /root/.quen   -> for the settings.json file
- /projects     -> for the GIT repositories and other files (start.sh, README)

### Setup
```bash
# Prepare settings file and other utilities
docker_volume=/d/Programming/PROJECTS/QwenCode_Container
mkdir -p "$docker_volume/.qwen"
mkdir -p "$docker_volume/projects"

cp for-docker-volume/README.md "$docker_volume/projects/README.md"
cp for-docker-volume/start.sh "$docker_volume/projects/start.sh"

cp for-docker-volume/qwen-settings.json $docker_volume/.qwen/settings.json
sed -i "s/{{ALIBABA_API_KEY}}/$ALIBABA_QWEN_CODE_FOR_DOCKER_1/g" $docker_volume/.qwen/settings.json

# to check replace result
cat $docker_volume/.qwen/settings.json     
```

### Run

```bash
export MSYS_NO_PATHCONV=1  # Disable path conversion (otherwise on GitBash in Windows /data becomes C:/data which is not desired here)

label="description=Qwen Code for different projects"

# calling with ICode argument as starting project
docker run -it \
    --name QwenCode_3 \
    --label "$label" \
    -v /$guest_volume/.qwen:/root/.qwen \
    -v /$guest_volume/projects:/projects \
    qwencode:3 ICode
``` 

### Attach to container

If the container is running... to attach to it:
```bash

```



## Models

### AliBaba
- qwen3.6-plus          : ✔️
- qwen3.5-plus          : ✔️
- qwen3.6-flash         : ::question::
- qwen-max-2025-01-25
- qwen3.5-35b-a3b
- qwen-plus

### Ollama
- qwen3:8b: ❌ too stupid
- llama3.1:8b: ❌ too stupid
- qwen3.5:4b: 
- codellama:7b-code
- dolphin3:8b ❌ does not support tools
- codellama:7b: ❌ does not support tools


Add a model to settings:
```bash
python add_model ""
```