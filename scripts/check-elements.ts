#!/usr/bin/env bun
/**
 * Holds each built element entry to what its source registers. Every
 * `elements/<name>.js`, in `ui/dist/` and in `ui/dist/cdn/`, must define
 * each tag that `ui/src/elements/<name>.ts` registers through its imports:
 * its family, and the elements they render. An import kept only to
 * register an element is exactly what a build drops when it takes a module
 * for free of side effects (see `elementModulesHaveSideEffectsPlugin` in
 * `ui/vite.config.ts`), and no test of the source can see that happen.
 *
 * A definition is a call with a tag and a class, `e("moul-button", t)`,
 * which only `defineElement` makes. Between them, the main, effects and
 * canvas files must show every tag that way, or the pattern has stopped
 * matching the build's output, and the check fails rather than pass blind.
 *
 *   bun scripts/check-elements.ts   check `ui/dist` (the last step of `bun run build:ui`)
 */
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { type CdnFiles, readCdnFiles, staticClosure } from './check-cdn'
import { findElementTags, registeredBy } from './sync-elements'

const DEFINE_CALL =
  /\b[A-Za-z_$][\w$]*\(\s*(["'`])(moul-[a-z0-9-]+)\1\s*,\s*[A-Za-z_$][\w$]*\s*\)/g

/** Tags a built file defines. */
export function definedTags(code: string): Set<string> {
  return new Set([...code.matchAll(DEFINE_CALL)].map((match) => match[2]))
}

/** Tags defined by `file` and every file it imports statically. */
function definedFrom(files: CdnFiles, file: string): Set<string> {
  return new Set(
    [...staticClosure(files, file)].flatMap((name) => [
      ...definedTags(files[name]),
    ]),
  )
}

/**
 * What is wrong with one build (`dist/` or `dist/cdn/`, as `files`), one
 * sentence per problem. `expected` maps each `elements/<name>.js` to the
 * tags its source registers; `allTags` is every tag the library has.
 */
export function elementProblems(
  label: string,
  files: CdnFiles,
  expected: Record<string, string[]>,
  allTags: string[],
): string[] {
  const bundles = Object.keys(files).filter(
    (name) =>
      name === 'moul-ui.js' ||
      name === 'effects.js' ||
      /^canvas\/[^/]+\.js$/.test(name),
  )
  const seen = new Set(bundles.flatMap((name) => [...definedFrom(files, name)]))
  const unseen = allTags.filter((tag) => !seen.has(tag))
  if (unseen.length > 0) {
    return [
      `${label}: the bundles show no definition of ${unseen.join(', ')}. If the build writes definitions differently now, update DEFINE_CALL in scripts/check-elements.ts so this check still sees them.`,
    ]
  }
  const problems: string[] = []
  for (const [entry, tags] of Object.entries(expected)) {
    if (files[entry] === undefined) {
      problems.push(`${label}: ${entry} was not built.`)
      continue
    }
    const defined = definedFrom(files, entry)
    const missing = tags.filter((tag) => !defined.has(tag))
    if (missing.length > 0) {
      problems.push(
        `${label}: ${entry} does not define ${missing.join(', ')}, which its source registers. The build dropped an import kept only for its side effect.`,
      )
    }
  }
  return problems
}

function main(): void {
  const uiDir = resolve(import.meta.dir, '..', 'ui')
  const srcDir = join(uiDir, 'src')
  const tags = findElementTags(srcDir)
  const expected = Object.fromEntries(
    readdirSync(join(srcDir, 'elements'))
      .filter((name) => name.endsWith('.ts'))
      .map((name) => [
        `elements/${name.replace(/\.ts$/, '.js')}`,
        [...registeredBy(join(srcDir, 'elements', name))].sort(),
      ]),
  )
  const problems: string[] = []
  for (const [label, dir] of [
    ['dist', join(uiDir, 'dist')],
    ['dist/cdn', join(uiDir, 'dist', 'cdn')],
  ]) {
    if (!existsSync(join(dir, 'elements'))) {
      problems.push(
        `${label}: no elements/ folder. Run \`bun run build:ui\` first.`,
      )
      continue
    }
    problems.push(
      ...elementProblems(
        label,
        readCdnFiles(dir),
        expected,
        tags.map((tag) => tag.tag),
      ),
    )
  }
  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`\x1b[31m✗ [elements] ${problem}\x1b[0m`)
    }
    process.exit(1)
  }
  console.log(
    `\x1b[32m✓ [elements] Each of the ${Object.keys(expected).length} element files, in dist/ and dist/cdn/, defines every element its source registers.\x1b[0m`,
  )
}

if (import.meta.main) main()
