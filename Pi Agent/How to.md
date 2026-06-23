# How to

## CTRL + SHIFT for multiline prompt

In GitBash shell of Windows Terminalm, by default it uses CTRL to add a new-line character in the prompt.   
Hot to switch to the more conventional SHIF ?  

Windows Terminal, Configuration, open JSON.  

1. Add this to the "actions" array:
```json
{
    "command": {
        "action": "sendInput",
        "input": "\u000a"
    },
    "id": "User.sendCtrlEnter"
}
```

2. Add this to the "keybindings" array:
```json
{
    "id": "User.sendCtrlEnter",
    "keys": "shift+enter"
}
```

## Directly execute shell commands

Use the "!" in the prompt, and the command will be executed directly in the shell.  
``! echo "this is a test" > test.txt``
``! ls -al``
 

## Disable a Skill

https://pi.dev/docs/latest/skills  

Skills are (generally) stored in _~/.pi/agent/skills_ (and project folder _.pi/skills_).  
Them are automatically picked by Pi at start.  
There is no way to disable a specific skill, so my idea is to move it in a _skills-disabled_ folder


## Switch local Model

Local models run on llama.cpp (or Ollama) and are exposed to the Pi container on _http://host.docker.internal:8001/v1_.  
When llama-server is strated and customized for a specific model A, and Pi switch to model B, it sends the model name and use a different context size as defined in _model.json_, 
but actually the model loaded in llama.cpp server remains the same!  

Solution 1: Use a Host Listener Script that monitor a "Model switch" file that is written by the guest (Pi container).  
Leave this script running in the teerminal. 
Teach Pi Agent to change the "Model switch" file to trigegr the server start of the new model.  


Solution 2: Use proxy that intercept the requests, and if it find out the model is changed, call the script to start the server with the new model. 


## Sessions

### Select a session

**At start**:
- ``pi -r`` (``pi --resume``) will show a menu where to pick a session.  
- ``pi -c`` (``pi --continue``) will pick the most recent session. 
- ``pi --name <session_name>`` will start a new session and give it a name.
- ``pi --session <session-id>``
- ``pi --no-session `` Start Pi with an ephemeral session.


**While opened**: ``/session`` will allow to manage sessions and change current session.

---

Sessions are automatically saved as JSONL files in:  _~/.pi/agent/sessions/_ .  
They are organized into subdirectories based on your current working directory, so sessions from different projects stay separated.  

- ``/session``: list the sessions
- ``/name Your-Session-Name``: give a name to the current session
- ``/tree``: allows to go back in a the session, at a certain point, to continue from there with a different approach
- ``/fork``: create a new session that starts from this point (it is a sort of "reset" or "Save as..." usefull when the session become too long)
  
Since you are currently in a session, you can easily get its unique identifier or file path: ``/session``
This will display the Session ID, the file path where it is stored, and other metadata like token usage and cost.


## !!! WIP !!! Use the voice for the prompt

```
pi install npm:pi-voice-stt
```

It needs ffmpeg installed in the contaginer.  
It needs access to a microphone in the host.