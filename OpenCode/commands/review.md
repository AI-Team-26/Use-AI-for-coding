---
description: Review PR N — read diff, check existing threads, post inline findings
subagent: true
---

If no number was provided, reply with the usage `/review <N> [note]` and do nothing else.

Otherwise, review **PR $1** of this repository.

- Number: `$1`
- Optional user note: `$2` (extra focus area for the review)

## Steps

### 1. Fetch PR info

Run:
```bash
gh pr view $1 --json title,body,state,headRefName,url,additions,deletions,changedFiles
```

If the PR does not exist or is not open (`state` ≠ `OPEN`), stop and report it. Do not proceed.

Also fetch the diff:
```bash
gh pr diff $1
```

And list changed files:
```bash
gh pr view $1 --json files --jq '.files[] | "\(.path)"'
```

### 2. Collect existing review threads

Use the GraphQL API to find all review threads and their resolution status:

```bash
gh api graphql -f query='
query {
  repository(owner: "<owner>", name: "<repo>") {
    pullRequest(number: '$1') {
      reviewThreads(first: 50) {
        nodes {
          isResolved
          comments(first: 50) {
            nodes {
              id
              body
              author { login }
              path
              line
              createdAt
            }
          }
        }
      }
    }
  }
}'
```

Replace `<owner>` and `<repo>` with the actual values from `git remote get-url origin`.

Note which findings already exist (resolved or unresolved) so you don't duplicate them.

### 3. Review the diff

Review the code changes yourself. Focus on:
- Correctness bugs, logic errors, off-by-one issues
- Security concerns (injection, auth bypass, data leaks)
- Missing error handling or edge cases
- Code style violations that break project conventions
- If a user note ($2) was provided, give extra attention to that area

For each new finding, post an **inline comment** on the specific file and line using:
```bash
gh api repos/<owner>/<repo>/pulls/$1/comments \
  -X POST \
  -f "body=<description>" \
  -f "path=<file_path>" \
  -F "line=<line_number>" \
  -f "side=RIGHT"
```

Sign every comment you post with your own agent name at the end (e.g., `— 🍋 Pi Lemon`).

**IMPORTANT:** All agents share one GitHub account, so formal APPROVE / REQUEST_CHANGES reviews return HTTP 422. Never attempt `gh pr review`. Inline thread comments are the only viable protocol.

### 4. Final report

After posting all findings (or confirming none), reply with a short report:

- **Verdict**: ✅ LGTM / ⚠️ Minor issues found / ❌ Blocking issues found
- **Findings summary**: bullet list of what you posted (file:line — brief description), or "No new findings."
- **Existing threads**: count of unresolved pre-existing threads (informational).

The very last line of your response MUST be exactly:

`[REVIEW $1 DONE]`

This marker is parsed programmatically; do not add anything after it.

## Constraints

- Report only: do NOT merge, close, approve, request changes, or re-request review. The human merge gate stays with the user.
- Do NOT modify any files in the repository.
- Do NOT create branches or commits.
- Keep inline comments concise and actionable (what's wrong + suggested fix).
