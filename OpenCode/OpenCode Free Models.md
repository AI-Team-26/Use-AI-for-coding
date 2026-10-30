# OpenCode Free Models Comparison

| Model                      | Provider          | Total Params | Active Params | Context | Modalities | Code  | Notes                                               |
| -------------------------- | ----------------- | :----------: | :-----------: | :-----: | ---------- | :---: | --------------------------------------------------- |
| **Flint 40B**              | Recursive Int.    |     40B      |     ~2.5B     |  262K   | Text       | **9** | Purpose-built for coding agents                     |
| **DeepSeek v4.1 Flash**    | DeepSeek          |  552B+196B   |    8B/16B     |   1M    | T/I        | **9** | DeepSeek lineage = top coding; massive backbone     |
| **MiMo v2.6 Flash**        | Xiaomi            |     309B     |      15B      |   1M    | T/I/A/V    | **8** | Agentic workflows; large capacity for complex repos |
| **GLM 5.3 Flash**          | Zhipu AI          |     320B     |      18B      |   1M    | T/I        | **8** | Designed for "coding & agentic"                     |
| **Nemotron 3.5 Super VL**  | NVIDIA            |     120B     |      12B      |   1M    | T/I/V      | **7** | Generalist; vision helps with UI screenshots        |
| **Nemotron 3.5 Lightning** | NVIDIA            |     30B      |      3B       |   1M    | Text       | **6** | Speed-first; fine for small edits, not large ones   |
| **Big Pickle**             | Unknown (stealth) |      ?       |       ?       |  200K   | Text       | **?** | Unpredictable                                       |

## Quick Takeaways

- **Best context**: All except Flint and Big Pickle offer 1M tokens
- **Lightest/fastest**: Nemotron 3.5 Lightning (3B active) → good for quick iterations
- **Most capable (raw)**: DeepSeek v4.1 Flash (552B backbone) or MiMo v2.6 Flash (309B)
- **Multimodal**: Nemotron Super VL, MiMo, DeepSeek, GLM all handle images/video/audio
- **Coding-specific**: Flint 40B is purpose-built for coding agents
- **⚠️ Caution**: Big Pickle logs your prompts for training — don't feed it sensitive code
