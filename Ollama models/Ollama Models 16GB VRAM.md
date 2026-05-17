# Ollama Models for 16GB VRAM

GeForce RTX 4060 Ti 16GB on PCI slot 2 of ASUS P8Z77V-LV (2012 !!!)  
MSI Afterburnet set to flat frequency curve at 900 mV.  

## Results for GeForce RTX 4060 Ti 16GB

| Model                                         |〰️| Size    | Context | GPU  | Tk/s | Time | Tools | Notes                                  |
| :-------------------------------------------- |〰️| ------: | ------: | ---: | ---: | ---: | :---- | :------------------------------------- |
| qwen2.5-coder:7b-instruct-q4_K_M-ALEX-22k     |✔️|  7.0 GB |   22528 | 100% |   62 |  15s | yes   |                                        |
| qwen2.5-coder:14b-instruct-q5_K_M             |🥇| 12.0 GB |    8192 | 100% |   33 |      | yes   | Incredibly good reasoning              |
| deepseek-coder-v2:16b-lite-base-q3_K_S        |✔️|  8.7 GB |    4096 | 100% |  133 |  38s | yes   |                                        |
| mistral-nemo:12b-instruct-2407-q3_K_S         |✔️|  6.2 GB |    4096 | 100% |   44 |  21s | yes   |                                        |
| mistral-nemo:12b-instruct-2407-q3_K_S         |✔️|  7.2 GB |    8192 | 100% |   69 |      |       |                                        |
| qwen2.5-coder:14b-instruct-q3_K_M             |✔️|  8.2 GB |    4096 | 100% |      |      |       |                                        |    
| qwen3.5:9b-q4_K_M-12k                         |✔️|  9.0 GB |         | 100% |   38 |  14s | yes   | SLOW                                   |
| qwen3.5-unsloth:9b-20k                        |✔️|  7.9 GB |         | 100% |   38 |   5s |       |                                        |
| qwen3.5-unsloth:9b-24k                        |✔️|  8.0 GB |         | 100% |   38 |  14s |       |                                        |
| qwen3.5-unsloth:9b-28k                        |✔️|  8.1 GB |         | 100% |   38 |  14s |       |                                        |
| qwen2.5 -coder:14b-instruct-q3_K_M            |✔️|  8.2 GB |    4096 | 100% |   32 |   4s |       |                                        |
| llama3.1:8b-instruct-q5_K_M                   |✔️|  6.2 GB |    4096 | 100% |   48 |   3s |       |                                        |
| gemma4:e4b-it-q4_K_M-ALEX-8k                  |✔️|   10 GB |    8192 | 100% |   61 |  18s |       |                                        |
| codestral:22b-v0.1-q4_K_M-ALEX-18k            |✔️| 19.0 GB |   18432 |  81% |      |      |       |                                        |
| codegemma:7b-instruct-v1.1-q4_K_M             |❌|         |         | 100% |      |      | NO    |                                        | 
| Qwen3.5-9b-Sushi-Coder-RL.Q4_K_M-8k:latest    |❌|  7.4 GB |         | 100% |   38 |   8s | NO    |                                        |
| qooba/qwen3-coder-30b-a3b-instruct:q3_k_m     |❌|         |         | 100% |   76 |      | NO    | Context fixed to 16K ? FAST            | 



deepseek-coder-v2:16b-lite-instruct-q4_K_M

Models to try:

- Qwen
  + brnpistone/Qwen3-4B-AgentCoder-q6-k:latest
  + fervent_mcclintock/Qwen3-Coder-30B-A3B-Instruct-Pruned-15B-A3B:Q5_0
  + qwen2.5-coder:14b-instruct-q4_K_M
  + [x] qwen2.5-coder:14b-instruct-q5_K_M  
  + moophlo/Qwen3-Coder-30B-A3B-Instruct-GGUF:Q3_K_M
- CodeGemma
  + no tools suppoerted ???
- Gemma4
  + gemma4:e4b-it-q8_0
  + aratan/gemma-4-E4B-q8-it-heretic:latest
  + MobiusDevelopment/gemma-4-E4B-it-coder-Q4_K_M:latest  <--
  + gemma4:26b-a4b-it-q4_K_M
  + gemma4:26b-a4b-it-q4_K_M
- Granite4
  + granite4.1:8b-q8_0
  + granite4.1:30b-q3_K_S
- DeepSeek
  + deepseek-coder-v2:16b-lite-instruct-q4_K_M
  + deepseek-coder-v2:16b-lite-instruct-q5_K_M
- Ministral
  + seamon67/Ministral-3-Reasoning:14b-q4_K_M
  + devstral-small-2:24b-instruct-2512-q4_K_M
  + mistral-nemo:12b-instruct-2407-q5_K_M
  + seamon67/Devstral1.1-2507:24b-q4_K_M
- CYLI310/CodeGPT:latest  
- h4rithd/coder:14b
- second_constantine/deepseek-coder-v2:16b
- haervwe/GLM-4.6V-Flash-9B:latest     <-- image



## Test

```bash
models=(
    "codestral:22b-v0.1-q4_K_M-ALEX-8k" 
    "granite4.1:8b-q4_K_S" 
    )
test_models models
```


```bash
# on separate shell
export OLLAMA_KEEP_ALIVE=3s; ollama serve ; export OLLAMA_KEEP_ALIVE=5m

# Test
read -r -d '' prompt <<'EOF'
Given this F# function, find the bug and fix it:
let rec fact n = if n = 0 then 0 else n * fact (n - 1)
EOF

models=(    
    "qwen2.5-coder:14b-instruct-q5_K_M"
    "h4rithd/coder:14b"
    "second_constantine/deepseek-coder-v2:16b"
)

#total duration:       28.6424446s
#load duration:        24.5498347s
#prompt eval count:    65 token(s)
#prompt eval duration: 243.5141ms
#prompt eval rate:     266.92 tokens/s
#eval count:           117 token(s)
#eval duration:        3.6426877s
#eval rate:            32.12 tokens/s
print_result () {
    local Y='\033[0;33m'       # Yellow
    local N='\033[0m'          # No Color

    local ps
    ps="$(ollama ps)"

    # print raw output
    echo -e "${Y}${ps}${N}"    

    echo "$ps" | awk '
    /total duration:/ {
        total=$3
        sub(/s$/, "", total)
    }

    /load duration:/ {
        load=$3
        sub(/s$/, "", load)
    }

    /eval duration:/ {
        
    }

    /GB/ {
        model=$1
        size=$3
        gpu=$5
        context=$6

        gsub("%", "", gpu)

        exec_time = total - load

        printf " | %-40s |✔️〰️| %5s | %5s | %7s |      | %4.1fs | + Pass |       |                                        |\n",
            model, size, gpu, context, exec_time
    }'

}

for model in "${models[@]}"; do
    echo
    echo "========================================================="
    echo "TESTING: $model"
    echo "========================================================="
    
    # Run the model
    ollama run "$model" --verbose "$prompt"    
    ollama ps
    print_result
    echo "==============================================================================================================="
    ollama stop "$model"     # Force the unload immediately
    sleep 5                  # Give the GPU a moment to clear the memory buffers
done
echo; echo "--------------------------------------------------------------"

```

## Note on models
