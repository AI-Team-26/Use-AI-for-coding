# Use AI for Coding

What I was working on? --> [TODO](TODO.md).  

This repository contains documentation, notes, scripts about the use of AI for coding assistance.  
In the end I started to work with AI "tools" that runs on Docker containers.  
The Docker containers can be customized to satisfy basic stuff (Git + GitHub auth) and specific requirements (customized prompt for particular languages, predefined skills etc...).  
For my specific situation, I found **Pi Agent** the best tool I can use.   
**Qwen Code** is a very good tool too, but, due to its huge system context + tools, it is too limited with local LLM and, probably, also more tokens-consuming.
  
I tried local LLM and also different LLM providers.  
I did tests using my old graphic card with 16GB of VRAM.  
I started with Ollama and then moved to llama.cpp, that allowed me to obtain better performance.  
Here my experiments:  
- 👌 [Ollama](Ollama&%20models)
- 💪 [llama.cpp](https://github.com/alex-piccione/learning.Llama-cpp) (dedicated repository)

The _scripts_ folder contains Bash scripts to create and test the models.  
Essentially the *create_models.sh* and the *test_models.sh* are the one with _public_ functions to use.  


## Considerations about the different ways to use AI

There are three categories of tools:

| IDE plugins         | ❌ Can do potentially everything in your PC (when run on local IDE). Limited in choices (models/providers/UI). Easy. |
| Web based tools     | ❌ Too limited in models and procedures and time-wasting for start. You became coupled to specific provider tool.    |
| Standalone programs | ✔️ Extremely customizable, can use any model (local and from providers). The perfect solution when run on container. |

**IDE plugins** are usually too much "restricted" in usage; you need to follow their way to work, but are very well integrated with the IDE and GitHub trought it.
They are not 100% secure, because they still have access to ... who knows? AND you can inadvertitley share secrets very easily.
- GitHub Copilot (VS & VS Code)
- Continue.DEV
- [Cline](Cline/README.md)
- LllamaCode
- CodeGeeX 
  
There are good ones for VS Code, but I haven't found one for Visual Studio (apart Copilot).

**Web based tools** are nice, but I find out too fragile and you can't usually use the provider and model of your choice.  
For this tools I use a shadow GitHub account, that doen't have access to my real account.  
Their connector are a little bit fragile and sometimes doesn't work.
- AliBaba Qwen Coder
- Mistral Chat (renamed Mistral Vibe?)

**Standalone programs** can run locally or on a Docker container, so they can be almost 100% secure.  
They have a CLI and sometime a web UI exposed on the guest.  

| [Aider](Aider/Aider.md)                          | ❌ Found an issue very earlier and abandoned before having it really working |
| [OpenCode](OpenCode/OpenCode.md)                 | ❔ Abandoned before having it fully setup                                     |
| [Qwen Code](Qwen%20Code/README%20Qwen%20Code.md) | ✔️ Good                                                                      |
| [Pi Agent](Pi%20Agent/README%20Pi%20Agent.md)    | ✔️ Fantastic!                                                                |
| Mistral Vibe (local)                             | ❔ Never tried                                                                |


## 🐳 Docker

I run the tools in a Docker container and Binded Volumes to store the projects (GitHub repositories) and tool settings/customization, so that I can easily access all within the host. This allows to open the projects with local IDE (usefull to check the changes done by the AI tool) and update settings/customization easily.   
The way to create the bind volume is with the _--mount type=bind_ of _docker run_ command (*-v** parameter also works, but is the old way), because it needs to NOT be created by the Docker build or you can have permissions issues (this happens if you create the volume in the Dockerfile).  

Once a container is created, it is not possible to attach a new volume to it.  
For this reason I use _/project_ folder as bind  volume, where I can add project/repositories any time.  

### root user

At the moment I'm not switching user, so the tool runs with _root_.  
[TODO] ** It will be good to switch to use a not-root user. **   

Pros
 + The agent can use apt-get and install whenever it needs a library (ffmpeg for example)
 + The agent can chnge "itself". It can edit SYSTEM.md. AGENTS.md, skills, extensions, setup scripts
 + Easy to work with
   - no special permisisons for /projects folder
   - can edit the AHGENTS.md and SYSTEM.md and also the skills and extensions
Cons
- The agent can see every file in the container, also secrets (.git-credentials)


## :octocat: GIT & GitHub

GIT and GitHub is a too big argument to be described here.  
Refer to [GIT credentials](GIT.md) for the GIT credentials setup.  
Refer to [GitHub access for Agent](GitHub%20access%20for%20Agent.md) to know how to give the Agent access to the GitHub repositories.  

### Default branch name

`git config --global init.defaultBranch main`

### Unwanted version diff

**CRLF vs LF**  
Windows uses `CRLF`, Linux `LF`.  
GIT, by default consider 2 files different if the end-line style is not the same.  
To avoid this instruct GIT to [TODO].

**File mode**  
When a file is edited both from the Agent (Linux) and the Host (Windows) it is possible it result changed because it get a different permissions set.   
`git status` says that a file is modified but openeing it doesn't show any difference. Using `git diff` the problem is clear.  

```sh
$ git diff file.txt
diff --git a/file.txt b/file.txt
old mode 100755
new mode 100644
```

To instruct GIT to ignore this differnce
only on hte Linux side and inspecting it, the difefrence is that it has lost the executable permission (set by Linux) wjhen edited in Windows (755 -> 644).   
`git config --global core.fileMode false` Will set GIT to ignore permissions changes of files.

If doesn't work, it is possible a more specific config exists on hte repo, find it:
``git config --list --show-origin | grep -i filemode`` 


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
