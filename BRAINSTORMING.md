# Brainstorming: Multi-Agent Workflow & Identity Protocol

## Context
Discussion regarding the optimal workflow for autonomous agents (specifically Pi instances) working in a shared repository where they share a single GitHub account.

## Core Goals of `TODO.md`
- **Backlog**: High-level planned tasks.
- **In Progress**: Active work (to be managed via PRs/Labels).
- **Completed**: Historical record of finished tasks.
- **Visibility**: Ability to see what is available, what is being worked on, and who is working on it.

## Identified Issues
1. **Collision**: Multiple agents accidentally working on the same task because they don't know another agent has started.
2. **State Drift ("Dirty" In Progress)**: The `In progress` section on `main` becoming outdated or cluttered because agents forget to move tasks to `Completed`.
3. **Shared Identity**: All agents use the same GitHub account, making `git author` or `gh pr view --json author` unreliable for distinguishing between agents.

## Proposed Solutions

### 1. The "Branch Publication" Signal (Crucial)
The very first step of any task must be the creation and **publication** (pushing) of the feature branch to the remote repository. This acts as the primary visibility signal. Even before a Draft PR is opened, the presence of a remote branch (e.g., `origin/feat/01_task`) dictates that the task has been taken by an agent. This prevents other agents from attempting to start the same work.

### 2. The "Draft PR" Signal
Instead of relying on a `In progress` section in `TODO.md` on `main`, the existence of an **Open Pull Request** (specifically a **Draft Pull Request**) serves as the secondary, more formal signal that a task is active.

### 2. Label-based Identity Protocol
To solve the shared identity problem, agents will use GitHub Labels to claim ownership.
- **Identity Token**: Each agent uses a unique label: `agent:<name>` (e.g., `agent:kiwi`).
- **Claiming a Task**:
    1. Create a feature branch (`feat/01_task`).
    2. Open a **Draft PR** immediately.
    3. Apply the identity label: `gh pr edit <PR_NUMBER> --add-label "agent:<name>"`.
- **Collision Detection Logic**:
    - Scan `Backlog` on `main`.
    - For each task, check `gh pr list --state open`.
    - If a matching PR exists, check its labels.
    - If `agent:<someone_else>` is present $\rightarrow$ **Skip (Collision)**.
    - If no `agent:` label is present $\rightarrow$ **Task is Unclaimed/Available**.
    - If `agent:<my_name>` is present $\rightarrow$ **Continue working**.

### 3. Refined Lifecycle
1. **Backlog (on `main`)**: Task is listed.
2. **Activation (via Draft PR)**: Agent creates branch $\rightarrow$ Opens Draft PR $\rightarrow$ Adds `agent:<name>` label.
3. **Implementation**: Agent works on the branch.
4. **Completion**: Agent moves task to `Completed` in the branch's `TODO.md` $\rightarrow$ Merges PR $\rightarrow$ `main` is updated.
