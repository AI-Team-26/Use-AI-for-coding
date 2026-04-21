FROM  ghcr.io/qwenlm/qwen-code:0.14.5

# Create and set working directory to workspace where projects are typically mounted
#WORKDIR /workspace
# the /workspace directory has to be passed as volume !!!

# copy configuration_template to ~/.qwen/settings.json
#COPY qwen-settings.json ~/.qwen/settings.json

CMD ["sh", "-c", "cd /workspace && qwen"]
#CMD ["/bin/bash"] for investigation