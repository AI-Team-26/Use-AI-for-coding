# QVAC Architectural Overview & Technical Comparison

This document summarizes the technical capabilities of the **QVAC** ecosystem, its relation to existing tools like `llama.cpp` and **Pi**, its behavior inside Docker environments, and a comparison between **LoRA fine-tuning** (QVAC Fabric) and **In-Context Learning** (`SYSTEM.md` / `AGENTS.md`).

## 1. What is QVAC?

**QVAC** is an open-source, local-first AI framework developed by Tether. It provides a unified API and developer platform to run local AI models entirely on consumer hardware (mobile devices, laptops, edge hardware) without cloud dependencies.

### Core Architecture

* **SDK & Unified API:** JavaScript and Python APIs covering text generation, vision, audio transcription (STT), text-to-speech (TTS), optical character recognition (OCR), vector embeddings, and Retrieval-Augmented Generation (RAG).

* **Underlying Engines:** Bundles C++ inference backends internally:

  * `qvac-fabric-llm.cpp` (A custom fork of `llama.cpp` for text/LLM inference).

  * `whisper.cpp` (For audio transcription).

  * `sd.cpp` (For image generation).

  * `nmt.cpp` (For translation).

* **Asset Downloader:** Manages model fetching, cached GGUF handling, and quantization profile constants (`LLAMA_3_2_1B_INST_Q4_0`, etc.) automatically.

* **QVAC Fabric:** An engine supporting cross-platform LoRA fine-tuning directly on edge GPUs (via Vulkan and Metal).

## 2. QVAC vs. `llama.cpp` vs. Pi

| 

| **Feature** | **llama.cpp** | **Pi** | **QVAC** | 
| **Type** | C++ LLM Inference Engine | TUI / CLI Interactive Coding Agent | On-Device Infrastructure & Multi-Modal SDK | 
| **Primary Scope** | High-performance execution of quantized GGUF text models. | Interactive terminal workflow, tool execution, and workspace integration. | Unified developer SDK combining text, audio, vision, vector search, and fine-tuning. | 
| **Execution Model** | Native binary or lightweight HTTP server. | Agent harness that routes prompts to external or local LLM backends. | Direct library bindings (Node.js/Python) or an OpenAI-compatible local HTTP server. | 
| **Multi-Modal Capabilities** | Focused primarily on text/embeddings. | Via plugins/skills. | Out-of-the-box support for STT, TTS, OCR, Vision, and RAG. | 

### Key Takeaways:

* **`llama.cpp`** is the core execution engine.

* **Pi** is an interactive agent shell for human-agent interaction.

* **QVAC** is an application-level wrapper bundling multiple C++ runtimes into a single software development kit.

## 3. Running QVAC in Docker & OS Access

### Model Execution Location

Unlike setups where an agent inside a container calls a `llama.cpp` instance hosted on the machine's host OS, **QVAC bundles `llama.cpp` inside its own package**. Therefore, when QVAC runs inside Docker, inference runs **directly inside the container**.

### System Operations (Creation of Folders / OS Commands)

* **QVAC is strictly an intelligence layer.** It cannot create folders, run bash commands, or alter the host file system directly.

* To perform actions (e.g., *"Create folder AAA on Disk C"*), you must use **Structured Outputs / Function Calling**:

  1. The user inputs a command.

  2. QVAC parses the request and returns a structured JSON payload (e.g., `{"action": "mkdir", "path": "C:/AAA"}`).

  3. Your surrounding application code (Node.js/Python) receives the JSON and executes the system command using standard system APIs (`fs.mkdir`).

### Docker Considerations

1. **GPU Passthrough:** NVIDIA Container Toolkit (`--gpus all`) or Vulkan exposure is required for accelerated inference inside Linux containers.

2. **Audio Streams:** Capturing live microphones or speakers from within a container requires mapping host sound devices (e.g., PulseAudio/PipeWire sockets via `--device /dev/snd`).

## 4. QVAC Fabric: LoRA Fine-Tuning on Edge Devices

QVAC Fabric allows users to perform **Low-Rank Adaptation (LoRA)** fine-tuning on consumer hardware.

### How It Works

* Base GGUF weights remain frozen and untouched (read-only).

* Trainable adapter matrices are attached to attention layers (\~0.1% of overall parameters).

* Gradients are calculated **only** for the adapter weights, keeping VRAM requirements low (often 2 GB–4 GB).

* **Cross-Platform Backend:** Uses Vulkan and Metal kernels rather than requiring NVIDIA/CUDA exclusively.

* **Dynamic Tiling:** Breaks matrix operations into manageable memory buffers to avoid crashes on mobile hardware (e.g., Adreno GPUs).

* **Output:** Produces a small, standalone `.gguf` adapter file (e.g., \~30 MB) that can be dynamically loaded alongside the base model at inference time.

## 5. Comparison: LoRA Fine-Tuning vs. In-Context System Prompts (`SYSTEM.md` / `AGENTS.md`)

| **Metric** | **Context Injection (SYSTEM.md / AGENTS.md)** | **LoRA Fine-Tuning (QVAC Fabric)** | 
| **Mechanism** | Injected directly into the LLM's active context window. | Modifies probabilistic weight matrices via backpropagation. | 
| **Iteration Speed** | **Instant.** Changes take effect immediately upon saving the file. | **Slow.** Requires minutes to hours of dataset training per iteration. | 
| **Rule Following** | **High.** Modern instruction-tuned models follow explicit prompt constraints reliably. | **Probabilistic.** Helps set tone/style, but can still drift from strict rules. | 
| **Context Overhead** | Uses context window tokens on every request. | Zero context overhead (rules are embedded in the weights). | 
| **Best Used For** | Dynamic agent routing, tool schemas, instructions, coding rules. | Unstructured style adaptation, esoteric syntax, or massive prompt reductions. | 

### Conclusion

For interactive agents like **Pi**, relying on structured Markdown context files (`SYSTEM.md` and `AGENTS.md`) is significantly more flexible, reliable, and easier to maintain than training LoRA adapters. Fine-tuning is best reserved for specialized domain adaptations where system instructions are too large to fit in standard context windows.