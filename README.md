# Use AI for Coding

What I was working on? --> [TODO](TODO.md).  

This repository contains documentation, notes, scripts about the use of AI for coding assistance.  
In the end I started to work with AI "tools" that runs on Docker containers.  
The Docker containers can be customized to satisfy basic stuff (Git + GitHub auth) and specific requirements (customized prompt for particular languages, predefined skills etc...).  
For my specific situation, I found **Pi Agent** the best tool I can use.   
**Qwen Code** is a very good tool too, but, due to its huge system context + tools, it is too limited with local LLM and, probably, also more tokens-consuming.
  
I tried local LLM and also different LLM providers.      
I did tests using my old graphic card with 16GB of VRAM.  
I started with Ollama and then moved to llama.cpp, that allowed me to obtain better performance with all the models.  
Here my experiments:  
- [Ollama](Ollama&%20models)
- [llama.cpp](https://github.com/alex-piccione/learning.Llama-cpp) (dedicated repository)

The _scripts/_ folder contains Bash scripts to create and test the models.  
Essentially the *create_models.sh* and the *test_models.sh* are the one with _public_ functions to use.  


## Considerations about the different ways to use AI

There are three categories of tools:
- IDE plugins........... ❌ Can do potentially everything in your PC
- Web based tools ...... ❌ Too limited, models prone to mistakes, time-wasting.
- Standalone programs .. ✔️ The perfect solution when run on container

**IDE plugins** are usually too much "restricted" in usage; you need to follow their way to work, but are very well integrated with the IDE and github trought it.
They are not 100% secure, because they still have access to ... who knows? AND you can inadvertitley share secrets very easily.
- GitHub Copilot (VS & VS Code)
- Continue.DEV
- [Cline](Cline/README.md)
- LllamaCode
- CodeGeeX 

**Web based tools** are nice, but I find out too fragile and you can't usually use the provider and model of your choice.  
For this tools I use a shadow GitHub account, that doen't have access to my real account.  
Their connector are a little bit fragile and sometimes doesn't work.
- AliBaba Qwen Coder
- Mistral Chat

**Standalone programs** can run locally or on a Docker container, so they can be almost 100% secure.  
They have a CLI and sometime a web UI exposed on the guest.  


| [Aider](Aider/Aider.md)                          | ❌ Found an issue very earlier and abandoned before having it really working |
| [OpenCode](OpenCode/OpenCode.md)                 | ❔ Abandoned before having it setup neither once                              |
| [Qwen Code](Qwen%20Code/README%20Qwen%20Code.md) | ✔️ Really good                                                               |
| [Pi Agent](Pi%20Agent/README%20Pi%20Agent.md)    | ✔️ SFantastic!                                                               |
| Mistral Vibe                                     | ❔ Never tried                                                                |


## 🐳 Docker

I run the tools in a Docker container and Binded Volumes to store the projects (GitHub repositories) and tool settings/customization, so that I can easily access all within the host. This allows to open the projects with local IDE (usefull to check the changes done by the AI tool) and update settings/customization easily.   
The way to create the bind volume is with the _--mount type=bind_ of _docker run_ command (*-v** parameter also works, but is the old way), because it needs to NOT be created by the Docker build or you can have permissions issues (this happens if you create the volume in the Dockerfile).  
At the moment I'm not switching user, so the tool runs with _root_.  
[TODO] ** It will be good to switch to use a not-root user. **   

Once a container is created, it is not possible to attach a new volume to it.  
For this reason I use _/project_ folder as bind  volume, where I can add project/repositories any time.  


## :octocat: GIT & GitHub

### Credentials

The GitHub credentials to execute "git" can be set with these commands:
```bash
git config --global user.name "$git_username"
git config --global user.email "$git_email"
git config --global credential.helper store
echo "https://$git_username:$git_pat@github.com" > ~/.git-credentials
```

### GitHub CLI

This one requires its own authentication.  
I automatically provide it generating an environment variable on-the-fly when we select the project.  
See _start.sh_ scripts in different tools (Qwen Code or Pi Agent for example).  

To check auth:
```bash
gh auth status 2>/dev/null || echo "gh not authenticated"
```

To manually login using hte token:
```bash

```


### PAT

Create a fine-grained access token for the owner of the repo, using the following data:
- Owner: ``<GitHub account name>``
- Repositories: All  
- Permissions:
  + Contents: Read & Write
  + Pull Requests: Read & Write
  + Actions: Read  (to check execution result)
  + (Metadata: added automatically)

Generate teh PAT and copy it.  
Store it in a environment variable: `setx GITHUB_PAT_<ACCOUNT>_<USE CASE> <GITHUB_PAT>`  

On the first call of ``git config --global credential.helper store`` it will ask for a PAT,
and it will store it in ~/git-credentials on a single line like this:
``https://<username>:<GITHUB_PAT>S@github.com``

_Note_: When paste in bash shell with right click, **CLICK ONLY ONCE** (it will not show nothing so you tend to right-click again!)


### Use Multiple PAT

The fine-grained GitHub PAT is created for a the user or an organiztion they have access to; you have to choose it.       
If you created a PAT attached to the user, it does not allow you to work with the organization repositories, and vice-versa.  

There is a way to use a specific PAT in the github credentials ?

To differentiate the PAT to use, based on the repository, you need to enable this property:
```sh 
#  Enable path-based matching
git config --global credential.useHttpPath true
``` 

Then you can add multiple PAT, for specific repositories.  
The PAT for-repo has to be set with the FULL REPOSITORY PATH, it can't be generic using part of the path (TO VERIFY) or wildcard.  


### 📌 Edit credentials

```bash
docker ps
container=
docker exec -it $container //bin//bash    ## double slash to prevent GitBash to correct the path
```

To read the current credentials: 
``cat ~/.git-credentials``

```bash
# git config --global credential.useHttpPath true    # at this point should be already set

# Clear the file (creates it if it doesn't exist)
# Using ':' is a clean way to truncate a file to 0 bytes
: > ~/.git-credentials

# ...or delete specific lines:
sed -i '1d' ~/.git-credentials

## Get env variables with tokens
env | grep GITHUB | sort

# Add PAT for owned repositories of Account or Organization

USER_TOKEN=
USERNAME=
GITHUB_ACCOUNT=
GITHUB_ORG=
echo "https://$USERNAME:$USER_TOKEN@github.com/$GITHUB_ACCOUNT" >> ~/.git-credentials
echo "https://$USERNAME:$USER_TOKEN@github.com/$GITHUB_ORG" >> ~/.git-credentials

# Add PAT for NOT-owned repo
TOKEN_2=$GITHUB_PAT_FOR_COLLABORATOR
USERNAME=...
echo "https://$USER$:$TOKEN_2@github.com/<another_account_or_organization>/repository.git" >> ~/.git-credentials  ## OK
echo "https://<username>:$TOKEN_2@github.com/<another_account_or_organization>/*" >> ~/.git-credentials           ## DOES NOT WORK (wildcard NOT accepted)
# practically you need to use the full repo path

# 5. Secure the file
chmod 600 ~/.git-credentials
```

### Recover GitHub credentials to migrate to a new container

``git config --global user.name``  
``git config --global user.email``  
``cat ~/.git-credentials``  ("github_pat_" is part of the key)


### 🚨 Troubleshooting: Terminal Freeze & Unresponsive Container

#### Symptoms
* The interactive container terminal hangs with a blinking cursor. It accepts text input but provides no prompt or output.
* Running `docker exec -it <container> /bin/bash` works for internal commands (like `ps` or `echo`), but running `ls` or accessing the shared project directory freezes that new terminal session instantly.

#### Root Cause: Bind Mount Break
The issue is a **hard breakdown of the filesystem bridge (9p protocol)** between the Windows host and the WSL2/Docker Linux VM. This typically occurs when:
1. Windows enters a low-power state, sleep, or Modern Standby (`S0`).
2. The WSL2 backend runs idle RAM/disk compaction after hours of inactivity, dropping the virtual connection to the host.

When this bridge breaks, any process trying to read or write to the shared host folder (`/projects`) is forced into a **`D` state (Uninterruptible Sleep)**. Because the process is trapped at the kernel level waiting for Windows disk I/O that will never respond, **it cannot be killed (even with `kill -9`) or bypassed from inside the container.**

#### Recovery Procedure
This cannot be resolved from inside the container. You must reset it from the Windows host:

**Forcefully restart the container:**
 ```bash
docker restart -t 0 <container_name>
```

If Docker hangs (common): Force-close the entire WSL backend via an Administrator PowerShell, then restart Docker Desktop:

```powershell
wsl --shutdown
```
**You need to restart Docker Desktop.**


### Prevent/Avoid hang up

The issue can be prevented (probably) avoiding the disk to go in low-power mode (sort of "sleep") and actually cause the bind mount break.  
Avoiding the "sleep mode" is possible with a keep-alive scritpt, but is not a nice thing if the PC is left unattended for hours or for the full night.  

Another approach is to check the state and restart it when need to start a session:
```bash
container_id=$(echo -e "$opt" | awk -F'[()]' '{print $2}')              

# Check if the container is running and if its mount is frozen
echo -e "Checking container health: $container_id..."
if docker ps --format '{{.ID}}' | grep -q "$container_id"; then
    # If 'ls /projects' takes longer than 2 seconds, it's frozen
    if ! timeout 2 docker exec "$container_id" ls /projects >/dev/null 2>&1; then
        echo -e "\n⚠️ ${RED}Mount frozen! Running automated recovery...${NC}"
        
        # 1. Force kill Docker Desktop interface
        echo -e "🛑 Closing Docker Desktop..."
        #taskkill.exe //F //IM "Docker Desktop.exe" >/dev/null 2>&1
        # close the user 
        powershell.exe -Command "Stop-Process -Name 'Docker Desktop', 'com.docker.backend' -Force -ErrorAction SilentlyContinue"
        
        # 2. Force shutdown the WSL backend
        echo -e "💀 Shutting down WSL..."
        wsl.exe --shutdown
        
        # 3. Relaunch Docker Desktop
        echo -e "🔄 Relaunching Docker Desktop..."
        cmd.exe /c start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        
        sleep 5                        

        # Wait dynamically for the Docker daemon to be fully ready
        echo -n "⏳ Waiting for Docker engine to start up..."
        until docker info >/dev/null 2>&1; do
            echo -n "."
            sleep 2
        done
        echo -e "\n✅ Docker is back online!"
    fi
fi
echo -e "Starting and attaching to container: $container_id \n\n"
```





## Ollama

To access host Ollama, it needs to be exposed to the Docker network.
```bash
# 8k/16k context
OLLAMA_ORIGINS="*"   OLLAMA_HOST=0.0.0.0  OLLAMA_MAX_CONTEXT_SIZE=8162    ollama serve
OLLAMA_ORIGINS="*"   OLLAMA_HOST=0.0.0.0  OLLAMA_MAX_CONTEXT_SIZE=16384   ollama serve
```

Use **HTTP**, not HTTPS.  

```bash
curl http://localhost:11434/v1/chat/completions -d '{
  "model": "qwen3:8b",
  "messages": [{"role": "user", "content": "hello"}]
}'


curl http://host.docker.internal:11434/v1/chat/completions -d '{
  "model": "qwen3:8b",
  "messages": [{"role": "user", "content": "hello"}]
}'
```
  
Models that can run locally: [Ollama Models](Ollama_Models.md)


## Tools UI

AionUi: https://github.com/iOfficeAI/AionUi  
Qwen Code documentation suggests it to have a UI (and also https://github.com/Piebald-AI/gemini-cli-desktop).



## Qwen Coder

https://coder.qwen.ai

Is a web tool, it uses Qwen website and it often stop to work and disrupt the work a lot ⚠️ (20/04/2026).

## Mistral AI 

I added GitHub connectors but it doesn't work today (it shows a message, probably internal incident) ⚠️ (20/04/2026).


## Mistral Vibe

https://docs.mistral.ai/getting-started/quickstarts/vibe/install-and-first-prompt
