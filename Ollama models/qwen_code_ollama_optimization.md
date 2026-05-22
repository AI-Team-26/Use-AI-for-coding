# Qwen Code + Ollama Optimization (8GB & 16GB)

## Qwen Code settings.json
Location: ~/.qwen/settings.json (project .qwen/settings.json overrides)

```
{
  "maxOutputTokens": 2048,
  "contextWindowSize": 16384,
  "temperature": 0.7,
  "topP": 0.95,
  "topK": 40,
  "repeatPenalty": 1.1,
  "fastModel": "",
  "experimental": {
    "emitToolUseSummaries": false
  },
  "tools": {
    "sandbox": false
  }
}
```

8GB: maxOutputTokens: 1024-2048, contextWindowSize: 8192-16384  
16GB: maxOutputTokens: 4096, contextWindowSize: 32768+

## Ollama Modelfile (qwen3:8b -> qwen3.5:9b)
```
FROM qwen3:8b-16k  # or qwen3.5:9b-q4_K_M
PARAMETER temperature 0.7
PARAMETER top_p 0.95
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1
PARAMETER num_ctx 16384
PARAMETER num_gpu 999
PARAMETER num_thread 8
PARAMETER num_predict 2048
PARAMETER stop "<|im_end|>"
PARAMETER stop "<|endoftext|>"
```

Create: ollama create qwen-optimized -f Modelfile

8GB: num_ctx 8192-16384, num_predict 1024  
16GB: num_ctx 32768, num_predict 4096

## Docker start.sh
```
#!/bin/bash
export QWEN_MAX_TOKENS=2048
export OLLAMA_NUM_PARALLEL=1
unset QWEN_SANDBOX_IMAGE
export QWEN_SANDBOX=false
exec qwen --continue
```

## Docker ENV
```
ENV QWEN_SANDBOX=false
ENV OLLAMA_HOST=http://host.docker.internal:11434
```
