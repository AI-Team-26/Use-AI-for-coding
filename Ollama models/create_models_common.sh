source common.sh
source test_models_common.sh

modelfiles_folder="modelfiles"

Q3_PARAMETERS=$(cat << 'EOF' 
# --- Custom Parameters ---
PARAMETER temperature 0.0      
PARAMETER top_k 10             
PARAMETER top_p 0.8
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.15
PARAMETER repeat_last_n 128
EOF
)


Q4_PARAMETERS=$(cat << 'EOF' 
# --- Custom Parameters ---
PARAMETER temperature 0.1      
PARAMETER top_k 20             
PARAMETER top_p 0.8
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 256
EOF
)


###############################
###      Create Models      ###
###############################

# For Q4 and better quantization models (Q5, Q6. Q8)
### Usage
# create_model_Q4 <model> <context_k> [OPTIONS: --save --test] 
# create_model_Q4 "qwen3.6:8b" 32  --save --test
create_model_Q4() {
    create_model "$1" "$2" "Q4" "${@:3}"
}

# For Q3 models
create_model_Q3() {
    create_model "$1" "$2" "Q3" "${@:3}"
}

## create_model_with_comtext <model> <ctx_k> --test
create_model_with_context() {
    local base_model="$1"
    local ctx_k="$2"

    local ctx=$((1024 * ctx_k))
    local new_model="${base_model}-${ctx_k}k"

    echo ""                                                           >&2
    echo "========================================================="  >&2
    echo "CREATE MODEL: ${yellow}$new_model${reset}"                  >&2
    echo "========================================================="  >&2

    # 1. Start with the original Modelfile content
    # Note: We use 'FROM $base_model' instead of the hash Ollama might return
    echo "FROM $base_model" > Modelfile

    # 2. Append everything EXCEPT the original FROM line to preserve TEMPLATE and SYSTEM
    ollama show "$base_model" --modelfile | grep -v "^FROM" >> Modelfile

    # 3. Append your custom PARAMETERS at the end to override defaults
    cat >> Modelfile <<EOF
# --- Custom Parameters ---
PARAMETER num_ctx $ctx
EOF

    # 4. Build and clean up
    ollama create "$new_model" -f Modelfile
    rm Modelfile

    if [ "$3" == "--test" ]; then
        local _=$(test_model "$new_model")
        echo "" >&2
    fi
}

# save_modlfile <model> --original
save_modelfile() {
    local model="$1"    

    if [ -z "$model" ]; then
        echo "‼️ save_modelfile was called with empty model"  >&2
        exit 1
    fi

    # check the Options
    local original=""
    for arg in "$@"; do
        if [[ "$arg" = "--original" ]]; then
            original=".original"
        fi
    done

    # Replace slash, dot, and colon with underscores, then add suffix
    local filename="${model//[\/\.:]/_}$original.modelfile"

    ollama show "$model" --modelfile > "$modelfiles_folder/$filename"

    # Remove the LICENSE. Some models  have already duplicated license.
    awk '/^LICENSE """/{skip=1; next} /^"""$/ && skip{skip=0; next} !skip' "$modelfiles_folder/$filename" > "$modelfiles_folder/$filename".tmp
    mv "$modelfiles_folder/$filename".tmp "$modelfiles_folder/$filename"

    printf "Modelfile ${yellow}%s${reset} saved in %s \n" $filename $modelfiles_folder >&2
}


## create_model <model> <ctx_k> <options>  (OPTIONS: --save --test)
## create_model qwen2.5-coder:14b-instruct-q5_K_M  32  Q3  --save  --test
create_model() {
    local base_model="$1"
    local ctx_k="$2"
    local q_type="$3"

    local ctx=$((1024 * ctx_k))
    local new_model="${base_model}-ALEX_CODE-${ctx_k}k"

    echo "Creating model: $new_model"

    # 1. Start with the original Modelfile content
    # Note: We use 'FROM $base_model' instead of the hash Ollama might return
    echo "FROM $base_model" > Modelfile
    
    # 2. Append everything EXCEPT the original FROM line to preserve TEMPLATE and SYSTEM    
    ollama show "$base_model" --modelfile  | grep -v "^FROM" >> Modelfile

    # Remove the LICENSE. Some models  have already duplicated license.
    awk '/^LICENSE """/{skip=1; next} /^"""$/ && skip{skip=0; next} !skip' Modelfile > Modelfile.tmp
    mv Modelfile.tmp Modelfile

    # 3. Append your custom PARAMETERS at the end to override defaults
    if [ $q_type == "Q3" ]; then
        echo  "Apply Q3 parameters" >&2
        echo "$Q3_PARAMETERS" >> Modelfile
    elif [ $q_type == "Q4" ]; then
        echo  "Apply Q4 parameters" >&2
        echo "$Q4_PARAMETERS" >> Modelfile
    else
        echo "\n❌ create_model was called with unknown q_type"  >&2
        exit 1
    fi

    echo "PARAMETER num_ctx $ctx" >> Modelfile 

    # 4. Build and clean up
    ollama create "$new_model" -f Modelfile
    #rm Modelfile

    #ollama show $new_model --modelfile  >&2

    # cehck the Options
    for arg in "$@"; do
        if [[ "$arg" = "--save" ]]; then
            # Replace slash, dot, and colon with underscores, then add suffix
            local filename="${new_model//[\/\.:]/_}.modelfile"
            ollama show "$new_model" --modelfile > "$modelfiles_folder/$filename"
            printf "Modelfile ${yellow}%s${reset} saved in %s" $filename $modelfiles_folder >&2

        elif [[ "$arg" == "--test" ]]; then
            result=$(test_model "$new_model") # >&2
        fi
    done
}

# create_model_from_modelfile <modelfile> <model_name>
create_model_from_modelfile() {
    local modelfile="$1" 
    local model_name="$2" 

    if [ -z "$modelfile" ]; then
        echo "\n‼️ create_model_from_modelfile was called with empty modelfile"  >&2
        exit 1
    fi

    if [ -z "$model_name" ]; then
        echo "\n‼️ create_model_from_modelfile was called with empty model_name"  >&2
        exit 1
    fi

    local modelfile_path="$modelfiles_folder/$modelfile"
    if [ ! -f "$modelfile_path" ]; then
        echo "\n❌ Error: Modelfile not found at path: '$modelfile_path'" >&2
        return 1
    fi
  
    ollama create  "$model_name" -f "$modelfile_path"

    test_model "$model_name" 
}