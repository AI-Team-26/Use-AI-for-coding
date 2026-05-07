# Ollama Models


## 8GB VRAM

| Model            | Max Context (100% GPU) | 32K Context           | Note                                      |
| ---              | ---                    | ---                   | ---                                       |
| qwen3.5:9b-gguf  | ~16K (text-only GGUF)  | ?                     | use the GGUF version                      |
| qwen3:8b         | qwen3:8b-16k           | ?                     |            |
| qwen2.5-coder:7b | qwen2.5-coder:7b-20k   | qwen2.5-coder:7b-32k  |  ✔️   stupid, don't execute commands                        |
| codegemma:7b     | ~20K (estimated)       |                       |                  |
| deepseek-r1:7b   | ~20K (estimated)       |                       | Thinking tokens inflate output length     |


**qwen3.5:9b**:  
Released March 2026. Newer than qwen3:8b, with a hybrid architecture (Gated Delta Networks + sparse MoE)
giving it strong instruction following and multilingual coding across 201 languages including C# and F#.
Scores 81.7 on GPQA Diamond — competitive with models 10x its size.
Supports 256K context natively.

⚠️ The default Ollama tag includes vision encoders that bloat VRAM on 8GB cards.
Use the text-only GGUF instead:

``ollama run hf.co/unsloth/Qwen3.5-9B-GGUF:Q4_K_M``

At Q4_K_M (~5.5GB), fits entirely in 8GB VRAM with ~55 t/s and up to ~16K context fully on GPU.
Has a `/think` reasoning mode for harder problems (disabled by default for the small series).


**qwen3:8b**:  
Qwen3 8B scores 72% on HumanEval and uses only ~5GB VRAM, leaving you plenty of headroom for context. It's newer than qwen2.5-coder, has a hybrid thinking mode (can reason step-by-step on complex problems), and Qwen3-8B outperforms the larger Qwen2.5-14B on over half the benchmarks, especially STEM and coding. Strong pick for .NET.

**qwen2.5-coder:7b**:  
Still excellent. Qwen2.5-Coder performs well across more than 40 programming languages — C# and F# are included. Your current setup with 20K context is already a solid configuration.

**codegemma:7b**:  
CodeGemma is a lightweight model with strong community support as a balanced and effective all-rounder. Less impressive than Qwen on benchmarks but worth testing for .NET-specific completions. 

**deepseek-r1:7b**:  
Good for complex architectural decisions or debugging tricky C# type issues. Slower due to chain-of-thought output, but can think through problems more carefully.

  
None of these models have C#/F# specialization — they're all general multilingual coders. The hard truth is that most benchmarks focus on Python/JS. For .NET work at 8GB, qwen3:8b is your best bet right now due to its stronger reasoning and recency.  
If you ever get a 16GB card, devstral-small:24b or qwen2.5-coder:14b would be a meaningful jump for multi-file .NET projects.


```bash
ctx_12k=12288
ctx_16k=16384
ctx_18k=18432
ctx_20k=20480 
ctx_24k=24576
ctx_28k=28672
ctx_32k=32768

# ── config ─────────────────────────────────────────────────
base_model=hf.co/unsloth/Qwen3.5-9B-GGUF:Q4_K_M   # set this
ctx=ctx_12k                   # set this

ctx_val=${!ctx}
new_model="$base_model-$((ctx_val / 1024))k"

new_model="qwen3.5:9b-gguf-12k"

# ── create and run ─────────────────────────────────────────
echo "FROM $base_model
PARAMETER num_ctx $ctx_val" > Modelfile

ollama create "$new_model" -f Modelfile
ollama run "$new_model" --verbose  "Hi, can you help me with F#?"
ollama ps
```
