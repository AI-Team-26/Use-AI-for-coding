def is_model_stuck_in_loop(response_text, previous_responses):
    # 1. Exact repetition check: Did it output the exact same text as the last turn?
    if len(previous_responses) >= 2:
        if response_text == previous_responses[-1] == previous_responses[-2]:
            return True
            
    # 2. Internal repetition check: Is the current chunk just repeating a phrase?
    # Split text into chunks of 100 characters. If the last 3 chunks are identical, it's looping.
    if len(response_text) > 300:
        chunk1 = response_text[-300:-200]
        chunk2 = response_text[-200:-100]
        chunk3 = response_text[-100:]
        if chunk1 == chunk2 == chunk3:
            return True
            
    return False

# Inside your post_generation_hook:
if is_model_stuck_in_loop(response_text, history):
    print("Model is looping! Injecting reset prompt.")
    # Force the model to break the loop
    history.append({"role": "user", "content": "[SYSTEM: You are stuck in a repetition loop. Stop repeating. If the code is finished, output </html>. If not, write the next logical line of code.]"})
    