# This logic runs as a post-generation hook in Pi
def post_generation_hook(response_text, conversation_history):
    MAX_CHUNKS = 10  # Hard limit to prevent infinite loops
    current_chunk_count = conversation_history.get("chunk_count", 0)
    
    # 1. Check if the HTML file is actually complete
    is_complete = "</html>" in response_text or "<!-- GAME_COMPLETE -->" in response_text
    
    # 2. Check if we hit the hard limit
    if current_chunk_count >= MAX_CHUNKS:
        print("Max chunks reached. Forcing stop.")
        return response_text 

    if not is_complete:
        # INJECT CONTINUATION PROMPT
        continuation_prompt = "\n\n[SYSTEM: You stopped generating before finishing the file. Continue exactly from where you left off. Do not repeat previous code. Output only the remaining HTML/JS.]"
        
        # Update Pi's internal context/history
        conversation_history.append({"role": "assistant", "content": response_text})
        conversation_history.append({"role": "user", "content": continuation_prompt})
        conversation_history["chunk_count"] = current_chunk_count + 1
        
        # Trigger the next generation pass automatically
        # (Use Pi's internal API to call the LLM again with the updated history)
        return call_llm_with_history(conversation_history)
        
    # If complete, reset counter for next task and return
    conversation_history["chunk_count"] = 0
    return response_text