# GitHub commands


## View the PR review status

`gh pr view <PR_number> --json <fields>`  
Example of request for check the review status of PR 11:  
`gh pr view 11 --json state,isDraft,number,title,url,mergeStateStatus,reviewDecision,author,closed,mergedAt,latestReviews`  

- `PR_number` is is the PR number (1, 2 .... 10, 11)
- `fields` is a list of comam separated properties  
  Available fields:
   additions
   assignees
   author
   autoMergeRequest
   baseRefName
   baseRefOid
   body
   changedFiles
   closed
   closedAt
   closingIssuesReferences
   comments
   commits
   createdAt
   deletions
   files
   fullDatabaseId
   headRefName
   headRefOid
   headRepository
   headRepositoryOwner
   id
   isCrossRepository
   isDraft
   labels
   latestReviews
   maintainerCanModify
   mergeCommit
   mergeStateStatus
   mergeable
   mergedAt
   mergedBy
   milestone
   number
   potentialMergeCommit
   projectCards
   projectItems
   reactionGroups
   reviewDecision
   reviewRequests
   reviews
   state
   statusCheckRollup
   title
   updatedAt
   url

