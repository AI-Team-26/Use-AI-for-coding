source "scripts.sh"

models=(
    "gemma4:e4b"
    "h4rithd/coder:14b"
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
