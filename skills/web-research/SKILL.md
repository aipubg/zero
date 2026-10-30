---
name: web-research
description: Multi-source web search, documentation retrieval, citation extraction, and factual synthesis.
triggers:
  - "search the web"
  - "research"
  - "find documentation"
  - "cite sources"
---

# Web Research Skill

Comprehensive research workflow for autonomous agents:

## Capabilities
1. **Multi-Query Synthesis**: Generate distinct search terms to explore problem surfaces from multiple angles.
2. **Deep Documentation Crawl**: Fetch upstream API references, release notes, and GitHub issue discussions.
3. **Fact Verification & Anti-Hallucination**: Cross-verify claims across at least 2 independent reputable sources.
4. **Citation Extraction**: Extract source URLs, publishing dates, author credentials, and excerpt quotes.
5. **Generative UI Card Output**: Format sources into interactive Research Space cards (`zero-ui:sources`).

## Standard Execution Workflow
1. Identify key factual questions and formulate targeted search queries.
2. Retrieve pages and filter out low-quality SEO or scraper domains.
3. Extract exact facts, API signatures, or benchmark numbers.
4. Present findings with direct links and confidence ratings.
