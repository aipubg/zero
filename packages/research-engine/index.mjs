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
    query,
    limit = 5,
    taskId = 'research-workflow',
    memoryEngine = null,
  }) {
    const startedAt = Date.now();
    const effectiveTopic = topic || query || '';
    const searchRes = await this.searchEngine.search(effectiveTopic, { limit });
    const hasRealSources = searchRes.totalResults > 0;

    // Build research markdown
    let reportContent;
    if (hasRealSources) {
      const citationList = searchRes.citations.map(
        (c) => `[${c.citationIndex}] [${c.title}](${c.url})\n    *Source: ${c.domain} | Provenance: ${c.provenance?.provider || 'web'}*\n    ${c.snippet}`
      ).join('\n\n');

      reportContent = `# Research Brief: ${effectiveTopic}

**Generated At:** ${new Date().toISOString()}
**Total Sources Examined:** ${searchRes.totalResults}
**Search Status:** Retrieved (${searchRes.provider}); source claims not independently verified

## Key Findings & Sources

${citationList}

---
*Sources returned by the listed search providers. Their claims have not been independently verified.*
`;
    } else {
      reportContent = `# Research Brief: ${effectiveTopic}

**Generated At:** ${new Date().toISOString()}
**Total Sources Examined:** 0
**Search Status:** ${searchRes.status.toUpperCase()} (No sources retrieved)

## Notice
No live web documents could be retrieved for topic "${effectiveTopic}".
Report generated with unverified status.
`;
    }

    // Produce artifact with truthful verified status
    const artifact = this.artifactManager.createArtifact({
      taskId,
      type: ARTIFACT_TYPES.REPORT,
      title: `Research Report: ${effectiveTopic}`,
      content: reportContent,
      verified: false,
    });

    // Index into persistent memory only if real sources were confirmed
    if (hasRealSources && memoryEngine && typeof memoryEngine.remember === 'function') {
      try {
        memoryEngine.remember({
          layer: 'semantic',
          category: 'research_findings',
          content: `Search results for '${effectiveTopic}': Retrieved ${searchRes.totalResults} sources; claims unverified. Primary reference: ${searchRes.citations[0]?.title} (${searchRes.citations[0]?.url})`,
          tags: ['research', effectiveTopic.toLowerCase().slice(0, 20)],
          confidence: 0.5,
        });
      } catch (_) {}
    }

    return {
      ok: hasRealSources,
      status: searchRes.status,
      topic,
      totalSources: searchRes.totalResults,
      citations: searchRes.citations,
      artifact,
      retrieved: hasRealSources,
      verified: false,
      durationMs: Date.now() - startedAt,
    };
  }

  close() {
    this.artifactManager.close();
  }
}

export { SearchEngine, FileOperations, ArtifactManager, ARTIFACT_TYPES };
