# CURL call to test endpoint


## OpenAI-compatible endpoint

### Google Gemini

```python
import os
from openai import OpenAI

api_key = os.environ.get("GEMINI_API_KEY_PI_AGENT")

if api_key == None or api_key == "":
    raise Exception("GEMINI_API_KEY_PI_AGENT environment variable not found or empty")
else:
    print("api key OK")

client = OpenAI(
    api_key=api_key,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

response = client.chat.completions.create(
    model="gemini-3.5-flash",
    messages=[
        {   "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": "Explain to me how AI works"
        }
    ]
)

print(response.choices[0].message)
```


### Cerebras

```sh
curl --location 'https://api.cerebras.ai/v1/chat/completions' \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer ${CEREBRAS_API_KEY}" \
  --data '{
    "model": "qwen-3.8-27b",
    "max_completion_tokens": 1024,
    "temperature": 0.2,
    "top_p": 1,
    "stream": false,
  "reasoning_effort": "medium",
    "messages": [
    {
      "role": "user",
      "content": "Why is fast inference important?"
    }
  ]
  }'
```

### Cloudflare

At the moment (15 Oct 2026) the API endpoint accept only stirng and not array of string and hte is a PR in Pi agent to solve this.  

```sh
base_url=https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai
chat_completion_url=https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai/chat/completions
https://gateway.ai.cloudflare.com/v1/{account_id}/default/compat/chat/completions

# Run `wrangler whoami` to get your account ID and set CLOUDFLARE_ACCOUNT_ID.
# Run `wrangler auth token` to get an API token and set CLOUDFLARE_API_TOKEN.
model="@cf/moonshotai/kimi-k2.7-code"
model=@cf/zai-org/glm-5.3-flash
curl -X POST https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/v1/chat/completions \
  --header "Authorization: Bearer $CLOUDFLARE_API_KEY_PI_AGENT" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "@cf/openai/gpt-oss-120b",
      "messages": [
        { "role": "user", "content": "What is Cloudflare?" }
      ],
      "max_tokens": 2048
  }'
  --header "cf-aig-gateway-id: default" \

@cf/zai-org/glm-5.3-flash

curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/v1/chat/completions" \
  --header "Authorization: Bearer $CLOUDFLARE_API_KEY_PI_AGENT" \
  --header "cf-aig-gateway-id: default" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "@cf/moonshotai/kimi-k2.6",
    "messages": [
      {
        "role": "user",
        "content": "What is Cloudflare?"
      }
    ]
  }'

```


anthropic/claude-sonnet-5.5

### Mistral

```sh
# OpenAI-compatible path
BASE_URL=https://codestral.mistral.ai/v1/chat/completions
# key from Codestral
API_KEY=$MISTRAL_CODESTRAL_API_KEY
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


### AliBaba

[TODO]

## Anthropic-compatible endpoint



## Gemini-compatible endpoint