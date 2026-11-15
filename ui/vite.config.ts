/// <reference types="vitest" />
import fs from 'node:fs'
import { resolve } from 'node:path'
import { parseAst, type ResolvedConfig, transformWithOxc } from 'vite'
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

/** The fields of an ESTree statement `reducedMotionModulePlugin` reads; Rolldown's parser adds `start` and `end`. */
interface Statement {
  type: string
  start: number
  end: number
  importKind?: string
  declaration?: {
    type: string
    id?: { name: string } | null
    declarations?: Array<{ id: { type: string; name?: string } }>
  } | null
  source?: { value: unknown; start: number; end: number } | null
  specifiers?: Array<{
    type: string
    importKind?: string
    imported?: { type: string; name?: string }
    local: { type: string; name?: string }
  }>
}

/** Every identifier name inside an AST node, wherever it appears. */
function identifiersIn(node: unknown, into = new Set<string>()): Set<string> {
  if (Array.isArray(node)) {
    for (const child of node) identifiersIn(child, into)
  } else if (node && typeof node === 'object') {
    const fields = node as Record<string, unknown>
    if (fields.type === 'Identifier' && typeof fields.name === 'string') {
      into.add(fields.name)
    }
    for (const value of Object.values(fields)) {
      if (value && typeof value === 'object') identifiersIn(value, into)
    }
  }
  return into
}

/** The names a top-level statement declares, other than types. */
function declaredNames(statement: Statement): string[] {
  const declaration =
    statement.type === 'ExportNamedDeclaration'
      ? statement.declaration
      : (statement as Statement['declaration'])
  if (declaration?.type === 'FunctionDeclaration') {
    return declaration.id ? [declaration.id.name] : []
  }
  if (declaration?.type === 'VariableDeclaration') {
    return (declaration.declarations ?? []).flatMap((declarator) =>
      declarator.id.type === 'Identifier' && declarator.id.name
        ? [declarator.id.name]
        : [],
    )
  }
  return []
}

/**
 * The exports of a module (parsed with types) that work without motion:
 * those whose declarations reach no value imported from `motion`, directly
 * or through the module's other declarations. Over-counts what a
 * declaration uses, so it can only err towards keeping motion.
 */
export function motionFreeExports(body: Statement[]): string[] {
  const motionValues = new Set<string>()
  const mentions = new Map<string, Set<string>>()
  const exported: string[] = []
  for (const statement of body) {
    if (statement.type === 'ImportDeclaration') {
      if (statement.source?.value !== 'motion') continue
      if (statement.importKind === 'type') continue
      for (const spec of statement.specifiers ?? []) {
        if (spec.importKind !== 'type' && spec.local.name) {
          motionValues.add(spec.local.name)
        }
      }
      continue
    }
    const names = declaredNames(statement)
    const used = identifiersIn(statement)
    for (const name of names) mentions.set(name, used)
    if (statement.type === 'ExportNamedDeclaration' && !statement.source) {
      exported.push(...names)
      for (const spec of statement.specifiers ?? []) {
        if (spec.local.name) exported.push(spec.local.name)
      }
    }
  }
  const needsMotion = (name: string, seen: Set<string>): boolean => {
    if (motionValues.has(name)) return true
    if (seen.has(name)) return false
    seen.add(name)
    return [...(mentions.get(name) ?? [])].some(
      (used) => used !== name && needsMotion(used, seen),
    )
  }
  return exported.filter((name) => !needsMotion(name, new Set()))
}

/**
 * CDN build only. `src/utils/motion.ts` holds two things: the reduced-motion
 * checks (`prefersReducedMotion`, `watchReducedMotion`), which every canvas
 * element and many controllers use, and the `animate()` helpers, which
 * import motion. A module lands in exactly one chunk, so in the shared CDN
 * build the chunk holding the checks would import motion, and every canvas
 * element would download the animation library to read a media query.
 *
 * This serves the checks as a module of their own, `moul:reduced-motion`
 * (the same source, cut down by tree-shaking to the two functions), and
 * points every import that takes nothing else at it. `utils/motion.ts`
 * imports them from there and re-exports them, so they are still bundled
 * once. The npm build compiles the module as written.
 *
 * The elements entries' copies (see `elementsNamespacePlugin`) split off
 * more: every export that works without motion (`motionFreeExports`: the
 * checks, the easing and spring constants, the pose helpers), so
 * `elements/button.js`, which reads `EASE_OUT`, does not download motion
 * either. The bundles keep the two-function split, and their bytes.
 */
export function reducedMotionModulePlugin(): Plugin {
  const motionModule = resolve(__dirname, 'src/utils/motion.ts')
  const srcDir = `${resolve(__dirname, 'src')}/`
  const specifier = 'moul:reduced-motion'
  const virtualId = `\0${specifier}`
  const checks = ['prefersReducedMotion', 'watchReducedMotion']
  let motionFree: string[] | undefined
  /** Whether an import or re-export takes `names` and nothing else. */
  const takesOnly = (statement: Statement, names: string[]): boolean => {
    const taken = (statement.specifiers ?? []).map((spec) =>
      spec.type === 'ImportSpecifier'
        ? spec.imported
        : spec.type === 'ExportSpecifier'
          ? spec.local
          : undefined,
    )
    return (
      taken.length > 0 &&
      taken.every(
        (name) =>
          name?.type === 'Identifier' && names.includes(name.name ?? ''),
      )
    )
  }
  return {
    name: 'reduced-motion-module',
    apply: 'build',
    resolveId(id) {
      return id === specifier ? virtualId : null
    },
    load(id) {
      return withoutElementsNamespace(id) === virtualId
        ? { code: fs.readFileSync(motionModule, 'utf8'), moduleType: 'ts' }
        : null
    },
    async transform(code, namespacedId) {
      // The elements entries' copies (see `elementsNamespacePlugin`) are cut
      // the same way as the modules they copy.
      const id = withoutElementsNamespace(namespacedId)
      if (!id.startsWith(srcDir) || !code.includes('motion')) return null
      const body = this.parse(code).body as unknown as Statement[]
      motionFree ??= motionFreeExports(
        parseAst(fs.readFileSync(motionModule, 'utf8'), { lang: 'ts' })
          .body as unknown as Statement[],
      )
      const names = namespacedId === id ? checks : motionFree
      // [start, end, replacement], applied from the end so offsets hold.
      const edits: Array<[number, number, string]> = []
      const moved: string[] = []
      for (const statement of body) {
        if (id === motionModule) {
          const declared = declaredNames(statement)
          if (
            statement.type === 'ExportNamedDeclaration' &&
            declared.length > 0 &&
            declared.every((name) => names.includes(name))
          ) {
            edits.push([statement.start, statement.end, ''])
            moved.push(...declared)
          }
          continue
        }
        const { source } = statement
        if (
          (statement.type !== 'ImportDeclaration' &&
            statement.type !== 'ExportNamedDeclaration') ||
          typeof source?.value !== 'string' ||
          !source.value.endsWith('motion') ||
          !takesOnly(statement, names) ||
          withoutElementsNamespace(
            (await this.resolve(source.value, namespacedId))?.id ?? '',
          ) !== motionModule
        ) {
          continue
        }
        edits.push([source.start, source.end, JSON.stringify(specifier)])
      }
      if (id === motionModule) {
        if (moved.length !== names.length) {
          this.error(
            `[reducedMotionModulePlugin] Expected src/utils/motion.ts to declare ${names.join(', ')} in exports of their own; update the plugin to match.`,
          )
        }
        edits.push([
          0,
          0,
          `import { ${names.join(', ')} } from ${JSON.stringify(specifier)};\nexport { ${names.join(', ')} };\n`,
        ])
      }
      let next = code
      for (const [start, end, text] of edits.sort((a, b) => b[0] - a[0])) {
        next = next.slice(0, start) + text + next.slice(end)
      }
      return edits.length > 0 ? { code: next, map: null } : null
    },
  }
}

/**
 * The package has three entry points. The npm build gives each its own pass:
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
 * `vite build --mode cdn` emits all three under `dist/cdn/`, for a plain
 * `<script type="module">` from a CDN, where bare specifiers cannot resolve,
 * so nothing there is external. It is one pass, so that Lit, motion and the
 * code the entries share are bundled once, into `dist/cdn/chunks/`, which
 * the entries import by relative URL: a page that loads `moul-ui.js`,
 * `effects.js` and `canvas.js` runs one Lit and one motion. `cdnChunkGroups`
 * draws the chunks so that no entry downloads code it does not run.
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

/**
 * The elements pass's entries: the loader, plus one per file in
 * `src/elements/`, named after the file (`elements/button` for
 * `button.ts`). `bun run sync:elements` writes those files.
 */
export function elementEntries(): Record<string, string> {
  const dir = resolve(__dirname, 'src/elements')
  const pieces = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((name) => /^[a-z0-9-]+\.ts$/.test(name))
    : []
  return Object.fromEntries([
    ['loader', resolve(__dirname, 'src/loader.ts')],
    ...pieces.map((name) => [
      `elements/${name.replace(/\.ts$/, '')}`,
      resolve(dir, name),
    ]),
  ])
}

/**
 * Elements entries only (the npm elements pass, and their copies in the CDN
 * pass). The build applies `package.json`'s `sideEffects`, which lists
 * built files, to `src/` as well, so it takes every component module for
 * free of side effects, and drops an import that runs one only to register
 * its element: `Button.ts`'s `import '../IconMorph/IconMorph'`. The bundles
 * never notice, because their entries export every component anyway; one
 * element's file would lose the elements it renders. This marks each module
 * that registers an element as having side effects, so those imports stay.
 */
export function elementModulesHaveSideEffectsPlugin(options: {
  onlyCopies: boolean
}): Plugin {
  const srcDir = `${resolve(__dirname, 'src')}/`
  return {
    name: 'element-modules-have-side-effects',
    apply: 'build',
    transform(code, id) {
      if (options.onlyCopies && !id.startsWith(ELEMENTS_NAMESPACE)) return null
      return withoutElementsNamespace(id).startsWith(srcDir) &&
        /\bdefineElement\(\s*['"]moul-/.test(code)
        ? { moduleSideEffects: true }
        : null
    },
  }
}

/**
 * npm elements pass only. The loader imports canvas elements from
 * `./canvas/<name>`, which the canvas pass builds; here they stay imports
 * of those files rather than second copies of the elements.
 */
export function canvasPiecesExternalPlugin(): Plugin {
  const loader = resolve(__dirname, 'src/loader.ts')
  return {
    name: 'canvas-pieces-external',
    enforce: 'pre',
    resolveId(source, importer) {
      return importer === loader && /^\.\/canvas\/[a-z0-9-]+$/.test(source)
        ? { id: `${source}.js`, external: true }
        : null
    },
  }
}

/**
 * Every entry of the CDN pass, by output name: the main and effects
 * entries, the canvas pass's, and the elements pass's.
 */
export function cdnEntries(): Record<string, string> {
  return {
    'moul-ui': resolve(__dirname, ENTRIES.main.source),
    effects: resolve(__dirname, ENTRIES.effects.source),
    ...canvasEntries(),
    ...elementEntries(),
  }
}

/** Whether a CDN entry is the loader or one element's file. */
function isElementsEntry(name: string): boolean {
  return name === 'loader' || name.startsWith('elements/')
}

/** The prefix of the elements entries' own copies of modules in the CDN pass. */
const ELEMENTS_NAMESPACE = '\0moul-elements:'

/** A module id without the elements namespace: the file it copies. */
export function withoutElementsNamespace(id: string): string {
  return id.startsWith(ELEMENTS_NAMESPACE)
    ? id.slice(ELEMENTS_NAMESPACE.length)
    : id
}

/**
 * CDN build only. `elements/<name>.js` must hold one element's code in
 * chunks of its own, and `moul-ui.js` and `effects.js` hold the same code
 * inline. A module lands in exactly one chunk, so one build cannot do both.
 * Instead, everything the elements entries import is a copy of its own,
 * under `\0moul-elements:`, except Lit's runtime and motion, which every
 * entry shares. A page that loads `moul-ui.js` and the loader runs one Lit
 * and one motion, the loader skips the tags `moul-ui.js` registered, and
 * the bundles are exactly what they were before the elements entries.
 */
export function elementsNamespacePlugin(): Plugin {
  const elementsDir = `${resolve(__dirname, 'src/elements')}/`
  let config: ResolvedConfig | undefined
  return {
    name: 'elements-namespace',
    apply: 'build',
    enforce: 'pre',
    configResolved(resolved) {
      // `vitest/config` types this hook with Vitest's own copy of Vite.
      config = resolved as unknown as ResolvedConfig
    },
    async resolveId(source, importer, options) {
      if (
        !importer ||
        !(
          importer.startsWith(ELEMENTS_NAMESPACE) ||
          importer.startsWith(elementsDir)
        )
      ) {
        return null
      }
      const resolved = await this.resolve(
        source,
        withoutElementsNamespace(importer),
        { ...options, skipSelf: true },
      )
      if (
        !resolved ||
        resolved.external ||
        LIT_RUNTIME.test(resolved.id) ||
        MOTION.test(resolved.id)
      ) {
        return resolved
      }
      // Keeps what the package says about side effects, so tree-shaking
      // drops the same unused modules from a copy as from the original.
      return { ...resolved, id: `${ELEMENTS_NAMESPACE}${resolved.id}` }
    },
    load(id) {
      if (!id.startsWith(ELEMENTS_NAMESPACE)) return null
      const file = withoutElementsNamespace(id)
      // A copy of another plugin's virtual module is that plugin's to load.
      if (file.startsWith('\0')) return null
      const code = fs.readFileSync(file, 'utf8')
      if (!/\.ts$/.test(file)) return { code, moduleType: 'js' }
      // Vite compiles TypeScript by file path and skips `\0` ids, so a copy
      // is compiled here, by its file's path, with the same tsconfig.
      return transformWithOxc(
        code,
        file,
        { lang: 'ts', sourcemap: false },
        undefined,
        config,
      ).then((result) => ({ code: result.code, moduleType: 'js' }))
    },
  }
}

/** Code the canvas elements share (controllers, helpers and styles) goes in one chunk. */
function canvasChunk(id: string): string | undefined {
  return /\/(?:node_modules|src\/(?:controllers|utils|styles))\//.test(id)
    ? 'shared'
    : undefined
}

/**
 * Lit's runtime, which records its version on `globalThis` and must run
 * once per page. Directives are not part of it; they go where the code that
 * uses them goes.
 */
const LIT_RUNTIME =
  /[\\/]node_modules[\\/](?:lit[\\/]index|lit-element[\\/]lit-element|lit-html[\\/](?:lit-html|is-server)|@lit[\\/]reactive-element[\\/](?:reactive-element|css-tag))\.js$/

/** motion and the packages it is built from. */
const MOTION =
  /[\\/]node_modules[\\/](?:motion|motion-dom|motion-utils|framer-motion)[\\/]/

/** The CDN entries fall in three families, by which import a page uses. */
const FAMILIES = ['main', 'effects', 'canvas'] as const
type Family = (typeof FAMILIES)[number]

interface ModuleGraph {
  getModuleInfo(id: string): { importedIds: readonly string[] } | null
}

/**
 * How the CDN pass splits its code:
 *
 * - `chunks/lit.js` holds Lit's runtime and `chunks/motion.js` holds motion,
 *   whichever entries use them.
 * - A module that entries of more than one family import statically goes
 *   in a chunk named for those families: `chunks/shared.js` for all three,
 *   `chunks/shared-main-effects.js` for the main and effects entries, and so
 *   on. Every module in such a chunk is one that each entry loading it
 *   imports, so `moul-ui.js` never downloads effects or canvas code.
 * - Controllers, helpers and styles only canvas elements use go in
 *   `chunks/canvas-shared.js`, as in the npm build.
 * - Everything else stays in the one entry that imports it, or in a chunk
 *   loaded on demand (the canvas elements, the virtualizer's layout).
 */
export function cdnChunkGroups(entries: Record<string, string>) {
  let families: Map<string, Set<Family>> | undefined
  /** Walks each entry's static imports once, recording which families reach each module. */
  function familiesOf(id: string, graph: ModuleGraph): Set<Family> {
    if (!families) {
      const reached = new Map<string, Set<Family>>()
      for (const [name, entry] of Object.entries(entries)) {
        // Their modules are copies no other entry reaches (see
        // `elementsNamespacePlugin`), so they need no family chunks.
        if (isElementsEntry(name)) continue
        if (!graph.getModuleInfo(entry)) {
          throw new Error(
            `[cdnChunkGroups] The CDN pass has no module ${entry}.`,
          )
        }
        const family: Family =
          name === 'moul-ui'
            ? 'main'
            : name === 'effects'
              ? 'effects'
              : 'canvas'
        const stack = [entry]
        while (stack.length > 0) {
          const next = stack.pop() as string
          const seen = reached.get(next) ?? new Set<Family>()
          if (seen.has(family)) continue
          seen.add(family)
          reached.set(next, seen)
          stack.push(...(graph.getModuleInfo(next)?.importedIds ?? []))
        }
      }
      families = reached
    }
    return families.get(id) ?? new Set()
  }
  // One group per set of two or more families. A module's imports are
  // reached by every family that reaches the module, and often by more, so
  // larger sets go first: by the time a group pulls in its modules'
  // imports, those imports already sit in the chunk they belong in.
  const familySets = [
    ['main', 'effects', 'canvas'],
    ['main', 'effects'],
    ['main', 'canvas'],
    ['effects', 'canvas'],
  ] as const
  return [
    { name: 'lit', test: LIT_RUNTIME, priority: 10 },
    { name: 'motion', test: MOTION, priority: 10 },
    ...familySets.map((set) => {
      const chunk =
        set.length === FAMILIES.length ? 'shared' : `shared-${set.join('-')}`
      return {
        name(id: string, graph: ModuleGraph): string | null {
          const reached = familiesOf(id, graph)
          return reached.size === set.length &&
            set.every((family) => reached.has(family))
            ? chunk
            : null
        },
        priority: 1 + set.length,
      }
    }),
    {
      name(id: string, graph: ModuleGraph): string | null {
        const reached = familiesOf(id, graph)
        return reached.size === 1 &&
          reached.has('canvas') &&
          canvasChunk(id) !== undefined
          ? 'canvas-shared'
          : null
      },
      priority: 1,
    },
  ]
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isCdn = mode === 'cdn'
  const isCanvas = mode === 'canvas'
  const isElements = mode === 'elements'
  const entry = mode === 'effects' ? ENTRIES.effects : ENTRIES.main
  // Only the first pass clears `dist/`, writes declarations and copies assets.
  const isFirstPass =
    !isCdn && !isCanvas && !isElements && entry === ENTRIES.main
  return {
    // motion's ES build reads `process.env.NODE_ENV` and leaves it to the
    // app's bundler to replace. Nothing replaces it on a CDN, so without
    // this the first spring animation throws "process is not defined". The
    // npm build leaves it for the app's bundler, as motion intends.
    ...(isCdn
      ? { define: { 'process.env.NODE_ENV': JSON.stringify('production') } }
      : {}),
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
      ...(isCdn
        ? [
            elementsNamespacePlugin(),
            reducedMotionModulePlugin(),
            elementModulesHaveSideEffectsPlugin({ onlyCopies: true }),
          ]
        : [noInlinedDependenciesPlugin()]),
      ...(isElements
        ? [
            canvasPiecesExternalPlugin(),
            elementModulesHaveSideEffectsPlugin({ onlyCopies: false }),
          ]
        : []),
    ],
    build: {
      target: 'esnext',
      outDir: isCdn ? 'dist/cdn' : 'dist',
      emptyOutDir: isFirstPass,
      // `public/` holds the sandbox's favicon and icons, not package assets.
      copyPublicDir: false,
      lib:
        isCanvas || isCdn || isElements
          ? {
              entry: isCdn
                ? cdnEntries()
                : isElements
                  ? elementEntries()
                  : canvasEntries(),
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
          ...(isCanvas
            ? {
                chunkFileNames: 'chunks/canvas-[name].js',
                manualChunks: canvasChunk,
              }
            : {}),
          ...(isElements
            ? { chunkFileNames: 'chunks/elements-[name].js' }
            : {}),
          // The CDN files are never re-bundled, so they can drop whitespace
          // and pure annotations.
          ...(isCdn
            ? {
                minify: true,
                // The elements entries' chunks hold their own copies of
                // modules, so they are named apart from the bundles' chunks.
                chunkFileNames: (chunk: {
                  name: string
                  moduleIds: readonly string[]
                }) =>
                  !chunk.moduleIds.some((id) =>
                    id.startsWith(ELEMENTS_NAMESPACE),
                  )
                    ? 'chunks/[name].js'
                    : // A copy of a virtual module is named after its id,
                      // `_moul-elements__moul_reduced-motion`.
                      chunk.name.startsWith('_moul-elements_')
                      ? `chunks/elements-${chunk.name.replace(/^_moul-elements_+moul_/, '')}.js`
                      : 'chunks/elements-[name].js',
                codeSplitting: { groups: cdnChunkGroups(cdnEntries()) },
              }
            : {}),
        },
      },
    },
  }
})
