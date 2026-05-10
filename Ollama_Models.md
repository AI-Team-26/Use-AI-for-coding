# Ollama Models


## 8GB VRAM

| Model                     | Max Context (100% GPU) | 32K Context          | Note |
| ---                       | ---                    | ---                  | ---                                                                            |
| qwen3.5:9b-gguf           | qwen3.5-unsloth:9b-28k |                      | ❌ No tool capability!!                                                       |
| qwen3.5:9b-q4_K_M         | qwen3.5:9b-q4_K_M-12k  |                      | ⚠️ neither 8k stay in the GPU !                                               |
| qwen3:8b                  | qwen3:8b-16k           |                      | ✔️ It understand and execute commands. Slow.                                  |
| qwen2.5-coder:7b          | qwen2.5-coder:7b-20k   | qwen2.5-coder:7b-32k | ❌ Often outputs tool JSON instead of actually using commands |
| codegemma:7b              | ~20K (estimated)       | Partial offload      | Not tested                                                                     |
| deepseek-r1:7b            | ~20K (estimated)       | Partial offload      | Not tested                                                                     |
| llama3.3:8b-q4_K_M        | ~16K                   | Partial offload      | Not tested                                                                     |
| deepseek-r1:8b-q4_K_M     | ~20K                   | Partial offload      | Not tested                                                                     |
| mistral-nemo:12b-q3_K_M   | ~12K                   | ???                  | Not tested                                                                     |
| deepseek-coder-v2:16b-lite-base-q3_K_S
| deepseek-coder-v2:latest
| second_constantine/deepseek-coder-v2:16b


CodeGeeX4:9B-all-q5_K_M is very likely the better fit than Qwen2.5-Coder:7B for your 8GB local use case, especially if your main pain point was tool-call reliability rather than raw benchmark score. CodeGeeX4-ALL-9B is explicitly described as a code-focused model for software development scenarios, including function calling and repository-level Q&A, and the GGUF Q5_K_M build is a compact ~7.14 GB file

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


**codegeex4:9b-all-q5_K_M**:
CodeGeeX4:9B-all-q5_K_M 

**qwen3:8b**:  
Qwen3 8B scores 72% on HumanEval and uses only ~5GB VRAM, leaving you plenty of headroom for context. It's newer than qwen2.5-coder, has a hybrid thinking mode (can reason step-by-step on complex problems), and Qwen3-8B outperforms the larger Qwen2.5-14B on over half the benchmarks, especially STEM and coding. Strong pick for .NET.

**qwen2.5-coder:7b**:  
Still excellent. Qwen2.5-Coder performs well across more than 40 programming languages — C# and F# are included. Your current setup with 20K context is already a solid configuration.

**codegemma:7b**:  
CodeGemma is a lightweight model with strong community support as a balanced and effective all-rounder. Less impressive than Qwen on benchmarks but worth testing for .NET-specific completions. 

**deepseek-r1:7b**:  
Good for complex architectural decisions or debugging tricky C# type issues. Slower due to chain-of-thought output, but can think through problems more carefully.


**llama3.3:8b-q4_K_M**:  
A very interesting option for 8GB cards because it tends to be more stable in instruction following and tool-oriented workflows. If qwen2.5-coder annoys you by dumping JSON or acting weird with shell-style tasks, this is one of the first alternatives worth testing.

**deepseek-r1:8b-q4_K_M**:  
A stronger reasoning-oriented alternative in the same rough VRAM class. It can be useful for debugging, refactoring logic, and thinking through tricky implementation details, but it may be slower and more verbose.

**mistral-nemo:12b-q3_K_M**:  
This is the “stretch” option for 8GB. With aggressive quantization it may still be usable, but context headroom gets tighter. Worth trying if you want something different from Qwen/Llama and are okay with more trade-offs.
  
  
None of these models have C#/F# specialization — they're all general multilingual coders. The hard truth is that most benchmarks focus on Python/JS. For .NET work at 8GB, qwen3:8b is your best bet right now due to its stronger reasoning and recency.  
If you ever get a 16GB card, devstral-small:24b or qwen2.5-coder:14b would be a meaningful jump for multi-file .NET projects.


```bash
ctx_4k=4096
ctx_6k=6144
ctx_8k=8192
ctx_10k=10240
ctx_12k=12288
ctx_16k=16384
ctx_18k=18432
ctx_20k=20480 
ctx_24k=24576
ctx_28k=28672
ctx_32k=32768

# ── config ─────────────────────────────────────────────────
base_model=codegeex4:9b-all-q5_K_M    # set this
ctx=ctx_4k                   # set this

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

See "Ollama from GGUF.md" in the Ollama project documentation for a different/update documentation:


deepseek-coder-v2:16b-lite-base-q3_K_S

codegeex4:9b-all-q5_K_M