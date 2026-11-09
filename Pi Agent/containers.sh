#!/usr/bin/env bash
# Usage:
# containers.sh <steps>
# where steps is a comma-concatenation of these possible values:
# containers.sh create_image      --> build the Docker image
# containers.sh setup             --> provision the docker volumes (calls containers_setup.sh)
# containers.sh create_container  --> create the containers (one per agent in constants.sh)
# containers.sh create_image,setup,create_container     --> execute all the steps

set -euo pipefail

steps=${1:?"<steps> argument must be defined"}

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

source constants.sh
docker_image="pi-agent:15"

valid_steps="create_image, setup, create_container"
IFS=',' read -ra step_list <<< "$steps"
normalized_steps=""
for step in "${step_list[@]}"; do
    step="${step//[[:space:]]/}"        # no valid step name contains a space
    [[ -z "$step" ]] && continue
    case "$step" in
        create_image|setup|create_container) ;;
        *) echo "❌ Unknown step '${step}'. Valid steps: ${valid_steps}" >&2; exit 2 ;;
    esac
    normalized_steps="${normalized_steps:+$normalized_steps,}$step"
done
[[ -z "$normalized_steps" ]] && { echo "❌ No valid step given. Valid steps: ${valid_steps}" >&2; exit 2; }
# dispatch on the normalized list, so 'a, b' and 'a,b' behave identically
steps=",$normalized_steps,"

# Create image ------------------------------------------------------------------------------------
has_step() { [[ "$steps" == *",$1,"* ]]; }

if has_step create_image; then
    docker build \
        --label description="Pi Agent" \
        -t "$docker_image" \
        -f Dockerfile \
        .
fi


# Setup -------------------------------------------------------------------------------------------
if has_step setup; then
    ./containers_setup.sh
fi


# Create containers -------------------------------------------------------------------------------
if has_step create_container; then

    for id in "${!agents[@]}"; do
        AGENT_ID="$id"                        # "Dev-1"  (the assoc-array key)
        AGENT_FULL_NAME="${agents[$id]}"      # "🍋 Pi Lemon"
        AGENT_ICON="${AGENT_FULL_NAME%% *}"   # "🍋"  (up to first space)
        AGENT_NAME="${AGENT_FULL_NAME#* }"    # "Pi Lemon"  (after first space)
        AGENT_DEFAULT_MODEL="${agent_default_models[$id]:-}"

        echo "$AGENT_ID | $AGENT_FULL_NAME | icon=$AGENT_ICON | name=$AGENT_NAME | default_model=${AGENT_DEFAULT_MODEL:-<none>}"

        # TODO: create_container is not idempotent - a re-run aborts on "name already in use"
        # and, with set -e, leaves the remaining agents uncreated. Skip (or recreate) existing ones.
        docker create \
            -it \
            --name "PiAgent-${AGENT_ID}" \
            --label "icon=${AGENT_ICON}" \
            --label "alias=${AGENT_NAME}" \
            --label "description=Pi Agent ${AGENT_ID}" \
            -e AI_AGENT_NAME="${AGENT_FULL_NAME}" \
            ${AGENT_DEFAULT_MODEL:+-e AI_AGENT_DEFAULT_MODEL="${AGENT_DEFAULT_MODEL}"} \
            --mount type=bind,src="$docker_volumes/scripts",dst=/scripts \
            --mount type=bind,src="$docker_volumes/share",dst=/share \
            --mount type=bind,src="$docker_volumes/$AGENT_ID/.pi",dst=/root/.pi \
            --mount type=bind,src="$docker_volumes/$AGENT_ID/projects",dst=/projects \
            "$docker_image"
    done
fi
