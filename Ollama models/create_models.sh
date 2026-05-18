#source "scripts.sh"
source create_models_common.sh

create_model_Q4 sparksammy/glm-4.7-flash-unsloth:tiny-hotfixed 28  --test

#create_model_Q4 gemma4:e4b 128  --test
#create_model_Q4 gemma4:e4b-it-q8_0 128 --test
#create_model_Q4 gemma4:e4b-it-q4_K_M 128 --test
#create_model_Q4 gemma4:26b-a4b-it-q4_K_M 16 --test
#create_model_Q4 h4rithd/coder:14b 32 --test
#create_model_Q4 deepseek-coder-v2:16b-lite-instruct-q4_K_M 14 --test

#create_model_Q4  devstral-small-2:24b-instruct-2512-q4_K_M 16  --test


#create_model_Q4  hhao/qwen2.5-coder-tools:14b   48  --save # --test
#sleep 5
#create_model_Q4  phi4-reasoning:14b-plus-q4_K_M 16  --test

# waiting base model pull
#create_model_Q4 qwen2.5-coder:14b-instruct-q4_K_M 64  --test
#create_model_Q4 qwen2.5-coder:14b-instruct-q4_K_M 128  --test

#create_model_Q4 deepseek-coder-v2:16b-lite-instruct-q4_K_M  16 --test
#create_model_Q4 deepseek-coder-v2:16b-lite-instruct-q4_K_M  32 --test


#save_modelfile hhao/qwen2.5-coder-tools:14b
#save_modelfile qwen2.5-coder:14b-instruct-q5_K_M --original
#save_modelfile deepseek-coder-v2:16b-lite-instruct-q4_K_M --original


#create_model_from_modelfile  "deepseek-coder-v2_16b-lite-instruct-q4_K_M.tools.modelfile" "deepseek-coder-v2:16b-lite-instruct-TOOLS-q4_K_M"