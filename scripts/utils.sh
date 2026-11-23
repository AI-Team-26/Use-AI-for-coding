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
# read_input PROMPT [hidden]
# Reads one line of free text into the global INPUT, which is empty when cancelled.
# Pass "hidden" to keep the answer off the screen, for tokens and passwords.
# Returns: 0 = line read (may be empty), 1 = input closed (EOF), INPUT_ESC = cancelled.
#
# The answer is read with readline (read -e), so the terminal does the editing:
# cursor movement, backspace and paste work as usual. ESC is bound to accept an
# empty answer, so a lone ESC cancels. A hidden answer is a plain no-echo read,
# where ESC cannot be caught: cancel that one with Ctrl-C.
#
# The cancel reason comes from a trap, not from read's status: Ctrl-C would kill
# the script, and read returns 1 both for a cancel and for EOF.
INPUT_ESC=2
read_input() {
    local prompt=$1 hidden=${2:-} answer="" line="" inner_rc=0 rc=0 cancelled=0 stripped
    INPUT=""

    trap 'cancelled=1' INT
    if [[ -n "$hidden" ]]; then
        answer=$(IFS= read -rs -p "$prompt" line || inner_rc=$?; printf '%s' "$line"; exit $inner_rc) || rc=$?
    else
        answer=$(
            # The ESC binding lives in this subshell, so the caller's readline is untouched.
            if bind 'set keyseq-timeout 150' 2>/dev/null && bind '"\e": "\C-a\C-k\C-v\C-]\C-m"' 2>/dev/null; then
                IFS= read -e -r -p "$prompt" line || inner_rc=$?
            else
                IFS= read -r -p "$prompt" line || inner_rc=$?   # no readline: plain read, Ctrl-C still cancels
            fi
            printf '%s' "$line"
            exit $inner_rc
        ) || rc=$?
    fi
    trap - INT

    # Hidden, cancelled and EOF reads echo no Enter, so close the line here.
    if [[ -n "$hidden" ]] || (( cancelled )) || (( rc != 0 )); then printf '\n'; fi
    if (( cancelled )) || [[ $answer == $'\x1d' ]]; then return $INPUT_ESC; fi
    if (( rc != 0 )); then return 1; fi
    stripped=${answer//$'\e'/}
    if [[ -n "$answer" && -z "$stripped" ]]; then return $INPUT_ESC; fi   # fallback read: line was only ESC

    INPUT=$answer
}
