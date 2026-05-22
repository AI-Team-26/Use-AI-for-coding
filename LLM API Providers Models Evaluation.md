# Models for Coding Evaluation


## Provider Models

- Ofox.ai: https://ofox.ai/models?utm=app_ofox
- TokenMix: 
- Novita.ai: 


## Results

Model Coding evaluation
| Provider    | Model                          | $ In/out    | Evaluation | Note                                                                           |
| ---         | ---                            |          ---| ---        | ---                                                                            |
| Openrouter  |                                |             |            |                                                                                |   
| Xiaomi      | mimo-v2.5                      |             | ✔️         |                                                                                |      
| Ofox        | deepseek/deepseek-v4-flash     | 0.14 / 0.28 |            |                                                                                |       
| Ofox        | deepseek/deepseek-v4-pro       | 1.74 / 3.48 |            |                                                                                |      
| Ofox        | bailian/qwen3.6-27b            | 0.60 / 3.60 |            |                                                                                |  
| Ofox        | bailian/qwen3.5-35b-a3b        | 0.29 / 1.83 |            |                                                                                |  
| Ofox        | bailian/qwen3.5-122b-a10b      | 0.29 / 2.29 | ❔         |                                                                                |
| Ofox        | bailian/qwen3.6-flash          | 0.25 / 1.50 |            |                                                                                |  
| Ofox        | bailian/qwen3.6-plus           | 0.50 / 3.00 |            |                                                                                |
| Ofox        | bailian/qwen3.5-flash          | 0.10 / 0.40 |            |                                                                                |
| Ofox        | bailian/qwen3-coder-next       | 0.20 / 1.50 | ❔         |                                                                                |
| Ofox        | bailian/qwen3-coder-plus       | 1.80 / 9.00 |            |                                                                                |
| Ofox        | bailian/qwen3-coder-flash      | 0.50 / 2.50 | ❔         |                                                                                |
| Ofox        | bailian/qwen-turbo             | 0.05 / 0.09 | ❔         |                                                                                |
| Ofox        | z-ai/glm-5.1                   | 1.40 / 4.40 |            |                                                                                |  
| Ofox        | minimax/minimax-m2.7           | 0.30 / 1.20 |            |                                                                                |  
| Ofox        | gemini-3.1-flash-image-preview | 0.25 / 1.50 |            |                                                                                |  
| Ofox        | z-ai/glm-4.7-flash:free        | FREE        |            |                                                                                |  
| Eden.ai     | amazon/zai.glm-4.7-flash       |             | ❌         | Duplicated files, not good reasoning, failed to use tools, lie                 | 
| Eden.ai     | google/gemma-4-26b-a4b-it      |             | ❌         | Not event responds!                                                             |
| Xiaomi      | mimo-v2-flash                  |             | ❌         |                                                                                |        
| TokenMix    | deepseek-v4-flash              | 0.14 / 0.28 |            |                                                                                 |
| Novita.ai   | kwaipilot/kat-coder-pro        | 0.30 / 1.20 |            |                                                                                 | 
| Novita.ai   | google/gemma-4-26b-a4b-it      | 0.13 / 0.40 |            |                                                                                 | 
| Novita.ai   | google/gemma-4-31b-it          | 0.40 / 0.40 |            |                                                                                 | 
| Novita.ai   | google/gemma-3-27b-it          | 0.12 / 0.20 |            |                                                                                 | 
| Novita.ai   | xiaomimimo/mimo-v2-flash       | 0.10 / 0.30 |            |                                                                                |
| Novita.ai   | deepseek/deepseek-v4-flash     | 0.14 / 0.28 |            |                                                                                |    


## Evaluating


0. google/gemini-3.1-flash-image-preview
0. minimax/minimax-m2.5:free (Openrouter)  
0. deepseek-v4-flash (TokenMix) 
0. deepseek/deepseek-v4-flash (Ofox)

## 🟢 Good models

0. mimo-v2.5 (Xiaomi)  
  + good rework of tests


## 🔴 Bad models

0. mimo-v2-flash (Xiaomi)
  + Denied command execution gives a cclear explanation of which rules deny it
  - Asked to change the name of a test... it didn't changed on similar tests
  - not smart on refactoring
  - It seems gets stuck in Qwen Code... start response but spinning for minutes ! 5 or more minutes for a simple question

0. google/gemma-4-26b-a4b-it (Eden.ai)
  - On Eden.ai it consumes tokens... without ever return the response   

0. amazon/zai.glm-4.7-flash (Eden.ai)
  - Duplicated files (it created FileExplorer/WriteFile.tests.cs while the same file existed in FileManager folder)
  - It said it created the PR. It didn't !
  - It created a new branch... from old main branch commit !
  - It applied changes without proper plan and with old informations (wanted t ocreate a folder that was already there)

      
