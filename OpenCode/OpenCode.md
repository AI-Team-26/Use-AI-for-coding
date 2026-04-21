# OpenCode

https://opencode.ai/download

https://opencode.ai/docs/#install


## Docker

### Building the Container

```bash
docker build -t opencode:1 .
docker build -t opencode:2 -f Dockerfile_2 .
```

## Running the Container

### With a project directory mounted:
```bash
MSYS_NO_PATHCONV=1
# run with Windows user so it has permission on volume in the host
    #--user $(id -u):$(id -g) \
docker run -it \
    -v //d/Programming/opencode_workspace:/workspace \
    opencode:2
```

### For interactive development:
```bash
docker run -it opencode:1
```

## Default User

The container runs as the `developer` user (password: `developer`) with sudo privileges.

## Ports

Port 8080 is exposed by default. Modify the Dockerfile if you need other ports.