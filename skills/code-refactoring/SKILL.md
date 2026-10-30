---
name: code-refactoring
description: Architectural code refactoring, dead code pruning, TypeScript typing, and modular decomposition without behavioral regression.
triggers:
  - "refactor"
  - "clean up code"
  - "prune dead code"
  - "optimize architecture"
---

# Code Refactoring Skill

Clean code transformation workflow for Project Zero:

## Capabilities
1. **Behavior-Preserving Refactoring**: Maintain exact functional behavior and API contracts while improving readability, modularity, and testability.
2. **Dead Code Elimination**: Detect and prune unused imports, orphan functions, and deprecated wrappers.
3. **Strict Typing**: Add explicit TypeScript/JSDoc types, eliminate `any` types, and enforce input validation schemas.
4. **Decoupling**: Replace tight coupling with dependency injection, event emitters, or clearly scoped interfaces.
5. **Regression Verification**: Run existing unit and live integration tests before and after edits.

## Standard Execution Workflow
1. Run pre-refactoring test suite to establish green baseline:
   ```bash
   npm test
   ```
2. Identify code smell or modularization boundary.
3. Apply single contiguous edits using surgical tools.
4. Run regression tests and verify 100% pass rate.
5. Record diffs into Coder Space widget (`zero-ui:diff`).
