# Ollama models customizations


Customized context and parameters value to reduce errors in small Ollama models.  

## Base setup

```bash
ctx_4k=4096
ctx_6k=6144
ctx_8k=8192
ctx_10k=10240
ctx_12k=12288
ctx_16k=16384
ctx_18k=18432
ctx_20k=20480 
ctx_22k=22528
ctx_24k=24576
ctx_28k=28672
ctx_32k=32768
ctx_36k=$((1024*36))
ctx_40k=$((1024*40))
ctx_44k=$((1024*44))
ctx_48k=$((1024*48))
ctx_52k=$((1024*52))
ctx_56k=$((1024*56))
ctx_60k=$((1024*60))
ctx_64k=$((1024*64))
ctx_96k=$((1024*96))
ctx_128k=$((1024*128))

# ── config ─────────────────────────────────────────────────
base_model=qwen2.5-coder:7b  # set this
ctx=ctx_24k                   # set this

ctx_val=${!ctx}
new_model="$base_model-$((ctx_val / 1024))k"

echo "new model: $new_model"

# ── create and run ─────────────────────────────────────────
echo "FROM $base_model
PARAMETER num_ctx $ctx_val" > Modelfile

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```



## Q3 (heavy) quantization

For a brittle Q3 coder model, to reduce errors, I’d start with:

- temperature: lower means more deterministic, if "0", only the most probable token is used (top_k, top_p, min_p and tfs_z will be ignored)
- top_k / top_p / min_p: tighter sampling reduces weird token choices.
- repeat_penalty / repeat_last_n: helps stop loops and repeated junk.
  Use a value between 1.05 and 1.15 (Q3).
- num_predict: Cut the response to a max number of token. Can "break" the response. Use repeat_penalty to interrujpt loop.
- rope_frequency_base: used for optimize old 4k/8k context models. NOT useful with new models.


Suggested set for Q3:  
```sh
PARAMETER temperature 0.0      
PARAMETER top_k 10             
PARAMETER top_p 0.8
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.15
PARAMETER repeat_last_n 128
# PARAMETER num_predict 64     
```

Suggested set for Q4 and better:  
```sh
PARAMETER temperature 0.1      
PARAMETER top_k 20             
PARAMETER top_p 0.8
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 256
# PARAMETER num_predict 64     
```

### Tool capability issue

devstral-small-2:24b-instruct-2512-q4_K_M
hhao/qwen2.5-coder-tools:14b-ALEX_CODE-32k

### Gemma4

_E2B_ and _E4B_ have a absolute native architectural limit of the context size of 128k.
_E26B_ and _E31B_ are capped to 256k.  


### Ministral








## granite4.1:8b-q4_K_M

```bash
base_model=granite4.1:8b-q4_K_M
ctx=ctx_8k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-$((ctx_val / 1024))k"

echo $new_model

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.0
PARAMETER top_k 10
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 8192
EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```

### Qwen3.5-9b-Sushi-Coder-RL.Q4_K_M-8k

```bash
base_model=Qwen3.5-9b-Sushi-Coder-RL.Q4_K_M-8k
ctx=ctx_8k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-$((ctx_val / 1024))k"

echo $new_model

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.0
PARAMETER top_k 10
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 8192
EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```


### granite4.1:8b-q4_K_S

```bash
base_model=granite4.1:8b-q4_K_S
ctx=ctx_10k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-$((ctx_val / 1024))k"

echo $new_model

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.0
PARAMETER top_k 10
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 8192
EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```



### granite4.1:8b-q5_K_M

```bash
base_model=granite4.1:8b-q5_K_M
ctx=ctx_8k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-$((ctx_val / 1024))k"

echo $new_model

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.0
PARAMETER top_k 10
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 8192
EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```






### llama3-groq-tool-use:8b-q5_0

- *** FIXED 8K context ***
+ FAST
+ Q5

```bash
base_model=llama3-groq-tool-use:8b-q5_0
ctx=ctx_20k

ctx_val=${!ctx}
new_model="$base_model-ALEX-$((ctx_val / 1024))k_v2"

echo $new_model

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

### NOT STUPID ###
PARAMETER temperature 0.2
PARAMETER top_k 20
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128

EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```


### qwen2.5-coder

#### qwen2.5-coder:7b-instruct-q5_K_M

```bash
base_model=qwen2.5-coder:7b-instruct-q5_K_M
ctx=ctx_64k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-$((ctx_val / 1024))k"

echo $new_model

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.1
PARAMETER top_k 20
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 8192
EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```

### qwen2.5-coder:7b-instruct-q4_K_M

```bash
base_model=qwen2.5-coder:7b-instruct-q4_K_M
ctx=ctx_128k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-$((ctx_val / 1024))k"

echo $new_model

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.0
PARAMETER top_k 10
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 8192
EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```


### qwen3:8b-16k

- it keep looping with the test prompt.

```bash
base_model=qwen3:8b
ctx=ctx_16k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-$((ctx_val / 1024))k"

echo $new_model

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.0
PARAMETER top_k 10
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 8192
EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```

### yi-coder:9b-base-q5_K_M

+ 12K stays in 8GB RAM
- it keep looping with the simple prompt "Hi, can you help me with F#?".

```bash
base_model=yi-coder:9b-base-q5_K_M
ctx=ctx_8k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-$((ctx_val / 1024))k"

echo $new_model

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.0
PARAMETER top_k 10
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 8192
EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```

### yi-coder:9b-chat-q5_K_M 

```bash
base_model=yi-coder:9b-chat-q5_K_M 
ctx=ctx_20k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-$((ctx_val / 1024))k"

echo $new_model

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.1
PARAMETER top_k 10
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 64
EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```


### mistral-nemo:12b-instruct-2407-q3_K_L

```bash
base_model=mistral-nemo:12b-instruct-2407-q3_K_L
ctx=ctx_10k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-$((ctx_val / 1024))k"

echo $new_model

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.1
PARAMETER top_k 10
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 64
EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```


## gemma4:e4b-it-q8_0

```bash
base_model=gemma4:e4b-it-q8_0
ctx=ctx_32k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-$((ctx_val / 1024))k"

echo $new_model

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.2
PARAMETER top_k 20
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128

EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```

### gemma4:e2b-it-q4_K_M

```bash
base_model=gemma4:e4b-it-q4_K_M
ctx=ctx_32k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-$((ctx_val / 1024))k"

echo $new_model

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.1
PARAMETER top_k 10
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 64
EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```

### ✔️ gemma4:e4b-it-q4_K_M

+ Super intelligent

```bash
base_model=gemma4:e4b-it-q4_K_M
ctx=ctx_8k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-$((ctx_val / 1024))k"

echo $new_model

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.1
PARAMETER top_k 10
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 64
EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```


### ✔️ qwen2.5-coder:7b 

+ 20K is the right value to stay in 8GB of RAM

```bash
base_model=qwen2.5-coder:7b 
ctx=ctx_20k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-$((ctx_val / 1024))k"

echo $new_model

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.0
PARAMETER top_k 10
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 64
EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```


### ❌ codegeex4:9b-all-q4_K_M

📌 CodeGeeX4 is a specialized "all-in-one" coding model optimized for its own proprietary agentic ecosystem rather than standard API tool-calling protocols like OpenAI or Ollama. While it excels at multilingual reasoning and repo-level code generation, its "tools" require custom integration or official extensions to function, making it a high-performance specialist rather than a plug-and-play generalist.
Today (05/2026) tjhe CodeGeeX extension of VS Code is not verified. And it is the only one that can use this model (not Cline).


12K context fits the 8GB of RAM

```bash
base_model=codegeex4:9b-all-q4_K_M
ctx=ctx_16k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-$((ctx_val / 1024))k"

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.1
PARAMETER top_k 10
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 64

# --- ADD THESE FOR TOOL/CHAT SUPPORT ---
TEMPLATE """{{ if .System }}<|system|>
{{ .System }}{{ end }}{{ if .Prompt }}<|user|>
{{ .Prompt }}{{ end }}<|assistant|>
{{ .Response }}"""

EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```


### ❌ codegeex4:9b-all-q5_K_M

- No tools capability
Also with 4K ot overflow the VRAM

```bash
base_model=codegeex4:9b-all-q5_K_M
ctx=ctx_8k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-TOOLS-$((ctx_val / 1024))k"

cat > Modelfile <<EOF
FROM $base_model

TEMPLATE "{{ if .System }}<|system|>{{ .System }}<|end|>{{ end }}{{ if .Prompt }}<|user|>{{ .Prompt }}<|end|>{{ end }}<|assistant|>{{ .Response }}<|end|>"

PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.0
PARAMETER top_k 10
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 64
EOF

echo -e "$new_model created"
ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```


### ❌ deepseek-coder-v2:16b-lite-instruct-q4_K_M

+ Good result
- Slow, can't fit in 8GB RAM !
- No tools capability

```bash

base_model=deepseek-coder-v2:16b-lite-instruct-q4_K_M
ctx=ctx_8k              

ctx_val=${!ctx}
new_model="$base_model-ALEX-TOOLS-$((ctx_val / 1024))k"

echo $new_model

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

TEMPLATE "{{ if .System }}<|system|>{{ .System }}<|end|>{{ end }}{{ if .Prompt }}<|user|>{{ .Prompt }}<|end|>{{ end }}<|assistant|>{{ .Response }}<|end|>"

PARAMETER temperature 0.0
PARAMETER top_k 10
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 64
EOF

echo -e "$new_model created"
ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps

```



## ❌ deepseek-coder-v2:16b-lite-base-q3_K_S

```bash
base_model=deepseek-coder-v2:16b-lite-base-q3_K_S 
ctx=ctx_12k              

ctx_val=${!ctx}
new_model="$base_model-$((ctx_val / 1024))k"

cat > Modelfile <<EOF
FROM $base_model
PARAMETER num_ctx $ctx_val

PARAMETER temperature 0.0
PARAMETER top_k 20
PARAMETER top_p 0.7
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.12
PARAMETER repeat_last_n 128
#  PARAMETER num_predict 64
EOF

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```