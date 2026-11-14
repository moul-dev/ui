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
 * - `vite build --mode canvas` emits `dist/canvas.js`, the
 *   `@moul-dev/web-component/canvas` entry, and one file per canvas and
 *   WebGL element, `dist/canvas/<name>.js`, each also importable on its own
 *   as `@moul-dev/web-component/canvas/<name>`. `canvas.js` holds no element:
 *   it loads each element's file the first time its tag appears. Code the
 *   elements share goes in one chunk, `dist/chunks/canvas-shared.js`.
 *
 * `--mode cdn`, `--mode cdn-effects` and `--mode cdn-canvas` emit the same
 * entries under `dist/cdn/` with everything inlined, for a plain
 * `<script type="module">` from a CDN, where bare specifiers cannot resolve.
 * The canvas pass keeps its files split there too, so a page still loads
 * only the elements it uses.
 */
const ENTRIES = {
  main: { source: 'src/index.ts', fileName: 'moul-ui.js' },
  effects: { source: 'src/effects.ts', fileName: 'effects.js' },
} as const

/**
 * The canvas pass's entries: the loader, plus one per file in
 * `src/canvas/`, named after the file (`canvas/globe` for `globe.ts`).
 */
export function canvasEntries(): Record<string, string> {
  const dir = resolve(__dirname, 'src/canvas')
  const pieces = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((name) => /^[a-z0-9-]+\.ts$/.test(name))
    : []
  return Object.fromEntries([
    ['canvas', resolve(__dirname, 'src/canvas.ts')],
    ...pieces.map((name) => [
      `canvas/${name.replace(/\.ts$/, '')}`,
      resolve(dir, name),
    ]),
  ])
}

/** Code the canvas elements share (controllers, helpers, styles and, on the CDN, Lit) goes in one chunk. */
function canvasChunk(id: string): string | undefined {
  return /\/(?:node_modules|src\/(?:controllers|utils|styles))\//.test(id)
    ? 'shared'
    : undefined
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isCdn = mode.startsWith('cdn')
  const isCanvas = mode === 'canvas' || mode === 'cdn-canvas'
  const entry =
    mode === 'effects' || mode === 'cdn-effects'
      ? ENTRIES.effects
      : ENTRIES.main
  // Only the first pass clears `dist/`, writes declarations and copies assets.
  const isFirstPass = !isCdn && !isCanvas && entry === ENTRIES.main
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
            dts({
              tsconfigPath: './tsconfig.app.json',
              // Overrides the tsconfig's exclude, so it repeats the test files
              // and adds the sandbox, which is the dev page, not package API.
              exclude: [
                'src/**/*.test.ts',
                'src/**/*.test.tsx',
                'src/**/test-setup.ts',
                'src/sandbox.ts',
                'node_modules/**',
              ],
            }) as any,
            copyCssTokensPlugin(),
          ]
        : []),
      ...(isCdn ? [] : [noInlinedDependenciesPlugin()]),
    ],
    build: {
      target: 'esnext',
      outDir: isCdn ? 'dist/cdn' : 'dist',
      emptyOutDir: isFirstPass,
      // `public/` holds the sandbox's favicon and icons, not package assets.
      copyPublicDir: false,
      lib: isCanvas
        ? {
            entry: canvasEntries(),
            formats: ['es'],
            fileName: (_format: string, name: string) => `${name}.js`,
          }
        : {
            entry: resolve(__dirname, entry.source),
            formats: ['es'],
            fileName: () => entry.fileName,
          },
      rollupOptions: {
        external: isCdn ? [] : isRuntimeDependency,
        // The canvas files import `utils/motion` for the reduced-motion check
        // alone; without this, a bare `import "motion"` would stay behind and
        // make every canvas element load the animation library for nothing.
        ...(isCanvas
          ? { treeshake: { moduleSideEffects: 'no-external' } }
          : {}),
        output: {
          banner: '"use client";',
          // The CDN file is never re-bundled, so it can drop whitespace and
          // pure annotations, and inline the virtualizer's lazy layout chunk.
          // The canvas files stay split even there: loading on demand is the point.
          ...(isCdn ? { minify: true } : {}),
          ...(isCdn && !isCanvas ? { codeSplitting: false } : {}),
          ...(isCanvas
            ? {
                chunkFileNames: 'chunks/canvas-[name].js',
                manualChunks: canvasChunk,
              }
            : {}),
        },
      },
    },
  }
})
