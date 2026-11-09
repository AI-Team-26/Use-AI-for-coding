# GIT & GitHub authentication

The agent needs Git and the GitHub CLI to:

- read private repositories,
- create and comment on pull requests,
- check workflow runs.

To avoid giving it access to a personal GitHub account, the agent uses a **shadow GitHub account** plus
**fine-grained personal access tokens (PATs)**. Fine-grained permissions keep the agent's access bounded to
specific repositories and permissions.

For the PAT permission checklist and the supported account/repository setups (agent account, organization,
collaborator), see [`GitHub access for Agent.md`](GitHub%20access%20for%20Agent.md). This document describes
the authentication flow implemented by the setup and startup scripts.

## Authentication flow at a glance

```text
Pi Agent/.env
      │  copied by Pi Agent/containers_setup.sh (setup step)
      ├── /scripts/.env           GITHUB_AGENT_ACCOUNT, GITHUB_COMMIT_EMAIL, EXA_API_KEY
      └── /scripts/github_pat     one "owner:PAT" line per owner, chmod 600

/scripts/start.sh
      │  setup_git_global   → git config --global user.name / user.email
      └  select_project     → read the repo origin URL
              └── set_github_auth_for_repo
                      └── owner = first segment of "owner/repo"
                      └── grep "^owner:" /scripts/github_pat
                      └── export GITHUB_TOKEN=<PAT>

gh                  authenticates from GITHUB_TOKEN
git                 authenticates through gh:
                    git config --global credential.https://github.com.helper "!gh auth git-credential"
```

The key idea: **GitHub CLI owns authentication**. `gh` reads `GITHUB_TOKEN`, and `git` delegates to `gh`
through its credential helper. The old `.git-credentials` store is not used (see
[Why not `.git-credentials`?](#why-not-git-credentials)).

## Environment variables

`Pi Agent/.env` is the local (host-side) source of truth. `containers_setup.sh` reads it and generates the
files mounted into the container at `/scripts`. `OpenCode/.env` uses the same variables.

| Variable | Required | Purpose |
|---|---|---|
| `GITHUB_AGENT_ACCOUNT` | yes | Shadow GitHub account; also a key (owner) in `github_pat` and the fallback token for invite acceptance |
| `GITHUB_ORG` | yes | GitHub organization; also a key (owner) in `github_pat` |
| `GITHUB_COMMIT_EMAIL` | yes | GitHub email set as git `user.email` — the account credited for commits |
| `GITHUB_AGENT_ACCOUNT_PAT` | yes | Fine-grained PAT for `GITHUB_AGENT_ACCOUNT` |
| `GITHUB_ORG_PAT` | yes | Fine-grained PAT for `GITHUB_ORG` |
| `GITHUB_MAIN_ACCOUNT` | no | Personal GitHub account, if its repositories must be reachable |
| `GITHUB_MAIN_ACCOUNT_PAT` | no | Fine-grained PAT for `GITHUB_MAIN_ACCOUNT` |
| `GITHUB_REVIEWER` | yes | GitHub account set as PR reviewer (used by the agent instructions, not by auth) |
| `EXA_API_KEY` | yes | EXA web-search API key (not GitHub-related, but generated into `/scripts/.env`) |

`.env.example` is the tracked template for `.env`. The generated `/scripts/.env` holds only the values that
must be visible at container startup:

```text
GITHUB_AGENT_ACCOUNT=<account>
GITHUB_COMMIT_EMAIL=<commit email>
EXA_API_KEY=<key>
```

Set `GITHUB_COMMIT_EMAIL` to the account's private `…@users.noreply.github.com` address to avoid the
[GH007 private-email error](#private-hidden-github-email).

## The PAT file (`/scripts/github_pat`)

`containers_setup.sh` builds this file from the `*_PAT` environment variables, one line per repository owner:

```text
<GITHUB_AGENT_ACCOUNT>:<GITHUB_AGENT_ACCOUNT_PAT>
<GITHUB_ORG>:<GITHUB_ORG_PAT>
<GITHUB_MAIN_ACCOUNT>:<GITHUB_MAIN_ACCOUNT_PAT>   # only when GITHUB_MAIN_ACCOUNT is set
```

Rules:

- Each record is exactly `owner:PAT`. The PAT itself must contain no trailing `@github.com`.
- `owner` must match the repository's GitHub account/org name exactly (`grep "^owner:"`), including case.
- The file is `chmod 600` and is bind-mounted read/write at `/scripts/github_pat` in every agent container.

## Per-owner PAT → `GITHUB_TOKEN`

When a project is selected, `select_project` (`scripts/start_common.sh`) reads the repository's `origin` URL.
If the project has a remote, it calls `set_github_auth_for_repo` (`scripts/git_common.sh`):

1. Take the HTTPS URL (`https://github.com/<owner>/<repo>.git`).
2. Extract `<owner>/<repo>` and take the first segment as `owner`.
3. Look up `grep "^<owner>:" /scripts/github_pat`.
4. If not found: **abort** with *"Failed to get PAT from file '/scripts/github_pat' for owner '<owner>'"*.
5. If the resolved PAT ends with `github.com`: **abort** — the line was probably written as
   `owner:pat@github.com`.
6. Otherwise: `export GITHUB_TOKEN=<PAT>`.

That single environment variable selects the correct PAT for the repository, so no per-repository credential
file is needed. A project with no `origin` remote gets no token; a later `gh`/`git` operation would stay
unauthenticated.

## GitHub CLI authentication

`gh` authenticates from the `GITHUB_TOKEN` environment variable — there is no `gh auth login` step.

```bash
gh auth status 2>/dev/null || echo "gh not authenticated"
```

Because the correct token is exported only after a project is selected, `gh` works against the current
repository's owner. Network/API failures from GitHub CLI are reported by the caller (for example the
clone menu).

## Git authentication (credential helper)

`git` does not read `GITHUB_TOKEN` directly. Instead the Docker image configures Git to delegate every
GitHub credential request to the GitHub CLI:

```bash
git config --global credential.https://github.com.helper "!gh auth git-credential"
```

This is the single bridge that makes `git clone` / `git push` / `git fetch` use the same per-owner PAT as
`gh`. It is baked into the image (`Pi Agent/Dockerfile`) so it survives container recreation.

### Why not `.git-credentials`?

The `.git-credentials` + `credential.useHttpPath` approach was removed because it does not work
for this multi-owner setup:

- `credential.useHttpPath true` only distinguishes records written with the **full repository path**
  (`github.com/<owner>/<repo>.git`), not a generic `github.com/<owner>` or org path.
- Adding one record per repository is unmanageable and error-prone.

Do not re-enable `credential.useHttpPath` or maintain `~/.git-credentials`; use the `github_pat` file and the
`gh` credential helper instead.

## Git identity

`setup_git_global` (`scripts/git_common.sh`) runs on first startup and sets the global commit identity:

```bash
git config --global user.name  "<agent name>"      # e.g. the AI_AGENT_NAME of the container
git config --global user.email "<GITHUB_COMMIT_EMAIL>"
```

- `user.name` identifies the author in the commit message header.
- `user.email` is the GitHub account that gets credited for the commit. It must match an email on that
  account, usually its private no-reply address.

Check the current values with:

```bash
git config --global user.name
git config --global user.email
```

## Repository access on clone (owner / collaborator / invite)

`clone_repo` (`scripts/start_common.sh`) does more than `set_github_auth_for_repo`:

1. It resolves the token for the repository owner, exporting `GITHUB_TOKEN`.
2. `check_repo_access` calls the GitHub API as the token's account and classifies the result through the
   `REPO_ACCESS_*` exit codes:
   - `REPO_ACCESS_OK` — the token's account is the repo owner, an org admin, or a collaborator with push.
   - `REPO_ACCESS_READ_ONLY` — no write access; the script then checks whether the repository is public.
   - `REPO_ACCESS_ERROR` — the repository info could not be fetched or access is denied.
3. `check_and_accept_invite` covers the collaborator invite path for an agent account: it temporarily falls
   back to the agent-account token (`set_default_github_token`), lists `/user/repository_invitations` and
   accepts the matching pending invitation.

> Note: this not-owned-repository path is still being improved (see `Feature 22` in `TODO.md`). The current
> fallback switches `GITHUB_TOKEN` to the agent account silently, and a missing owner PAT aborts with the
> terse lookup error above. Until that is reworked, add the owner's PAT with
> "🔑 Manage GitHub credentials" and retry.

## Manage credentials

Use the startup menu action **🔑 Manage GitHub credentials** (implemented by `manage_git_credentials` in
`scripts/git_common.sh`). It writes the same `/scripts/github_pat` file and lists entries with obfuscated
PATs.

Manual checks:

```bash
cat /scripts/github_pat        # owner:PAT lines (PATs are visible)
grep -n "^<owner>:" /scripts/github_pat
```

Each line must remain in the `owner:PAT` form. A malformed line breaks the lookup for that owner.

## Recovering credentials on a new container

The credentials live in files, not in an interactive `gh auth login` state:

```bash
git config --global user.name
git config --global user.email
cat /scripts/github_pat
```

That is enough to reproduce the container's Git/GitHub authentication.

## Private (hidden) GitHub email

Each GitHub account has a no-reply address in the form
`1234567+<username>@users.noreply.github.com` where `1234567` is the account ID.

Find it in **Settings → Emails**, under "Keep my email addresses private". With that option enabled, GitHub
uses the no-reply address everywhere and — importantly — rejects pushes that would publish the real email
with the `GH007` error. Set `GITHUB_COMMIT_EMAIL` to this no-reply address.

## PR review account

An account cannot review its own pull request, so when the same GitHub account creates a PR it must also be
reviewed by a different identity. The two feasible options are:

- **A second GitHub account**, or
- **A GitHub App**.

The setup is evaluating a GitHub App created at the organization level
(**Organization → Settings → Developer settings → GitHub App**), with webhooks disabled and these
repository permissions:

- Metadata (default)
- Contents: Read only
- Pull requests: Read & Write

It is installed only for the organization. The final decision (GitHub App vs. second account) is part of the
PAT/access documentation; see `GitHub access for Agent.md`.