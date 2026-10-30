---
name: pdf-processing
description: Text extraction, table parsing, document chunking, and semantic summarization of PDF files.
triggers:
  - "read pdf"
  - "extract pdf"
  - "summarize pdf"
  - "parse pdf table"
---

# PDF Processing Skill

Intelligent document processing workflow:

## Capabilities
1. **Text & Metadata Extraction**: Extract raw text, titles, authors, and page numbers from PDF files.
2. **Table & Schema Extraction**: Detect tabular data layouts and convert to Markdown or CSV tables.
3. **Semantic Chunking**: Split long documents into token-bounded sections based on headings and paragraph boundaries.
4. **Executive Summarization**: Generate concise summaries with bullet points covering key takeaways.
5. **Question Answering**: Answer user questions with direct page number citations.

## Standard Execution Workflow
1. Locate target PDF and inspect page count and structure.
2. Extract text per page while preserving line breaks and tables.
3. Chunk into coherent passages (500-1000 tokens) with 50-token overlap.
4. Extract targeted facts or compile full executive brief.
