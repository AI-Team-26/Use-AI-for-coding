#source "scripts.sh"
source "create_models_common.sh"

#create_model_with_cotext "gemma4:e4b" 16  --test
#create_model_with_cotext "gemma4:e4b" 32  --test
#create_model_with_cotext "gemma4:e4b" 48  --test
#create_model_with_cotext "gemma4:e4b" 64  --test
#create_model_with_cotext "gemma4:e4b" 96  --test
#create_model_with_cotext "gemma4:e4b" 128  --test
#create_model_with_cotext "gemma4:e4b" 156  --test
#create_model_with_cotext "gemma4:e4b" 192  --test

#create_model_with_cotext gemma4:e4b-it-q4_K_M 128 --test

#create_model_with_cotext gemma4:e4b-it-q4_K_M 256 --test
#create_model_with_cotext gemma4:e4b-it-q4_K_M 512 --test
#create_model_with_cotext gemma4:e4b-it-q8_0 128 --test

create_model_Q4 gemma4:e4b-it-q8_0 128 --test

#ollama show gemma4:e4b-it-q4_K_M --modelfile