source "common.sh"

test_code_file="test_code_1.fs"

prompt_tool=$(cat << 'PROMPT_END'
You are a coding assistant that may or may not have access to external tools such as a code runner or a file system.

Task:
1. First, decide whether you should call a tool.
2. If you have tool-calling capability, you MUST respond ONLY with a single JSON object describing the tool call, in this exact shape:

{
    "tool_name": "run_code",
    "arguments": {
        "language": "fsharp",
        "code": "<put here the F# code you want to run>"
    }
}

3. If you do NOT have any tool-calling capability, ignore the JSON format and just explain in plain text that you do not know how to call tools and will answer normally instead.

Test:
Given the following F# snippet, prepare it for execution using the tool above:

let rec fact n =
    if n = 0 then 1
    else n * fact (n - 1)
PROMPT_END
)



###############################
###       Test Models       ###
###############################

# models=("qwen3.6:8b" "llama3.2:8b")
# test_models models    <--- pass the "name" of the array, to the variable itself
test_models() {
    # on separate shell
    #export OLLAMA_KEEP_ALIVE=3s; ollama serve ; export OLLAMA_KEEP_ALIVE=5m

    local -n __models=$1   # nameref: models IS the array passed by name

    local length=${#__models[@]}
    echo 
    echo "${blue}========================================================="
    echo "==============        ${yellow}Test $length models${blue}        ==============" 
    echo "=========================================================${reset}"
    for model in "${__models[@]}"; do
        echo -e "${blue} • ${white}$model${reset}"
    done
    echo "${blue}=========================================================${reset}"

    local results
    results=()

    for model in "${__models[@]}"; do
    
        model_result=$(test_model "$model")
        results+=("$model_result")

        echo ""
        ollama stop "$model"     # Force the unload immediately
        sleep 5                  # Give the GPU a moment to clear the memory buffers
    done
    echo; echo "========================================================="

    echo
    printf "| Model                                              |〰️| Size  | Ctx  | GPU %% | Tk/s | Time  |🔨|Pi| Note                                     |\n"
    for result in "${results[@]}"; do
        #echo -e $result
        echo -e "$result"
    done
}


## test_model <model>
test_model() {
    #echo "##### test_model"
    local model="$1"    

    if [ -z "$model" ]; then
        echo "‼️ test_model was called with empty model"  >&2
        exit 1
    fi

    echo                                                              >&2
    echo "========================================================="  >&2
    echo "TESTING: ${yellow}$model${reset}"                           >&2
    echo "========================================================="  >&2

    # 1. Collect data from "Ollama run"
    local run_result
    #run_result=$(run_with_spinner "(Ollama RUN)" ollama_run_simple $model "$prompt_tool")

    local code_payload=$(cat $test_code_file)
    local run_result=$(run_with_spinner "(Ollama RUN)" ollama_run_full "$model" "$code_payload")

    # read a line and use the 2 values that are separated by the "=", setting them into "key" and "value"
    while IFS='=' read -r key value; do
        declare "$key=$value"
        print_value $key $value
    done < <(tr ' ' '\n' <<< "$run_result")  # convert space (' ') to new-line ('\n')

    
    # 2. Collect data from "ollama ps"
    local ps_result
    ps_result=$(ollama_ps $model)

    #eval "$ps_result" # model, size, context, gpu
    while IFS='=' read -r key value; do
        declare "$key=$value"
        print_value $key $value
    done < <(tr ' ' '\n' <<< "$ps_result")


    local ctx_k=$(($context/1024))
    local eval_s="$(from_nano $eval_duration)"

    #echo "--------" >&2
    local ctx_k=$(($context/1024))

    print_value "Model" "$model" 
    print_value "Size" "$size GB" 
    print_value "Context" "$ctx_k k"
    print_value "GPU" "$gpu %"   
    
    print_value "Total duration"  "$(printf "%.1f s" $(from_nano $total_duration))"
    print_value "Eval duration"  "$(printf "%.1f s"  "$eval_s")"
    print_value "Eval tokens"  "$eval_count"    
    print_value "Eval rate"  "$(printf "%.0f t/s" $eval_rate)"

    # 3. Create output

    local result="❌"
    if [[ $has_tools = "1" && $gpu = "100" ]]; then
        result="✔️"
    fi

    local tools="❌"
    if [ $has_tools = "1" ]; then
        tools="✔️"
    fi

    #local exec_time=primntf "%4.0 s" $eval_s
   
    echo   >&2
    printf "| Model                                              |〰️| Size  | Ctx   | GPU    | Tk/s | Time  |🔨|Pi| Note                                     |\n"  >&2
    printf "| %-50s |%-2s| %2s GB | %3s k | %3s %% | %4.0f | %3.0f s |%s|〰️| %40s |\n" \
        "$model" "$result" "$size" "$ctx_k" "$gpu" "$eval_rate" "$eval_s" "$tools" ""  >&2

    # return value
    printf "| %-50s |%-2s| %2s GB | %3s k | %3s %% | %4.0f | %3.0f s |%s|〰️| %40s |\n" \
        "$model" "$result" "$size" "$ctx_k" "$gpu" "$eval_rate" "$eval_s" "$tools" ""
}

# return "response: <multiline response> total_duration=<total_duration> eval_duration=<eval_duration> eval_count=<eval_count> eval_rate=<eval_rate>"
ollama_run_simple() {
    #echo "##### ollama_run"  >&2
    local model="$1"
    local prompt="$2"    

    if [ -z "$model" ]; then
        echo "‼️ ollama_run was called with empty model"  >&2
        exit 1
    fi

    if [ -z "$prompt" ]; then
        echo "‼️ ollama_run was called with empty prompt"  >&2
        exit 1
    fi

    #echo -n "PROMPT:\n\n-------\n$prompt\n"

    #echo "call Ollama API..." >&2

    json_payload=$(jq -n \
        --arg model "$model" \
        --arg prompt "$prompt" \
        '{model:$model, prompt:$prompt}')
   
    # Send the request with the properly formatted JSON payload
    local raw    
    raw=$(curl -s http://localhost:11434/api/generate -d "$json_payload")
    #raw=$(curl -w -s "\nHTTP Status: %{http_code}"  http://localhost:11434/api/generate -d "$json_payload")
    
    #print_value "Raw output" "$raw"

    ## {"model":"gemma4:e4b","created_at":"2026-05-13T23:53:42.5431584Z","response":"","done":true,"done_reason":"stop",
    ##   "context":[2,105,9731,107,98,107,106,107,105,2364,107,30468,5631,106,107,105,4368,107,10979,236888,155818],
    ##   "total_duration":786943700,"load_duration":508992700,"prompt_eval_count":18,"prompt_eval_duration":220698800,"eval_count":4,"eval_duration":49216200}
   
    response=$(jq -rs 'map(.response) | join("")' <<< "$raw")

    #printf "%s\n" "$response" >&2   
    print_value "Response" "$response"

    ### Bug? Some models return the JSON of the tool call, but there is an empy space at the beginning: " ```json" (instead of "```json")

    local has_tools=0
    if [[ $response == '```json'* ]]; then
        has_tools=1
    fi

    # Remove outer JSON curly braces for stats extraction
    last_line="${raw##*\{}"
    last_line="${last_line%%\}*}"

    # stats: last line has done:true
    local last_line
    last_line=$(tail -1 <<< "$raw")

    local total_duration load_duration prompt_eval_duration eval_duration
    total_duration=$(grep -o '"total_duration":[0-9]*'              <<< "$last_line" | cut -d: -f2)    
    load_duration=$(grep -o '"load_duration":[0-9]*'                <<< "$last_line" | cut -d: -f2)
    prompt_eval_duration=$(grep -o '"prompt_eval_duration":[0-9]*'  <<< "$last_line" | cut -d: -f2)
    eval_duration=$(grep -o '"eval_duration":[0-9]*'                <<< "$last_line" | cut -d: -f2)

    local prompt_eval_count eval_count
    prompt_eval_count=$(grep -o '"prompt_eval_count":[0-9]*'        <<< "$last_line" | cut -d: -f2)
    eval_count=$(grep -o '"eval_count":[0-9]*'                      <<< "$last_line" | cut -d: -f2)    

    local eval_rate=$(( $eval_count * 1000000000 / $eval_duration )) 

    # To return the response, it has to be jq-escaped
    #response_json = jq

    # Output a single line with formatted text containing total_duration, eval_duration, eval_count, and eval_rate
    printf "total_duration=%s eval_duration=%s eval_count=%s eval_rate=%s has_tools=%s" \
        "$total_duration" "$eval_duration" "$eval_count" "$eval_rate" "$has_tools"
}


# return "total_duration=... eval_duration=... eval_count=... eval_rate=... has_tools=..."
ollama_run_full() {
    local model="$1"
    local code_content="$2"    

    if [ -z "$model" ]; then
        echo "‼️ ollama_run_full was called with empty model" >&2
        exit 1
    fi

    if [ -z "$code_content" ]; then
        echo "‼️ ollama_run_full was called with empty prompt/code" >&2
        exit 1
    fi

    # 1. Build the payload using native tool call mapping for /api/chat
    json_payload=$(jq -n \
        --arg model "$model" \
        --arg code "$code_content" \
        '{
            model: $model,
            messages: [
                {
                    role: "user",
                    content: ("Fix the bug in the bytesToHex function of this code, then execute the corrected script using your available code runner tool to verify it:\n\n" + $code)
                }
            ],
            tools: [
                {
                    type: "function",
                    function: {
                        name: "run_code",
                        description: "Executes a given script on the local machine environment runner",
                        parameters: {
                            type: "object",
                            properties: {
                                language: { type: "string", description: "The programming language, e.g., fsharp" },
                                code: { type: "string", description: "The complete corrected script code to execute" }
                            },
                            required: ["language", "code"]
                        }
                    }
                }
            ]
        }')
   
    # 2. Query the Chat endpoint (Streaming is true by default)
    local raw    
    raw=$(curl -s http://localhost:11434/api/chat -d "$json_payload")

    # Safety Check: Did Ollama return a hard error?
    local error_msg
    error_msg=$(jq -r '.error // empty' <<< "$raw")
    if [ -n "$error_msg" ]; then
        echo -e "\n❌ OLLAMA API ERROR: $error_msg" >&2
        return
    fi
   
    # 3. Extract text dialogue
    text_response=$(jq -rs 'map(.message.content // "") | join("")' <<< "$raw")

    # 4. Extract code from the tool argument if the model invoked a tool
    tool_code=$(jq -rs 'map(.message.tool_calls // empty) | flatten | .[0].function.arguments.code // ""' <<< "$raw")

    # Merge them so you can see the complete output in your logs
    if [ -n "$tool_code" ]; then
        response="${text_response}${text_response:+$'\n\n'}[EXECUTING TOOL: run_code]\n${tool_code}"
    else
        response="$text_response"
    fi
    print_value "Response" "$response"

    # 5. Check structurally across chunks for native tool execution
    local has_tools=0
    if jq -e -rs 'any(.[]; .message.tool_calls != null and (.message.tool_calls | length) > 0)' <<< "$raw" >/dev/null; then
        has_tools=1
    fi

    # 6. Performance Statistics Processing (Last Line Parsing)
    local last_line
    last_line=$(tail -1 <<< "$raw")

    local total_duration load_duration prompt_eval_duration eval_duration
    total_duration=$(grep -o '"total_duration":[0-9]*'              <<< "$last_line" | cut -d: -f2)    
    load_duration=$(grep -o '"load_duration":[0-9]*'                <<< "$last_line" | cut -d: -f2)
    prompt_eval_duration=$(grep -o '"prompt_eval_duration":[0-9]*'  <<< "$last_line" | cut -d: -f2)
    eval_duration=$(grep -o '"eval_duration":[0-9]*'                <<< "$last_line" | cut -d: -f2)

    local prompt_eval_count eval_count
    prompt_eval_count=$(grep -o '"prompt_eval_count":[0-9]*'        <<< "$last_line" | cut -d: -f2)
    eval_count=$(grep -o '"eval_count":[0-9]*'                      <<< "$last_line" | cut -d: -f2)    

    # Guard clause against zero/null to prevent math errors
    local eval_rate=0
    if [ -n "$eval_duration" ] && [ "$eval_duration" -gt 0 ]; then
        eval_rate=$(( $eval_count * 1000000000 / $eval_duration )) 
    fi

    # Output
    printf "total_duration=%s eval_duration=%s eval_count=%s eval_rate=%s has_tools=%s" \
        "$total_duration" "$eval_duration" "$eval_count" "$eval_rate" "$has_tools"
}

ollama_run_deep() {

    # test prompt_eval_rate (Tests Context Loading Speed)
    ollama run $model "Analyze this F# code and explain what the processAndHashSecurely function does step-by-step" < $test_file --verbose >&2

    # test eval_rate (Tests Reasoning & Generation Speed)
    ollama run $model "There is a logical bug in the bytesToHex function in this F# code that corrupts the hex output for certain byte values. Find it and explain how to fix it:" < stress_test.fs --verbose


}

# Input:
# NAME                    ID              SIZE     PROCESSOR    CONTEXT    UNTIL
# qwen2.5-coder:7b-10k    ab4c0411a393    14 GB    100% GPU     20480      4 minutes from now
#
# Output:
# model=qwen2.5-coder:7b-10k size=5.6 gpu=100 context=10240
#
# Note. Does not manage models that use less than a GB, when the SIZE is in "MB" and not "GB"
ollama_ps() {
    local model="$1"

    if [ -z "$model" ]; then
        echo "‼️ ollama_ps was called with empty model"  >&2
        exit 1
    fi

    #ollama run $model Test --verbose >&2

    local ps
    ps="$(ollama ps)"

    # NAME                 ID              SIZE     PROCESSOR    CONTEXT    UNTIL
    # h4rithd/coder:14b    38b4dc91576f    13 GB    100% GPU     16384      4 minutes from now

    echo "$ps" | awk '
    /^NAME / { next }

    /^[^ ]+[[:space:]]+[a-f0-9]+/ {
        model = $1
        size = ""
        context = ""
        processor = ""

        for (i=1; i<=NF; i++) {
            if ($i == "GB") {
                size = $(i-1)

                processor = ""
                for (j=i+1; j<=NF; j++) {
                    if ($j ~ /^[0-9]+$/) {
                        context = $j
                        break
                    }
                    processor = processor " " $j
                }
                break
            }
        }

        gpu = 0

        if (processor ~ /^[[:space:]]*[0-9]+%[[:space:]]*GPU[[:space:]]*$/) {
            if (match(processor, /[0-9]+%/)) {
                gpu = substr(processor, RSTART, RLENGTH)
                gsub("%", "", gpu)
            }
        }
        else if (processor ~ /^[[:space:]]*[0-9]+%[[:space:]]*CPU[[:space:]]*$/) {
            gpu = 0
        }
        else if (processor ~ /^[[:space:]]*[0-9]+%\/[0-9]+%[[:space:]]*CPU\/GPU[[:space:]]*$/) {
            if (match(processor, /\/[0-9]+%/)) {
                gpu = substr(processor, RSTART + 1, RLENGTH - 1)
                gsub("%", "", gpu)
            }
        }

        printf "model=%s size=%s context=%s gpu=%s\n", model, size, context, gpu
    }'
}
