# Brainstorming: Multi-Agent Workflow & Identity Protocol

## Context
Discussion regarding the optimal workflow for autonomous agents (specifically Pi instances) working in a shared repository where they share a single GitHub account.

## Identified Issues
1. **Collision**: Multiple agents accidentally working on the same task because they don't know another agent has started.
2. **State Drift ("Dirty" In Progress)**: The `In progress` section on `main` becoming outdated or cluttered because agents forget to move tasks to `Completed`.
3. **Shared Identity**: All agents use the same GitHub account, making `git author` or `gh pr view --json author` unreliable for distinguishing between agents.
4. **Context Limits**: New Pi sessions start with fresh context, so agents need a way to remember what they were working on.

## Proposed Solutions

### 1. The "Branch Publication" Signal (Crucial)
The very first step of any task must be the creation and **publication** (pushing) of the feature branch to the remote repository. This acts as the primary visibility signal. Even before a Draft PR is opened, the presence of a remote branch (e.g., `origin/feat/01_task`) dictates that the task has been taken by an agent. This prevents other agents from attempting to start the same work.

### 2. The "Draft PR" Signal
Instead of relying on a `In progress` section in `TODO.md` on `main`, the existence of an **Open Pull Request** (specifically a **Draft Pull Request**) serves as the secondary, more formal signal that a task is active.

### 2. Label-based Identity Protocol
To solve the shared identity problem, agents will use GitHub Labels to claim ownership.
- **Identity Token**: Each agent uses a unique label including their name and icon: `agent: 🥝 <Name>` (e.g., `agent: 🥝 Pi Kiwi`).
- **Claiming a Task**:
    1. Create a feature branch (`feat/01_task`).
    2. Open a **Draft PR** immediately.
    3. Apply the identity label: `gh pr edit <PR_NUMBER> --add-label "agent: 🥝 <Name>"`.
- **Collision Detection Logic**:
    - Scan `Backlog` on `main`.
    - For each task, check `gh pr list --state open`.
    - If a matching PR exists, check its labels.
    - If `agent: 🥝 <someone_else>` is present $\rightarrow$ **Skip (Collision)**.
    - If no `agent: 🥝` label is present $\rightarrow$ **Task is Unclaimed/Available**.
    - If `agent: 🥝 <my_name>` is present $\rightarrow$ **Continue working**.

### 3. Refined Lifecycle
1. **Backlog (on `main`)**: Task is listed.
2. **Activation (via Draft PR)**: Agent creates branch $\rightarrow$ Opens Draft PR $\rightarrow$ Adds `agent:<name>` label.
3. **Implementation**: Agent works on the branch. Uses `TODO.md` on branch for internal tracking across Pi sessions.
4. **Completion**: Agent merges PR $\rightarrow$ `main` is updated. History lives in Git, not in TODO.md.

## Decisions

### `main`'s `TODO.md` Structure
```markdown
# TODO

## Backlog
- [ ] Task 1
- [ ] Task 2
```
- **Only `Backlog`** section exists on `main`
- **No `In Progress`** section → Branch + PR = signal
- **No `Done`** section → PR merged = done (history lives in Git)

### Branch's `TODO.md` Structure
```markdown
# TODO

## In Progress
- [ ] **[feat/01_task]** Task description
    - [ ] Sub-step 1
    - [ ] Sub-step 2

## Backlog
- [ ] Task 3
```
- **`In Progress`** section exists only on the branch
- Used for internal tracking across Pi sessions (fresh context = need to remember what was being done)
- Optional `Backlog` section for related future tasks

### File Consolidation
- **No `AGENT_WORKFLOW.md`** → Keep it simple, avoid adding more files
- **Refactor `AGENTS.md`** → Include everything: entry point + workflow protocol + TODO lifecycle + Git/GitHub setup
- **Backup `AGENTS.md` and `SYSTEM.md`** to `OLD/` before modifying
