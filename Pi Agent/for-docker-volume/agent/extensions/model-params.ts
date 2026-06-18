import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"

export default function (api: ExtensionAPI) {
  // Intercept every chat completion request
  api.onBeforeChatCompletion((request) => {
    console.log("🎛️ Overriding temperature:", request.temperature)
    
    request.temperature = 0.1
    request.top_p = 0.8
    request.top_k = 20
    
    console.log("✅ New params:", request)
    return request
  })
}