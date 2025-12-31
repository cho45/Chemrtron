
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'out/mcp',
    lib: {
      entry: resolve(__dirname, 'src/mcp/index.ts'),
      formats: ['cjs']
    },
    rollupOptions: {
      // Node.js built-in modules must be external
      external: (id) => {
        const builtins = [
          'fs', 'path', 'os', 'url', 'http', 'https', 'child_process',
          'zlib', 'stream', 'util', 'crypto', 'events', 'buffer',
          'net', 'tls', 'assert', 'fs/promises'
        ]
        return id.startsWith('node:') || builtins.includes(id)
      },
      output: {
        entryFileNames: 'mcp.js',
        // Ensure all code is in a single file
        inlineDynamicImports: true,
        manualChunks: undefined
      }
    },
    ssr: true,
    target: 'node20',
    minify: false,
    emptyOutDir: true
  },
  ssr: {
    noExternal: true
  }
})
