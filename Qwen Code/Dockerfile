FROM ghcr.io/qwenlm/qwen-code:0.15.2
# https://github.com/QwenLM/qwen-code/pkgs/container/qwen-code
# https://github.com/QwenLM/qwen-code/releases
# https://github.com/QwenLM/qwen-code/blob/main/Dockerfile

### Install .net 10 SDK
# Install prerequisites
RUN apt-get update && apt-get install -y wget gpg apt-transport-https

### Microsoft .net SDK

# Download and install key to keyrings (modern way)
RUN wget https://packages.microsoft.com/keys/microsoft.asc -O- | \
  gpg --dearmor > /usr/share/keyrings/microsoft-prod.gpg

# Re-add repo with signed-by
RUN echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/microsoft-prod.list

RUN apt-get update && apt-get install -y \
    dotnet-sdk-10.0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

    #git \
    #curl \
    #wget \
    #python3 \
    #python3-pip \
    #nodejs \
    #npm \
    #vim \
    #nano \
    #build-essential \


# WORKDIR /projects
# we use a /projects directory that has to be passed as volume !!!


#ENTRYPOINT ["/bin/sh", "-c", "/projects/start.sh"]
# Use ENTRYPOINT to run the script, and CMD for the default argument
ENTRYPOINT ["/projects/start.sh"]
# Default: no argument (interactive selection)
CMD [""]  
