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

INPUT_ESC=2
# Reads one line of free text into the global INPUT; use ESC to cancel.
# Pass "hidden" as the second argument to keep the typed text off the screen
# (for PATs); a newline is printed when the answer is complete.
# Return codes: 0 = answer read (may be empty), 1 = input closed (terminal
# gone or Ctrl-D as the first key), INPUT_ESC = ESC pressed.
# Arrow/function keys also start with ESC, so their sequence is drained and
# ignored instead of cancelling. The drain reads up to 5 chars within 50 ms,
# so text pasted right after an arrow key can lose its first chars (same
# trade-off as the menu reader). A paste is not echoed after the first char:
# the tail arrives while the terminal echo is off; the answer is still complete.
read_input() {
    local prompt=$1 hidden=${2:-} first rest seq rc
    INPUT=""

    printf '%s' "$prompt"
    while true; do
        # -s: the terminal does not echo, so an empty Enter prints one newline,
        # not two, and the manual echo below is the only copy of the first char.
        IFS= read -rsn1 first || { [[ -n "$hidden" ]] && printf '\n'; return 1; }
        if [[ "$first" == $'\e' ]]; then
            seq=""
            IFS= read -rsn5 -t 0.05 seq 2>/dev/null || :
            if [[ -z "$seq" ]]; then
                printf '\n'
                return $INPUT_ESC
            fi
            continue
        fi
        break
    done
    # In -n1 mode Ctrl-D arrives as data, not as end of input.
    if [[ "$first" == $'\x04' ]]; then
        printf '\n'
        return 1
    fi
    if [[ -z "$first" ]]; then
        printf '\n'
        return 0
    fi
    if [[ -n "$hidden" ]]; then
        rc=0
        IFS= read -rs rest || rc=$?
        printf '\n'
        [[ $rc -ne 0 ]] && return 1
    else
        printf '%s' "$first"
        IFS= read -r rest || return 1
    fi
    INPUT="$first$rest"
}
