import { parseHTML, DOMParser } from "linkedom";

/**
 * Polyfill environment for Turndown.
 * Turndown inside Node.js checks for 'window.DOMParser'.
 * If not found, it attempts to 'require("@mixmark-io/domino")'.
 * By providing a global window and DOMParser, we bypass the domino requirement.
 */
(global as any).window = global;
(global as any).DOMParser = DOMParser;

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadAllIndexers, getIndexerById } from "../main/indexer-loader";
import { getIndex, hasCache } from "../main/cache-manager";
import { fuzzySearch } from "../shared/search-algorithm";

// TurndownService will be initialized inside main()
let turndownService: any;

/**
 * Common logic to fetch a document and convert to Markdown
 */
async function fetchAndConvert(indexerId: string, relativeUrl: string) {
  const indexer = await getIndexerById(indexerId);
  if (!indexer) {
    throw new Error(`Indexer not found: ${indexerId}`);
  }

  let fullUrl = relativeUrl;
  if (indexer.urlTemplate) {
    fullUrl = indexer.urlTemplate.replace('${url}', relativeUrl);
  }

  console.error(`Fetching ${fullUrl}...`);

  const response = await fetch(fullUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${fullUrl}: ${response.statusText}`);
  }
  const html = await response.text();

  // Extract content using Linkedom
  const { document } = parseHTML(html);
  
  let targetElement: any = document.body;
  
  if (indexer.contentSelector) {
    const selected = document.querySelector(indexer.contentSelector);
    if (selected) {
      targetElement = selected;
    }
  } else {
    const commonSelectors = ['main', 'article', '#content', '.content', '.documentation'];
    for (const sel of commonSelectors) {
      const selected = document.querySelector(sel);
      if (selected) {
        targetElement = selected;
        break;
      }
    }
  }

  // Turndown will now use the global DOMParser instead of attempting to require 'domino'
  const markdown = turndownService.turndown(targetElement);
  
  return `<!-- Source: ${fullUrl} -->\n\n# ${indexer.name}: ${relativeUrl}\n\n${markdown}`;
}

async function main() {
  // Dynamic import to ensure polyfills are applied first.
  // bundled into mcp.js via inlineDynamicImports: true.
  const { default: TurndownService } = await import("turndown");
  
  turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  const server = new McpServer({
    name: "Chemrtron",
    version: "1.0.0"
  });

  // Register Tool: list_available_docsets
  server.registerTool(
    "list_available_docsets",
    {
      description: "List all available documentation sets (e.g., mdn, nodejs, python, etc.) currently cached in Chemrtron. Call this tool first to see what documentation is available locally before searching."
    },
    async () => {
      const indexers = await loadAllIndexers();
      const available = [];
      for (const idx of indexers) {
        if (hasCache(idx.id)) {
          available.push({
            id: idx.id,
            name: idx.name,
            domain: idx.urlTemplate ? new URL(idx.urlTemplate.replace('${url}', '')).hostname : undefined
          });
        }
      }
      return {
        content: [{ type: "text", text: JSON.stringify(available, null, 2) }]
      };
    }
  );

  // Register Tool: search_docs
  server.registerTool(
    "search_docs",
    {
      description: "Search official technical documentation via Chemrtron. Returns a list of matching documents with URIs. To read the actual content of a result, you MUST use the 'read_doc' tool with the provided URI.",
      inputSchema: {
        query: z.string().describe("The search query (e.g. 'useEffect', 'fs.readFile')"),
        indexerId: z.string().optional().describe("Specific indexer ID (e.g. 'mdn', 'nodejs')."),
      }
    },
    async ({ query, indexerId }) => {
      const indexers = await loadAllIndexers();
      const targets = indexerId ? indexers.filter(i => i.id === indexerId) : indexers;
      let allResults: any[] = [];

      for (const idx of targets) {
        if (!hasCache(idx.id)) continue;
        try {
          const { data } = getIndex(idx.id);
          const results = fuzzySearch(query, data, { urlTemplate: undefined });
          const augmented = results.slice(0, 50).map(r => ({
            title: r[0],
            uri: `chemr://doc/${idx.id}/${r[1]}`,
            score: r.score
          }));
          allResults.push(...augmented);
        } catch (e) {
          console.error(`Error searching ${idx.id}:`, e);
        }
      }
      allResults.sort((a, b) => (a.score || 0) - (b.score || 0));
      return {
        content: [{ type: "text", text: JSON.stringify(allResults.slice(0, 20), null, 2) }]
      };
    }
  );

  // Register Tool: read_doc
  server.registerTool(
    "read_doc",
    {
      description: "Read the full content of a documentation page found via search_docs. This tool performs optimized extraction and returns clean Markdown. Use this tool INSTEAD OF generic 'fetch' or Web Search tools when you have a chemr:// URI.",
      inputSchema: {
        uri: z.string().describe("The chemr://doc/{indexerId}/{path} URI returned by search_docs")
      }
    },
    async ({ uri }) => {
      try {
        const parsed = new URL(uri);
        if (parsed.protocol !== 'chemr:') throw new Error("Invalid protocol");
        
        const parts = parsed.pathname.split('/').filter(p => p); 
        let indexerId: string;
        let relativeUrl: string;

        if (parsed.host === 'doc') {
            if (parts.length < 2) throw new Error("Invalid URI format. Missing indexerId or path.");
            indexerId = parts[0];
            relativeUrl = parts.slice(1).join('/');
        } else if (!parsed.host && parsed.pathname.startsWith('//doc/')) {
            const subparts = parsed.pathname.substring(6).split('/');
            indexerId = subparts[0];
            relativeUrl = subparts.slice(1).join('/');
        } else {
            throw new Error(`Invalid URI format. Expected chemr://doc/{indexerId}/{path}, got ${uri}`);
        }
        
        const text = await fetchAndConvert(indexerId, decodeURIComponent(relativeUrl));
        return {
          content: [{ type: "text", text }]
        };
      } catch (e) {
        return {
          content: [{ type: "text", text: `Error reading document: ${e instanceof Error ? e.message : String(e)}` }],
          isError: true
        };
      }
    }
  );

  // Register Resource: chemr://doc/{indexerId}/{+path}
  server.registerResource(
    "doc",
    new ResourceTemplate("chemr://doc/{indexerId}/{+path}", { list: undefined }),
    {
      title: "Documentation Page"
    },
    async (uri, { indexerId, path }) => {
      try {
        const text = await fetchAndConvert(indexerId, decodeURIComponent(path));
        return {
          contents: [{ uri: uri.href, mimeType: "text/markdown", text }]
        };
      } catch (e) {
        return {
          contents: [{ uri: uri.href, mimeType: "text/plain", text: String(e) }],
          isError: true
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Chemrtron MCP Server running on stdio");
}

main().catch(err => {
  console.error("Failed to start MCP server:", err);
  process.exit(1);
});