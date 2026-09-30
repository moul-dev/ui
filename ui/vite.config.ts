/// <reference types="vitest" />
import fs from 'node:fs'
import { resolve } from 'node:path'
import stylex from '@stylexjs/unplugin'
import react from '@vitejs/plugin-react'
import { Features } from 'lightningcss'
import ts from 'typescript'
import dts from 'vite-plugin-dts'
import { defineConfig, type Plugin } from 'vitest/config'

function preserveTokensStylexPlugin(): Plugin {
  return {
    name: 'preserve-tokens-stylex',
    apply: 'build',
    enforce: 'post',
    async closeBundle() {
      const outDir = resolve(__dirname, 'dist')
      const stylexCssPath = resolve(outDir, 'assets/stylex.css')
      const themeCssPath = resolve(__dirname, 'src/styles/theme.css')
      const tokensTsPath = resolve(__dirname, 'src/tokens/tokens.stylex.ts')

      // Emit dist/tokens.stylex.js with stylex.defineVars() intact for consumer apps
      if (fs.existsSync(tokensTsPath)) {
        const tokensTsCode = fs.readFileSync(tokensTsPath, 'utf-8')
        const transpiled = ts.transpileModule(tokensTsCode, {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ESNext,
          },
        })
        fs.writeFileSync(
          resolve(outDir, 'tokens.stylex.js'),
          `'use client';\n${transpiled.outputText}`,
          'utf-8',
        )
      }

      if (fs.existsSync(themeCssPath)) {
        const themeCss = fs.readFileSync(themeCssPath, 'utf-8').trim()

        // Also write standalone dist/theme.css
        fs.writeFileSync(resolve(outDir, 'theme.css'), `${themeCss}\n`, 'utf-8')

        // Prepend theme.css into dist/assets/stylex.css
        if (fs.existsSync(stylexCssPath)) {
          const currentStylexCss = fs.readFileSync(stylexCssPath, 'utf-8')
          if (!currentStylexCss.includes('[data-theme="light"]')) {
            fs.writeFileSync(
              stylexCssPath,
              `${themeCss}\n\n${currentStylexCss}`,
              'utf-8',
            )
          }
        }
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
      lightningcssOptions: {
        exclude: Features.LightDark, // Prevents lowering to --lightningcss-light/dark
      },
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
