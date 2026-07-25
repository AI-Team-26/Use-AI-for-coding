# GitHub access for Agent

The goal is to use GIT and GitHub CLI to create branches, PR, and check GitHub Actions for repositories owned by a personal account or its GitHub organization, from a machine where an AI Agent is operating.  
I have created a shadow GitHub account for this purpose, this account is used by the AI Agent.  
  
The possible options are:
- ✔️ Fine-grained permissions PAT on the main Account. Note. All the commits and the PR will be done by the main Account, so it can Merge the PR immediately.
- Member of a GitHub Organization
- Collaborator on the GitHub Organization repo
- Collaborator on the main Account repository
- New repository in the Agent GitHub account


## Fine-grained permissions PAT on the main account for organization repository ✔️

Using a fine-grained PAT token, created on the Organization allows to have restricted permissions (OK).
PR are created under the main account, but code constribution appear to be done by the agent.

**IT Works PERFECTLY fine.**

## Member of a GitHub Organization 

(The organization is created by the main Account and the GitHub shadow account is a Member)  
As a member it needs "Write" basic role/permission on the organization.  
It can access with a PAT token pointing to the organization.  
To be used it requires "=true" and to save the credentials per-repository in . git-credentials (no wildcard)  
In this way it has access to the repository secrets. ** That is a concern because a mistakes allows potentially to access to secrets and other private info **


## Collaborator on the GitHub Organization repository ❌

A fine-graned PAT (on the shadow account) cannot be created for the organization repositories, because it is not a member of it.  
Being a collaborator, it can access the repository within a Classic token, but a classic token has not fine-grained permissions and is possibly too "strong".  
The same if a SSH key is used for authentication.  

## Collaborator on the main Account repository ❌

Ths is not the favorite way, but it add the possibility to access to existing repositories.  
Tested a public repository but should work also for private ones.  

Prerequisites: a **Classic PAT** with permissions on "repo" and "read:org" (required by some commands like ``gh pr view <pr>`` and ``gh pr edit <pr>``)

1. Add the shadow account as Collaborator. In the repository Settings > Collaborators create an invite for the shadow account.
2. In the shadow account, open the email and accept the invitation (can be done also in GitHub account, you have the invite in the notifications)
Done.
  
Edit of worflows (.github/workflows/deploy.yaml): ?  (there is a "workflow" checkbox for the classic PAT)  
Access to Actions (workflow run is successful): ? 


## New repository in the Agent GitHub account ❌

The work will not be visible in your Account.  
Very easy to manage for the Agent... less for you, because you need to use the shadow GitHub account to operate.
It can be a valid solution for specific requirements.