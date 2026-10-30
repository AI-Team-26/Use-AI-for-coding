# OpenCode

I'm trying this because hte OpenCode free models works only with opencode running app.  

**OBSOLETE** All the scripts here are obsolete and have been moved into the _containers.sh_ script file.  

## Docker

### Build the Image

Use the "OpenCode" text in the label because the utility script (outside of this project) called to start the ai agents, looks for that string.  

```bash
cd OpenCode
containers.sh create

# example:
docker build \
    --label description="OpenCode" \
    -t opencode:3 \
    -f Dockerfile \
    .
```

### Setup the Containers

Copy necessary customized files into the bind volumes.  
Replace placeholders with secrets.

```bash
cd OpenCode
containers.sh setup
```

### Run the containers

The containers share a common *scripts* folder and also share their own *opencode* and *projects* folders.  
The scripts folder contains general setup scripts.  
The .opencode folder is where each container has its distinctive instructions.    
The **projects** folder allows to work on the same code from the host, making possible agent-driven/pair programming.  
  
The bind-mount volumes:
- (shared)   /scripts    -> common scripts and settings
- (shared)   /share      -> for sharing files between agents and with the Host
- (container)/projects   -> the GIT repositories (projects)
- (container)/opencode   -> the OpenCode settings, skills etc...

```bash
cd OpenCode
containers.sh run
```