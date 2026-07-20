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