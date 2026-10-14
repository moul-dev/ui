import { copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { glob } from 'glob'
import ts from 'typescript'
import dts from 'vite-plugin-dts'
import { defineConfig, type Plugin } from 'vitest/config'

function copyTokensPlugin(): Plugin {
  return {
    name: 'copy-tokens-plugin',
    closeBundle() {
      mkdirSync(resolve(__dirname, 'dist/assets'), { recursive: true })
      copyFileSync(
        resolve(__dirname, 'src/shared/tokens.css'),
        resolve(__dirname, 'dist/assets/tokens.css'),
      )
      copyFileSync(
        resolve(__dirname, 'src/shared/tokens.css'),
        resolve(__dirname, 'dist/tokens.css'),
      )
    },
  }
}

function cleanBootstrapCssPlugin(): Plugin {
  return {
    name: 'clean-bootstrap-css',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('bootstrap') && id.includes('.css')) {
        let cleaned = code.replace(/\/\*# sourceMappingURL=.*?\*\//g, '')
        // Replace ':root,\n:host' and ':root,\n  :host' with ':root'
        cleaned = cleaned.replace(/:root,\s*:host/g, ':root')
        return {
          code: cleaned,
          map: null,
        }
      }
    },
  }
}

function tsDecoratorsPlugin(): Plugin {
  return {
    name: 'ts-decorators-plugin',
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('.ts') && !id.includes('node_modules')) {
        const result = ts.transpileModule(code, {
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ESNext,
            useDefineForClassFields: false,
            experimentalDecorators: false,
          },
          fileName: id,
        })
        return {
          code: result.outputText,
          map: result.sourceMapText ? JSON.parse(result.sourceMapText) : null,
        }
      }
    },
  }
}

const componentEntries = Object.fromEntries(
  glob
    .sync('src/components/*/index.ts', { cwd: __dirname })
    .map((file) => [
      file.replace(/^src\//, '').replace(/\.ts$/, ''),
      resolve(__dirname, file),
    ]),
)

export default defineConfig({
  plugins: [
    cleanBootstrapCssPlugin(),
    tsDecoratorsPlugin(),
    dts({ tsconfigPath: './tsconfig.app.json' }) as unknown as Plugin,
    copyTokensPlugin(),
  ],
  build: {
    target: 'es2022',
    cssMinify: 'esbuild',
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        ...componentEntries,
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => {
        if (id.includes('.css') || id.includes('?inline')) return false
        if (id === 'lit' || id.startsWith('lit/')) return true
        if (id === '@floating-ui/dom' || id.startsWith('@floating-ui/dom/'))
          return true
        if (id === 'bootstrap' || id.startsWith('bootstrap/')) return true
        return false
      },
      output: {
        chunkFileNames: 'shared/[name]-[hash].js',
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
