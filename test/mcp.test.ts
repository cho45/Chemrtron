import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert/strict';
import http from 'http';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MCP_SERVER_PATH = path.resolve(__dirname, '../out/mcp/mcp.js');

// Test Configuration
const TEST_PORT = 39393;
const MOCK_INDEXER_ID = 'test-mock';
const TEMP_DIR = path.join(os.tmpdir(), 'chemr-mcp-test-' + Date.now());
const CACHE_DIR = path.join(os.homedir(), '.chemr', 'cache'); // Real cache dir for now, as cache-manager uses homedir
const MOCK_CACHE_FILE = path.join(CACHE_DIR, `${MOCK_INDEXER_ID}.dat`);

// Prepare Mock Data
const MOCK_HTML = `
<!DOCTYPE html>
<html>
<body>
  <main>
    <h1>Test API Documentation</h1>
    <p>This is a mock function.</p>
    <pre><code>function testMock() { return true; }</code></pre>
  </main>
</body>
</html>
`;

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number | string;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: any;
}

class McpClient {
  private proc: ChildProcess;
  private buffer = '';
  private pendingRequests = new Map<number | string, (res: JsonRpcResponse) => void>();

  constructor(env: NodeJS.ProcessEnv = {}) {
    this.proc = spawn('node', [MCP_SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...env }
    });

    this.proc.stdout?.on('data', (data) => {
      this.buffer += data.toString();
      const lines = this.buffer.split('\n');
      if (!this.buffer.endsWith('\n')) {
          this.buffer = lines.pop() || '';
      } else {
          this.buffer = '';
      }

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const response = JSON.parse(line);
          this.handleResponse(response);
        } catch (e) {
          // Ignore
        }
      }
    });

    this.proc.stderr?.on('data', (data) => {
      console.error(`[MCP Server] ${data}`);
    });
  }

  private handleResponse(response: JsonRpcResponse) {
    if (response.id !== undefined && this.pendingRequests.has(response.id)) {
      const resolve = this.pendingRequests.get(response.id)!;
      this.pendingRequests.delete(response.id);
      resolve(response);
    }
  }

  async send(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const msg = JSON.stringify(request) + '\n';
    this.proc.stdin?.write(msg);

    if (request.id !== undefined) {
      return new Promise((resolve) => {
        this.pendingRequests.set(request.id!, resolve);
      });
    }
    return Promise.resolve({ jsonrpc: '2.0', id: -1 }); 
  }

  async close() {
    this.proc.stdin?.end();
    this.proc.stdout?.removeAllListeners();
    this.proc.stderr?.removeAllListeners();
    this.proc.kill();
    
    // Safety kill
    const timeout = setTimeout(() => {
        this.proc.kill('SIGKILL');
    }, 1000).unref();

    await new Promise<void>(resolve => {
        this.proc.on('exit', () => resolve());
    });
    clearTimeout(timeout);
  }
}

// Mock Server
let server: http.Server;

async function startMockServer() {
  return new Promise<void>((resolve) => {
    server = http.createServer((req, res) => {
      console.log(`[MockServer] Request: ${req.url}`);
      if (req.url === '/docs/test-page') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(MOCK_HTML);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    server.listen(TEST_PORT, () => {
      console.log(`[MockServer] Listening on ${TEST_PORT}`);
      resolve();
    });
  });
}

function setupTestEnv() {
  // Create temp dir for extra indexers
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  
  const indexerContent = `
    export default {
      id: '${MOCK_INDEXER_ID}',
      name: 'Test Mock Indexer',
      urlTemplate: 'http://localhost:${TEST_PORT}/docs/\${url}',
      contentSelector: 'main',
      async index(ctx) {}
    };
  `;
  fs.writeFileSync(path.join(TEMP_DIR, 'mock.js'), indexerContent);

  // Create fake cache
  // Format: \x01{metadata}\ntitle\turl\n
  const metadata = { id: MOCK_INDEXER_ID, name: 'Test Mock Indexer', version: '1.0', created: Date.now() };
  const data = `Test Function\ttest-page\n`;
  const content = `\x01${JSON.stringify(metadata)}\n${data}`;
  
  // Ensure cache dir exists (it should, but just in case)
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(MOCK_CACHE_FILE, content);
}

function cleanupTestEnv() {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(MOCK_CACHE_FILE)) {
    fs.unlinkSync(MOCK_CACHE_FILE);
  }
  if (server) {
    server.close();
  }
}

async function runTests() {
  setTimeout(() => {
    console.error('❌ Test timeout exceeded (10s).');
    cleanupTestEnv();
    process.exit(1);
  }, 10000).unref();

  console.log('Setting up test environment...');
  setupTestEnv();
  await startMockServer();

  console.log('Starting MCP Server Tests...');
  // Pass the temp dir as extra indexers path
  const client = new McpClient({
    CHEMR_EXTRA_INDEXERS_PATH: TEMP_DIR
  });
  
  let testFailed = false;

  try {
    // 1. Initialize
    console.log('Test 1: Initialize');
    await client.send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1" } }
    });
    // Skip notification
    await client.send({ jsonrpc: "2.0", method: "notifications/initialized" });
    console.log('  ✅ Passed');

    // 2. Search in Mock Indexer
    console.log('Test 2: Search "Test Function" in mock indexer');
    const searchRes = await client.send({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "search_docs",
        arguments: { query: "Test Function", indexerId: MOCK_INDEXER_ID }
      }
    });
    
    const results = JSON.parse(searchRes.result.content[0].text);
    assert.equal(results.length, 1);
    assert.equal(results[0].title, "Test Function");
    console.log('  ✅ Passed');

    // 3. Read Resource (Fetch from Mock Server)
    console.log('Test 3: Read Resource');
    const resourceUri = results[0].uri; // Should be chemr://doc/test-mock/test-page
    console.log(`  Fetching ${resourceUri}`);
    // Check format
    assert.ok(resourceUri.startsWith('chemr://doc/test-mock/'), `URI should start with chemr://doc/test-mock/, got ${resourceUri}`);
    
    const readRes = await client.send({
      jsonrpc: "2.0",
      id: 3,
      method: "resources/read",
      params: { uri: resourceUri }
    });
    
    if (readRes.error) {
        console.error('  ❌ JSON-RPC Error:', JSON.stringify(readRes.error, null, 2));
    } else if (!readRes.result || !readRes.result.contents) {
        console.error('  ❌ Invalid Response:', JSON.stringify(readRes, null, 2));
    }

    const content = readRes.result.contents[0];
    assert.equal(content.mimeType, "text/markdown");
    
    // Check if Turndown converted the HTML correctly
    // <main> -> # Test API Documentation ... function testMock() ...
    assert.ok(content.text.includes("# Test API Documentation"));
    assert.ok(content.text.includes("function testMock()"));
    console.log('  ✅ Passed');

  } catch (e) {
    console.error('❌ Test Failed:', e);
    testFailed = true;
  } finally {
    await client.close();
    cleanupTestEnv();
  }

  if (testFailed) {
    process.exit(1);
  }
} // The original replace string ends here, but the file content continues with runTests();

runTests();
