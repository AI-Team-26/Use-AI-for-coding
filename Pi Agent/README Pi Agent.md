# Pi Agent

A minimalist terminal coding agent.  
It lets use root user to Pi Agent. Container is not accessible/exposed to internet.  
It shares settings and can share projects folder (using a bind mount volume) within the host, so settings and code are easy to read and change.  

TODO:
- Add a simple and light web-ui:  https://github.com/ygncode/pi-web
- Add a multi-session web-ui manager: https://github.com/04mg/caw
- Add routing of API keys
- Add STT capability

## Docker

All the Docker job (build the image, provision the volumes, create the containers) is done by `containers.sh`.  
The steps are comma-concatenable (spaces tolerated, unknown steps are rejected):
- `create_image` → build the Docker image (the label `description="Pi Agent"` is looked for by the ai-start script; the image tag is set in `containers.sh`)
- `setup` → create the docker-volumes folders and copy the configuration (shared scripts, per-agent `.pi`, `github_pat`); the logic is in `containers_setup.sh`
- `create_container` → `docker create` one container per agent

The agents (icon + alias), their default models and the docker-volumes path are defined in `constants.sh`.  
The docker-volumes path can be overridden without editing the tracked file: `PI_AGENT_VOLUMES=/my/path ./containers.sh setup`.

```bash
cd "Pi Agent"

# all the steps
./containers.sh create_image,setup,create_container

# single steps
./containers.sh create_image
./containers.sh setup
./containers.sh create_container
```

### Volumes

The containers share a common *scripts* folder and also share their own *.pi* and *projects* folders.  
The scripts folder contains general setup scripts.  
The .pi folder is where each container has its skills, extensions and model settings (it is not common so the selected model is not inherited from last selection of another container).  
The **projects** folder allows to work on the same code from the host, making possible agent-driven/pair programming.  

The bind-mount volumes:
- (shared)    /scripts   -> for common
- (shared)    /share     -> shared data
- (container) /projects  -> for the GIT repositories, local projects and other utility files (start script, .env, README etc...)
- (container) /root/.pi  -> for the settings, skills etc...
