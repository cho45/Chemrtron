
import { parseHTML } from 'linkedom';
import type { IndexerContext, IndexerDefinition } from '../../src/shared/types';
import * as path from 'path';
import * as fs from 'fs';

class LiveIndexerContext implements IndexerContext {
  public entries: Array<{ title: string; url: string }> = [];

  pushIndex(title: string, url: string): void {
    // Normalize whitespace in title
    this.entries.push({ title: title.replace(/\s+/g, ' ').trim(), url });
  }

  async fetchDocument(url: string): Promise<Document> {
    const html = await this.fetchText(url);
    const { document } = parseHTML(html);
    return document as unknown as Document;
  }

  async fetchJSON<T = any>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
    return res.json();
  }

  async fetchText(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
    return res.text();
  }

  async crawl(urls: string[], callback: (url: string, doc: Document) => void): Promise<void> {
    for (const url of urls) {
      try {
        const doc = await this.fetchDocument(url);
        callback(url, doc);
      } catch (e) {}
    }
  }

  progress() {}
}

interface IndexerSpec {
  id: string;
  expectedSymbols: string[];
  minEntries?: number;
}

const SPECS: IndexerSpec[] = [
  { id: 'lua', expectedSymbols: ['print', 'assert', 'lua_newstate'], minEntries: 100 },
  { id: 'mysql', expectedSymbols: ['SELECT', 'UPDATE', 'ABS', 'JOIN'], minEntries: 200 },
  { id: 'rust', expectedSymbols: ['unsafe', 'keyword', 'Vec', 'Expressions'], minEntries: 500 },
  { id: 'k8s', expectedSymbols: ['kubectl', 'Pod', 'Architecture'], minEntries: 50 },
  { id: 'cpp', expectedSymbols: ['vector', 'unique_ptr', 'constexpr'], minEntries: 300 },
  { id: 'git', expectedSymbols: ['add', 'commit', 'rev-parse'], minEntries: 50 },
  { id: 'typescript', expectedSymbols: ['Utility Types', 'Partial', 'tsconfig'], minEntries: 50 },
  { id: 'elixir', expectedSymbols: ['Kernel.abs', 'Enum.map', 'String.trim'], minEntries: 500 },
  { id: 'kotlin', expectedSymbols: ['String', 'Collections', 'ranges'], minEntries: 500 },
  { id: 'redis', expectedSymbols: ['GET', 'SET', 'HGET', 'PUBLISH'], minEntries: 200 },
  { id: 'postgresql', expectedSymbols: ['SELECT', 'CREATE TABLE', 'JSON', 'vacuum'], minEntries: 500 },
  { id: 'cmake', expectedSymbols: ['add_executable', 'target_link_libraries', 'PROJECT_SOURCE_DIR'], minEntries: 500 },
  { id: 'raku', expectedSymbols: ['absolute', 'Array', 'operators'], minEntries: 500 },
  { id: 'ruby', expectedSymbols: ['Array', 'Enumerable', 'reduce'], minEntries: 1000 },
  { id: 'sqlite', expectedSymbols: ['SELECT', 'CREATE TABLE', 'sqlite3_open'], minEntries: 200 },
  { id: 'vim', expectedSymbols: ['help', 'motion', 'visual'], minEntries: 1000 },
  { id: 'android', expectedSymbols: ['android.app', 'Activity', 'View'], minEntries: 1000 },
  { id: 'arduino', expectedSymbols: ['digitalRead', 'pinMode', 'Serial'], minEntries: 50 },
  { id: 'clojure', expectedSymbols: ['map', 'reduce', 'filter', 'defn'], minEntries: 500 },
  { id: 'golang', expectedSymbols: ['Go Spec: Types', 'std: fmt', 'std: net/http'], minEntries: 200 },
  { id: 'java', expectedSymbols: ['String', 'ArrayList', 'HashMap', 'Thread'], minEntries: 1000 },
  { id: 'opengl', expectedSymbols: ['glDrawArrays', 'glClear', 'glTexImage2D'], minEntries: 400 },
  { id: 'php', expectedSymbols: ['strlen', 'array_map', 'json_encode'], minEntries: 1000 },
  { id: 'python3', expectedSymbols: ['list', 'dict', 'json', 'sys.path'], minEntries: 1000 },
  { id: 'ghc', expectedSymbols: ['Prelude', 'Data.List', 'Control.Monad'], minEntries: 1000 },
  { id: 'mdn', expectedSymbols: ['JavaScript', 'HTML', 'CSS', 'fetch'], minEntries: 5000 },
  { id: 'nodejs', expectedSymbols: ['fs', 'http', 'process', 'Buffer'], minEntries: 500 },
  { id: 'pandas', expectedSymbols: ['DataFrame', 'Series', 'read_csv'], minEntries: 1000 },
  { id: 'html', expectedSymbols: ['HTML elements', 'Introduction', 'Canvas'], minEntries: 500 },
  { id: 'docker', expectedSymbols: ['docker build', 'docker run', 'Dockerfile'], minEntries: 100 },
  { id: 'man', expectedSymbols: ['abort(3)', 'grep(1)', 'systemd(1)'], minEntries: 1000 }
];

async function runTest(spec: IndexerSpec) {
  process.stdout.write(`Testing Indexer: ${spec.id.padEnd(12)} `);
  
  try {
    const indexPath = path.resolve(__dirname, `../../src/indexers/${spec.id}.js`);
    const module = await import(indexPath);
    const indexer: IndexerDefinition = module.default;
    const ctx = new LiveIndexerContext();

    await indexer.index(ctx);

    const errors: string[] = [];
    if (spec.minEntries && ctx.entries.length < spec.minEntries) {
      errors.push(`Count too low: ${ctx.entries.length}`);
    }

    // Check if urlTemplate works
    if (indexer.urlTemplate && ctx.entries.length > 0) {
      const firstEntry = ctx.entries[0];
      const finalUrl = indexer.urlTemplate.replace('${url}', firstEntry.url);
      if (!finalUrl.startsWith('https://')) {
        errors.push(`Invalid generated URL: ${finalUrl}`);
      }
      // Check for double slashes like https://example.com//path
      if (finalUrl.match(/https?:\/\/[^/]+\/\//)) {
        errors.push(`Double slash in generated URL: ${finalUrl}`);
      }
    }

    for (const symbol of spec.expectedSymbols) {
      const found = ctx.entries.some(e => e.title.toLowerCase().includes(symbol.toLowerCase()));
      if (!found) {
        errors.push(`Missing: "${symbol}"`);
      }
    }

    if (errors.length > 0) {
      console.log('❌');
      errors.forEach(e => console.error(`     - ${e}`));
      return false;
    } else {
      console.log(`✅ (${ctx.entries.length} entries)`);
      return true;
    }
  } catch (error) {
    console.log('💥');
    console.error(`     - ${error}`);
    return false;
  }
}

async function main() {
  const targetIds = process.argv.slice(2);
  const targets = targetIds.length > 0 ? SPECS.filter(s => targetIds.includes(s.id)) : SPECS;
  console.log('=== Indexer Live Health Check ===\n');
  let successCount = 0;
  for (const spec of targets) {
    if (await runTest(spec)) successCount++;
  }
  console.log(`\nSummary: ${successCount} / ${targets.length} passed.`);
  if (successCount < targets.length) process.exit(1);
}

main();
