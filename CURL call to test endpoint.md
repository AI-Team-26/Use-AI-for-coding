# CURL call to test endpoint


## OpenAI-compatible endpoint

```bash
# OpenAI-compatible path
BASE_URL=https://codestral.mistral.ai/v1/chat/completions
# key from Codestral
API_KEY=$MISTRAL_CODESTRAL_API_KEY_ALEX
MODEL="codestral-2508"

PAYLOAD=$(cat <<EOF
{
  "model": "$MODEL",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Say hello in exactly 3 words."}
  ],
  "temperature": 0.7,
  "max_tokens": 50
}
EOF
)

curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "$PAYLOAD"
```

https://codestral.mistral.ai/v1/fim/completions
https://codestral.mistral.ai/v1/chat/completions



## Anthropic-compatible endpoint



## Gemini-compatible endpoint