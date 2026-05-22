# Ollama Models for 8GB VRAM

GeForce GTX 1070 8GB on PCI slot 2 of ASUS P8Z77V-LV (2012 !!!)

## Results

| Model                                         |     | GB   | GPU % | Context | Tk/s | Time | Result | Tools | Notes                                  |
| :-------------------------------------------- | --- | ---: | -----:| ------: | ---: | ---: | :----- | ------| :------------------------------------- |
| qwen2.5-coder:7b-instruct-q4_K_M-ALEX-22k     |🥇🥇|  6.8 |   100 |   22528 |   32 |   4s | + Win  | yes   |                                        |
| qwen2.5-coder:7b-ALEX-20k                     |🥇〰️|  6.8 |   100 |   20480 |   33 |   7s | + Win  | yes   |                                        |
| qwen2.5-coder:7b-10k                          |✔️〰️|  5.6 |   100 |   10240 |   32 |   8s | + Win  | yes   |                                        |
| qwen2.5-coder:7b-instruct-q5_K_M-ALEX-16k     |✔️🧠|  7.0 |   100 |   16384 |   29 |  10s | + Pass | yes   |                                        |
| llama3-groq-tool-use:8b-q5_0                  |✔️❌|  6.9 |   100 |    8192 |   28 |  13s | + Win  | yes   | FIXED 8K (due to GGUF settings)        |  
| qwen3:8b-ALEX-16k                             |✔️🧠|  7.8 |   100 |   16384 |   27 |  47s | + Pass | yes   |                                        | 
| granite4.1:8b-q4_K_M-ALEX-8k                  |✔️🧠|  7.4 |   100 |    8192 |   26 |  12s | + Pass | yes   | Reasoning                              |
| granite4.1:8b-q5_K_M                          |✔️〰️|  7.1 |   100 |    4096 |   23 |  26s | + Pass | yes   |                                        |
| Qwen3.5-9b-Sushi-Coder-RL.Q4_K_M-8k           |✔️🧠|  7.4 |   100 |    8192 |   19 |  42s | + Wow  | yes   | Super Reasonint and Testing            |  
| second_constantine/deepseek-coder-v2:16b      |✔️〰️| 10.0 |    76 |    4096 |   17 |  34s | + Pass | yes   |                                        |
| granite4.1:8b-q4_K_S-ALEX-10k                 |❌〰️|  7.7 |    96 |   10240 |   18 |  17s | + Pass | yes   |                                        |
| qwen3.5:9b-q4_K_M-12k                         |❌🧠|  9.1 |    73 |   12288 |   11 |  77s | + Pass | yes   | Too slow                               |
| gemma4:e4b-it-q4_K_M-ALEX-8k                  |✔️🧠| 10.0 |    34 |    8192 |   13 |  87s | + Wow  | yes   |                                        |
| gemma4:e4b-it-q4_K_M-ALEX-10k                 |✔️🧠| 10.0 |    34 |   10240 |   14 |  91s | + Wow  | yes   |                                        | 
| gemma4:e4b-it-q4_K_M                          |❌🧠| 10.0 |    33 |    4096 |   14 |  93s | + Pass | yes   | Too small context                      | 

| deepseek-coder-v2:16b-lite-base-q3_K_S        |❌〰️|  8.9 |    83 |    4096 |   16 |  32s | + PAss | yes   |                                        |  
| qwen2.5-coder:7b-instruct-q4_K_M-ALEX-24k     |❌✔️|  7.6 |    94 |   24576 |   15 |  13s | + Pass | yes   | Too slow, but result came out quickly  |   
| mistral-nemo:12b-instruct-2407-q4_0           |     |  8.2 |    91 |    4096 |   12 |  30s | + Pass | yes   | Too slow                               | 
| mistral-nemo:12b-instruct-2407-q3_K_L-8k      |❌〰️|  8.4 |    87 |    8192 |    7 |  30s | + Pass | yes   | Too slow                               |
| mistral-nemo:12b-instruct-2407-q4_K_M-8k      |❌〰️|  9.3 |    79 |    8192 |    5 |  46s | + Pass | yes   | Too slow                               |  
| qwen3.5-unsloth:9b-18k                        |❌〰️|  7.8 |   100 |   18432 |   20 |  20s | + Pass | *NO*  |                                        |
| deepseek-coder-v2:16b-lite-instruct-q4_K_M    |❌〰️| 11.0 |    62 |    4096 |   12 |  51s | ++ Wow | *NO*  |                                        |
| codegeex4:9b-all-q4_K_M                       |❌🧠|  6.4 |   100 |    4096 |   24 |  10s | + Wow  | *NO*  |                                        |
| codegeex4:9b-all-q4_K_M-ALEX-12k              |❌〰️|  7.3 |   100 |   12288 |   24 |  10s | + Wow  | *NO*  |                                        |
| codegeex4:9b-all-q5_K_M                       |❌〰️|  7.7 |    93 |    4096 |   14 |  12s | + Pass | *NO*  |                                        |
| codegeex4:9b-all-q5_K_M-ALEX-8k               |❌〰️|  7.9 |    94 |    8192 |   15 |  29s | + Pass | *NO*  |                                        |
| yi-coder:9b-chat-q5_K_M                       |❌〰️|  6.8 |   100 |    4096 |   23 |  24s | + Pass | *NO*  |                                        |
| yi-coder:9b-chat-q5_K_M-ALEX-20k              |❌〰️|  9.5 |    79 |   20480 |    8 |  24s | + PAss | *NO*  | Too slow                               |
| qwen3.5:9b-q4_K_M                             |❌🧠|  8.8 |    72 |    4096 |   11 |  78s | + Wow  | yes   | Too slow and small context             |
| qwen2.5-coder:7b-32k                          |❌〰️|  8.7 |    85 |   32768 |   11 |  24s | + Pass | yes   |                                        |
| codegemma:7b-20k                              |〰️〰️|  9.9 |    73 |    8192 |    6 |  40s | + Pass | ❔    |                                        |
| deepseek-coder-v2:16b-lite-base-q3_K_S        |❌〰️|      |       |         |      |      | - Fail |       | Failed the test                        |
| yi-coder:9b-base-q5_K_M                       |❌〰️|      |       |         |      |      | - Fail |       | Failed the test. Rubbish output.       |
| qwen3.5:9b-gguf                               |❌〰️|      |       |         |      |      | - Fail | *NO*  |                                        |
| deepseek-r1:8b                                |❌〰️|      |       |         |      |      | - Fail | *NO*  |                                        |
| qwen2.5-coder:14b-instruct-q3_K_M             |❌〰️|  9.6 |    77 |    8192 |    4 |  32s | + Pass | yes   | Too slow                               | 


Models to test:
- mistral-nemo:12b-instruct-2407-q3_K_S
- llama3.1:8b-instruct-q5_K_M
- codegemma:7b-instruct-v1.1-q4_K_M  v1.1 
- llama3-groq-tool-use:8b-q5_0-ALEX-16k_v2


## To try

https://huggingface.co/bigatuna/Qwen3.5-9b-Sushi-Coder-RL-GGUF
Q4_K_M and Q6_K

https://huggingface.co/TheBloke/MAmmoTH-Coder-13B-GGUF?show_file_info=mammoth-coder-13b.Q4_K_M.gguf


## Note on models

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

