FROM ghcr.io/qwenlm/qwen-code:0.15.2
#https://github.com/QwenLM/qwen-code/pkgs/container/qwen-code
# https://github.com/QwenLM/qwen-code/releases
# https://github.com/QwenLM/qwen-code/blob/main/Dockerfile

### Install .net 10 SDK
# Install prerequisites
RUN apt-get update && apt-get install -y wget gpg apt-transport-https

# Download and install key to keyrings (modern way)
RUN wget https://packages.microsoft.com/keys/microsoft.asc -O- | \
  gpg --dearmor > /usr/share/keyrings/microsoft-prod.gpg

# Re-add repo with signed-by
RUN echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/microsoft-prod.list

# Download and add Microsoft key
#RUN wget https://packages.microsoft.com/keys/microsoft.asc -O- | gpg --dearmor > microsoft.asc.gpg
#RUN mv microsoft.asc.gpg /etc/apt/trusted.gpg.d/

# Add Microsoft repo (detects Debian bookworm automatically)
#RUN wget https://packages.microsoft.com/config/debian/12/prod.list -O /etc/apt/sources.list.d/microsoft-prod.list

RUN apt-get update && apt-get install -y dotnet-sdk-10.0 

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


# Create and set working directory to workspace where projects are typically mounted
#WORKDIR /projects
# we use a /projects directory that has to be passed as volume !!!

# the mount volume will wipe out this, so don't COPY nothing 
#COPY container/README.md /projects
#COPY container/start.sh /projects
#RUN chmod +x /projects/start.sh


# !!! root/.qwen/settings.json has to be set as a Docker Volume !!!
# copy configuration_template to ~/.qwen/settings.json
#COPY qwen-settings.json ~/.qwen/settings.json

# !!! /workspace has to be already set as a Docker Volume !!!
#CMD ["sh", "-c", "cd /workspace/ICode && qwen"]
#CMD ["/bin/bash"] for investigation


#COPY start.sh /usr/local/bin/
#RUN chmod +x /usr/local/bin/start.sh
#ENTRYPOINT ["/usr/local/bin/start.sh"]

#ENTRYPOINT ["/bin/sh", "-c", "/projects/start.sh"]
# Use ENTRYPOINT to run the script, and CMD for the default argument
ENTRYPOINT ["/projects/start.sh"]
# Default: no argument (interactive selection)
CMD [""]  
