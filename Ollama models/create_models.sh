#source "scripts.sh"
source "create_models_common.sh"

create_model_Q4 gemma4:e4b 128  --test
create_model_Q4 gemma4:e4b-it-q8_0 128 --test
create_model_Q4 gemma4:e4b-it-q4_K_M 128 --test
create_model_Q4 h4rithd/coder:14b 128 --test

