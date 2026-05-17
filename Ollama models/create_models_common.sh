source scripts.sh


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

### Usage
# create_model_Q4 <model> <context_k>
# create_model_Q4 "qwen3.6:8b" 32
create_model_Q4() {
    create_model "$1" "$2" "Q4"
}

create_model_Q3() {
    create_model "$1" "$2" "Q3"
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


## create_model <model> <ctx_k> q_type
## create_model qwen2.5-coder:14b-instruct-q5_K_M  32  Q3
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
    ollama show "$base_model" --modelfile | grep -v "^FROM" >> Modelfile

    # 3. Append your custom PARAMETERS at the end to override defaults
    if [ $q_type == "Q3" ]; then
        echo "$Q3_PARAMETERS" >> Modelfile
    elif [ $q_type == "Q4" ]; then
        echo "$Q4_PARAMETERS" >> Modelfile
    else
        echo "‼️ create_model was called with unknown q_type"  >&2
        exit 1
    fi

    # 4. Build and clean up
    ollama create "$new_model" -f Modelfile
    rm Modelfile

    #ollama show $new_model --modelfile

    test_model "$new_model"
}
