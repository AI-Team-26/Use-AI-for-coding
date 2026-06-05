---
name: web-search
description: Searches the web using EXA AI for factual answers and documentation lookups. Use this when the user asks a question, needs facts, or wants to find official docs/tutorials.
---

# Web Search

## Usage

Run the script with a query. Choose the mode based on intent:

### Factual questions → Answer mode
```bash
python3 search.py --answer "Is Turboquant active on llama.cpp main branch?"
```
Returns a synthesized answer with source citations. Best for yes/no questions, definitions, explanations.

### Finding docs/tutorials → Search mode
```bash
python3 search.py --search "MAUI best way to create a button"
```
Returns a ranked list of URLs with titles and snippets. Best for finding official docs, tutorials, guides.

### Both (default)
```bash
python3 search.py "your query"
```
Runs both modes and outputs results from each.

## Requirements

- **No API key required** — works out of the box via EXA MCP (zero-config)
- Optional: set `EXA_API_KEY` or create `~/.pi/web-search.json` for direct API access (more reliable, higher limits)
- Python 3.8+ (stdlib only — no external dependencies)
