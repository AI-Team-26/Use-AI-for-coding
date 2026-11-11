docker_volumes="${PI_AGENT_VOLUMES:-/p/PiAgent_Container}"

# Agent names, format "<icon> <alias>" → become the container icon/alias labels
declare -A agents
agents["Dev-1"]="🍋 Pi Lemon"
agents["Dev-2"]="🥝 Pi Kiwi"
agents["Dev-3"]="🍊 Pi Orange"
agents["Reviewer"]="🌹 Pi Rose"
agents["QA"]="🍒 Pi QA"

declare -A agent_colors
agent_colors["Dev-1"]="#fbca04"
agent_colors["Dev-2"]="#0e8a16"
agent_colors["Dev-3"]="#0e8a16"
agent_colors["Reviewer"]="#b60205"
agent_colors["QA"]="#8f1261"
#Lemon #eafb04, Orange: #d93f0b, Kiwi: #0e8a16

# NOTE: the old Manager was not a regular agent: it mounted the HOST /projects folder
# ("accessible also from host") and had no /share mount. Uncommenting the line below
# creates a normal agent instead ($docker_volumes/Manager/projects + /share).
#agents["Manager"]="🍓 Pi Manager"

# Optional default model per agent (AI_AGENT_DEFAULT_MODEL env var of the container)
declare -A agent_default_models
agent_default_models["Dev-1"]="KAT-Coder-V2.5-Dev-Cerebellum (deucebucket) [160k]"
agent_default_models["Dev-2"]="mindai/macaron-v1-venti"
agent_default_models["Dev-3"]="inclusionai/ling-3.0-flash"
agent_default_models["Reviewer"]="inclusionai/ling-3.0-flash"


