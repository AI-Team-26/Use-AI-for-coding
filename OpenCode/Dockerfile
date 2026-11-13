FROM mcr.microsoft.com/dotnet/sdk:10.0 

# Install prerequisites: Node.js 24 and security requisites
# and libs for Rust 
# and custom libraries for some projects (ffmpeg)
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    wget gpg ca-certificates curl git gnupg jq \
    build-essential pkg-config libssl-dev \
    && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y nodejs \
    && apt-get install -y ffmpeg \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

#--- Rust
RUN curl -fsSL https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
ENV PATH="${PATH}:/root/.cargo/bin"

#--- Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

#--- GIT settings
RUN git config --global init.defaultBranch main
RUN git config --global core.fileMode false
RUN git config --global credential.https://github.com.helper "!gh auth git-credential"

#--- OpenCode Agent

# OpenCode Installation (official install script)
RUN curl -fsSL https://opencode.ai/v2/install | bash

# Add OpenCode bin path to ENV (installer defaults to $HOME/.opencode/bin)
ENV PATH="${PATH}:/root/.opencode/bin"

#COPY opencode.json ~/.config/opencode/opencode.json
COPY opencode.json /root/.config/opencode/opencode.json

# Backup the .opencode directory structure so it survives volume mounts
#RUN echo "Preparing OpenCode backup state..."
#RUN mkdir -p /root/.opencode \
#    && tar -cf /root/.opencode_backup.tar -C /root/.opencode . || true

#--- Set User

# Switch to the developer user
#USER developer
#ENV HOME=/home/developer

# Set working directory
#WORKDIR /workspace

# Create a non-root user
#RUN useradd -m -s /bin/bash developer && echo "developer:developer" | chpasswd && adduser developer sudo
#RUN useradd -m -s /bin/bash developer

# Give permission on workspace dir
#RUN chown developer:developer /workspace && chmod 755 /workspace
#RUN chmod -R 777 .
#RUN chown -R developer:developer /workspace


EXPOSE 8080
ENTRYPOINT ["/scripts/start.sh"]