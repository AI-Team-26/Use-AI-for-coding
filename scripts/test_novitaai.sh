#!/bin/bash

API_KEY="$NOVITAAI_API_KEY_PI_AGENT_LOCAL"
MODEL_ID="nex-agi/nex-n2-pro"
BASE_URL="https://api.novita.ai/openai"

curl -X POST "$BASE_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "'$MODEL_ID'",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "Hello, how are you?"
      }
    ],
    
    "max_tokens": 131072,
    "temperature": 1,
    "top_p": 1,
    "min_p": 0,
    "top_k": 50,
    "presence_penalty": 0,
    "frequency_penalty": 0,
    "repetition_penalty": 1
  }'


#    "response_format": { "type": "text" },
#    "max_tokens": 262144,
#    "temperature": 0.7


  curl "https://api.novita.ai/openai/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NOVITAAI_API_KEY_PI_AGENT_LOCAL" \
  -d @- << 'EOF'
{
    "model": "nex-agi/nex-n2-pro",
    "messages": [
        {
            "role": "system",
            "content": "Be a helpful assistant"
        },
        {
            "role": "user",
            "content": "Hi there!"
        }
    ],
    "response_format": { "type": "text" },
    "max_tokens": 131072,
    "temperature": 1,
    "top_p": 1,
    "min_p": 0,
    "top_k": 50,
    "presence_penalty": 0,
    "frequency_penalty": 0,
    "repetition_penalty": 1
}
EOF
  