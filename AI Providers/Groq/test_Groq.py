import requests
import os

# https://console.groq.com/docs/models

#api_key = os.environ.get("GROQ_API_KEY_PI_AGENT")
api_key = os.environ.get("Groq_api_key_continue_dev")
url = "https://api.groq.com/openai/v1/models"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)

print(response.json())

#---

# pip install Groq

from groq import Groq

client = Groq(api_key=api_key)

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Explain the importance of fast language models",
        }
    ],
    model="llama-3.3-70b-versatile",
)

print(chat_completion.choices[0].message.content)

