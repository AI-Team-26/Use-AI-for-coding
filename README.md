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
- [Qwen Code](Qwen%20Code/README%20Qwen%20Code.md)
- [Pi Agent](Pi%20Agent/README%20Pi%20Agent.md)
- Mistral Vibe


## 🐳 Docker

I run the tools in a Docker container and Bind Volume to store the repo, so that I can easily access it within an IDE.  
The way to create teh bind volume is the *-v** parameter of _docker run_.  

## GitHub

### Credentials

The GitHub credentials to execute "git" can be set with these commands:
```bash
git config --global user.name "$git_username"
git config --global user.email "$git_email"
git config --global credential.helper store
echo "https://$git_username:$git_pat@github.com" > ~/.git-credentials
```

### PAT

Create a fine-grained access token for the owner of the repo, using the following data:
- Owner: <GitHub account name>
- Repositories: All  
- Permissions:
  + Contents: Read & Write
  + Pull Requests: Read & Write
  + Actions: Read  (to check execution result)
  + Metadata (required): automatically selected

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


### Edit credentials

**To read the current credentials**:
``cat ~/.git-credentials``

```bash
# git config --global credential.useHttpPath true  

# Clear the file (creates it if it doesn't exist)
# Using ':' is a clean way to truncate a file to 0 bytes
: > ~/.git-credentials

# ...or delete specific lines:
sed -i '2d' ~/.git-credentials

# Add PAT for owned repositories of Account or Organization

TOKEN_1=$GITHUB_PAT_OF_USER
echo "https://<username>:$TOKEN_1@github.com/<github_account>" >> ~/.git-credentials
echo "https://<username>:$TOKEN_1@github.com/<github_organization>" >> ~/.git-credentials

# Add PAT for NOT-owned repo
TOKEN_2=$GITHUB_PAT_FOR_COLLABORATOR
echo "https://<username>:$TOKEN_2@github.com/<another_account_or_organization>/repository.git" >> ~/.git-credentials  ## OK
echo "https://<username>:$TOKEN_2@github.com/<another_account_or_organization>/*" >> ~/.git-credentials               ## DOES NOT WORK (wildcard NOT accepted)
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
