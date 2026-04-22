# Qwen Code

Docs:
- https://github.com/QwenLM/qwen-code
- https://github.com/QwenLM/qwen-code/pkgs/container/qwen-code

``echo $GITHUB_TOKEN_PUBLIC | docker login ghcr.io -u alex-piccione --password-stdin``
``docker pull ghcr.io/qwenlm/qwen-code:0.14.5``


## Create custom image

- Pass the configuration file into a volume
- Pass the /worlkspae directory into a volume
- Start Qwen from /workspace

```bash
docker build \
    --label "Qwen code for AI coding" \
    -t qwencode:1 \
    .
```

## Run the Container

```bash
# set settings file
guest_volume=/d/Programming/PROJECTS/QwenCode_iCode
cp qwen-settings.json $guest_volume/.qwen/settings.json
sed -i "s/{{ALIBABA_API_KEY}}/$ALIBABA_QWEN_CODE_FOR_DOCKER_1/g" $guest_volume/.qwen/settings.json
cat $guest_volume/.qwen/settings.json      #to check


export MSYS_NO_PATHCONV=1  # Disable path conversion (otherwise on GitBash in Windows /data becomes C:/data which is not desired here)

label="description=Qwen Code for ICode"

docker run -it \
    --name QwenCode_ICode \
    --label "$label" \
    -v /$guest_volume/.qwen:/root/.qwen \
    -v /$guest_volume/workspace:/workspace \
    qwencode:1
``` 

If teh container is running... to attach to it:
```bash

```



## Models

### AliBaba
- qwen3.6-plus: ✔️
- qwen3.5-plus: ✔️
- qwen3.6-flash
- qwen-max-2025-01-25
- qwen3.5-35b-a3b
- qwen-plus

### Ollama
- qwen3:8b: ❌ too stupid
- llama3.1:8b: ❌ too stupid
- qwen3.5:4b: 
- codellama:7b-code


add model to settings:
```bash
model="codellama:7b"
add_model.sh model
```