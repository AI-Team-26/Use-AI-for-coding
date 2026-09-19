#FROM debian:bookworm-slim
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


#--- Pi Agent

# Pi Installation
RUN curl -fsSL https://pi.dev/install.sh | sh

# Pi Extensions
RUN pi install https://github.com/gsanhueza/pi-token-speed
#RUN pi install npm:pi-idle
RUN pi install https://github.com/AI-Team-26/pi-status
RUN pi install npm:pi-llama-cpp-stats
RUN pi install npm:pi-voice-stt

# Copy the entire .pi directory (which now contains the installs)
# to the backup locations so it survives the volume mount
#RUN cp -r /root/.pi/. /root/.pi_backup/
RUN echo "Restore the .pi folder can take minutes, please wait."
RUN tar -cf /root/.pi_backup.tar -C /root/.pi . && rm -rf /root/.pi/*

ENTRYPOINT ["/scripts/start.sh"]
