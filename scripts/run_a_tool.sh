#!/bin/bash

# Select a tool and run it

echo  "▶ Run a tool"

# Define options
options=(
    "Run OpenCode"
    "Run Qwen Code"
    "Exit"
)


# Display menu and prompt for selection
select opt in "${options[@]}"; do
    case $opt in
        "Run OpenCode")
            echo "Executing OpenCode..."
            ./OpenCode/run.sh
            break
            ;;
        "Run Qwen Code")
            #echo "Executing Qwen Code..."
            ./Qwen\ Code/run.sh
            break
            ;;
        "Exit")
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid option. Please try again."
            ;;
    esac
done



