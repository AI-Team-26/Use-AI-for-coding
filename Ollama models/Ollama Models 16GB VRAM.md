# Ollama Models for 16GB VRAM

GeForce RTX 4060 Ti 16GB on PCI slot 2 of ASUS P8Z77V-LV (2012 !!!)  
MSI Afterburnet set to flat frequency curve at 900 mV.  

## Results with GeForce RTX 4060 Ti 16GB


| Model                                                        |〰️| Size  | Ctx   | GPU   | Tk/s | Time  |🔨|Pi| Note                                     |
| :----------------------------------------------------------- |〰️| ----: | ----: | ----: | ---: | ----: |〰️|〰️| :--------------------------------------- |
| gemma4:e4b-it-q4_K_M-ALEX_CODE-128k                          |✔️| 13 GB | 128 k | 100 % |   62 |   6 s |✔️|✔️| ❤️                                      |
| sparksammy/glm-4.7-flash-unsloth:small-hotfixed-ALEX_CODE-16k|✔️| 15 GB |  16 k | 100 % |   82 |  12 s |✔️|✔️|                                          |
| sparksammy/glm-4.7-flash-unsloth:tiny-hotfixed-ALEX_CODE-28k |✔️| 14 GB |  28 k | 100 % |   70 |  20 s |✔️|✔️|                                          |
| granite4.1:8b-ALEX_CODE-36k                                  |✔️| 15 GB |  36 k | 100 % |   61 |   8 s |✔️|✔️| Fast. Not too smart...                   |
| gemma4:e4b-it-q8_0-ALEX_CODE-128k                            |✔️| 15 GB | 128 k | 100 % |   43 |  19 s |✔️|〰️| Q8                                       |
| gemma4:e4b-ALEX_CODE-128k                                    |✔️| 13 GB | 128 k | 100 % |   63 |   4 s |✔️|〰️| Not "it"   FAST                          |
| pdurugyan/qwen3.5-9b-deepseek-v4-flash-Q4_K_M-ALEX_CODE-216k |✔️| 10 GB | 216 k | 100 % |   38 |  16 s |✔️|✔️| (:latest in the name)    Smart           |
| qwen3.5:9b-q4_K_M-ALEX_CODE-152k                             |✔️| 15 GB | 152 k | 100 % |   39 |  16 s |✔️|✔️| ❤️                                      |
| moophlo/Qwen3-Coder-30B-A3B-Instruct-GGUF:Q3_K_M-10k         |❌| 15 GB |  10 k |  98 % |   35 |  14 s |✔️|✔️| (ALEX_CODE) 30B  💔 output is truncated |
| rnj-1:8b-instruct-q8_0-ALEX_CODE-32k                         |❌| 13 GB |  32 k | 100 % |   27 |  20 s |✔️|✔️| Capped at 32k    💔 Too rigid           |
| qwen3:14b-q4_K_M-ALEX_CODE-36k                               |✔️| 15 GB |  36 k | 100 % |   27 |  32 s |✔️|✔️| Slow but smart                           |
| qwen3.5:9b-q8_0-ALEX_CODE-64k                                |✔️| 15 GB |  64 k | 100 % |   26 |  24 s |✔️|✔️|                                          |
| moophlo/Qwen3-Coder-30B-A3B-Instruct-GGUF:Q3_K_M             |✔️| 15 GB |   8 k |  97 % |   32 |  15 s |✔️|〰️| 8k    30B                                |

| granite4.1:30b-q3_K_S-ALEX_CODE-6k                           |❌| 15 GB |   6 k | 100 % |   20 |  22 s |✔️|✔️| SLOW  30B 💔 Stupid and lying always    |
| pdurugyan/qwen3.5-9b-deepseek-v4-flash-Q4_K_M:latest         |❌|  7 GB |   8 k | 100 % |   38 |  15 s |✔️|✔️| 8k                                       |
| granite4.1:8b-q4_K_S                                         |❌|  7 GB |   8 k | 100 % |   50 |  10 s |✔️|〰️| 8k                                       |
| sparksammy/glm-4.7-flash-unsloth:tiny-hotfixed               |❌| 12 GB |   8 k | 100 % |   74 |  26 s |✔️|✔️| kk                                       |
| gemma4:26b-a4b-it-q4_K_M                                     |❌| 20 GB |   8 k |  76 % |    9 |  53 s |✔️|✔️| TOO SLOW   26B                           |
| granite4.1:30b-q3_K_S                                        |❌| 16 GB |   8 k |  94 % |    6 |  70 s |✔️|〰️| TOO SLOW   30B                           |
| granite4:32b-a9b-h                                           |❌| 21 GB |   8 k |  69 % |    3 | 170 s |✔️|〰️| TOO SLOW   32B                           |
| qwen3:30b-a3b-thinking-2507-q4_K_M-ALEX_CODE-8k              |❌| 19 GB |   8 k |  77 % |    4 | 404 s |✔️|〰️|                                          |
| mistral-nemo:12b-instruct-2407-q3_K_S-ALEX_CODE-8k           |❌|  7 GB |   8 k | 100 % |   69 |   6 s |❌|〰️|                                          |
| hhao/qwen2.5-coder-tools:14b-ALEX_CODE-16k                   |❌| 13 GB |  16 k | 100 % |   32 |  18 s |❌|❌|                                          |
| h4rithd/coder:14b                                            |❌| 13 GB |  16 k | 100 % |   34 |  15 s |❌|〰️| Tools: Wrapped JSON reeponse             |
| h4rithd/coder:14b-ALEX_CODE-32k                              |❌| 17 GB |  32 k | 100 % |   33 |  15 s |❌|❌| Tools: Wrapped JSON reeponse             |
| MFDoom/deepseek-coder-v2-tool-calling:16b                    |❌| 10 GB |   4 k | 100 % |  100 |   1 s |❌|❌| Tools: Wrapped JSON reeponse             |
| second_constantine/deepseek-coder-v2:16b                     |❌| 11 GB |   8 k | 100 % |   94 |   5 s |❌|❌| Tools: Wrapped JSON reeponse             |
| deepseek-coder-v2:16b-lite-instruct-q4_K_M-ALEX_CODE-14k     |❌| 14 GB |  14 k | 100 % |  128 |   1 s |❌|〰️|                                          |
| devstral-small-2:24b-instruct-2512-q4_K_M                    |❌| 17 GB |   8 k |  88 % |    8 |   7 s |❌|〰️|                                          |
| llama3-groq-tool-use:8b-q5_0                                 |❌|  7 GB |   8 k | 100 % |   73 |   2 s |❌|〰️|                                          |
| devstral:24b-small-2505-q4_K_M                               |❌| 16 GB |   8 k |  92 % |    6 |  82 s |❌|〰️| Neither 6k stay in VRAM                  |
| qwen2.5-coder:7b-instruct-q4_K_M                             |❌| 5.3 GB |   8 k | 100 % |   69 |   7 s |❌|〰️|                                          |
| qwen2.5-coder:14b                                            |❌| 10 GB |   8 k | 100 % |   31 |  17 s |❌|〰️|                                          |
| qwen2.5-coder:14b-instruct-q5_K_M                            |❌| 12 GB |   8 k | 100 % |   29 |  17 s |❌|〰️|                                          |


 Special models
- llama3-gradient:8b is a specialized model for 1M context (maybe too much for a 16GB VRAM) to ingst HUGE amount of documentation
- rnj-1:8b-instruct-q8_0:  it works but the logic is too rigid. It is good for math, precise regex, cracking complex algorithm

❌ OLLAMA API ERROR: _model_ **does not support tools**
- codestral:22b-v0.1-q4_K_M-ALEX_CODE-8k
- second_constantine/yandex-gpt-5-lite:8b-q5_K_M
- CYLI310/CodeGPT:latest-ALEX_CODE-32k
- phi4-reasoning:14b-plus-q4_K_M-ALEX_CODE-16k
- kwaiCoder-DS-V2-Lite-Base-q4_K_M
- phi4:14b-q4_K_M
- granite-code:20b-base-q4_K_M
- rnj-1:8b-instruct-q4_K_M  (rnj-1:8b-instruct-q8_0 works !!)


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
- Granite4
  + granite4.1:8b-q8_0
  + granite4.1:30b-q3_K_S
  + granite-code:20b-base-q4_K_M
- DeepSeek
  + deepseek-coder-v2:16b-lite-instruct-q4_K_M
  + deepseek-coder-v2:16b-lite-instruct-q5_K_M
- Ministral
  + seamon67/Ministral-3-Reasoning:14b-q4_K_M
  + devstral-small-2:24b-instruct-2512-q4_K_M
  + mistral-nemo:12b-instruct-2407-q5_K_M
  + seamon67/Devstral1.1-2507:24b-q4_K_M
- Phi
  + phi4
  + phi4-reasoning:14b-plus-q4_K_M
- CYLI310/CodeGPT:latest  
- [x] h4rithd/coder:14b
- second_constantine/deepseek-coder-v2:16b
- haervwe/GLM-4.6V-Flash-9B:latest     <-- image
- sparksammy/glm-4.7-flash-unsloth:tiny-hotfixed
- rnj-1:8b-instruct-q8_0  supposed to be good for coding

