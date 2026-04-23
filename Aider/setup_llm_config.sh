#!/bin/bash

# Script to check and set up LLM configuration for Aider
CONFIG_FILE="/home/appuser/.aider.conf.yml"

# Function to check if a key exists in the config file
key_exists() {
    grep -q "^$1:" "$CONFIG_FILE"
}

# Check if the config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Config file $CONFIG_FILE not found. Skipping LLM configuration."
    exit 0
fi

# Check for OPENAI_API_BASE
if key_exists "openai-api-base"; then
    echo "openai-api-base already exists in $CONFIG_FILE"
else
    echo "openai-api-base not found in $CONFIG_FILE"
    read -p "Please enter your compatible OpenAI provider URL: " OPENAI_API_BASE
    if [ ! -z "$OPENAI_API_BASE" ]; then
        echo "openai-api-base: $OPENAI_API_BASE" >> "$CONFIG_FILE"
        echo "openai-api-base added to $CONFIG_FILE"
    fi
fi

# Check for OPENAI_API_KEY
if key_exists "openai-api-key"; then
    echo "openai-api-key already exists in $CONFIG_FILE"
else
    echo "openai-api-key not found in $CONFIG_FILE"
    read -s -p "Please enter your API key for the custom host: " OPENAI_API_KEY
    echo "" # Print newline after hidden input
    if [ ! -z "$OPENAI_API_KEY" ]; then
        echo "openai-api-key: $OPENAI_API_KEY" >> "$CONFIG_FILE"
        echo "openai-api-key added to $CONFIG_FILE"
    fi
fi

# Check for MODEL
if key_exists "model"; then
    echo "model already exists in $CONFIG_FILE"
else
    echo "model not found in $CONFIG_FILE"
    read -p "Please enter your preferred model (e.g., gpt-4, claude-3-opus, or your provider's model name): " MODEL
    if [ ! -z "$MODEL" ]; then
        echo "model: $MODEL" >> "$CONFIG_FILE"
        echo "model added to $CONFIG_FILE"
    fi
fi

echo "Configuration check complete!"
