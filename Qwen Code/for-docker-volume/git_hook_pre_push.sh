#!/bin/sh

# Blocks direct push to main branch
    
protected="main master"
while read local_ref local_sha remote_ref remote_sha; do
  for branch in $protected; do
    if [ "$remote_ref" = "refs/heads/$branch" ]; then
      echo "❌ Blocked: Direct push to '$branch' is not allowed. Create a PR instead."
      exit 1
    fi
  done
done
exit 0
    