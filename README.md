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

I want to run the tools in a Docker container and us a Bind Volume to store the repo, so that I can easily access it within an IDE.  
The problem is that a **Dockerfile -v parameter** only creates readonly bind models.  
So I will use **Docker Compose** files, where is much easier to set volumes.  



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
