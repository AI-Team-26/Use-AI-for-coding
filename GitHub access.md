# GitHub access

The goal is to use GIT and GitHub CLI to create branches, PR, and check GitHub Actions for repositories owned by a personal account or its GitHub organization, from a machine where an AI Agent is operating.  
I have created a shadow GitHub account for this purpose, this account is used by the AI Agent.  
  
The possible options are:
- Member of a GitHub Organization
- Collaborator on the GitHub Organization repo
- Collaborator on the main Account repo
- ✔️ Fine-grained permissions PAT on the main Account


## Member of a GitHub Organization 

As a member it needs "Write" basic role/permission on the organization.  
It can access with a PAT token pointing to the organization.  
To be used it requires "=true" and to save the credentials per-repo in .  git-credentials (no wildcard)  
In this way it has access to the repository secrets. ** That is a concern because a mistakes allows potentially to access to secrets and other private info **


## Collaborator on the GitHub Organization repo ❌

A fine-graned PAT (on the shadow account) cannot be created for the organization repositories, because it is not a member of it.  
Being a collaborator, it can access the repo within a Classic token, but a classic token has not fine-grained permissions and is possibly too "strong".  
The same if a SSH key is used for authentication.  

## Collaborator on the main Account repo ❌

I haven't explored this solution, because I believe that it is the same of the Organization way, but it potentially exposes also other absolutely not-wanted-to-share repositories to the shadow account.  
The only benefit can be the possibility to access to existing repositories.


## Fine-grained permissions PAT on the main account for organization repo ✔️

Using a fine-grained PAT token, created on the Organization allows to have restricted permissions (OK).
PR are created under the main account, but code constribution appear to be done by the agent.

**IT Works PERFECTLY fine.**