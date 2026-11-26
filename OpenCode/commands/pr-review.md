---
description: Review PR N — Review a PR and leave a comment. Return a summary and a marker.
subagent: false
---

If no number was provided, reply with the usage `/review <N> [note]` and do nothing else.
Otherwise, review **PR $1** of this repository.
- Number: `$1`
- Optional user note: `$2`

If PR is not "open" highlight it in the response.  

Leave a PR review comment, numbered (for reference) and signed with your name.  
Use these icons to mark points: 🟥 heavy 🟧 blocking 🟨 suggestion.  
Also number the points to have a clear reference. 
Specify file and funcion or row (when possible).  
Example:  
"1.🟨 10,000 PBKDF2 iterations is low. OWASP recommends 600,000 for PBKDF2-HMAC-SHA256. No real hashes exist yet, so raising Iterations now costs nothing. Benchmark the login path first if latency worries you. (File: src/Monei.Core/Entities/Account.cs, row 26)"  
  
Block (🟧) only for missing task requirements, regressions or concrete defects. Everything else is a non-blocking 🟨 suggestion or a follow-up TODO.  
Add a verdict of the review: ✅ Approved ☑️ Approved (can be improved) ⛔ Rejected.  
The first line of the review should be like this: <verdict> by <agent>.  
Do not point that the branch is behind main.  
  
After you wrote your points, check them again, one by one, to verify it is not a false claim.  
  
Report a recap specifying if there are blocking points (changes request) or PR can be merged as it is.  
**IMPORTANT** The very last line of your response MUST be exactly this: "[REVIEW FOR `$1` DONE]".
