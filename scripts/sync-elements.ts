#!/usr/bin/env bun
/**
 * Writes the per-element entries from the components themselves, so every
 * element can be imported on its own and the loader knows every tag.
 *
 * - `ui/src/elements/<name>.ts` for each tag `moul-<name>` in the main and
 *   effects entries: `@moul-dev/web-component/elements/<name>`. It
 *   re-exports the component folder's `index.ts`, so importing it registers
 *   the element, the rest of its family (`<moul-tab>` brings `<moul-tabs>`
 *   and `<moul-tab-panel>`) and the elements they render, and nothing else.
 * - The `ELEMENTS` map in `ui/src/loader.ts`: every tag, canvas ones
 *   included, with the import that loads it. Canvas elements keep their own
 *   entries, `ui/src/canvas/<name>.ts`.
 *
 *   bun run sync:elements           write both
 *   bun run sync:elements --check   fail if either is out of date (src/elements.test.ts runs this too)
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const LINE_WIDTH = 80

export interface ElementTag {
  /** The tag, `moul-tab`. */
  tag: string
  /** The tag without `moul-`, which names its entry: `elements/tab` or `canvas/tab`. */
  name: string
  /** The file that registers it. */
  module: string
  /** `canvas` when `src/canvas/<name>.ts` is its entry, `element` otherwise. */
  kind: 'canvas' | 'element'
}

/** Every `.ts` file under `dir` that is not a test. */
function sourceFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...sourceFiles(path))
    else if (path.endsWith('.ts') && !path.endsWith('.test.ts')) {
      files.push(path)
    }
  }
  return files.sort()
}

/** The tags a module registers, in order. */
function registeredTags(code: string): string[] {
  return [...code.matchAll(/defineElement\(\s*'(moul-[a-z0-9-]+)'/g)].map(
    (match) => match[1],
  )
}

/** Every element the components register, by tag. */
export function findElementTags(srcDir: string): ElementTag[] {
  const canvasDir = join(srcDir, 'canvas')
  const canvasNames = new Set(
    existsSync(canvasDir)
      ? readdirSync(canvasDir)
          .filter((name) => /^[a-z0-9-]+\.ts$/.test(name))
          .map((name) => name.replace(/\.ts$/, ''))
      : [],
  )
  const tags = new Map<string, ElementTag>()
  for (const module of sourceFiles(join(srcDir, 'components'))) {
    for (const tag of registeredTags(readFileSync(module, 'utf8'))) {
      const existing = tags.get(tag)
      if (existing) {
        throw new Error(
          `<${tag}> is registered in both ${existing.module} and ${module}.`,
        )
      }
      const name = tag.slice('moul-'.length)
      tags.set(tag, {
        tag,
        name,
        module,
        kind: canvasNames.has(name) ? 'canvas' : 'element',
      })
    }
  }
  return [...tags.values()].sort((a, b) => a.tag.localeCompare(b.tag))
}

/** The file a relative specifier in `from` points at, or undefined. */
function resolveModule(from: string, specifier: string): string | undefined {
  const base = resolve(dirname(from), specifier)
  return [`${base}.ts`, join(base, 'index.ts'), base].find(
    (path) => path.endsWith('.ts') && existsSync(path),
  )
}

/** Files a module runs when it runs: its relative imports and re-exports that are not type-only, transitively. */
export function staticClosure(module: string): Set<string> {
  const seen = new Set<string>()
  const stack = [module]
  while (stack.length > 0) {
    const file = stack.pop() as string
    if (seen.has(file)) continue
    seen.add(file)
    const code = readFileSync(file, 'utf8')
    for (const [, specifier] of code.matchAll(
      /^(?:import|export)\s+(?!type\b)(?:[^'";]*?\sfrom\s*)?'(\.[^']+)'/gm,
    )) {
      const target = resolveModule(file, specifier)
      if (target) stack.push(target)
    }
  }
  return seen
}

/** Tags a source file registers when it runs, through everything it imports. */
export function registeredBy(file: string): Set<string> {
  return new Set(
    [...staticClosure(file)].flatMap((module) =>
      registeredTags(readFileSync(module, 'utf8')),
    ),
  )
}

/** A path from `src/elements/` to `file`, without its extension. */
function fromElementsDir(srcDir: string, file: string): string {
  return relative(join(srcDir, 'elements'), file)
    .split('\\')
    .join('/')
    .replace(/(?:\/index)?\.ts$/, '')
}

/** A JSDoc block holding `text`, wrapped at the line width; one line when it fits. */
function docComment(text: string): string {
  if (`/** ${text} */`.length <= LINE_WIDTH) return `/** ${text} */`
  const lines: string[] = []
  let line = ' *'
  for (const word of text.split(' ')) {
    if (line.length > 2 && `${line} ${word}`.length > LINE_WIDTH) {
      lines.push(line)
      line = ' *'
    }
    line = `${line} ${word}`
  }
  return `/**\n${[...lines, line].join('\n')}\n */`
}

/** `a`, `a and b`, `a, b and c`. */
function listOf(items: string[]): string {
  return items.length < 2
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

/**
 * The source of `src/elements/<name>.ts`: everything the component
 * folder's `index.ts` exports, which is what the main or effects entry
 * runs for that component. So an element brings its family (`elements/tab`
 * registers `<moul-tabs>` and `<moul-tab-panel>` too), defined together and
 * in the main entry's order. The loader loads tags one by one, and a
 * parent such as `<moul-tabs>` calls methods on its children; were they
 * separate, it could render before they upgrade.
 */
export function elementEntrySource(
  element: ElementTag,
  tags: ElementTag[],
  srcDir: string,
): string {
  const folder = dirname(element.module)
  const index = join(folder, 'index.ts')
  // A folder whose index does not run the module: the module on its own.
  const source =
    existsSync(index) && staticClosure(index).has(element.module)
      ? index
      : element.module
  const family = tags
    .filter((tag) => tag !== element && dirname(tag.module) === folder)
    .map((tag) => `\`<${tag.tag}>\``)
  const registers =
    family.length === 0
      ? `\`<${element.tag}>\``
      : `\`<${element.tag}>\` and the rest of its family, ${listOf(family)},`
  return `${docComment(
    `\`@moul-dev/web-component/elements/${element.name}\`: registers ${registers} when imported.`,
  )}\nexport * from '${fromElementsDir(srcDir, source)}'\n`
}

/** One line of the loader's map, wrapped as Biome wraps it. */
function loaderLine(element: ElementTag): string {
  const dir = element.kind === 'canvas' ? 'canvas' : 'elements'
  const key = `  '${element.tag}': () =>`
  const value = `import('./${dir}/${element.name}'),`
  const oneLine = `${key} ${value}`
  return oneLine.length <= LINE_WIDTH ? oneLine : `${key}\n    ${value}`
}

const MAP_START = /^export const ELEMENTS\b[^\n]*= \{\n/m
const MAP_NOTE =
  '  // Written by `bun run sync:elements` from the components: do not edit by hand.\n'

/** `loader.ts` with its `ELEMENTS` map rewritten for `tags`. */
export function withLoaderMap(loader: string, tags: ElementTag[]): string {
  const start = loader.match(MAP_START)
  if (start?.index === undefined) {
    throw new Error(
      'src/loader.ts has no `export const ELEMENTS … = {` line to write the map after.',
    )
  }
  const bodyStart = start.index + start[0].length
  // From the newline that opens the map, so an empty map (`= {\n}`) closes
  // at its own brace rather than at the next function's.
  const bodyEnd = loader.indexOf('\n}\n', bodyStart - 1)
  if (bodyEnd === -1) {
    throw new Error('The ELEMENTS map in src/loader.ts never closes.')
  }
  return `${loader.slice(0, bodyStart)}${MAP_NOTE}${tags.map(loaderLine).join('\n')}${loader.slice(bodyEnd)}`
}

/** Every file this script owns, by absolute path, with the content it should have. */
export function plannedFiles(srcDir: string): Map<string, string> {
  const tags = findElementTags(srcDir)
  const files = new Map<string, string>()
  for (const element of tags) {
    if (element.kind !== 'element') continue
    files.set(
      join(srcDir, 'elements', `${element.name}.ts`),
      elementEntrySource(element, tags, srcDir),
    )
  }
  const loaderPath = join(srcDir, 'loader.ts')
  files.set(loaderPath, withLoaderMap(readFileSync(loaderPath, 'utf8'), tags))
  return files
}

/** Files that differ from the plan, and entries the plan no longer has. */
export function outOfDate(srcDir: string): {
  changed: string[]
  stale: string[]
} {
  const planned = plannedFiles(srcDir)
  const changed = [...planned]
    .filter(
      ([path, content]) =>
        !existsSync(path) || readFileSync(path, 'utf8') !== content,
    )
    .map(([path]) => path)
  const dir = join(srcDir, 'elements')
  const stale = existsSync(dir)
    ? readdirSync(dir)
        .map((name) => join(dir, name))
        .filter((path) => !planned.has(path))
    : []
  return { changed, stale }
}

function main(): void {
  const rootDir = resolve(import.meta.dir, '..')
  const srcDir = join(rootDir, 'ui', 'src')
  const rel = (path: string) => relative(rootDir, path)
  const { changed, stale } = outOfDate(srcDir)

  if (process.argv.includes('--check')) {
    if (changed.length === 0 && stale.length === 0) {
      console.log(
        '\x1b[32m✓ [elements] Every element entry is up to date.\x1b[0m',
      )
      return
    }
    for (const path of [...changed, ...stale]) {
      console.error(`\x1b[31m✗ [elements] ${rel(path)} is out of date.\x1b[0m`)
    }
    console.error('  Run \x1b[36mbun run sync:elements\x1b[0m to rewrite it.')
    process.exit(1)
  }

  const planned = plannedFiles(srcDir)
  mkdirSync(join(srcDir, 'elements'), { recursive: true })
  for (const path of changed) {
    writeFileSync(path, planned.get(path) as string)
    console.log(`  \x1b[32m✓ Wrote\x1b[0m ${rel(path)}`)
  }
  for (const path of stale) {
    rmSync(path)
    console.log(`  \x1b[33m✓ Removed\x1b[0m ${rel(path)}`)
  }
  console.log(
    `\x1b[32m✓ [elements] ${planned.size - 1} element entries and the loader map are up to date.\x1b[0m`,
  )
}

if (import.meta.main) main()
