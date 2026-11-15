#!/usr/bin/env bun
/**
 * Holds the CDN build in `ui/dist/cdn/` to what makes it safe to load from a
 * plain `<script type="module">`: a page that loads several entries runs one
 * copy of each runtime, and each entry downloads only what it uses.
 *
 * - Lit and motion are each bundled into exactly one file. A second Lit
 *   means a second `ReactiveElement` ("Multiple versions of Lit loaded"); a
 *   second motion means a second frame loop. The markers below are strings
 *   each runtime's code carries, and they survive minification.
 * - `moul-ui.js` imports no effects or canvas entry.
 * - `canvas.js` imports nothing up front, so an element's file loads only
 *   when its tag appears.
 * - No canvas element loads motion; they check reduced motion and nothing else.
 *
 *   bun scripts/check-cdn.ts   check `ui/dist/cdn` (the last step of `bun run build:ui`)
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, posix, relative, resolve } from 'node:path'

/** Strings only each runtime's code contains, once per copy of it. */
export const RUNTIME_MARKERS: Record<string, RegExp[]> = {
  // The version arrays Lit pushes onto `globalThis`, one per package.
  lit: [
    /\blitHtmlVersions\b/,
    /\breactiveElementVersions\b/,
    /\blitElementVersions\b/,
  ],
  // The step order of motion's frame loop.
  motion: [/[`"']resolveKeyframes[`"'],\s*[`"']preUpdate[`"']/],
}

/** CDN files, by path relative to `dist/cdn` (`chunks/lit.js`), with their code. */
export type CdnFiles = Record<string, string>

/**
 * The files a file imports statically, relative to `dist/cdn`. Rolldown
 * hoists every static import to the top of a chunk, after the banner, so
 * reading the leading `import` statements finds them all; dynamic
 * `import()` calls further down are not static imports and are skipped.
 */
export function staticImports(file: string, code: string): string[] {
  const statement =
    /^\s*import\s*(?:[^"'`;]*?\s*from\s*)?(["'`])([^"'`]+)\1\s*;?/
  let rest = code.replace(/^\s*(["'])use client\1;?/, '')
  const imports: string[] = []
  for (let match = statement.exec(rest); match; match = statement.exec(rest)) {
    imports.push(posix.normalize(posix.join(posix.dirname(file), match[2])))
    rest = rest.slice(match[0].length)
  }
  return imports
}

/** `file` and every file it reaches through static imports. */
export function staticClosure(files: CdnFiles, file: string): Set<string> {
  const reached = new Set<string>()
  const stack = [file]
  while (stack.length > 0) {
    const next = stack.pop() as string
    if (reached.has(next) || files[next] === undefined) continue
    reached.add(next)
    stack.push(...staticImports(next, files[next]))
  }
  return reached
}

/** What is wrong with a CDN build, one sentence per problem; empty when nothing is. */
export function cdnProblems(files: CdnFiles): string[] {
  const problems: string[] = []
  const names = Object.keys(files).sort()
  const runtimeFiles = new Map<string, Set<string>>()

  for (const [runtime, markers] of Object.entries(RUNTIME_MARKERS)) {
    const carriers = new Set<string>()
    for (const marker of markers) {
      const found = names.filter((name) => marker.test(files[name]))
      if (found.length === 0) {
        problems.push(
          `No CDN file carries ${runtime}'s marker ${marker}. If ${runtime} changed, update RUNTIME_MARKERS in scripts/check-cdn.ts so this check still sees it.`,
        )
      }
      for (const name of found) carriers.add(name)
    }
    if (carriers.size > 1) {
      problems.push(
        `${runtime} is bundled ${carriers.size} times, in ${[...carriers].join(', ')}. A page that loads more than one of them runs more than one copy; ${runtime} belongs in one shared chunk.`,
      )
    }
    runtimeFiles.set(runtime, carriers)
  }

  const isEntryOtherThanMain = (name: string) =>
    name === 'effects.js' || name === 'canvas.js' || name.startsWith('canvas/')
  const fromMain = [...staticClosure(files, 'moul-ui.js')].filter(
    isEntryOtherThanMain,
  )
  if (fromMain.length > 0) {
    problems.push(
      `moul-ui.js imports ${fromMain.join(', ')}. A page that loads only the main entry must not download effects or canvas code.`,
    )
  }

  const fromLoader = [...staticClosure(files, 'canvas.js')].filter(
    (name) => name !== 'canvas.js',
  )
  if (fromLoader.length > 0) {
    problems.push(
      `canvas.js imports ${fromLoader.join(', ')} up front. The loader must import nothing until a canvas tag appears.`,
    )
  }

  const motion = runtimeFiles.get('motion') ?? new Set<string>()
  for (const element of names.filter((name) => name.startsWith('canvas/'))) {
    const loaded = [...staticClosure(files, element)].filter((name) =>
      motion.has(name),
    )
    if (loaded.length > 0) {
      problems.push(
        `${element} loads motion (${loaded.join(', ')}). Canvas elements check reduced motion and do not animate with motion.`,
      )
    }
  }

  return problems
}

/** Every `.js` file under `dir`, by path relative to it. */
export function readCdnFiles(dir: string): CdnFiles {
  const files: CdnFiles = {}
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (entry.name.endsWith('.js')) {
        files[relative(dir, path).split('\\').join('/')] = readFileSync(
          path,
          'utf8',
        )
      }
    }
  }
  walk(dir)
  return files
}

function main(): void {
  const cdnDir = resolve(import.meta.dir, '..', 'ui', 'dist', 'cdn')
  if (!existsSync(join(cdnDir, 'moul-ui.js'))) {
    console.error(
      '\x1b[31m✗ [cdn] No ui/dist/cdn/moul-ui.js. Run `bun run build:ui` first.\x1b[0m',
    )
    process.exit(1)
  }
  const problems = cdnProblems(readCdnFiles(cdnDir))
  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`\x1b[31m✗ [cdn] ${problem}\x1b[0m`)
    }
    process.exit(1)
  }
  console.log(
    '\x1b[32m✓ [cdn] One Lit and one motion across ui/dist/cdn, and each entry loads only its own code.\x1b[0m',
  )
}

if (import.meta.main) main()
