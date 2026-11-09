# GitHub access for Agent

The goal is to use GIT and GitHub CLI to create branches, create PR, review PR, and check GitHub Action runs for repositories owned by a personal account or its GitHub organizations, from a machine where an AI Agent is operating.  
The agent operates a **shadow GitHub account** (Agent account) for code contributions, while PRs are reviewed by a **different account** (an account cannot review its own pull request, see [PR review account](#pr-review-account)).  
In this document we refer to them as **Main [GH] Account** and **Agent [GH] Account**.  
The described solutions work for Free GitHub accounts subscriptions (paid subscriptions have more choices).  
The authentication flow implemented by the setup scripts is documented in [GIT.md](GIT.md); this document covers how the PATs are created and which account/repository combinations are supported.


## Classic vs fine-grained PAT

**DO NOT USE CLASSIC PAT**
---
The fundamental difference isn't the checkboxes, it's the targeting model. Fine-grained PATs use an allow-list: you pick specific repos at creation time, and the token is permanently bounded to exactly those. Classic PATs use a capability class: `repo` isn't "these three repos," it's "full control of every private repo this account can currently reach — and every one it gains access to later, automatically, with no new consent step." That's the real danger, and it's structural — it doesn't go away no matter how carefully you configure the rest of the screen. If the shadow account ever gets added to a new org, a new repo, anything — this same already-issued token silently expands to cover it. A fine-grained token wouldn't; you'd have to consciously go edit it.
Your `repo` checkbox is also a bundle you can't partially disable — and one piece of that bundle is worth flagging specifically. Notice `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, and `security_events` are all greyed out and auto-checked underneath `repo` — that's not optional, it's baked in the moment you check the parent box. `security_events` in particular means this token can read and write Dependabot, code-scanning, and secret-scanning alerts on every private repo it touches — including dismissing an alert. That's a meaningfully sensitive permission to have inherited invisibly, and there's no way to keep code read/write while stripping just that one out of a classic token. A fine-grained PAT would let you grant Contents + Pull requests and explicitly leave "Code scanning alerts" and "Secret scanning alerts" at No access.


## Creating the PATs

Every account the agent uses needs its own fine-grained PAT. The PATs are created in the GitHub UI, stored in
`Pi Agent/.env` (one `*_PAT` variable per account) and copied into `/scripts/github_pat` as `owner:PAT`
lines — see [GIT.md](GIT.md) for the flow.

### Prerequisite for organization repositories

A fine-grained PAT targets either a user account **or** one organization; the two do not overlap.  
For an organization PAT:

1. The Agent account must be a **Member** of the organization (invited by the Main account).
2. The organization must allow fine-grained tokens:  
   `Org Settings → Personal access tokens → Settings → Allow access via fine-grained personal access tokens → Save`

### Step-by-step

1. Log in with the account that will own the PAT (the Agent account).
2. `Profile → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token`
3. Set a token name (e.g. `agent-<org>`) and the expiration (max 1 year; renew before it lapses).
4. **Resource owner**: the account or the organization. For an organization, the prerequisites above must be in place.
5. **Repository access**: *All repositories* or *Only select repositories*.  
   "All" also covers repositories created later; in an organization, changes may still need a
   [pending request approval](#approve-the-pending-requests-organization).
6. **Permissions → Repository permissions**: apply the [permission checklist](#permission-checklist) below,
   leave everything else at *No access*.
7. Generate and copy the token (`github_pat_…`, shown only once) into the matching variable of `Pi Agent/.env`
   (`GITHUB_AGENT_ACCOUNT_PAT` / `GITHUB_ORG_PAT` / `GITHUB_MAIN_ACCOUNT_PAT`), then re-run the setup step so
   `/scripts/github_pat` is regenerated.

### Permission checklist

| Permission | Value | Notes |
|---|---|---|
| Contents | Read & Write | push branches |
| Pull requests | Read & Write | create PRs, comment, reply to reviews |
| Actions | Read | check workflow runs and results via `gh` or the API |
| Workflows | Read | read `.github/workflows` files; pushes that touch them fail (see below) |
| Metadata | Read (automatic) | added by GitHub as soon as any repository permission is selected |
| Secrets | **No access** | never grant it |

**Workflows: Read vs Read & Write**

- *Read* is enough for the agent to inspect runs and workflow files. A push that touches `.github/workflows`
  fails with *"refusing to allow a Personal Access Token … without workflow scope"*. When that happens, put the
  file under `.github/` (not `workflows/`) and ask the user to move it into place from the GitHub UI.
  See also [Rulesets and branch protection.md](Rulesets%20and%20branch%20protection.md#the-githubworkflows-push-limit).
- *Read & Write* allows pushing workflow changes, **but it exposes to secrets exfiltration**: a workflow can
  print or upload the repository secrets, so a compromised or prompt-injected agent could steal them.  
  **Do not allow the agent to write workflows.** Use AI chats to get suggestions/corrections about workflows
  and apply them yourself.

### Approve the "Pending requests" (organization)

**📌 Mandatory for organization tokens.**  
Creating a PAT that targets the organization — or updating it, e.g. adding a new repository — generates an
approval request. **This request is not notified, and not emailed!** Until an admin approves it, the token
silently does nothing on the new repositories.

To find and approve it:  
`Org Settings → Personal access tokens → Pending requests`


## GIT authentication 

Stop using ``git config --global credential.useHttpPath true``.  
It works for records in .git-credentials ONLY with the full repository path like `github.com/<user-account>/my_repo.git`.  
It doesn't work for generic paths like `github.com/<user-account>` or `github.com/<organization>`.  
It practically consider both the previous records at the same level, valid for github.com, **so it will just pick the first one**.  
Set and maintain a record in .git-credentials for every repository is inpractical.  

**Solution: use authentication of GitHub CLI**  

This Git config allows the `git` command to authenticate using the GitHub CLI:
```text
[credential "https://github.com"]
helper = !gh auth git-credential
```
or, equivalently:
```bash
git config --global credential.https://github.com.helper "!gh auth git-credential"
```
The Docker image already sets it (`Pi Agent/Dockerfile`), so it survives container recreation.

### How GitHub authentication works

GitHub PAT are stored in custom file (**/scripts/github_pat**) instead of the cumbersome .git-credentials.  
When the user select a project, the script extracts the repository owner (from the repository remote origin URL) and get the PAT from the file.  
It set the **GITHUB_TOKEN** environment variable, and that is used by GitHub CLI to authenticate.  
The `github.com.helper` in the GIT config says to the `git` command to use the GitHub CLI to authentucate.  


## Account and Credentials solutions

Exising repository on Main account:
- (A) ❌ Agent account as a **Collaborator** of the Main GH account repository
- (B1) ✔️ Move repository into an organization and have old path <main-account/repo> redirected to <org/repo> then follow (C) or (D) solution
- (C) ➖ Use Main account PAT

New Repository:
- (B) ✔️ Member of Organization and Fine-grained PAT
- (D) ❌ Collaborator on the GitHub Organization repository
- (E) ❌ New repository in the Agent GitHub account


### A. ❌ Collaborator on the main Account repository

**This will work only using GitHub Classic PAT, not fine-grained PAT.**  
This is currently a well known gap that is not planned to be solved by GitHub yet.  
Set the Agent to be a Collaborator of the repository in the Main Account and use Classic PAT

Pros:
+ Works for existing repositories
+ Very easy to set. Does not require to add a new PAT to the .git-credentials (it has to be done only once)

Cons:
- [BLOCKER] Works ony with Classic PAT, not fine-grained.
- Access to the secrets of the Actions
- In order to work it requires some caveats (already automated)

Tested a public repository but should work also for private ones.  

Steps:
0. [Prerequisite] a **Classic PAT** with permissions on "repo" and "read:org" (required by some commands like ``gh pr view <pr>`` and ``gh pr edit <pr>``)
1. Add the shadow account as Collaborator. In the repository Settings > Collaborators create an invite for the shadow account.
2. In the shadow account, open the email and accept the invitation (can be done also in GitHub account, you have the invite in the notifications)
Done.
  
**NOTE**  
In order to work (both `git` and `gh` commands), the `export GITHUB_TOKEN=<git_pat>` has to be run. 
**This comamnd is automated when you select a project in Pi**, so it needs a re-load of 
Without that `git push` will ask for username/PAT etc... to try to set specific GIT credentials for the repo instead of using the GitHub Classic PAT !  
**GIT will not use the Classic PAT stored in the .git-credentials file automativcally !!** 
Use `git status` to see if you can log in.  


To know more:  
**AI PROMPT**
```text
I have a GitHub Account A and GitHub Account B.  
I have the repository `github.com/A/my-repo.git`. It is public.
I added Account B as Collaborator to the repository `A/my-`repo`.  
Invite email was sent and accepted.  

GIT is set to use HTTP path (`git config --global credential.useHttpPath true`).  
The `.git-credentials` has these records:
https://xxx:github_pat_11CATkrA@github.com/B
https://xxx:ghp_H3zKMHv9@github.com

The last record is the Classic PAT of GitHub account B.  
Calling `git push` starts the process to set new GIT credentials for the repo (the prompt asks for username and PAT).
If I use `export GITHUB_TOKEN=<git_pat>` before calling `git push`, it works!  
  
I also tried with the proper username in the Classic PAT record: `https://B:ghp_H3zKMHv9@github.com`, but still doesn't work!  
  
Why GIT doesn't use the Classic PAT to login into the repo authomatically???  
```

### B1. Move repository to the organization

Prerequisites: the main account has an organization.  

1. Go to the repository Settings
2. Under **Danger Zone** select **Transfer**
3. Under "new owner" seelct "One of my organizations"

The old URL will continue to work.  
A Transfer back  to the MAin account can be done, to return to the original state.  


AI PROMPT
```text
I have a GitHub Main account. I have an organization where that account is the owner.  
I want to use another account  (Agent account) to access the repository with a PAT.
can I create the PAT from:
- Main account (the owner of the repo)
- The organization
- The Agent account, after it become member of ht eorganization
- The Agent account, how to give it this permission?  

I prefer the soliution whre the PAT is created on the Agent account so that the PR are created from that account and Main account can review them and merge (remain the owner).

```

### B. ✔️ Fine-grained permissions PAT on the Agent account for organization repository 

Using a fine-grained PAT token, created on the Organization allows to have restricted permissions.  
The Agent account must be a Member of the organization.  
A PAT for the Agent account organization should exist. It has a list of repositories, and a new repositories can be added at any moment.  
  
Pros:
+ Code constribution appear to be done by the agent.
+ Agent permissions are limited by the PAT
+ No need to generate new PAT, just extend the existing one

Cons
- Set the PAT for the repo is a little bit laborious (**Remember to accept the request in the Organization GitHub page**)
- I cannot push directly with my Main Account. despite is the admin ?!

#### Organization

**The organization is created by the main Account (Owner) and the GitHub shadow account is a Member (requires invitation).**  
As a member it needs "Write" basic role/permission on the organization.  
It can access with a fine-grained PAT token pointing to the organization.  
Agent account has access to the repository secrets in the UI. ** Is this a concerning thing ? **

Fine-grained PATs must be enabled on the organization, and every token creation/update must be approved
manually: see [Creating the PATs](#creating-the-pats) (organization toggle and 📌 Pending requests).

#### 📌 Main account cannot push

It can happen that the Main account (despite is the admin of the organization) cannot push (403).  
Adding it as Admin member of the organization, still cannot push (403), and this is not required.    
The cause is probably that Windows uses **OAuth App** and not .git-credentials, and the stored credentials is not updated.  
  
**Solution: Refresh the token/record used for OAuth login**  
Open Windows "Credentials Manager", select "Windows Credentials" and look for records of "https://github.com".  
Remove the record, and try git push again.  
**It will ask for login on GitHub and then it will create a VALID record.**  
(If you choose "Token" instead of "Sign in with a browser", select "repo" and "workflows", will be enough)
  
Note. If the rea more than one record (like https://github.com and https:alex@github.com), the git push will ask to pick one each time! Remove one.

### C. ➖ Use Main account fine-grained PAT

There is no real advantage on doing this if not just being a quick solution.  
Also, it doesn't make a clean PR reviews mechainism.
Moving the repository under a organization seems a simple solution.


### D. ❌ Collaborator on the GitHub Organization repository 

A fine-graned PAT (on the shadow account) cannot be created for the organization repositories, because it is not a member of it.  
Being a collaborator, it can access the repository within a Classic token, but a classic token has not fine-grained permissions and is possibly too "strong".  
The same if a SSH key is used for authentication.  


### E. ❌ New repository in the Agent GitHub account

The work will not be visible in your Account.  
Very easy to manage for the Agent... less for you, because you need to use the shadow GitHub account to operate.
It can be a valid solution for specific requirements.


## PR review account

An account cannot review its own pull request, so the PR author and the reviewer must be two different
identities. The options evaluated (open question also recorded in [GIT.md](GIT.md#pr-review-account)):

| Option | Status | Notes |
|---|---|---|
| Second GitHub account as reviewer | ✅ **Adopted** | the `GITHUB_REVIEWER` account is added as reviewer by the agents; it can formally approve or request changes |
| GitHub App as reviewer | ❌ Trialled, not adopted | never wired into the setup (see below) |

**Decision**: reviews are done by a second GitHub account — in the current setup the Main account, configured
via `GITHUB_REVIEWER`. When all agents create PRs from the same Agent account, the Main account is the only
identity that can produce a formal APPROVE / CHANGES_REQUESTED review (GitHub rejects with 422 an account
reviewing its own PR).

The GitHub App trial is kept for reference: created at organization level
(`Organization → Settings → Developer settings → GitHub Apps`), URL = the organization URL, webhooks disabled,
repository permissions Metadata (default) + Contents: Read only + Pull requests: Read & Write, installed for
the organization only. It was not adopted: the startup scripts and the agent instructions only support
account + PAT authentication, so an App installation token would be a second, parallel auth mechanism.

## Troubleshooting

Quick reference for the errors you can hit with the GIT/GitHub setup described in this document.
The scripts referenced here live in `scripts/git_common.sh` and `scripts/start_common.sh`; the
authentication flow is documented in [GIT.md](GIT.md).

| Symptom | Cause | Fix |
|---|---|---|
| `❌ The PAT for '<owner>' ends with 'github.com'` | the line in `/scripts/github_pat` was written as `owner:pat@github.com` or misses the `owner:` prefix | correct the line to `<owner>:<PAT>`; `set_github_auth_for_repo` validates it when the project is selected |
| `git push` asks for username + PAT although a PAT exists | `GITHUB_TOKEN` is not exported in the current shell, or the `gh` credential helper is missing from the Git config | select the project again (it runs `set_github_auth_for_repo`); check the `[credential "https://github.com"] helper = !gh auth git-credential` entry (the Docker image already sets it) |
| 403 pushing with the **Main** account although it is org admin | Windows Credential Manager keeps a stale OAuth token instead of the PAT | remove the `https://github.com` record from Windows Credentials and login again — see 📌 Main account cannot push in Solution B |
| `GH007: Your push would publish a private email address` | the account has "Keep my email addresses private" enabled and `user.email` is the real email | use the no-reply address (`1234567+user@users.noreply.github.com`): set `GITHUB_COMMIT_EMAIL` to it, `setup_git_global` applies it — see [GIT.md](GIT.md#private-hidden-github-email) |
| `refusing to allow a Personal Access Token ... without workflow scope` | the push touches a file under `.github/workflows` and the PAT has Workflows: *Read* | keep *Read* (Workflows: *Write* exposes the repository secrets to exfiltration): put the file under `.github/` and ask the user to move it into `workflows/` from the GitHub UI — see [Rulesets and branch protection.md](Rulesets%20and%20branch%20protection.md#the-githubworkflows-push-limit) |
| Org PAT silently does nothing on a new repository | the fine-grained PAT "Pending request" was never approved (not notified, not emailed) | `Org Settings → Personal access tokens → Pending requests` — see [Approve the "Pending requests"](#approve-the-pending-requests-organization) |
| `gh` works but `git` does not (or the reverse) | the two authenticate separately (`gh` from `GITHUB_TOKEN`, `git` through the `gh` credential helper); the collaborator path also needs a pending invitation (and `repo:invite` with a Classic PAT) | accept the invitation first — `check_and_accept_invite` does it automatically during clone; see Solution A |
| `⛔ You cannot access this repo. You need to set credentials or be a collaborator.` | the PAT resolved for the repository owner has no access to the repo and no invitation is pending | add the owner's PAT via **🔑 Manage GitHub credentials** (`owner:PAT` line in `/scripts/github_pat`) and retry, or invite the Agent account as collaborator. Feature 22 tracks improving this message |
| `❌ Failed to clone!` + `GraphQL: Could not resolve to a Repository ...` | the selected PAT does not cover the repository: wrong owner record, or a fine-grained PAT on "Only select repositories" that misses it | match the repository owner against `/scripts/github_pat`; extend the PAT's repository list or approve the org pending request |
| `❌ PR not found on branch '…'` (todo-task extension) | no open PR on the branch, or the token lacks Pull requests: Read / targets the wrong owner | verify with `gh pr list --head <branch>`; related: Bug 64 (execution report not attached when the PR is merged/closed) |
| `Could not restore model …`, git errors overwriting the TUI footer | not an authentication problem | tracked separately: Bug 61 (pi-agent errors break the TUI) |

Repository access is verified by `check_repo_access` before cloning. Its exit codes
(`scripts/git_common.sh`):

| Code | Value | Meaning |
|---|---|---|
| `REPO_ACCESS_OK` | 0 | owner or collaborator, the repo can be used |
| `REPO_ACCESS_ERROR` | 1 | authentication/access failure |
| `REPO_ACCESS_READ_ONLY` | 2 | no write access detected — the script then checks whether the repo is public or looks up and accepts a pending invitation |
