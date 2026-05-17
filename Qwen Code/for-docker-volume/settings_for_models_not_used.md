# Settings for not used Models

Expired Free quota models:

```json

      // Local Ollama      
      {
        "id": "qwen2.5-coder:14b-instruct-q5_K_M",
        "name": "qwen2.5-coder:7b-20k (local Ollama)",
        "baseUrl": "http://host.docker.internal:11434/v1",
        "description": "---",
        "envKey": "LOCAL_OLLAMA",
        "generationConfig": {
          "contextWindowSize": 8192,
          "samplingParams": {
            "max_tokens": 2048
          }
        }
      }, 
      {
        "id": "qwen3:8b-20k",
        "name": "qwen3:8b-20k (local Ollama)",
        "baseUrl": "http://host.docker.internal:11434/v1",
        "description": "qwen3:8b-20k via local Ollama",
        "envKey": "LOCAL_OLLAMA",
        "generationConfig": {
          "contextWindowSize": 20480,
          "samplingParams": {
            "max_tokens": 2048
          }
        }
      },

      // Mistral
      /* wrong URL
      {
        "id": "devstral-2512",
        "name": "devstral-2512 (Mistral)",
        "baseUrl": "http://host.docker.internal:11434/v1",
        "description": "devstral-2512 via Mistral",
        "envKey": "MISTRAL_API_KEY_1"
      },
      */
      {   // no body response.. devstral-2511 or devstral-2512  ???
        "id": "devstral-2511",
        "name": "devstral-2511 (Mistral Codestral)",
        "baseUrl": "https://codestral.mistral.ai/v1",
        "description": "devstral-2511 on Mistral",
        "envKey": "MISTRAL_CODESTRAL_API_KEY_1"
      },
      {
        "id": "codestral-2508",
        "name": "codestral-2508 (Mistral Codestral)",
        "baseUrl": "https://codestral.mistral.ai/v1",
        "description": "codestral-2508 on Mistral",
        "envKey": "MISTRAL_CODESTRAL_API_KEY_1"
      },


      // AliBaba
      {
        "id": "qwen3.6-plus",
        "name": "qwen3.6-plus",
        "baseUrl": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        "description": "Qwen3-Coder via Dashscope",
        "envKey": "ALIBABA_API_KEY"
      },   
      {
        "id": "qwen-plus",
        "name": "qwen-plus (AliBaba)",
        "baseUrl": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        "description": "AliBaba qwen-plus via Dashscope",
        "envKey": "ALIBABA_API_KEY"
      }, 
      {
        "id": "qwen3.5-plus",
        "name": "qwen3.5-plus (AliBaba)",
        "baseUrl": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        "description": "Qwen3-Coder via Dashscope",
        "envKey": "ALIBABA_API_KEY"
      },  

      // OpenRouter
      {
        "id": "baidu/cobuddy:free",
        "name": "baidu/cobuddy:free (Openrouter)",
        "baseUrl": "https://openrouter.ai/api/v1",
        "description": "baidu/cobuddy:free on Openrouter",
        "envKey": "OPENROUTER_API_KEY"
      },
      {
        "id": "qwen/qwen3-coder-flash",
        "name": "qwen/qwen3-coder-flash (Openrouter)",
        "baseUrl": "https://openrouter.ai/api/v1",
        "description": "qwen/qwen3-coder-flash on Openrouter",
        "envKey": "OPENROUTER_API_KEY"
      },
      {
        "id": "qwen/qwen3.6-plus",
        "name": "qwen/qwen3.6-plus (Openrouter)",
        "baseUrl": "https://openrouter.ai/api/v1",
        "description": "qwen/qwen3.6-plus on Openrouter",
        "envKey": "OPENROUTER_API_KEY"
      },
      {
        "id": "kwaipilot/kat-coder-pro-v2",
        "name": "kwaipilot/kat-coder-pro-v2 (Openrouter)",
        "baseUrl": "https://openrouter.ai/api/v1",
        "description": "kwaipilot/kat-coder-pro-v2 on Openrouter",
        "envKey": "OPENROUTER_API_KEY"
      },
     {
        "id": "kwaipilot/kat-coder-pro-v2:free",
        "name": "kwaipilot/kat-coder-pro-v2:free (Openrouter)",
        "baseUrl": "https://openrouter.ai/api/v1",
        "description": "kwaipilot/kat-coder-pro-v2:free on Openrouter",
        "envKey": "OPENROUTER_API_KEY"
      },
      {
        "id": "minimax/minimax-m2.7",
        "name": "minimax/minimax-m2.7 (Openrouter)",
        "baseUrl": "https://openrouter.ai/api/v1",
        "description": "minimax/minimax-m2.7 on Openrouter",
        "envKey": "OPENROUTER_API_KEY"
      },
      {
        "id": "minimax/minimax-m2.5:free",
        "name": "minimax/minimax-m2.5:free (Openrouter)",
        "baseUrl": "https://openrouter.ai/api/v1",
        "description": "minimax/minimax-m2.5:free on Openrouter",
        "envKey": "OPENROUTER_API_KEY"
      },
      {
        "id": "google/gemini-3.1-flash-lite",
        "name": "google/gemini-3.1-flash-lite (Openrouter)",
        "baseUrl": "https://openrouter.ai/api/v1",
        "description": "google/gemini-3.1-flash-lite on Openrouter",
        "envKey": "OPENROUTER_API_KEY"
      },

      // Ofox
      {
        "id": "deepseek/deepseek-v4-flash",
        "name": "deepseek/deepseek-v4-flash (Ofox.AI)",
        "baseUrl": "https://api.ofox.ai/v1",
        "description": "deepseek/deepseek-v4-flash on Ofox.AI",
        "envKey": "OFOX_API_KEY"
      },
      {
        "id": "bailian/qwen3-coder-next",
        "name": "bailian/qwen3-coder-next (Ofox)",
        "baseUrl": "https://api.ofox.ai/v1",
        "description": "bailian/qwen3-coder-next on Ofox",
        "envKey": "OFOX_API_KEY"
      },
      {
        "id": "bailian/qwen3-coder-next",
        "name": "bailian/qwen3-coder-next (Ofox)",
        "baseUrl": "https://api.ofox.ai/v1",
        "description": "bailian/qwen3-coder-next on Ofox",
        "envKey": "OFOX_API_KEY"
      },

      
      {
        "id": "z-ai/glm-4.7-flash:free",
        "name": "z-ai/glm-4.7-flash:free (Ofox.AI)",
        "baseUrl": "https://api.ofox.ai/v1",
        "description": "z-ai/glm-4.7-flash:free on Ofox.AI",
        "envKey": "OFOX_API_KEY"
      },

```


