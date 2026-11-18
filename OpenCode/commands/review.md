---
description: Review PR N — Review a PR and leave a comment. Return a summary and a marker.
subagent: false
---

If no number was provided, reply with the usage `/review <N> [note]` and do nothing else.
Otherwise, review **PR $1** of this repository.
- Number: `$1`
- Optional user note: `$2`

If PR is not "open" highlight it in the response.  

Leave a PR review comment, signed with your name.  
Use these icons to mark points: 🟥 heavy 🟧 blocking 🟨 trivial 🟦 info.  
Also number the points to have a clear reference.  
Add a verdict at the beginning of the review: ✅ Approved ☑️ Approved (can be improved) ⛔ Rejected.  
Do not consider the fact that the branch is behind main.  
  
Report a recap specifying if there are blocking points (changes request) or PR can be merged as it is.  
**IMPORTANT** The very last line of your response MUST be exactly this: "[REVIEW FOR `$1` DONE]".
