# GitHub access for Agent

The goal is to use GIT and GitHub CLI to create branches, create PR, review PR, and check GitHub Action runs for repositories owned by a personal account or its GitHub organizations, from a machine where an AI Agent is operating.  
I have created 2 shadow GitHub account for this purpose, one for write code and one for review PRs. These account are used by the AI Agent, 
so, in this document we will refer to **Main [GH] Account** and **Agent [GH] Account (Dev/Reviewer)**.  
The described solutions work for Free GitHub accounts subscriptions (pay subscriptions have more choices).  


## Classic vs fine-grained PAT

**DO NOT USE CLASSIC PAT**
---
The fundamental difference isn't the checkboxes, it's the targeting model. Fine-grained PATs use an allow-list: you pick specific repos at creation time, and the token is permanently bounded to exactly those. Classic PATs use a capability class: `repo` isn't "these three repos," it's "full control of every private repo this account can currently reach — and every one it gains access to later, automatically, with no new consent step." That's the real danger, and it's structural — it doesn't go away no matter how carefully you configure the rest of the screen. If the shadow account ever gets added to a new org, a new repo, anything — this same already-issued token silently expands to cover it. A fine-grained token wouldn't; you'd have to consciously go edit it.
Your `repo` checkbox is also a bundle you can't partially disable — and one piece of that bundle is worth flagging specifically. Notice `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, and `security_events` are all greyed out and auto-checked underneath `repo` — that's not optional, it's baked in the moment you check the parent box. `security_events` in particular means this token can read and write Dependabot, code-scanning, and secret-scanning alerts on every private repo it touches — including dismissing an alert. That's a meaningfully sensitive permission to have inherited invisibly, and there's no way to keep code read/write while stripping just that one out of a classic token. A fine-grained PAT would let you grant Contents + Pull requests and explicitly leave "Code scanning alerts" and "Secret scanning alerts" at No access.


### GitHub fine-grained permission PAT

Use the following permissions for the owned repositories:
- Owner: ``<GitHub account name>``
- Repositories: All  
- Permissions:
  + Contents: Read & Write
  + Pull Requests: Read & Write
  + Actions: Read (to check execution result, using gh or api) 
  + Workflows:
    - Read: this is enough for the agent to know (you cannot commit changes to .github/workflows files or the push fails)
    - Read & Write (to push changes to the .github/workflows folder) **It exposes to secrets exfiltration if the agent is infected with malicious behaviour** 
  + (Metadata: added automatically)

**No permissions to read Repository secrets.**

## Workflows

**Do not allow the agent to write workflows, it can exfiltrate secrets.**
Use AI chats to get suggestions/corrections about GitHub workflows.  


## GIT authentication 

Stop using ``git config --global credential.useHttpPath true``.  
It works for records in .git-credentials ONLY with the full repository path like `github.com/<user-account>/my_repo.git`.  
It doesn't work for generic paths like `github.com/<user-account>` or `github.com/<organization>`.  
It practically consider both the previous records at the same level, valid for github.com, **so it will just pick the first one**.  
Set and maintain a record in .git-credentials for every repository is inpractical.  

**Solution: use authentication of GitHub CLI**  

This line in _.gitconfig_ allows the `git` command to authenticate using the GitHub CLI:
```text
[credential "https://github.com"]
helper = !/usr/bin/gh auth git-credential
```
[TODO: try this simple form:]
helper = !gh auth git-credential


``credential.https://github.com.helper = !/usr/bin/gh auth git-credential``
Dockerfile: ``RUN git config --global credential.https://github.com.helper "!/usr/bin/gh auth git-credential"``

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

Fine-grained PAT needs to be enabled on the organization:
``Org Settings → Personal access tokens → Settings → Allow access via fine-grained personal access tokens → Save``

#### 📌 Remember to approve PAT changes

When update the Agent PAT adding a new repository of the organization, it generates a request.  
**This request is not notified, and not emailed!**  
To find it:  
``Org Settings → Personal access tokens → Pending requests``

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


## Troubleshooting


## 