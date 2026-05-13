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

- temperature: lower means more deterministic,
- top_k / top_p / min_p: tighter sampling reduces weird token choices.
- repeat_penalty / repeat_last_n: helps stop loops and repeated junk.
- num_predict: keeps the model from wandering too long. Prevent it to fall in a loop
  ! when set to 64, it cuts the response !!

Perplexity:  
```sh
PARAMETER temperature 0.0      
PARAMETER top_k 20             
PARAMETER top_p 0.8
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.15
PARAMETER repeat_last_n 128
# PARAMETER num_predict 64     
```

Gemini:  
```sh
FROM deepseek-coder-v2:16b-lite-base-q3_K_S
# Stick to 0.0 for logic/math/code
PARAMETER temperature 0.0
# Higher top_k can help if temp was > 0, but at 0.0 it's ignored
PARAMETER top_k 10
# Slightly lower penalty to respect F# syntax patterns
PARAMETER repeat_penalty 1.05
```

# Essential: Adjust RoPE for Llama 3 to prevent gibberish at 20k
PARAMETER rope_frequency_base 572000


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


### qwen2.5-coder:7b-instruct-q5_K_M

```bash
base_model=qwen2.5-coder:7b-instruct-q5_K_M
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

### qwen2.5-coder:7b-instruct-q4_K_M

```bash
base_model=qwen2.5-coder:7b-instruct-q4_K_M
ctx=ctx_22k              

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


### gemma4:e2b-it-q4_K_M

```bash
base_model=gemma4:e4b-it-q4_K_M
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