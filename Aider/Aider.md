# Aider

https://aider.chat/docs/config/editor.html

## Docker

- paulgauthier/aider : installs the aider core, a smaller image that’s good to get started quickly.
- paulgauthier/aider-full : installs aider will all the optional extras.  

The full image has support for features like interactive help, the browser GUI and support for using Playwright to scrape web pages.  
The core image can still use these features, but they will need to be installed the first time you access them.  
Since containers are ephemeral, the extras will need to be reinstalled the next time you launch the aider core container.


## Custom Image

Base image: paulgauthier/aider-full  
Customization:
- GIT
- a README.md file with instructions
- auto-start script to seet compatibe OpenAI provider URL and key


Create a file, _aider.Dockerfile_.  
Run  ``docker build -t alex-aider:1 -f aider.Dockerfile .``

## Editor

When using Aider, you can configure which editor to use when opening files. By default, Aider will use your system's default editor, but you can specify a different one.

To set a custom editor, you can add the following to your `.aider.conf.yml` file:

```
editor: vim 
#(or "vi" or "nano" or "code --wait")
```

Or you can set it as an environment variable:

```
export GIT_EDITOR="code --wait"
```

This is already included in the Dockerfile.


## VS Code Integration

If you want to use VS Code to connect to your Aider container, you can install VS Code Server in the container and connect to it from your host machine. This provides a full GUI experience for development while keeping your code in the containerized environment with Aider AI assistance.

To set up VS Code Server in the container, you would need to add the following to the Dockerfile (though this increases the image size significantly):

```Dockerfile
# Install VS Code Server (Optional - increases image size)
RUN wget -O- https://aka.ms/install-vscode-server/setup.sh | sh
# Then you can connect via browser at http://localhost:8081 or use VS Code's remote SSH feature
```

Alternatively, you can use VS Code's Dev Containers extension to connect to your running container directly from your host VS Code installation, which provides a seamless development experience with access to both Aider CLI and the VS Code GUI within the same containerized environment.

## Options

https://aider.chat/docs/config/options.html
