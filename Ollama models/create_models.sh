source create_models_common.sh

### create_model_Q4 & create_model_Q3

create_model_Q4 granite4.1:8b 36 --test

create_model_Q4 qwen3:14b-q4_K_M 36 --test


### save_modelfile

#save_modelfile hhao/qwen2.5-coder-tools:14b
#save_modelfile qwen2.5-coder:14b-instruct-q5_K_M --original
#save_modelfile deepseek-coder-v2:16b-lite-instruct-q4_K_M --original

### create_model_from_modelfile

#create_model_from_modelfile  "deepseek-coder-v2_16b-lite-instruct-q4_K_M.tools.modelfile" "deepseek-coder-v2:16b-lite-instruct-TOOLS-q4_K_M"