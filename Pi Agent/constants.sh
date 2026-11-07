docker_volumes="/p/PiAgent_Container"

# Agent names, format "<icon> <alias>" → become the container icon/alias labels
declare -A agents
agents["Dev-1"]="🍋 Pi Lemon"
agents["Dev-2"]="🥝 Pi Kiwi"
agents["Dev-3"]="🍊 Pi Orange"
agents["Reviewer"]="🌹 Pi Rose"
agents["QA"]="🍒 Pi QA"
#agents["Manager"]="🍓 Pi Manager"

# Optional default model per agent (AI_AGENT_DEFAULT_MODEL env var of the container)
declare -A agent_default_models
agent_default_models["Dev-1"]="KAT-Coder-V2.5-Dev-Cerebellum (deucebucket) [160k]"
agent_default_models["Dev-2"]="mindai/macaron-v1-venti"
agent_default_models["Dev-3"]="inclusionai/ling-3.0-flash"
agent_default_models["Reviewer"]="inclusionai/ling-3.0-flash"
