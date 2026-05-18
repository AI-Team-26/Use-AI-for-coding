source test_models_common.sh

models=(
    #gemma4:e4b  # ✔️
    #gemma4:e4b-it-q8_0-ALEX_CODE-128k # ✔️
    #codestral:22b-v0.1-q4_K_M  # ❌
    #second_constantine/deepseek-coder-v2:16b # ❌
    #MFDoom/deepseek-coder-v2-tool-calling:16b # ❌
    #second_constantine/yandex-gpt-5-lite:8b-q5_K_M # ❌
    sparksammy/glm-4.7-flash-unsloth:tiny-hotfixed # ✔️
    sparksammy/glm-4.7-flash-unsloth:tiny-hotfixed-ALEX_CODE-32k # ❌
    
    
    #"devstral-small-2:24b-instruct-2512-q4_K_M"

    #"hhao/qwen2.5-coder-tools:14b"
    #"h4rithd/coder:14b"

)


# pass the array variable name!!
test_models models

# single functions call for debug
#ollama_run $model $prompt
#test_model "gemma4:e4b"
#ollama_run 
#ollama_run "functiongemma:latest" $prompt_tool
#test_model "functiongemma:latest"
#ollama_run "nomic-embed-text:latest"


#ollama run gemma4:26b-a4b-it-q4_K_M Test --verbose; ollama ps