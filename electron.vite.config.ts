import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          mcp: resolve(__dirname, 'src/mcp/index.ts')
        },
        // ビルド後にindexersディレクトリをコピー
        output: {
          plugins: [
            {
              name: 'copy-indexers',
              writeBundle() {
                const srcDir = resolve(__dirname, 'src/indexers')
                const outDir = resolve(__dirname, 'out/main/indexers')

                if (!existsSync(srcDir)) return

                // 出力ディレクトリを作成
                mkdirSync(outDir, { recursive: true })

                // .jsファイルをコピー
                const files = readdirSync(srcDir).filter(f => f.endsWith('.js'))
                files.forEach(file => {
                  copyFileSync(join(srcDir, file), join(outDir, file))
                  console.log(`Copied ${file} to out/main/indexers/`)
                })
              }
            }
          ]
        }
      }
    }
  },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()]
  }
})
