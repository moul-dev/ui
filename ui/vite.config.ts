/// <reference types="vitest" />
import fs from 'node:fs'
import { resolve } from 'node:path'
import dts from 'vite-plugin-dts'
import { defineConfig, type Plugin } from 'vitest/config'

const BANNED_IMPORT_PREFIXES = [
  'react',
  'react-dom',
  'react-aria',
  'react-aria-components',
  '@stylexjs/stylex',
  '@lit/react',
  'motion/react',
] as const

export function banReactImportsPlugin(): Plugin {
  return {
    name: 'ban-react-imports',
    enforce: 'pre',
    resolveId(id: string, importer?: string) {
      const isBanned = BANNED_IMPORT_PREFIXES.some(
        (prefix) =>
          id === prefix ||
          id.startsWith(`${prefix}/`) ||
          id.startsWith(`${prefix}-`),
      )
      if (isBanned) {
        throw new Error(
          `[banReactImportsPlugin] Prohibited import detected: "${id}"${
            importer ? ` in "${importer}"` : ''
          }. React, StyleX, and React-adapter modules are forbidden in @moul-dev/ui.`,
        )
      }
      return null
    },
  }
}

export function copyCssTokensPlugin(): Plugin {
  return {
    name: 'copy-css-tokens',
    apply: 'build',
    closeBundle() {
      const srcPath = resolve(__dirname, 'src/styles/style.css')
      const outDir = resolve(__dirname, 'dist/assets')
      const destPath = resolve(outDir, 'style.css')

      if (fs.existsSync(srcPath)) {
        fs.mkdirSync(outDir, { recursive: true })
        fs.copyFileSync(srcPath, destPath)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  plugins: [
    banReactImportsPlugin(),
    dts({ tsconfigPath: './tsconfig.app.json' }) as any,
    copyCssTokensPlugin(),
  ],
  build: {
    target: 'esnext',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'moul-ui.js',
    },
    rollupOptions: {
      output: {
        banner: '"use client";',
      },
    },
  },
})
