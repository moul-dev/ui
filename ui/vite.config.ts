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
          }. React, StyleX, and React-adapter modules are forbidden in @moul-dev/web-component.`,
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
          `[noInlinedDependenciesPlugin] Third-party modules were bundled into @moul-dev/web-component:\n  ${inlined.join(
            '\n  ',
          )}\nImport only packages listed in ui/package.json "dependencies"; they are kept external.`,
        )
      }
    },
  }
}

/**
 * Strips comments and collapses whitespace in Lit `css` templates, which Lit
 * would otherwise ship as written (see `minify-css-templates.ts`). Build only:
 * Vitest and the dev server keep the styles as authored, and tests read them.
 */
export function minifyCssTemplatesPlugin(): Plugin {
  return {
    name: 'minify-css-templates',
    apply: 'build',
    enforce: 'pre',
    async transform(code, id) {
      if (
        !id.endsWith('.ts') ||
        id.includes('/node_modules/') ||
        !/\bcss\b/.test(code)
      ) {
        return null
      }
      // Imported on first use, so loading this config never loads TypeScript.
      const { minifyCssTemplates } = await import('./minify-css-templates')
      const minified = minifyCssTemplates(code, id)
      return minified === code ? null : { code: minified, map: null }
    },
  }
}

/**
 * The package has two entry points, each built in its own pass:
 *
 * - `vite build` emits the main entry, `dist/moul-ui.js`, plus the type
 *   declarations and the CSS tokens.
 * - `vite build --mode effects` emits `dist/effects.js`, the
 *   `@moul-dev/web-component/effects` entry for motion.
 *
 * Separate passes keep the main bundle exactly what it would be without the
 * effects entry: a shared build would move code both entries use into a
 * common chunk and change the main bundle's shape. The cost is that a small
 * internal helper used by both is present in both files. Third-party
 * packages are never duplicated, because both passes leave them as bare
 * imports for the app's bundler to resolve once.
 *
 * `--mode cdn` and `--mode cdn-effects` emit the same two entries under
 * `dist/cdn/` with everything inlined, for a plain `<script type="module">`
 * from a CDN, where bare specifiers cannot resolve.
 */
const ENTRIES = {
  main: { source: 'src/index.ts', fileName: 'moul-ui.js' },
  effects: { source: 'src/effects.ts', fileName: 'effects.js' },
} as const

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isCdn = mode === 'cdn' || mode === 'cdn-effects'
  const entry =
    mode === 'effects' || mode === 'cdn-effects'
      ? ENTRIES.effects
      : ENTRIES.main
  // Only the first pass clears `dist/`, writes declarations and copies assets.
  const isFirstPass = !isCdn && entry === ENTRIES.main
  return {
    test: {
      environment: 'happy-dom',
      globals: true,
      setupFiles: ['./src/test-setup.ts'],
    },
    plugins: [
      banReactImportsPlugin(),
      minifyCssTemplatesPlugin(),
      ...(isFirstPass
        ? [
            dts({ tsconfigPath: './tsconfig.app.json' }) as any,
            copyCssTokensPlugin(),
          ]
        : []),
      ...(isCdn ? [] : [noInlinedDependenciesPlugin()]),
    ],
    build: {
      target: 'esnext',
      outDir: isCdn ? 'dist/cdn' : 'dist',
      emptyOutDir: isFirstPass,
      copyPublicDir: isFirstPass,
      lib: {
        entry: resolve(__dirname, entry.source),
        formats: ['es'],
        fileName: () => entry.fileName,
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
