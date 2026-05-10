# Use a lightweight Debian base (matching your Qwen Code bookworm repo)
FROM debian:bookworm-slim

# Install prerequisites and Node.js (needed for Pi)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget gpg ca-certificates curl git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install .NET 10 SDK (Achieving the same goal as Qwen setup)
RUN wget https://packages.microsoft.com/keys/microsoft.asc -O- | \
    gpg --dearmor > /usr/share/keyrings/microsoft-prod.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/microsoft-prod.list \
    && apt-get update && apt-get install -y dotnet-sdk-10.0 \
    && apt-get clean && rm -rf /var/lib/apt/lists/* [cite: 2, 3]

# Install Pi Coding Agent globally
RUN npm install -g @mariozechner/pi-coding-agent

# Use /projects volume for persistence (Matching your Qwen Code goal)
WORKDIR /projects
VOLUME /projects 

# Create a simple entrypoint to start Pi
# You can pass your Ollama URL via environment variables
ENTRYPOINT ["pi"]
CMD ["--help"]