# add a model to the settings

# usage:
# run from root: python ./scripts/add_model.py <provider> <model>   
# provider must be: "ollama" "alibaba"

import json
import sys
import os
import subprocess

settings_file_path = "for-docker-volume/qwen-settings.json"
docker_volume = "/d/Programming/PROJECTS/QwenCode_Container"
github_pat = os.environ['ALIBABA_QWEN_CODE_FOR_DOCKER_1']

templates = {
    "alibaba": {
        "id": "{model_id}",
        "name": "{model_id} (AliBaba)",
        "baseUrl": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        "description": "AliBaba {model_id} via Dashscope",
        "envKey": "ALIBABA_API_KEY"      
    },
    "ollama": {
        "id": "{model_id}",
        "name": "{model_id}(Ollama)",
        "baseUrl": "http://host.docker.internal:11434/v1",
        "description": "{model_id} via Ollama",
        "envKey": "ALIBABA_API_KEY"  # mandatory but not actally used
    }
}


def main():
    if len(sys.argv) < 3:
        print("Usage: add_model.py <provider> <model_id>   (provider can be: alibaba | ollama)")
        sys.exit(1)

    provider = sys.argv[1]    
    model_id = sys.argv[2]
    print(f"ℹ️  Add '{model_id}' from '{provider}' to Qwen Code settings") 
     
    try:

        # 1. Load and modify JSON
        with open(settings_file_path, 'r') as f:
            data = json.load(f)

        if provider not in templates:
            raise Exception(f"Provier '{provider}' is not valid")

        template = templates[provider]
        new_record = {key: value.replace("{model_id}", model_id) for key, value in template.items()}
        data["modelProviders"]["openai"].append(new_record)
        
        with open(settings_file_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"🟢 {model_id} added to local Qwen Code settings") 
        
        # 2. Execute shell commands
        
        target_path = f"{docker_volume}/.qwen/settings.json"
        
        subprocess.run(["cp", settings_file_path, target_path])
        subprocess.run(["sed", "-i", f"s/{{ALIBABA_API_KEY}}/{github_pat}/g", target_path])

        print(f"🟢 Qwen Code settings updated in Docker volume") 
    
    except Exception as ex:
        print(f"❌ Failed: {str(ex)}", file=sys.stderr)
        sys.exit(1)
     
if __name__ == "__main__":
    main()