
import fs from 'fs';
import { join } from 'path';
import os from 'os';
import { app } from 'electron';

const CHEM_DIR = join(os.homedir(), '.chemr');
const MCP_DIR = join(CHEM_DIR, 'mcp');

/**
 * MCPサーバー本体 (バンドル済みjs) を ~/.chemr/mcp/mcp.js にエクスポートする
 */
export function exportMcpServer(): void {
  try {
    if (!fs.existsSync(MCP_DIR)) {
      fs.mkdirSync(MCP_DIR, { recursive: true });
    }

    const mcpDest = join(MCP_DIR, 'mcp.js');

    // 開発時とパッケージ後でソースパスを調整
    // Viteビルド成果物は out/mcp/mcp.js にある
    const possiblePaths = [
      join(__dirname, '..', 'mcp', 'mcp.js'),
      join(app.getAppPath(), 'out', 'mcp', 'mcp.js'),
      join(process.resourcesPath, 'app.asar.unpacked', 'out', 'mcp', 'mcp.js')
    ];
    
    let sourcePath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        sourcePath = p;
        break;
      }
    }

    if (sourcePath) {
        const mcpContent = fs.readFileSync(sourcePath);
        fs.writeFileSync(mcpDest, mcpContent);
        console.error(`[McpExporter] Exported MCP server to ${mcpDest} (${mcpContent.length} bytes) from ${sourcePath}`);
    } else {
        console.error(`[McpExporter] Warning: Could not find MCP source in any of: ${possiblePaths.join(', ')}`);
    }
  } catch (error) {
    console.error('[McpExporter] Failed to export MCP server:', error);
  }
}
