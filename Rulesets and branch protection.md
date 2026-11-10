# Rulesets and branch protection

Two mechanisms keep the agent from breaking the default branch of a repository:

1. The **"main branch" ruleset**, applied with `scripts/create-ruleset.sh`.
2. The **`.github/workflows` push limit**, imposed by the fine-grained PAT permission
   [Workflows: Read](GitHub%20access%20for%20Agent.md#permission-checklist).

## The "main branch" ruleset (`scripts/create-ruleset.sh`)

The script creates a ruleset named **main branch** on the default branch
(`conditions.ref_name.include = ["~DEFAULT_BRANCH"]`) of each given repository:

| Rule | Effect |
|---|---|
| `deletion` | the default branch cannot be deleted |
| `non_fast_forward` | force-push is rejected |
| `pull_request` | 1 approving review is required; stale reviews are dismissed on push; merging is allowed only via **merge** or **rebase** (no squash) |
| `copilot_code_review` | Copilot reviews on push (draft PRs are not reviewed) |

`required_review_thread_resolution` is currently `false`; setting it to `true`
requires applying the ruleset again with an Administration token.

### Usage

The script is run on the host (it is not copied into the containers). Repos come from
arguments or stdin (one `owner/repo` per line, `#` comments and blank lines skipped):

```bash
bash scripts/create-ruleset.sh owner/repo [owner/repo ...]
echo "owner/repo" | bash scripts/create-ruleset.sh
cat repos.txt | bash scripts/create-ruleset.sh
```

### Token

The script reads the `GITHUB_TOKEN` environment variable (it does **not** read
`/scripts/github_pat` itself — the header comment pointing to that file only means the
token should come from the same source).

Creating a ruleset requires the **Administration: Read & Write** repository permission,
which the agent PAT does **not** have (see the
[permission checklist](GitHub%20access%20for%20Agent.md#permission-checklist)). Run it
with the Main account PAT instead:

```bash
export GITHUB_TOKEN=<main-account PAT>
bash scripts/create-ruleset.sh <org>/<repo>
```

### Behaviour notes

- **Idempotent**: if a ruleset named `main branch` already exists on the repository, the
  script prints `⛔ <repo> — ruleset already exists, skipping` and moves on.
- **307 redirect**: GitHub redirects `POST /repos/{owner}/{repo}/rulesets` to
  `/repositories/{id}/rulesets`. `gh api` does not follow redirects for POST, so the
  script calls the REST API with `curl -L` directly.
- On failure it prints the API `errors[].message` lines, so a missing permission or a
  rejected payload is visible.

Verify after applying:

```bash
gh api repos/<owner>/<repo>/rulesets | jq '.[].name'
```

## The `.github/workflows` push limit

A fine-grained PAT with **Workflows: Read** (the value used in this setup) cannot push
files under `.github/workflows`. The push fails with:

```text
refusing to allow a Personal Access Token to modify workflows or its metadata without 'workflow' scope
```

This is deliberate: **Workflows: Read & Write** would let a workflow read the repository
secrets, so a compromised or prompt-injected agent could exfiltrate them. The setup
therefore keeps Workflows: *Read* — see the
[Workflows notes in the permission checklist](GitHub%20access%20for%20Agent.md#permission-checklist).

Workaround when a workflow file must change:

1. Commit the file under `.github/` (not `workflows/`) and push it.
2. The user moves it into `.github/workflows/` from the GitHub web UI (or applies the
   AI-suggested workflow changes there manually).
