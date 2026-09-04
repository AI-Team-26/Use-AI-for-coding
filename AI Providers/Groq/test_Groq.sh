
curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
     -H "Authorization: Bearer $GROQ_API_KEY_PI_AGENT" \
     -H "Content-Type: application/json" \
     -d '{"messages": [{"role": "user", "content": "Explain the importance of fast language models"}], "model": "qwen/qwen3.8-27b"}'