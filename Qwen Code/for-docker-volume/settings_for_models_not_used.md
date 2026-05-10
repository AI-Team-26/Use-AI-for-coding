# Settings for not used Models

Expired Free quota models:

```json
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


      // Local Ollama
      {
        "id": "qwen3.5-unsloth:9b-20k",
        "name": "qwen3.5-unsloth:9b-20k (local Ollama)",
        "baseUrl": "http://host.docker.internal:11434/v1",
        "description": "qwen3.5-unsloth:9b-20k via local Ollama",
        "envKey": "LOCAL_OLLAMA",
        "generationConfig": {
          "contextWindowSize": 20480,
          "samplingParams": {
            "max_tokens": 2048
          }
        }
      },
      {
        "id": "qwen3.5-unsloth:9b-28k",
        "name": "qwen3.5-unsloth:9b-28k (local Ollama)",
        "baseUrl": "http://host.docker.internal:11434/v1",
        "description": "qwen3.5-unsloth:9b-28k via local Ollama",
        "envKey": "LOCAL_OLLAMA",
        "generationConfig": {
          "contextWindowSize": 28672,
          "samplingParams": {
            "max_tokens": 2048
          }
        }
      },


      {
        "id": "baidu/cobuddy:free",
        "name": "baidu/cobuddy:free (Openrouter)",
        "baseUrl": "https://openrouter.ai/api/v1",
        "description": "baidu/cobuddy:free on Openrouter",
        "envKey": "OPENROUTER_API_KEY"
      },

```


