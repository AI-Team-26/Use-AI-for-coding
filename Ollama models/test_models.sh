source test_models_common.sh

models=(       
    qwen2.5-coder:7b-instruct-q4_K_M
    gemma4:26b-a4b-it-q4_K_M-ALEX_CODE-8k
    gemma4:26b-a4b-it-q4_K_M-ALEX_CODE-16k
    
    #h4rithd/coder:14b # ❌
    #gemma4:e4b  # ✔️
)

# pass the array variable name!!
test_models models
