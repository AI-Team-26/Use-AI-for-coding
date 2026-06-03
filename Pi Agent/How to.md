# How to

## SHIFT button for multiline prompt

By default it uses CTRL to add a new-line character in the prompt. Hot to switch to the more conventional SHIF ?


## Directly execute shell commands

Use the "!" in the prompt, and the command will be executed directly in the shell.  
``! echo "this is a test" > test.txt``
``! ls -al``
 

## Switch local Model

Local models run on llama.cpp (or Ollama) and are exposed to the Pi container on _http://host.docker.internal:8001/v1_.  
When llama-server is strated and customized for a specific model A, and Pi switch to model B, it sends the model name and use a different context size as defined in _model.json_, 
but actually the model loaded in llama.cpp server remains the same!  

Solution 1: Use a Host Listener Script that monitor a "Model switch" file that is written by the guest (Pi container).  
Leave this script running in the teerminal. 
Teach Pi Agent to change the "Model switch" file to trigegr the server start of the new model.  


Solution 2: Use proxy that intercept the requests, and if it find out the model is changed, call the script to start the server with the new model. 


## Sessions

Sessions are automatically saved as JSONL files in:  _~/.pi/agent/sessions/_ .  
They are organized into subdirectories based on your current working directory, so sessions from different projects stay separated.  

- ``/session``: list the sessions
- ``/name YourSessionName``: give a name to the current session
- ``/tree``: allows to go back in a the session, at a certain poimnt, to continue from there with a difefrent approach
- ``/fork``: create a new session that starts from this poimnt (it is a sort of "reset" or "Sace as..." usefull when the session become too long)
  
You have two main ways to see your past sessions: ``pi -r``.

Since you are currently in a session, you can easily get its unique identifier or file path:
``/session``
This will display the Session ID, the file path where it is stored, and other metadata like token usage and cost.

 ### How can I reopen it later?

 Once you have the information from /session, you can reopen it using these commands:

 - To continue the most recent session:
   ```bash
     pi -c
   ```
 - To open this specific session using its ID or path:
   ```bash
     pi --session <ID_OR_PATH>
   ```
 - To create a new branch from this session (forking):
   ```bash
     pi --fork <ID_OR_PATH>
   ```


   llama-server -hf ggml-org/gpt-oss-20b-GGUF -c 0 --jinja

# Then, access http://localhost:8080
