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
- 👌 [Ollama](Ollama&%20models)
- 💪 [llama.cpp](https://github.com/alex-piccione/learning.Llama-cpp) (dedicated repository)

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
| [OpenCode](OpenCode/OpenCode.md)                 | ❔ Abandoned before having it fully setup                                     |
| [Qwen Code](Qwen%20Code/README%20Qwen%20Code.md) | ✔️ Really good                                                               |
| [Pi Agent](Pi%20Agent/README%20Pi%20Agent.md)    | ✔️ Fantastic!                                                                |
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

The generic GIT credentials to execute `git` can be set with these commands:
```bash
git config --global user.name "$git_username"
git config --global user.email "$git_email"
git config --global credential.helper store
echo "https://$git_username:$git_pat@github.com" > ~/.git-credentials
```
The start scripts contains these commands.  
For more details, look at [GitHub access.md]("GitHub access.md").  


### GitHub CLI

GitHub CLI requires its own authentication, it doesn't use .git-credentials.    
It can use the **GITHUB_TOKEN** environment variable, so we will set it.  
The start scripts automatically populate the variable with the right token on-the-fly when a project with a repository is selected.    
See _start_common.sh_ script.  

To check the GH CLI authentication:
```bash
gh auth status 2>/dev/null || echo "gh not authenticated"
```


### GitHub PAT

We use fine-grained access tokens.  
Use the following permissions for the owned repositories:
- Owner: ``<GitHub account name>``
- Repositories: All  
- Permissions:
  + Contents: Read & Write
  + Pull Requests: Read & Write
  + Actions: Read (to check execution result, using gh ?) 
  + Workflows: Read & Write (to push changes to the .github/workflows folder)
  + (Metadata: added automatically)

Generate the PAT and copy it.  
Store it in a environment variable: `setx GITHUB_PAT_<ACCOUNT>_<USE CASE> <GITHUB_PAT>`  

The start script or the first call of ``git config --global credential.helper store`` will ask for a PAT,
and it will store it in ~/git-credentials on a single line like this:
``https://<username>:<GITHUB_PAT>S@github.com``

_Note_: When paste in bash shell with right click, **CLICK ONLY ONCE** (it will not show nothing so you tend to right-click again!)


### Use Multiple GitHub PAT

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
docker exec -it $container /bin//bash    ## double slash to prevent GitBash to correct the path
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
