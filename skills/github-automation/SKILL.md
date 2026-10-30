---
name: github-automation
description: Autonomous GitHub operations including branch management, PR review, issue triage, commits and sync.
triggers:
  - "github"
  - "pull request"
  - "git commit"
  - "git sync"
  - "git push"
---

# GitHub Automation Skill

Autonomous workflow for Git and GitHub operations in Project Zero:

## Capabilities
1. **Branch Management**: Create, switch, and merge git feature branches safely.
2. **Commit Hygiene**: Structure clear atomic commits following Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).
3. **Remote Sync**: Fetch, rebase, and push changes to remote origins (`origin/main`).
4. **Pull Request Automation**: Draft PR descriptions with summary, changes list, and verification steps.
5. **Issue Triage**: Inspect issue threads, extract repro steps, and propose fixes.

## Standard Execution Workflow
1. Check repository status:
   ```bash
   git status
   git log -n 5 --oneline
   ```
2. Verify all tests pass before committing:
   ```bash
   npm test
   ```
3. Stage intended files and commit with descriptive message:
   ```bash
   git add <files>
   git commit -m "<type>: <concise description>"
   ```
4. Push to origin:
   ```bash
   git push origin <branch>
   ```
