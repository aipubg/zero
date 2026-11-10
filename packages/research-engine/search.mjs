/**
 * @fileoverview Zero Research Engine — Configurable Search & Citation Tracking
 *
 * Implements structured web search, source extraction, and citation numbering
 * for research agents and user queries.
 *
 * Mandatory Verification Rules:
 * 1. Never fabricate synthetic search citations with verified: true.
 * 2. Distinguish real retrieved sources from query links.
 * 3. Return explicit unavailable, empty or failed states when searches cannot retrieve real results.
 * 4. Record source URLs and citation provenance.
 */

export class SearchEngine {
  /**
   * @param {Object} [options]
   * @param {string} [options.defaultProvider='multi-source']
   */
  constructor(options = {}) {
    this.defaultProvider = options.defaultProvider || 'multi-source';
    this.history = [];
    this.fetch = options.fetch || globalThis.fetch;
  }

  /**
   * Validate that a URL is a genuine HTTP(S) address with valid domain
   * @param {string} urlString
   * @returns {boolean}
   */
  static isValidWebUrl(urlString) {
    if (!urlString || typeof urlString !== 'string') return false;
    try {
      const parsed = new URL(urlString);
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
    } catch {
      return false;
    }
  }

  static isSourceUrl(urlString) {
    if (!SearchEngine.isValidWebUrl(urlString)) return false;
    const url = new URL(urlString);
    // Instant Answer related/category links navigate back into search results.
    // Their snippets are not retrieved external source documents.
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    return host !== 'duckduckgo.com' && !host.endsWith('.duckduckgo.com');
  }

  async retrieveJson(endpoint, provider, attempts, validate) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    let httpStatus;
    try {
      const response = await this.fetch(endpoint, {
        headers: { 'User-Agent': 'ZeroAI-ResearchEngine/1.0 (Windows)' }, signal: controller.signal,
      });
      httpStatus = response.status;
      if (!response.ok) { attempts.push({ provider, status: 'failed', httpStatus }); return null; }
      // Keep the deadline active while reading/parsing the body, not just headers.
      const data = await response.json();
      if (!validate(data)) throw new Error('Invalid search response structure');
      attempts.push({ provider, status: 'retrieved', httpStatus });
      return data;
    } catch (error) {
      attempts.push({ provider, status: httpStatus === undefined || controller.signal.aborted ? 'unavailable' : 'failed', ...(httpStatus === undefined ? {} : { httpStatus }) });
      return null;
    } finally { clearTimeout(timer); }
  }

  /**
   * Perform structured search query across live web sources
   * @param {string} query Search terms
   * @param {Object} [options]
   * @param {number} [options.limit=5] Maximum results
   * @param {string} [options.domain] Specific domain filter
   * @returns {Promise<{ query: string, status: string, totalResults: number, citations: Array, provider: string, durationMs: number, verified: boolean }>}
   */
  async search(query, options = {}) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      throw new Error('Search requires a non-empty query string');
    }

    const startedAt = Date.now();
    const limit = Math.min(Math.max(options.limit || 5, 1), 20);
    const cleanQuery = query.trim();
    const citations = [];
    let providerUsed = this.defaultProvider;
    const attempts = [];

    // 1. Try DuckDuckGo Instant Answer API
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1&skip_disambig=1`;
      const data = await this.retrieveJson(ddgUrl, 'duckduckgo-instant', attempts, value => value !== null && typeof value === 'object' && !Array.isArray(value));
      if (data) {
        if (data.Abstract && data.AbstractURL && SearchEngine.isSourceUrl(data.AbstractURL)) {
          citations.push({
            citationIndex: citations.length + 1,
            title: data.Heading || cleanQuery,
            url: data.AbstractURL,
            source: data.AbstractSource || new URL(data.AbstractURL).hostname,
            domain: new URL(data.AbstractURL).hostname,
            snippet: data.Abstract,
            provenance: {
              provider: 'duckduckgo-instant',
              fetchedAt: Date.now(),
              endpoint: ddgUrl,
            },
            retrieved: true,
            verified: false,
          });
        }

        if (Array.isArray(data.RelatedTopics)) {
          for (const topic of data.RelatedTopics) {
            if (citations.length >= limit) break;
            if (topic.Text && topic.FirstURL && SearchEngine.isSourceUrl(topic.FirstURL)) {
              citations.push({
                citationIndex: citations.length + 1,
                title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 60),
                url: topic.FirstURL,
                source: new URL(topic.FirstURL).hostname,
                domain: new URL(topic.FirstURL).hostname,
                snippet: topic.Text,
                provenance: {
                  provider: 'duckduckgo-related',
                  fetchedAt: Date.now(),
                  endpoint: ddgUrl,
                },
                retrieved: true,
                verified: false,
              });
            }
          }
        }
      }
    } catch (_) {
      attempts.push({ provider: 'duckduckgo-instant', status: 'unavailable' });
      // DuckDuckGo unavailable or timed out; continue to secondary live provider
    }

    // 2. If citations below limit, query Wikipedia OpenSearch API for real encyclopedic documents
    if (citations.length < limit) {
      try {
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQuery)}&limit=${limit}&namespace=0&format=json`;
        const data = await this.retrieveJson(wikiUrl, 'wikipedia-opensearch', attempts, value => Array.isArray(value) && Array.isArray(value[1]) && Array.isArray(value[3]));
        if (data) {
          const [term, titles, snippets, urls] = data;
          if (Array.isArray(titles) && Array.isArray(urls)) {
            for (let i = 0; i < titles.length; i++) {
              if (citations.length >= limit) break;
              const link = urls[i];
              const title = titles[i];
              const snippet = snippets && snippets[i] ? snippets[i] : `Wikipedia reference for ${title}`;

              if (SearchEngine.isSourceUrl(link) && !citations.some((c) => c.url === link)) {
                citations.push({
                  citationIndex: citations.length + 1,
                  title,
                  url: link,
                  source: new URL(link).hostname,
                  domain: new URL(link).hostname,
                  snippet,
                  provenance: {
                    provider: 'wikipedia-opensearch',
                    fetchedAt: Date.now(),
                    endpoint: wikiUrl,
                  },
                  retrieved: true,
                  verified: false,
                });
              }
            }
          }
        }
      } catch (_) {
        attempts.push({ provider: 'wikipedia-opensearch', status: 'unavailable' });
        // Wikipedia unavailable or offline
      }
    }

    // TRUTHFULNESS RULE:
    // If no citations were retrieved from real providers, return an explicit empty/unavailable state.
    // DO NOT synthesize search results and DO NOT mark query URLs as verified sources.
    const allowed = citations.filter(c => !options.domain || c.domain === options.domain || c.domain.endsWith('.' + options.domain));
    citations.splice(0, citations.length, ...allowed.slice(0, limit).map((c, i) => ({ ...c, citationIndex: i + 1 })));
    const isSuccess = citations.length > 0;
    const searchResult = {
      query: cleanQuery,
      status: isSuccess ? 'ok' : attempts.some(a => a.status === 'retrieved') ? 'empty' : attempts.some(a => a.status === 'failed') ? 'failed' : 'unavailable',
      totalResults: citations.length,
      citations,
      provider: providerUsed,
      retrieved: isSuccess,
      verified: false,
      attempts,
      durationMs: Date.now() - startedAt,
      timestamp: Date.now(),
      notice: isSuccess ? null : 'No external web documents could be retrieved from live search providers.',
    };

    this.history.push({
      query: cleanQuery,
      timestamp: Date.now(),
      resultCount: citations.length,
      status: searchResult.status,
    });
    if (this.history.length > 200) this.history.shift();

    return searchResult;
  }
}
