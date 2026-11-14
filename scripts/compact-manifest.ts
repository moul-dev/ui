#!/usr/bin/env bun
/**
 * Rewrites `ui/dist/custom-elements.json` without indentation, the step after
 * `cem analyze` in `build:ui`.
 *
 * The analyzer always pretty-prints, and the indentation was about 40% of the
 * manifest's bytes in the npm package. Editors, linters and `sync:llms` parse
 * the file; nobody reads it by hand (`jq . dist/custom-elements.json` does).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const manifestPath = resolve(
  import.meta.dir,
  '..',
  'ui',
  'dist',
  'custom-elements.json',
)

const before = readFileSync(manifestPath, 'utf8')
const after = `${JSON.stringify(JSON.parse(before))}\n`
writeFileSync(manifestPath, after)

const kb = (text: string) => `${(Buffer.byteLength(text) / 1024).toFixed(0)} KB`
console.log(`[manifest] custom-elements.json ${kb(before)} → ${kb(after)}`)
