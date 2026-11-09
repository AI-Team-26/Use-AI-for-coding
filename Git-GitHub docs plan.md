# GIT & GitHub setup — documentation plan (Feature 12)

Feature 12 is *"Complete the documentation for GIT and GitHub setup"*.
This file records the audit and the breakdown so the analysis is not lost between sessions.
No code changes here: it is the working plan for the 12.x sub-tasks.

## Why the task exists

The setup only works today by reading the scripts. The two documents that should explain it contradict each other and the implementation:

| Document | Problem |
|---|---|
| `GIT.md` | Unfinished `[TODO]` block ("We need to… / Initially I thought that…"); an empty bullet under *GIT credentials using GH*; three sections still teach `.git-credentials` + `credential.useHttpPath`, which `GitHub access for Agent.md` explicitly declares **wrong**; many typos; *PR Review account / GitHub App* is an open question, not a decision |
| `GitHub access for Agent.md` | Opens with "DO NOT USE CLASSIC PAT" then §A documents Classic PAT as a working path; unresolved `[TODO: try this simple form: helper = !gh auth git-credential]`; `## Troubleshooting` heading is **empty**; no mention of the `REPO_ACCESS_*` exit codes nor of the "🔑 Manage GitHub credentials" menu |
| Both | Nothing documents the actual flow implemented in `Pi Agent/containers_setup.sh`, `scripts/git_common.sh` and `scripts/start_common.sh` |

## The flow to document (source of truth = the code)

1. `Pi Agent/containers_setup.sh` generates `/scripts/.env` and `/scripts/github_pat` — lines `owner:PAT` built from `GITHUB_AGENT_ACCOUNT` / `GITHUB_ORG` / `GITHUB_MAIN_ACCOUNT` plus their `*_PAT` values; `chmod 600`.
2. `scripts/start_common.sh` `select_project` / `clone_repo` resolve the repo owner from the `origin` URL.
3. `scripts/git_common.sh` `set_github_auth_for_repo` greps that owner in `github_pat` and exports `GITHUB_TOKEN`; `set_default_github_token` is the agent-account fallback.
4. `gh` authenticates from `GITHUB_TOKEN`; `git` authenticates through `gh` via
   `[credential "https://github.com"] helper = !/usr/bin/gh auth git-credential`.
5. `setup_git_global` sets `user.name` / `user.email` (the account "credited" for commits, see Feature 56).
6. `check_repo_access` + `check_and_accept_invite` handle the collaborator/invite path and return the `REPO_ACCESS_*` codes; `add_github_pat` / `manage_git_credentials` are the interactive "🔑 Manage GitHub credentials" menu.

Topics with **no documentation at all** today: fine-grained PAT permission checklist and the silent org "Pending requests" approval step, enabling fine-grained tokens at org level, `scripts/create-ruleset.sh`, the `workflow` scope refusal, the GH007 private-email trap, the Windows Credential Manager 403.

## Sub-tasks

- **12.1 — "Git & GitHub auth: current implementation"** ✅ (rewritten `GIT.md` / merged the overlap): env-var table → `github_pat` format → per-owner PAT resolution → `GITHUB_TOKEN` → gh credential helper → git identity. Obsolete `.git-credentials` sections deleted, `[TODO]`s closed. The not-owned-repository path is documented against the current code and should be revisited after Feature 22.
- **12.2 — "Creating the PATs"**: step-by-step fine-grained PAT with the exact permissions (including Workflows *Read* vs *Read & Write* and the secret-exfiltration warning), org-level "Allow access via fine-grained personal access tokens", the pending-request approval gotcha; record the GitHub App / second-reviewer decision from `GIT.md`.
- **12.3 — "Troubleshooting"**: fill the empty `## Troubleshooting` section, see the table below.
- **12.4 — Rulesets & branch protection**: document `scripts/create-ruleset.sh` (it reads `~/scripts/github_pat`) and the `.github/workflows` push limits; cross-link from `Pi Agent/README Pi Agent.md`.

### 12.3 — troubleshooting entries to write

| Symptom | Cause | Fix |
|---|---|---|
| `❌ The PAT for '<owner>' ends with 'github.com'` | `github_pat` line written as `owner:pat@github.com`, or missing the `owner:` prefix | correct the line (`scripts/git_common.sh`, `set_github_auth_for_repo` validation) |
| `git push` asks for username + PAT although a PAT exists | `GITHUB_TOKEN` not exported, or the `gh` credential helper missing in `.gitconfig` | select the project again (or `set_github_auth_for_repo`); add the `credential.https://github.com.helper` entry |
| 403 pushing with the **main** account while it is org admin | Windows Credential Manager keeps a stale OAuth token | remove the `https://github.com` record, retry and re-login |
| `GH007: Your push would publish a private email address` | email privacy enabled + wrong `user.email` | use `1234567+user@users.noreply.github.com`; reset it with `setup_git_global` |
| `refusing to allow a Personal Access Token ... without workflow scope` | a file under `.github/workflows` is pushed and the PAT has Workflows: Read | keep Read (no Write, secrets exfiltration risk) → put the file in `.github/` and ask the user to move it in the UI |
| Org PAT silently does nothing for a new repository | the fine-grained PAT "Pending request" was never approved | Org Settings → Personal access tokens → Pending requests (it is **not** notified or emailed) |
| `gh` works but `git` does not (or the reverse) | the two authenticate separately; collaborator path needs `repo:invite` (Classic PAT only) | accept the invitation first; see §A of `GitHub access for Agent.md` |
| Menu aborts on repo access | `check_repo_access` exit codes are not explained | document `REPO_ACCESS_*` (introduced by `fix/60_errexit_check_repo_access`) |
| `❌ PR not found on branch '…'` | no open PR on the branch, or the token lacks Pull requests read / wrong owner | `gh pr list --head <branch>`; related: Bug 64 |
| `Could not restore model …` / TUI broken by git errors | not GitHub-related | keep the cross-reference only — Bug 3 and Bug 61 |

## Dependencies

12.1 and 12.3 quote variable names and messages that are about to change:

- **Feature 56** renames `GITHUB_MAIN_ACCOUNT_EMAIL` → `GITHUB_COMMIT_EMAIL` (landed; `.env.example` files were still stale and are fixed together with 12.1).
- **Feature 22** changes the not-owned-repository path (`clone_repo` ignoring the `set_github_auth_for_repo` failure, the terse abort message, the implicit fallback to the agent account).

Land 56 and 22 before 12.1; 12.2, 12.3 and 12.4 are independent enough to start any time.
