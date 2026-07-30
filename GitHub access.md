# GitHub access for Agent

The goal is to use GIT and GitHub CLI to create branches, create PR, review PR, and check GitHub Action runs for repositories owned by a personal account or its GitHub organization, from a machine where an AI Agent is operating.  
I have created a shadow GitHub account for this purpose, this account is used by the AI Agent, 
so, in this document we will refer to **Main [GH] Account** and **Agent [GH] Account**.  
I will use solutions accessible to Free GitHub accounts.  

The possible options are:
- (A) ✔️ Agent GH account as a **Collaborator** of the Main GH account repository ⭐
- (B) ✔️ Fine-grained permissions PAT on the main Account. Note. All the commits and the PR will be done by the main Account, so it can Merge the PR immediately.
- (C) Member of a GitHub Organization
- (D) Collaborator on the GitHub Organization repo
- (E) New repository in the Agent GitHub account


## A. ✔️ Collaborator on the main Account repository ⭐
Set the Agent to be a Collaborator of the repository in teh Main Account

Pros:
+ Works for existing repositories
+ Very easy to set. Does not require to add a new PAT to the .git-credentials (it has to be done only once)

Cons:
- Making Classic PAT work is STRESSFUL
- Access to the secrets of the Actions
- In order to work it requires some caveats (already automated)

Tested a public repository but should work also for private ones.  

Steps:
0. [Prerequisite] a **Classic PAT** with permissions on "repo" and "read:org" (required by some commands like ``gh pr view <pr>`` and ``gh pr edit <pr>``)
1. Add the shadow account as Collaborator. In the repository Settings > Collaborators create an invite for the shadow account.
2. In the shadow account, open the email and accept the invitation (can be done also in GitHub account, you have the invite in the notifications)
Done.
  
TODO: verify  
Edit of worflows (.github/workflows/deploy.yaml): ?  (there is a "workflow" checkbox for the classic PAT)  
Access to Actions (workflow run is successful): ? 

**NOTE**  
In order to work (both `git` and `gh` commands), the `export GITHUB_TOKEN=<git_pat>` has to be run. 
**This comamnd is automated when you select a project in Pi**, so it needs a re-load of 
Without that `git push` will ask for username/PAT etc... to try to set specific GIT credentials for the repo instead of using the GitHub Classic PAT !  
**GIT will not use the Classic PAT stored in the .git-credentials file automativcally !!** 
Use `git status` to see if you can log in.  


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

## B. ✔️ Fine-grained permissions PAT on the main account for organization repository 

Using a fine-grained PAT token, created on the Organization allows to have restricted permissions (OK).
PR are created under the main account, but code constribution appear to be done by the agent.

**IT Works PERFECTLY fine.**

## C. Member of a GitHub Organization 

(The organization is created by the main Account and the GitHub shadow account is a Member)  
As a member it needs "Write" basic role/permission on the organization.  
It can access with a PAT token pointing to the organization.  
To be used it requires "=true" and to save the credentials per-repository in . git-credentials (no wildcard)  
In this way it has access to the repository secrets. ** That is a concern because a mistakes allows potentially to access to secrets and other private info **


## D. ❌ Collaborator on the GitHub Organization repository 

A fine-graned PAT (on the shadow account) cannot be created for the organization repositories, because it is not a member of it.  
Being a collaborator, it can access the repository within a Classic token, but a classic token has not fine-grained permissions and is possibly too "strong".  
The same if a SSH key is used for authentication.  


## E. ❌ New repository in the Agent GitHub account

The work will not be visible in your Account.  
Very easy to manage for the Agent... less for you, because you need to use the shadow GitHub account to operate.
It can be a valid solution for specific requirements.