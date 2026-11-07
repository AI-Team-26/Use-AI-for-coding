# ============================================================
# utils.sh — Some utilities
# ============================================================

# Verifiies the given variables are defined.
# Used to check the environment variables required by the script are set.
# Usage:   
#   required_vars AAA_API_KEY AAA_SERVICE_ID   # service AAA
#   required_vars BBB_API_KEY ZZZ_API_KEY"     # other services
required_vars() {
    for var in "$@" ; do
        if [[ -z "${!var:-}" ]]; then
            echo -e "❌ ${RED}'$var' is not found.${NC} (Forgot to set it in the .env file?)"
            exit 1
        fi
    done
}

# Verifiies the given variables are defined.
# Used to check the environment variables required by the script are set.
# Usage:   
#   env_vars=("AAA_API_KEY" "AAA_SERVICE_ID")   # service AAA
#   env_vars+=("BBB_API_KEY" "ZZZ_API_KEY")  # other services
#   required_vars $env_vars
required_vars_array() {
    local -n vars="$1"
    required_vars "${vars[@]}"
}

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; BLUE=$'\033[0;34m'; PURPLE=$'\033[0;35m'; BOLD_PURPLE=$'\033[1;35m'; NC=$'\033[0m'