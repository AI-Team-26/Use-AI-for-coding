# Use AI for Coding

There are 3 types of tools:
- IDE plugins
- Web based tools
- Standalone programs

**IDE plugins** are usually too much "restricted" in usage; you need to follow their way to work, but are very well integrated with the IDE and github trought it.
They are not 100% secure, because they still have access to ... who knows? AND you can inadvertitley share secrets !!  


**Web based tools** are nice, but I find out too fragile and you can't usually use the provider and model of your choice.  
For this tools I use a shadow GitHub account, that doen't have access to my real account.  
Their connector are a little bit fragile and sometimes doesn't work.

**Standalone programs** can run locally or on a Docker container, so they can be almost !00% secure.  
They have a CLI and sometime a web UI exposed on the guest.  

Local running tools s 

**IDE plugins** ❌ 
- GitHub Copilot
- Continue.DEV
- Cline

**Web based tools**  
- AliBaba Qwen Coder
- Mistral Chat

**Standalone programs** on Docker ✔️
- [Aider](Aider/Aider.md)
- [OpenCode](OpenCode/OpenCode.md)
- [Qwen Code](Qwen%20Code/Qwen%20Code.md)
- Mistral Vibe


## 🐳 Docker

I run the tools in a Docker container and Bind Volume to store the repo, so that I can easily access it within an IDE.  
The way to create teh bind volume is the *-v** parameter of _docker run_.  

## GitHub

### Credentials

Can be set with these commands:
```bash
git config --global user.name "$git_username"
git config --global user.email "$git_email"
git config --global credential.helper store
echo "https://$git_username:$git_pat@github.com" > ~/.git-credentials
```


### PAT

I create a fine-grained access token.
Repositories: All  
Permissions:
- Contents: Read & write
- Pull Requests: Read & Write
- Actions: Read  (to check execution result)
- Metadata (required): automatically selected

### Recover PAT to migrate to a new container

``git config --global user.name``  
``git config --global user.email``  
``git config --global credential.helper``  
``cat ~/.git-credentials``  "github_pat" is part of the key  


### Action logs

How to access Action run logs?   
TODO:   not found a solution yet  
Maybe GitHub API (it needs PAT)?  
https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#list-workflow-runs-for-a-repository


### Ollama

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


### Tools UI

AionUi: https://github.com/iOfficeAI/AionUi  
Qwen Code docuemntation sugegsts it to have a UI (and also https://github.com/Piebald-AI/gemini-cli-desktop).




## OpenCode

[OpenCode](OpenCode/OpenCode.md)


## Qwen Code

[Qwen Code](Qwen%20Code/Qwen%20Code.md)



## Qwen Coder

https://coder.qwen.ai

Is a web tool, it uses Qwen website and it often stop to work and disrupt the work a lot ⚠️ (20/04/2026).

## Mistral AI 

I added GitHub connectors but it doesn't work today ⚠️ (20/04/2026).with connecto


## Mistral Vibe

https://docs.mistral.ai/getting-started/quickstarts/vibe/install-and-first-prompt
