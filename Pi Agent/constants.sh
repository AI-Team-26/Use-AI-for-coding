docker_volumes="${AI_AGENTS_FOLDER:-/ai_agents}/PiAgent_Containers"

# Agent names, format "<icon> <alias>" → become the container icon/alias labels
declare -A agents
agents["Dev-1"]="🍋 Pi Lemon"
agents["Dev-2"]="🥝 Pi Kiwi"
agents["Dev-3"]="🍊 Pi Orange"
agents["Dev-4"]="🍒 Pi Cherry"
agents["Dev-5"]="🥥 Pi Coco"
# 🍓🍒🍇🍌🍉🍅🍍🍎🍐🍏🥥🍑
# 🌹
#🥕🍆


declare -A agent_colors
agent_colors["Dev-1"]="#fbca04"
agent_colors["Dev-2"]="#0e8a16"
agent_colors["Dev-3"]="#0e8a16"
agent_colors["Dev-4"]="#b60205"
agent_colors["Dev-5"]="#c5def5"


# Optional default model per agent (AI_AGENT_DEFAULT_MODEL env var of the container)
declare -A agent_default_models
agent_default_models["Dev-1"]="local 64K"
agent_default_models["Dev-2"]="deepseek-v4.1-flash-1017"
agent_default_models["Dev-3"]="deepseek-v4.1-flash:free"
agent_default_models["Dev-4"]="nvidia/nemotron-3-ultra-550b-a55b:free"
agent_default_models["Dev-5"]="local 64K"


