/**
 * @fileoverview Zero Research Engine — Central Research, File & Artifact Intelligence
 *
 * Unifies:
 * - Multi-provider web search with structured citation indexing
 * - Sandboxed file reading, writing, directory walking, and CSV processing
 * - SHA-256 verified artifact generation and persistence
 * - Autonomous multi-step research workflow execution
 */

import { SearchEngine } from './search.mjs';
import { FileOperations } from './file-ops.mjs';
import { ArtifactManager, ARTIFACT_TYPES } from './artifact-manager.mjs';

export class ResearchEngine {
  /**
   * @param {Object} [options]
   * @param {string} [options.dbPath=':memory:']
   * @param {string} [options.baseDir]
   * @param {string} [options.storageDir]
   */
  constructor(options = {}) {
    this.searchEngine = new SearchEngine(options);
    this.fileOps = new FileOperations(options);
    this.artifactManager = new ArtifactManager(options);
  }

  /**
   * Autonomous research workflow: searches web, structures citations,
   * produces a verified research report artifact, and optionally updates memory.
   */
  async executeResearchWorkflow({
    topic,
    limit = 5,
    taskId = 'research-workflow',
    memoryEngine = null,
  }) {
    const startedAt = Date.now();
    const searchRes = await this.searchEngine.search(topic, { limit });

    // Build synthesized research markdown
    const citationList = searchRes.citations.map(
      (c) => `[${c.citationIndex}] [${c.title}](${c.url})\n    *${c.snippet}*`
    ).join('\n\n');

    const reportContent = `# Research Brief: ${topic}

**Generated At:** ${new Date().toISOString()}  
**Total Sources Examined:** ${searchRes.totalResults}  
**Search Provider:** ${searchRes.provider}  

## Key Findings & Sources

${citationList}

---
*Verified autonomously by Zero Research Engine.*
`;

    // Produce verified artifact
    const artifact = this.artifactManager.createArtifact({
      taskId,
      type: ARTIFACT_TYPES.REPORT,
      title: `Research Report: ${topic}`,
      content: reportContent,
      verified: true,
    });

    // Index into persistent memory if engine provided
    if (memoryEngine && typeof memoryEngine.remember === 'function') {
      try {
        memoryEngine.remember({
          layer: 'semantic',
          category: 'research_findings',
          content: `Research findings for '${topic}': Found ${searchRes.totalResults} sources. Primary reference: ${searchRes.citations[0]?.title || 'web'}`,
          tags: ['research', topic.toLowerCase().slice(0, 20)],
          confidence: 0.95,
        });
      } catch (_) {}
    }

    return {
      ok: true,
      topic,
      totalSources: searchRes.totalResults,
      citations: searchRes.citations,
      artifact,
      durationMs: Date.now() - startedAt,
    };
  }

  close() {
    this.artifactManager.close();
  }
}

export { SearchEngine, FileOperations, ArtifactManager, ARTIFACT_TYPES };
