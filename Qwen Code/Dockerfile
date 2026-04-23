FROM  ghcr.io/qwenlm/qwen-code:0.15.1

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
