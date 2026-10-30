---
name: memory-retention
description: Cross-session persistent memory, user preferences recall, workflow pattern tracking, and episodic retrieval.
triggers:
  - "remember"
  - "recall"
  - "my preferences"
  - "memory"
  - "what did we do"
---

# Memory Retention & Workflow Patterns Skill

Maintain durable long-term memory across Zero conversations:

## Capabilities
1. **Durable SQLite Storage**: Store and search observation summaries in local SQLite database with retention auto-pruning.
2. **Workflow Pattern Mining**: Identify recurring sequences of application usage and record candidates into `workflow_patterns`.
3. **User Profile & Preferences**: Record user instructions, coding styles, favorite tools, and project constraints.
4. **Episodic Search**: Recall past conversation turns and technical decisions with fuzzy keyword queries.

## Standard Execution Workflow
1. When user provides explicit instruction (e.g. "always use Owner Mode", "remember this API key format"), record fact into memory store.
2. During problem solving, query memory store for relevant past patterns or user decisions.
3. Incorporate recalled facts seamlessly into current execution context.
