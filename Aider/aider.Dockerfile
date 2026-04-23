# Use the official aider-full image as base
FROM paulgauthier/aider-full

# Create and set working directory to workspace where projects are typically mounted
WORKDIR /workspace

# Copy README.md file with instructions
COPY README.md /app/README.md

# Copy aider configuration file to appuser's home directory
# The container runs as appuser (uid=1000) with home directory /home/appuser
COPY .aider.conf.yml /app/.aider.conf.yml
# Copy config file to home directory - ownership will be handled at runtime
RUN mkdir -p /home/appuser && cp /app/.aider.conf.yml /home/appuser/.aider.conf.yml

# Copy setup script to run on container startup
COPY setup_llm_config.sh /app/setup_llm_config.sh
RUN chmod +x /app/setup_llm_config.sh || echo "Setting executable permissions failed, but continuing"

# Set environment variables
#ENV GIT_EDITOR="code --wait"
#ENV AIDER_DARK_MODE=true

# Expose port for aider's web UI (if applicable)
EXPOSE 8080

# Create an entrypoint script to run setup first, then aider
RUN echo '#!/bin/bash\n\ncd /app\n# Ensure config file has proper permissions\nchown appuser:appuser /home/appuser/.aider.conf.yml 2>/dev/null || echo "Using default permissions"\n./setup_llm_config.sh\n cd /workspace \n aider "$@"' > /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Default entrypoint - run setup script first, then aider
ENTRYPOINT ["/app/entrypoint.sh"]
