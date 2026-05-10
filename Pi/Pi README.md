# Pi Agent (Local & Isolated)

A minimalist terminal coding agent setup for F# development, optimized for hardware with 8GB RAM.

## Build the Image
```bash
docker build \
    --label "Pi Agent for FSharp" \
    -t pi-agent:v1 \
    .