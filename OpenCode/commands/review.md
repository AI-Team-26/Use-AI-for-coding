---
description: Review PR N — read diff, check existing threads, post inline findings
subagent: true
---

If no number was provided, reply with the usage `/review <N> [note]` and do nothing else.

Otherwise, review **PR $1** of this repository.

- Number: `$1` (must match `^[1-9][0-9]*$`; otherwise print the usage and stop)
- Optional user note: `$2` (extra focus area for the review)

## Steps

### 1. Fetch PR info

Resolve the repo identifier (re-run in every shell block that needs it — variables do not persist across tool calls):

```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)   # e.g. AI-Team-26/Use-AI-for-coding
```

Then fetch the PR:

```bash
gh pr view "$1" --json title,body,state,headRefName,headRefOid,url,additions,deletions,changedFiles
```

Check the exit code first: if `gh pr view` fails (non-zero exit), the PR does not exist — report that and stop. If it succeeds but `state` ≠ `OPEN`, report the state and stop. Do not proceed either way.

Also fetch the diff and changed files:

```bash
gh pr diff "$1"
gh pr view "$1" --json files --jq '.files[] | "\(.path)"'
```

Note the `headRefOid` value from step 1; you will need it as `commit_id` when posting comments.

### 2. Collect existing review threads

Use the GraphQL API to find all review threads and their resolution status:

```bash
gh api graphql \
  -f query='query($owner: String!, $repo: String!, $num: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $num) {
        reviewThreads(first: 50) {
          totalCount
          pageInfo { hasNextPage endCursor }
          nodes {
            isResolved
            comments(first: 50) {
              totalCount
              nodes { id body author { login } path line createdAt }
            }
          }
        }
      }
    }
  }' \
  -f owner="$(gh repo view --json nameWithOwner -q .nameWithOwner | cut -d/ -f1)" \
  -f repo="$(gh repo view --json nameWithOwner -q .nameWithOwner | cut -d/ -f2)" \
  -F num="$1"
```

> Note: `-f` sends a string, `-F` sends a typed value. The `Int!` variable requires `-F`.

If `hasNextPage` is true, paginate with `after: "<endCursor>"` before proceeding. Note which findings already exist (resolved or unresolved) so you don't duplicate them.

### 3. Review the diff

Review the code changes yourself. Follow `OpenCode/AGENTS.md` project conventions. Focus on:

- Correctness bugs, logic errors, off-by-one issues
- Security concerns (injection, auth bypass, data leaks)
- Missing error handling or edge cases
- Code style violations against AGENTS.md rules
- Repo-specific checks:
  - Does the PR body task list / "Files changed" table match the actual diff?
  - Was the Backlog entry removed from TODO.md and a Done line added?
  - For docs/prompt PRs: stale command names, broken links, contradictions between files
- If a user note ($2) was provided, give extra attention to that area

#### Posting findings as inline comments

For each finding that maps to a specific file + line **on the new side of the diff** (`side=RIGHT`; count `+` lines inside the hunk), post an inline comment using JSON on stdin:

```bash
cat <<'JSON' | gh api repos/"$(gh repo view --json nameWithOwner -q .nameWithOwner)"/pulls/"$1"/comments --input -
{"body": "<single-line description, escape \" and \\ — sign with your agent name>", "commit_id": "<headRefOid from step 1>", "path": "<file_path>", "line": <new_file_line>, "side": "RIGHT"}
JSON
```

> ⚠️ The delimiter MUST be quoted (`<<'JSON'`) to prevent shell expansion of `$`, backticks, and quotes in the body. An unquoted heredoc behaves identically to `-f "body=..."`. The body must be a single line; escape any embedded `"` as `\"` and `\` as `\\`.

Sign every comment with your own agent name at the end (e.g., `— 🍋 Pi Lemon`).

> Same-account note: if the token's account is also the PR author, formal APPROVE / REQUEST_CHANGES returns 422. Use COMMENT reviews or inline threads instead.

#### Fallback for unanchored findings

GitHub only accepts inline comments on lines present in the diff. Findings like "TODO.md entry not removed", "no test added", or "PR body table mismatch" have no anchor line. Collect those separately; after all anchored comments are posted, send one summary via:

```bash
gh pr comment "$1" --body "$(printf '%s' '<summary of unanchored findings, signed>' | cat)"
```

If an inline post returns HTTP 422 ("not part of the diff"), do NOT retry the same line — move it to the unanchored summary instead.

### 4. Final report

After posting all findings (or confirming none), reply with a short report in this format:

```
Decision: ✅ Approved / ☑️ Approved (can be improved) / ⛔ Rejected

Findings:
1. <🟥|🟧|🟨|🟦> file:line — brief description
2. …

Unanchored notes: (if any were collected)
Existing unresolved threads: N (informational)
```

Severity icons: 🟥 heavy · 🟧 blocking · 🟨 trivial · 🟦 info

The very last line of your response MUST be exactly:

`[REVIEW $1 DONE]`

This marker is intended for future programmatic parsing by the todo-task extension; keep it on its own line with nothing after it.

## Scope

Post findings and a verdict; the user merges.
