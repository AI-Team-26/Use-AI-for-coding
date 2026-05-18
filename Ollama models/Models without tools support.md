# Models without "tools" capability

## Models that does not support "tools" in Ollama


- deepseek-coder-v2:16b-lite-instruct-q4_K_M



## Problem

Run deepseek-coder-v2:16b-lite-instruct-q4_K_M in Ollama.

It does not work in _Qwen Code_ and in _Pi Agent_:
> Error: 400 registry.ollama.ai/library/deepseek-coder-v2:16b-lite-instruct-q4_K_M does not support tools


The error "400 ... does not support tools" occurs because Ollama explicitly flags certain models in its registry as incompatible with function calling (tool use). If your client (Qwen Code, Pi Agent, or OpenCode) sends a request containing a "tools" parameter to a model without this flag, Ollama rejects it.




## hhao/qwen2.5-coder-tools:14b-ALEX_CODE-32k

```bash
ollama show hhao/qwen2.5-coder-tools:14b-ALEX_CODE-32k --modelfile >> modelfiles/hhao_qwen2.5-coder-tools:14b-ALEX_CODE-32k.modelfile
```




## deepseek-coder-v2:16b-lite-instruct-q4_K_M


Gemni suggest to copy what this one has: MFDoom/deepseek-coder-v2-tool-calling


```
FROM deepseek-coder-v2:16b-lite-instruct-q4_K_M

# Inject the template that teaches Ollama how to map tools for this model
TEMPLATE """{{ if .System }}<｜System｜>{{ .System }}{{ end }}{{ if .Tools }}<｜System｜>Tools available:
{{- range .Tools }}
- {{ .Function.Name }}: {{ .Function.Description }}
  Parameters: {{ .Function.Parameters }}
{{- end }}
Reply with a tool call block if needed.{{ end }}..."""

```


## Solution 1

*******************
*** NOT WORKING ***
*******************

Try force the Template.   

Create a Modelfile with:
```sh
FROM <model>
TEMPLATE "{{ if .System }}<|system|>{{ .System }}<|end|>{{ end }}{{ if .Prompt }}<|user|>{{ .Prompt }}<|end|>{{ end }}<|assistant|>{{ .Response }}<|end|>"
```

```bash
# Set your base model name
BASE_MODEL="deepseek-coder-v2:16b-lite-instruct-q4_K_M"
NEW_MODEL="$BASE_MODEL-tools"

# Create the Modelfile with the custom template
cat <<EOF > Modelfile_temp
FROM $BASE_MODEL
TEMPLATE "{{ if .System }}<|system|>{{ .System }}<|end|>{{ end }}{{ if .Prompt }}<|user|>{{ .Prompt }}<|end|>{{ end }}<|assistant|>{{ .Response }}<|end|>"
EOF

# Build the new model variant
ollama create "$NEW_MODEL" -f Modelfile_temp

# Cleanup
rm Modelfile_temp
```

