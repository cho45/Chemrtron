import { parseHTML } from 'linkedom';
import type { IndexerContext, IndexerDefinition } from '../../src/shared/types';
import * as path from 'path';
import * as fs from 'fs';

/**
 * CLI環境用のライブ IndexerContext 実装
 */
class LiveIndexerContext implements IndexerContext {
  public entries: Array<{ title: string; url: string }> = [];

  pushIndex(title: string, url: string): void {
    // タイトルの空白を正規化
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
      } catch (e) {
        console.error(`  [Crawl Error] ${url}: ${e}`);
      }
    }
  }

  progress() {}
}

async function runTest(indexerId: string): Promise<boolean> {
  process.stdout.write(`Testing Indexer: ${indexerId.padEnd(15)} `);
  
  try {
    const indexPath = path.resolve(__dirname, `../../src/indexers/${indexerId}.js`);
    const module = await import(indexPath);
    const indexer: IndexerDefinition = module.default;
    const ctx = new LiveIndexerContext();

    if (!indexer.testSpec) {
      console.log('⚠️ (No testSpec defined)');
      return true;
    }

    await indexer.index(ctx);

    const errors: string[] = [];
    const spec = indexer.testSpec;

    if (spec.minEntries && ctx.entries.length < spec.minEntries) {
      errors.push(`Count too low: ${ctx.entries.length} < ${spec.minEntries}`);
    }

    for (const symbol of spec.expectedSymbols) {
      const found = ctx.entries.some(e => e.title.toLowerCase().includes(symbol.toLowerCase()));
      if (!found) {
        errors.push(`Missing: "${symbol}"`);
      }
    }

    // URL Template validation
    if (indexer.urlTemplate && ctx.entries.length > 0) {
      const firstEntry = ctx.entries[0];
      const finalUrl = indexer.urlTemplate.replace('${url}', firstEntry.url);
      if (!finalUrl.startsWith('https://')) {
        errors.push(`Invalid generated URL: ${finalUrl}`);
      }
      if (finalUrl.match(/https?:\/\/[^/]+\/\//)) {
        errors.push(`Double slash in generated URL: ${finalUrl}`);
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
  const indexersDir = path.resolve(__dirname, '../../src/indexers');
  const allFiles = fs.readdirSync(indexersDir)
    .filter(f => f.endsWith('.js') && f !== 'sample.js')
    .map(f => f.replace('.js', ''));

  const targetIds = process.argv.slice(2);
  const targets = targetIds.length > 0 ? targetIds : allFiles;

  console.log('=== Indexer Live Health Check ===\n');

  let successCount = 0;
  let skippedCount = 0;

  for (const id of targets) {
    const ok = await runTest(id);
    if (ok) successCount++;
    else if (ok === null) skippedCount++;
  }

  console.log(`\nSummary: ${successCount} passed, ${targets.length - successCount} failed.`);
  if (successCount < targets.length) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});