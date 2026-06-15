#FROM debian:bookworm-slim
FROM mcr.microsoft.com/dotnet/sdk:10.0 

# Install prerequisites: Node.js 22 and security requisites
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    wget gpg ca-certificates curl git gnupg openssh-server \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    #&& npm install -g @mariozechner/pi-coding-agent \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

## Download and install key to keyrings (modern way)
#RUN wget https://packages.microsoft.com/keys/microsoft.asc -O- | \
#    gpg --dearmor > /usr/share/keyrings/microsoft-prod.gpg
#
## Add repo with signed-by and install .NET 10 SDK
#RUN echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/microsoft-prod.list \
#    && apt-get update && apt-get install -y dotnet-sdk-10.0 \
#    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Pi Installation
RUN curl -fsSL https://pi.dev/install.sh | sh

# Pi Extensions
RUN pi install https://github.com/gsanhueza/pi-token-speed

# 🔐 SSH Server Setup
RUN mkdir /var/run/sshd \
    && echo 'root:pi' | chpasswd \
    && sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config \
    && sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config \
    && sed -i 's/#PermitEmptyPasswords no/PermitEmptyPasswords no/' /etc/ssh/sshd_config

# Expose SSH port
EXPOSE 22

# Use ENTRYPOINT to start sshd first, then run start.sh
ENTRYPOINT ["/bin/sh", "-c", "/usr/sbin/sshd && exec /projects/start.sh"]
CMD [""]
