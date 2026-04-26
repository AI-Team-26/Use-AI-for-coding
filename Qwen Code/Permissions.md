# Permissions


Permission can be given at user level, in _/.qwen/settings.json_ or at project level, with /<project>/.qwen/settings.json .


Permissions at user level (to append to the existing file):
```json
{
  "permissions": {
    "allow": [
      "Bash(touch *)",
      "Bash(dotnet *)",

      // GIT
      //"Bash(git *)",
      "Bash(git status)",
      "Bash(git diff)",
      "Bash(git checkout *)", // single branch
      "Bash(git checkout -b **)", // create + checkout
      "Bash(git checkout --track **)", // track remote
      //"Bash(git checkout [a-zA-Z0-9._/-]*)",
      "Bash(git add -A)",
      "Bash(git commit -m *)",

      // GitHub CLI
      "Bash(gh run view *)",
      // example: gh pr view 5 --json number,title,body,comments,url
      "Bash(gh pr view *)",
      "Bash(gh pr view * --json *)",
      "Bash(gh pr view * --comments)",
      "Bash(gh pr view * --json * --comments)"
    ]
  },
  "$version": 3
}
```` 



