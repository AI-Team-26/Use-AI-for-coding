ollama_run() {
    local model=$1

    # Check if Ollama is running
    if ! curl -s http://localhost:11434/api/version > /dev/null; then
        echo "Error: Ollama server is not running" >&2
        echo "Please start Ollama first using: ollama serve" >&2
        return 1
    fi

    # Check if model exists
    if ! ollama list | grep -q "$model"; then
        echo "Error: Model $model is not available" >&2
        echo "Available models:" >&2
        ollama list >&2
        return 1
    fi

    # Define the prompt template with proper JSON escaping
    local prompt=$(cat << 'PROMPT_END'
You are a coding assistant that may or may not have access to external tools such as a code runner or a file system.

Task:
1. First, decide whether you should call a tool.
2. If you have tool-calling capability, you MUST respond ONLY with a single JSON object describing the tool call, in this exact shape:

{
    "tool_name": "run_code",
    "arguments": {
        "language": "fsharp",
        "code": "<put here the F# code you want to run>"
    }
}

3. If you do NOT have any tool-calling capability, ignore the JSON format and just explain in plain text that you do not know how to call tools and will answer normally instead.

Test:
Given the following F# snippet, prepare it for execution using the tool above:

let rec fact n =
    if n = 0 then 1
    else n * fact (n - 1)
PROMPT_END

    # Escape double quotes and newlines for JSON
    local escaped_prompt=$(printf '%s' "$prompt" | sed 's/"/\\\\\"/g; s/\n/\\\\n/g')
    # Create JSON payload with properly escaped content
    local json_payload=$(printf '{"model":"%s","prompt":"%s"}' "$model" "$escaped_prompt")

    echo "Prompt Tool: \$prompt" >&2
    echo "JSON Payload: \$json_payload" >&2
    echo "Sending API request..." >&2

    echo "Sending API request..." >&2

    # Send the request with proper error handling
    local raw
    raw=$(curl -s -w "\nHTTP Status: %{http_code}" http://localhost:11434/api/generate -H "Content-Type: application/json" -d "$json_payload" 2>&1)

    # Display the full response for debugging
    echo "API Response Details:"
    echo "$raw" | jq -r '.response' 2>/dev/null || echo "Raw response: $raw"
}

# Call the function with your desired model and prompt
ollama_run "qwen2.5-coder:14b-instruct-q5_K_M"
