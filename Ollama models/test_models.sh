source test_models_common.sh

models=(         
    #granite4.1:30b-q3_K_S
    qwen3:14b-q4_K_M
    
    
    #h4rithd/coder:14b # ❌
    #gemma4:e4b  # ✔️
)

# pass the array variable name!!
test_models models
