FROM ubuntu:24.04

# Set environment variables to avoid interactive installations
ENV DEBIAN_FRONTEND=noninteractive

# Update package list and install basic utilities
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    #python3 \
    #python3-pip \
    #nodejs \
    #npm \
    #vim \
    nano \
    build-essential \
    && rm -rf /var/lib/apt/lists/*


# Install OpenCode
RUN curl -fsSL https://opencode.ai/install | bash

# Switch to the developer user
#USER developer

# Set working directory
WORKDIR /workspace

# Create a non-root user
#RUN useradd -m -s /bin/bash developer && echo "developer:developer" | chpasswd && adduser developer sudo
#RUN useradd -m -s /bin/bash developer

# Give permission on workspace dir
#RUN chown developer:developer /workspace && chmod 755 /workspace
#RUN chmod -R 777 .
#RUN chown -R developer:developer /workspace

# Set home directory
#ENV HOME=/home/developer

# Expose a port (you can change this as needed)
EXPOSE 8080

# Default command
CMD ["/bin/bash"]