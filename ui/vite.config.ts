/// <reference types="vitest" />
import fs from 'node:fs'
import { resolve } from 'node:path'
import stylex from '@stylexjs/unplugin'
import react from '@vitejs/plugin-react'
import ts from 'typescript'
import dts from 'vite-plugin-dts'
import { defineConfig, type Plugin } from 'vitest/config'


function preserveTokensStylexPlugin(): Plugin {
  return {
    name: 'preserve-tokens-stylex',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const tokensChunk = bundle['tokens.stylex.js']
      if (tokensChunk && tokensChunk.type === 'chunk') {
        const tokensTsPath = resolve(__dirname, 'src/tokens/tokens.stylex.ts')
        const tokensTsCode = fs.readFileSync(tokensTsPath, 'utf-8')
        const cleaned = tokensTsCode
          .replace(
            /import\s+\*\s+as\s+stylex\s+from\s+['"][^'"]+['"];?\s*/g,
            '',
          )
          .replace(
            /export\s+const\s+tokens\s*=\s*stylex\.defineVars\(/,
            'export const tokens = ',
          )
          .replace(
            /\)\s*\n\s*export\s+type\s+Tokens\s*=\s*typeof\s+tokens\s*$/,
            ';\n\nexport const rawTokens = tokens;\nexport const tokenValues = tokens;\n',
          )

        const transpiled = ts.transpileModule(cleaned, {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ESNext,
          },
        })
        tokensChunk.code = `'use client';\n${transpiled.outputText}`
      }
    },
  }
}



// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  plugins: [
    stylex.vite({
      useCSSLayers: true,
      dev: process.env.NODE_ENV === 'development',
      runtimeInjection: false,
    }),
    react(),
    dts({ tsconfigPath: './tsconfig.app.json' }),
    preserveTokensStylexPlugin(),
  ],
  build: {
    target: 'esnext',
    lib: {
      entry: {
        'moul-ui': resolve(__dirname, 'src/index.ts'),
        'tokens.stylex': resolve(__dirname, 'src/tokens/tokens.stylex.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-aria-components',
        '@stylexjs/stylex',
        'recharts',
        'react-aria',
        'input-otp',
      ],
      output: {
        banner: "'use client';",
      },
    },
  },
})

