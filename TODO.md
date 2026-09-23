# TODO

## Backlog

- Feature 18: todo-extraction feature has to extract used model properly.
  ```
  async function finishFeature(ctx: ExtensionContext, pi: ExtensionAPI): Promise<void> {
  
    // TODO: rework
    // Get model info
    const modelName = "${}/${}" ctx.provider ?? "unknown" model?.name ?? 'unknown'
  ```

  Use a constant LOCAL_LLAMA_CPP_PROVIDER="Llama.cpp" to define the provider used for local LLM.

  Use the following info.
  ctx.model:
 ```ts
   interface Model<TApi extends Api> {
     id: string          // e.g. "qwen3-..."
     name: string
     api: TApi           // e.g. "openai-completions"
     provider: ProviderId // e.g. "Llama.cpp"
     baseUrl: string     // ← http://host.docker.internal:8001/v1
     contextWindow: number
     maxTokens: number
     ...
   }
 ```

 ```ts
   const res = await fetch(`${ctx.model.baseUrl}/models`)   // list models
   const data = await res.json()                            // { data: [{ id, object, ... }] }
 ```

    We can assume there is ONLY ONE model (comemnt this assumption) and pick it.
  
   For llama-server specifically you also have non-standard endpoints at the server root (strip the /v1 suffix):
   + GET /props — loaded model info (name, context size, slots, main GPU, etc.)
   + GET /slots — slot state


  So, if the current provider is LOCAL_LLAMA_CPP_PROVIDER we can extract the model (name?) from the API.

- Feature 17: the feature-timer extension should add a retry-function (every 15-30 seconds) that check if the user reviewed the PR (Accepted or Rejected)

- Feature 11: 
  todo-feature: it should show teh elapsed time (00:00) and update the status every 15 or 30 seconds,

- Feature 10: add a single extension to show current GIT repo as <owner>/<repo> (<branch>) with owner/repo in different colors

- Feature 13: Select the Pi container should show the Agent name and icon (ai-start script)

- Feature 12: Complete the documentation for GIT and GitHub setup

- Feature 16: todo-feature extension should work also with bugs

- 🐞 Bug 2: GIT token for not-owned repositories.
  Currently, when you open a project where the repository is not-owned, it presents a message like this: 
  "❌ Git credentials record for <an-account>/<a project> not found"
  "Do you want to set the GIT credentials for "an-account" (do you have the PAT)? [Yy]es / [N]o"

  I reply "No" and this is the next message: 
  The "default" account GIT credentials will be used, this works iif you are a colalborator of the repo

- POC 1: https://pi.dev/packages/pi-voice-stt

- POC 2: Try SmallCode tool: https://github.com/Doorman11991/smallcode IF IT IS WORTH

