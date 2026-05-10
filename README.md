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
- [Qwen Code](Qwen%20Code/Qwen%20Code%20README.md)
- [Pi](Pi/Pi%20README.md)
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

Create a fine-grained access token for the owner (alex-cyber-75)
Owner: alex-cyber-75
Repositories: All  
Permissions:
- Contents: Read & write
- Pull Requests: Read & Write
- Actions: Read  (to check execution result)
- Metadata (required): automatically selected

On the first call of ``git config --global credential.helper store`` it will ask for a PAT,
and it will store in ~/git-credentials on a single line like this:
``https://alex-cyber:github_pat_11CAZ*****HhS@github.com``


### Use Multiple PAT

The fine-grained GitHub PAT is created for a the user or an organiztion they have access to; you have to choose it.       
If you created a PAT attached to the user, it does not allow you to work with the organization repositories, and vice-versa.  

There is a way to use a specific PAT in the github credentials ?

To differentiate the PAT to use, based on the repository, you need to enable this property:
``git config --global credential.useHttpPath true`` 

Then you can add multiple PAT, for specific repositories.  
The PAT for-repo has to be set wit hte hFULL REPOSITORY PATH, can't be "generic".  

[TODO: example of credentials for a repo]

**To check current credentials**:
``cat ~/.git-credentials``

Then the ~/git-credentials file should contain the full path, no wildcard ("*") and full repo path (ending with .git"):  
```txt
https://user:token1@github.com/account
https://user:token2@github.com/organization/repo.git
```

```bash
# 1. Enable path-based matching
git config --global credential.useHttpPath true

# 2. Clear the file (creates it if it doesn't exist)
# Using ':' is a clean way to truncate a file to 0 bytes
: > ~/.git-credentials

# 2b or delete specific lines:
sed -i '2d' /root/.git-credentials

# 3. Add PAT for owned repositories (Use -e for newlines)
TOKEN_1=***
echo -e "https://alex-cyber:$TOKEN_1@github.com/alex-cyber-75" >> ~/.git-credentials

# 4. Add PAT for organization repositories
TOKEN_2=***
echo -e "https://alex-cyber:$TOKEN_2@github.com/AIex-75-Team/*" >> ~/.git-credentials
echo -e "https://alex-cyber:$TOKEN_2@github.com/AIex-75/Alex75.AIAgents" >> ~/.git-credentials
echo -e "https://alex-cyber:$TOKEN_2@github.com/AIex-75/Alex75.AIAgents" >> ~/.git-credentials

# 5. Secure the file
chmod 600 ~/.git-credentials
```` 


## Organization repositories

Create a fine-grained access token for the organization repositories
Owner: organization
Repositories: All
Permisisons:
- Contents: Read & write
- Pull Requests: Read & Write
- Actions: Read  (to check execution result)
- Metadata (required): automatically selected


github_pat_11CAZACO*****OEItFo



### Recover PAT to migrate to a new container

``git config --global user.name``  
``git config --global user.email``  
``git config --global credential.helper``  
``cat ~/.git-credentials``  ()"github_pat_" is part of the key)    IS IT SHOWIMNG ONLY THE LAST ??


### Replace the PAT

https://alex-cyber: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@github.com

### Action logs

How to access Action run logs?   
TODO:   not found a solution yet  
Maybe GitHub API (it needs PAT)?  
https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#list-workflow-runs-for-a-repository

or install github CLI in the Container?  
https://github.com/cli/cli/blob/trunk/docs/install_linux.md#debian
```bash
(type -p wget >/dev/null || (sudo apt update && sudo apt install wget -y)) \
	&& sudo mkdir -p -m 755 /etc/apt/keyrings \
	&& out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg \
	&& cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
	&& sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
	&& sudo mkdir -p -m 755 /etc/apt/sources.list.d \
	&& echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
	&& sudo apt update \
	&& sudo apt install gh -y
```


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
  
Models that can run locally: [Ollama Models](Ollama_Models.md)


### Tools UI

AionUi: https://github.com/iOfficeAI/AionUi  
Qwen Code docuemntation sugegsts it to have a UI (and also https://github.com/Piebald-AI/gemini-cli-desktop).




## OpenCode

[OpenCode](OpenCode/OpenCode.md)


## Qwen Code

[Qwen Code](Qwen%20Code/README.md)



## Qwen Coder

https://coder.qwen.ai

Is a web tool, it uses Qwen website and it often stop to work and disrupt the work a lot ⚠️ (20/04/2026).

## Mistral AI 

I added GitHub connectors but it doesn't work today ⚠️ (20/04/2026).with connecto


## Mistral Vibe

https://docs.mistral.ai/getting-started/quickstarts/vibe/install-and-first-prompt
