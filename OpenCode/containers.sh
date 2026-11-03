# Usage:
# containers.sh <steps>
# where steps is a concatenation of these possible values: create, setup, run
# containers.sh create_image      --> create the Docker images
# containers.sh setup             --> call the setup_containers.sh
# containers.sh create_container  --> create the images to create the containers
# containers.sh create_image,setup,create_container     --> execute all the steps

set -euo pipefail

steps=${1:-"<steps> argument must be defined"}

source constants.sh
docker_image="opencode-agent:4"


# Create ------------------------------------------------------------------------------------------
if [[ "$steps" == *create_image* ]]; then
    docker build \
        --label description="OpenCode" \
        -t $docker_image \
        -f Dockerfile \
        .
fi


# Setup -------------------------------------------------------------------------------------------
if [[ "$steps" == *setup* ]]; then    
    ./containers_setup.sh
fi


# Run ---------------------------------------------------------------------------------------------
if [[ "$steps" == *create_container* ]]; then

    for id in "${!agents[@]}"; do
        AGENT_ID="$id"                        # "Dev-1"  (the assoc-array key)
        AGENT_FULL_NAME="${agents[$id]}"      # "🔵 Blu"
        AGENT_ICON="${AGENT_FULL_NAME%% *}"   # "🔵"  (up to first space)
        AGENT_NAME="${AGENT_FULL_NAME#* }"    # "Blu"  (after first space)

        echo "$AGENT_ID | $AGENT_FULL_NAME | icon=$AGENT_ICON | name=$AGENT_NAME"

        # run -it \
        docker create \
            -it \
            --name "OpenCode-${AGENT_ID}" \
            --label "icon=${AGENT_ICON}" \
            --label "alias=${AGENT_NAME}" \
            --label "description=OpenCode ${AGENT_ID}" \
            -e AI_AGENT_NAME="${AGENT_FULL_NAME}" \
            --mount type=bind,src="$docker_volumes/scripts",dst=/scripts \
            --mount type=bind,src="$docker_volumes/scripts",dst=/share \
            --mount type=bind,src="$docker_volumes/$AGENT_ID/opencode",dst=/root/.config/opencode \
            --mount type=bind,src="$docker_volumes/$AGENT_ID/projects",dst=/projects \
            $docker_image
    done
fi

