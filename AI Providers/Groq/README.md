# Groq

The free tier is unusable.  
- Many models just doesn't work
- A very simple request ("does the file AAA exists?") to _openai/gpt-oss-120b_ just returned this error: 
  ```Error: 413: {"message":"Request too large for model `openai/gpt-oss-120b` in organization `org_05geehbdwjnxdn777m0fx` service tier `on_demand` on tokens per minute (TPM): Limit 8000, Requested 15882,
 please reduce your message size and try again. Need more tokens? Upgrade to Dev Tier today at https://console.groq.com/settings/billing","type":"tokens","code":"rate_limit_exceeded"}
 ```

