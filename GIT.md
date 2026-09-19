# GIT

The agent needs to access GIT repository for:
- Read private repositories
- Create PR
- Comment PR
- See Workflows run results

To avoid giving it access to the user account stuff with risk to expose secrets and other private stuff, I use a shadow GitHub account (**Agent GH Account**).  
In this way it is possible to have an approach of close-to-open permissions.  
This is possible using a **fine-grained permissions PAT** for the account.  


## Repositories owner

Where to create repositories?  
Repositories created under the Agent account



## Credentials

The generic GIT credentials to execute `git` can be set with these commands:
```bash
git config --global user.name "$git_username"
git config --global user.email "$git_email"
```

[TODO]
We need to 
Initially I thought that 
git config --global credential.helper store
echo "https://$git_username:$git_pat@github.com" > ~/.git-credentials




### GIT credentiaks using GH

I found that using the .git-credentials is not working for my scope:
- 

### [OBSOLETE] GIT credentials store

[OBSOLETE] I don't use this approach anymore because .git-credentials doesn't  allow multi-PAT without precisely defined repositories.
Adding a PAT FOE EVERY REPOSITORY AND A NEW RECORD IN .git-credentials IS UNMANAGEABLE.  

Use ``git config --global credential.helper store``, it will ask for a PAT,  
and it will store it in ~/git-credentials on a single line like this:  
``https://<username>:<GITHUB_PAT>S@github.com``

*Note*: When paste in bash shell with right click, **CLICK ONLY ONCE** (it will not show nothing so you tend to right-click again!)

### GitHub CLI

GitHub CLI is required for access to PR comemnts, reply to PR comments, and many other operations.    
GitHub CLI requires its own authentication, it doesn't use .git-credentials.  
One way it can authenticate is using the **GITHUB_TOKEN** environment variable; we use this way.



The start scripts automatically populate the variable with the right token on-the-fly when a project with a repository is selected.    
See *start_common.sh* script.  

To check the GH CLI authentication:
```bash
gh auth status 2>/dev/null || echo "gh not authenticated"
```



### Use Multiple GitHub PAT

The fine-grained GitHub PAT is created for a the user or an organiztion they have access to; you have to choose it.       
If you created a PAT attached to the user, it does not allow you to work with the organization repositories, and vice-versa.  

There is a way to use a specific PAT in the github credentials ?

To differentiate the PAT to use, based on the repository, you need to enable this property:
```sh 
#  Enable path-based matching
git config --global credential.useHttpPath true
``` 

Then you can add multiple PAT, for specific repositories.  
The PAT for-repo has to be set with the FULL REPOSITORY PATH, it can't be generic using part of the path (TO VERIFY) or wildcard.  


### 📌 Edit credentials

```bash
docker ps
container=
docker exec -it $container /bin//bash    ## double slash to prevent GitBash to correct the path
```

To read the current credentials: 
``cat ~/.git-credentials``

```bash
# git config --global credential.useHttpPath true    # at this point should be already set

# Clear the file (creates it if it doesn't exist)
# Using ':' is a clean way to truncate a file to 0 bytes
: > ~/.git-credentials

# ...or delete specific lines:
sed -i '1d' ~/.git-credentials

## Get env variables with tokens
env | grep GITHUB | sort

# Add PAT for owned repositories of Account or Organization

USER_TOKEN=
USERNAME=
GITHUB_AGENT_ACCOUNT=
GITHUB_ORG=
echo "https://$USERNAME:$USER_TOKEN@github.com/$GITHUB_AGENT_ACCOUNT" >> ~/.git-credentials
echo "https://$USERNAME:$USER_TOKEN@github.com/$GITHUB_ORG" >> ~/.git-credentials

# Add PAT for NOT-owned repo
TOKEN_2=$GITHUB_PAT_FOR_COLLABORATOR
USERNAME=...
echo "https://$USER$:$TOKEN_2@github.com/<another_account_or_organization>/repository.git" >> ~/.git-credentials  ## OK
echo "https://<username>:$TOKEN_2@github.com/<another_account_or_organization>/*" >> ~/.git-credentials           ## DOES NOT WORK (wildcard NOT accepted)
# practically you need to use the full repo path

# 5. Secure the file
chmod 600 ~/.git-credentials
```

### Recover GitHub credentials to migrate to a new container

``git config --global user.name``  
``git config --global user.email``  
``cat ~/.git-credentials``  ("github_pat_" is part of the key)



## PR Review account

The Agent Account creates the PR.  
Anothe ragent (or the same agent) cannot review the PR because an account cannot review its own PR.  
To make the agent able to review:
A. Different GitHub account 
B. GitHub App

I'm trying to use a GitHub App. 
It was created for hte Organization (Organizatrion -> Settings -> Developer stuff -> GitHub App)  
URL: same GitHub URL of the Organization. Disable webhook, so no need to set the callbaclk URL.
Permissions:
- Metadata (default)
- Contents: Read only
- Pull requests: Read & Write

Install for Organization only.  

