#!/usr/bin/env bun
/**
 * Holds each published bundle to a size budget, so a bigger bundle is a
 * decision someone makes in review rather than something nobody noticed.
 *
 * Budgets live in `ui/size-budget.json` as raw bytes, which are the same on
 * every machine for the same source; gzip sizes are printed for reference.
 * The main entry's budget is what keeps `@moul-dev/web-component` from
 * paying for `@moul-dev/web-component/effects`, and both of theirs keep them
 * from paying for the canvas elements. Every file of the canvas entry (the
 * loader, each element's file and the shared chunk) and every file of the
 * CDN build (its entries and the chunks they share) needs a budget of its
 * own: a file without one fails the check until `--write` records it.
 *
 *   bun run size           check `ui/dist` against the budgets (run build:ui first)
 *   bun run size --write   record the current sizes as the new budgets
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}

const uiDir = resolve(import.meta.dir, '..', 'ui')
const budgetPath = join(uiDir, 'size-budget.json')

export type SizeBudget = Record<string, number>

export interface SizeResult {
  file: string
  bytes: number
  gzipBytes: number
  budget: number | undefined
}

export function measure(file: string): { bytes: number; gzipBytes: number } {
  const contents = readFileSync(file)
  return {
    bytes: statSync(file).size,
    gzipBytes: gzipSync(contents, { level: 9 }).length,
  }
}

/** Files over budget, with how far over they are. */
export function overBudget(results: SizeResult[]): SizeResult[] {
  return results.filter(
    (result) => result.budget !== undefined && result.bytes > result.budget,
  )
}

/**
 * Built files that need a budget beyond the ones `size-budget.json` names:
 * the canvas entry's files under `dist/`, and every file under `dist/cdn/`,
 * relative to `ui/`.
 */
export function budgetedFiles(root: string): string[] {
  const files: string[] = []
  if (existsSync(join(root, 'dist/canvas.js'))) files.push('dist/canvas.js')
  for (const sub of ['dist/canvas', 'dist/chunks']) {
    const path = join(root, sub)
    if (!existsSync(path)) continue
    for (const name of readdirSync(path).sort()) {
      if (name.endsWith('.js')) files.push(`${sub}/${name}`)
    }
  }
  const walk = (dir: string) => {
    const path = join(root, dir)
    if (!existsSync(path)) return
    for (const entry of readdirSync(path, { withFileTypes: true }).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      if (entry.isDirectory()) walk(`${dir}/${entry.name}`)
      else if (entry.name.endsWith('.js')) files.push(`${dir}/${entry.name}`)
    }
  }
  walk('dist/cdn')
  return files
}

const kb = (bytes: number) => `${(bytes / 1000).toFixed(2)} kB`
const signed = (bytes: number) =>
  `${bytes > 0 ? '+' : ''}${bytes.toLocaleString('en-US')} B`

function main(): void {
  const write = process.argv.includes('--write')
  const budget = JSON.parse(readFileSync(budgetPath, 'utf8')) as SizeBudget

  const missing = Object.keys(budget).filter(
    (file) => !existsSync(join(uiDir, file)),
  )
  // `--write` drops the budget of a file that is no longer built.
  if (missing.length > 0 && !write) {
    console.error(
      `${colors.red}✗ [size] Missing ${missing.join(', ')}. Run \`bun run build:ui\` first.${colors.reset}`,
    )
    process.exit(1)
  }

  const files = [
    ...new Set([...Object.keys(budget), ...budgetedFiles(uiDir)]),
  ].filter((file) => existsSync(join(uiDir, file)))
  const results: SizeResult[] = files.map((file) => ({
    file,
    budget: budget[file],
    ...measure(join(uiDir, file)),
  }))

  for (const result of results) {
    const diff = result.bytes - (result.budget ?? result.bytes)
    const color = diff > 0 ? colors.red : diff < 0 ? colors.green : colors.dim
    const status =
      result.budget === undefined
        ? `${colors.red}no budget${colors.reset}`
        : `${color}${diff === 0 ? 'at budget' : `${signed(diff)} vs budget`}${colors.reset}`
    console.log(
      `  ${result.file.padEnd(42)} ${kb(result.bytes).padStart(10)}  ${colors.dim}gzip ${kb(result.gzipBytes).padStart(9)}${colors.reset}  ${status}`,
    )
  }

  if (write) {
    const next = Object.fromEntries(results.map((r) => [r.file, r.bytes]))
    writeFileSync(budgetPath, `${JSON.stringify(next, null, 2)}\n`)
    console.log(
      `${colors.green}✓ [size] Recorded current sizes in ui/size-budget.json.${colors.reset}`,
    )
    return
  }

  const unbudgeted = results.filter((result) => result.budget === undefined)
  if (unbudgeted.length > 0) {
    console.error(
      `${colors.red}✗ [size] No budget for ${unbudgeted.map((r) => r.file).join(', ')}.${colors.reset}`,
    )
    console.error(
      `  Run ${colors.cyan}bun run size --write${colors.reset} to record one, and say why in the change.`,
    )
    process.exit(1)
  }

  const over = overBudget(results)
  if (over.length > 0) {
    for (const result of over) {
      console.error(
        `${colors.red}✗ [size] ${result.file} is ${signed(result.bytes - (result.budget ?? 0))} over its budget of ${result.budget?.toLocaleString('en-US')} B.${colors.reset}`,
      )
    }
    console.error(
      `  If the growth is intended, run ${colors.cyan}bun run size --write${colors.reset} and say why in the change.`,
    )
    process.exit(1)
  }

  const saved = results.filter(
    (r) => r.budget !== undefined && r.bytes < r.budget,
  )
  if (saved.length > 0) {
    console.log(
      `${colors.yellow}  Under budget: run \`bun run size --write\` to lock in the saving.${colors.reset}`,
    )
  }
  console.log(
    `${colors.green}✓ [size] Every bundle is within its budget.${colors.reset}`,
  )
}

if (import.meta.main) main()
