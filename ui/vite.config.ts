/// <reference types="vitest" />
import fs from 'node:fs'
import { resolve } from 'node:path'
import dts from 'vite-plugin-dts'
import { defineConfig, type Plugin } from 'vitest/config'

const { dependencies = {}, peerDependencies = {} } = JSON.parse(
  fs.readFileSync(resolve(__dirname, 'package.json'), 'utf8'),
) as Record<string, Record<string, string> | undefined>

// Runtime dependencies stay bare imports in the npm build so the consumer's
// bundler resolves one copy. Inlining Lit here would load a second
// ReactiveElement next to the app's own ("Multiple versions of Lit loaded").
const RUNTIME_DEPENDENCIES = Object.keys({
  ...dependencies,
  ...peerDependencies,
})

function isRuntimeDependency(id: string): boolean {
  return RUNTIME_DEPENDENCIES.some(
    (dep) => id === dep || id.startsWith(`${dep}/`),
  )
}

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

/**
 * Fails the npm build when a module from `node_modules` ends up inlined,
 * which happens when source imports a package that is missing from
 * `dependencies` (or reaches past a dependency into its own dependencies).
 */
export function noInlinedDependenciesPlugin(): Plugin {
  return {
    name: 'no-inlined-dependencies',
    apply: 'build',
    generateBundle(_options, bundle) {
      const inlined = Object.values(bundle).flatMap((output) =>
        output.type === 'chunk'
          ? Object.keys(output.modules).filter((id) =>
              id.includes('/node_modules/'),
            )
          : [],
      )
      if (inlined.length > 0) {
        this.error(
          `[noInlinedDependenciesPlugin] Third-party modules were bundled into @moul-dev/ui:\n  ${inlined.join(
            '\n  ',
          )}\nImport only packages listed in ui/package.json "dependencies"; they are kept external.`,
        )
      }
    },
  }
}

// `vite build` emits the npm entry, `dist/moul-ui.js`, with runtime
// dependencies left as bare imports. `vite build --mode cdn` emits
// `dist/cdn/moul-ui.js` with everything inlined for a plain
// `<script type="module">` from a CDN, where bare specifiers cannot resolve.
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isCdn = mode === 'cdn'
  return {
    test: {
      environment: 'happy-dom',
      globals: true,
      setupFiles: ['./src/test-setup.ts'],
    },
    plugins: [
      banReactImportsPlugin(),
      ...(isCdn
        ? []
        : [
            dts({ tsconfigPath: './tsconfig.app.json' }) as any,
            copyCssTokensPlugin(),
            noInlinedDependenciesPlugin(),
          ]),
    ],
    build: {
      target: 'esnext',
      outDir: isCdn ? 'dist/cdn' : 'dist',
      emptyOutDir: !isCdn,
      copyPublicDir: !isCdn,
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        formats: ['es'],
        fileName: () => 'moul-ui.js',
      },
      rollupOptions: {
        external: isCdn ? [] : isRuntimeDependency,
        output: {
          banner: '"use client";',
          // The CDN file is never re-bundled, so it can drop whitespace and
          // pure annotations, and inline the virtualizer's lazy layout chunk.
          ...(isCdn ? { minify: true, codeSplitting: false } : {}),
        },
      },
    },
  }
})
