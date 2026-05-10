FROM debian:bookworm-slim

# Install prerequisites, Node.js, and Pi Agent with security updates
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    wget gpg ca-certificates curl git gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    #&& npm install -g @mariozechner/pi-coding-agent \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Download and install key to keyrings (modern way)
RUN wget https://packages.microsoft.com/keys/microsoft.asc -O- | \
    gpg --dearmor > /usr/share/keyrings/microsoft-prod.gpg

# Add repo with signed-by and install .NET 10 SDK
RUN echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/microsoft-prod.list \
    && apt-get update && apt-get install -y dotnet-sdk-10.0 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Official Pi Installation (via pi.dev)
# This installs the 'pi' binary globally
RUN curl -fsSL https://pi.dev/install.sh | sh

# we use a /projects directory that has to be passed as volume !!!
# We also expose /root/.pi for global skills, API keys, and tool settings
# VOLUME ["/root/.pi", "/projects"] this can cause permission problems

#WORKDIR /projects

# Use ENTRYPOINT to run the script, and CMD for the default argument
ENTRYPOINT ["/projects/start.sh"]
CMD [""]