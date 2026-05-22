# GPU on rent website

- Test what is capable of a GPU with 16GB, 32GB, 48GB
- Verify how to secure and use a rented GPU
- Test what it can cost in a week/month of usage


## 32GB

What model can I run?

Qwen Coder: ✔️
  ✔️ **Qwen/Qwen3-Coder-30B-A3B-Instruct**: https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct
    AWQ: https://huggingface.co/YCWTG/Qwen3-Coder-30B-A3B-Instruct-W4A16-mixed-AWQ  (18GB)
DeepSeek: 
  DeepSeek Coder 33B: old... not V2
Codestral: 
  codestral:22b-v0.1-q6_K: 18GB
  codestral:22b-v0.1-q8_0: 24GB
CodeLlama: ❌
  codellama:34b-code-q6_K: ❌ Not as powerful as the latest DeepSeek Coder V2 or Qwen models for some tasks




- DeepSeek Coder 33B – This model is highly regarded for coding tasks and requires around 24GB+ VRAM for optimal performance. It’s one of the top performers for code generation and understanding, making it a great fit for your setup
localaimaster.com
- WizardCoder 15B – This model is also well-suited for coding and fits comfortably within 32GB VRAM, offering strong code completion and reasoning abilities
localaimaster.com
- CodeLlama 13B – Another popular choice for coding, CodeLlama 13B typically requires 8-16GB VRAM but can be run at higher precision or with larger context windows on a 32GB card
localaimaster.com
- Qwen3.5 35B – If you want to push the limits of your VRAM, Qwen3.5 35B is a powerful model for both coding and general tasks. With quantization, it can fit into 32GB VRAM and offers excellent performance
reddit.com
- Qwen3-Coder-Next – This is a newer model optimized for coding and agentic workflows, and it can be run at high quality with 32GB VRAM
reddit.com



### Runpod

Not properly tested yet.


### Ollama vs vLLM vs Exllama

**KV Cache**: The main memory cost for long contexts is the key-value (KV) cache, which stores intermediate states for attention. This scales with context length, but not as much as the model itself.  
**Efficient Backends**: Tools like vLLM or Exllama use paged attention, which optimizes KV cache memory and allows for much longer contexts with less overhead.

With vLLM/Exllama you can often double or triple the effective context length for the same VRAM, thanks to paged attention.
  
Local Limitations  
GTX 1070 is too old for vLLM (minimum RTX 20-series/Pascal+), but upgrade targets (4060/5060 Ti 16GB) are fully compatible. RunPod RTX/A-series (24-32GB) are perfect for vLLM with coding models like Qwen 2.5 Coder 32B Q4 (~19GB VRAM), leaving headroom for 128K+


### Deploy a model and expose Ollama with authentication

[TODO]