echo -e "\n=== Qwen Code ===\n"

#docker ps -a --format "{{.Names}}" | grep Qwen

# Read the output into an array
mapfile -t qwen_containers < <(docker ps -a --format "{{.Names}} ({{.ID}}) ({{.Status}})" | grep Qwen)

# Check if the array is empty
if [ ${#qwen_containers[@]} -eq 0 ]; then
    echo "No Docker containers found with 'Qwen' in the name."
    exit 1
fi

# Add "Exit" to the options
options=("${qwen_containers[@]}" "Exit")

# Display the menu
echo -e "Select a container"
select opt in "${options[@]}"; do
    case $opt in
        "Exit")
            echo "Exiting..."
            exit 0
            ;;
        *)
            if [[ -n "$opt" ]]; then
                # Extract the container ID (assuming format: "name (id)")
                #container_id=$(echo "$opt" | awk '{print $NF}' | tr -d '()')
                container_id=$(echo "$opt" | awk -F'[()]' '{print $2}')

                echo "Starting and attaching to container: $container_id"

                # Start the container
                # -a:  attaches to the container's output immediately.
                # -1: keeps STDIN open for interactive input.
                docker start -ai "$container_id" || {
                    echo "Failed to start container $container_id"
                    break
                }

                # Attach will pick up the entrypoint script in a "waiting usder input state", not what we want
                #docker attach "$container_id"

                break
            else
                echo "Invalid option. Please try again."
            fi
            ;;
    esac
done