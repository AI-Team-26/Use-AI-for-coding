source "scripts.sh"

models=(
    #"gemma4:e4b"
    #"gemma4:e4b-it-q4_K_M"
    #"h4rithd/coder:14b"
    #"gemma4:e4b-it-q4_K_M-ALEX-32k"
    "gemma4:e4b-it-q4_K_M-256k"
    "gemma4:e4b-it-q8_0"
    "gemma4:e4b-it-q8_0-128k"
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
