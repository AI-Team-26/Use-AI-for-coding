# add a model to the settings

import json
import sys
import os
import subprocess

settings_file_path = "qwen-settings.json"
docker_volume = "/d/Programming/PROJECTS/QwenCode_Container"
github_pat = os.environ['ALIBABA_QWEN_CODE_FOR_DOCKER_1']

def main():
    if len(sys.argv) < 2:
        print("Usage: add_model.py <model_id>")
        sys.exit(1)
        
    model_id = sys.argv[1]
    print(f"ℹ️  Add {model_id} to Qwen Code settings") 
     
    try:

        # 1. Load and modify JSON
        with open(settings_file_path, 'r') as f:
            data = json.load(f)
        
        data["modelProviders"]["openai"].append({
            "id": model_id,
            "name": f"{model_id} (Ollama)",
            "baseUrl": "http://host.docker.internal:11434/v1",
            "description": f"{model_id} via Ollama",
            "envKey": "ALIBABA_API_KEY"
        })
        
        with open(settings_file_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"🟢 {model_id} added to local Qwen Code settings") 
        
        # 2. Execute shell commands
        
        target_path = f"{docker_volume}/.qwen/settings.json"
        
        subprocess.run(["cp", "qwen-settings.json", target_path])
        subprocess.run(["sed", "-i", f"s/{{ALIBABA_API_KEY}}/{github_pat}/g", target_path])

        print(f"🟢 Qwen Code settings updated in Docker volume") 
    
    except Exception as ex:
        print(f"❌ Failed: {str(ex)}", file=sys.stderr)
        sys.exit(1)
     
if __name__ == "__main__":
    main()