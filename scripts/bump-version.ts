#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  changelogSlug,
  compareCalVer,
  computeNextVersion,
  parseCalVer,
  utcIsoDate,
} from './calver'

// ANSI colors for clean console logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
}

interface BumpOptions {
  explicitVersion?: string
  now: Date
  dryRun: boolean
  scaffoldChangelog: boolean
}

function parseArgs(args: string[]): BumpOptions {
  let explicitVersion: string | undefined
  let now = new Date()
  let dryRun = false
  let scaffoldChangelog = false

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      console.log(`
${colors.bright}Moul UI — CalVer Bump (YYYY.MM.MICRO)${colors.reset}

${colors.yellow}Usage:${colors.reset}
  bun run bump [options] [version]

${colors.yellow}Options:${colors.reset}
  [version]               Explicit version to set (YYYY.MM.MICRO, newer than the current one)
  --date=<YYYY-MM-DD>     Compute the version as if today (UTC) were this date
  --changelog, -c         Scaffold docs/src/content/docs/changelog/<YYYY-MM-MICRO>.mdx
  --dry-run, -d           Preview changes without modifying any files
  --help, -h              Show this help message

${colors.yellow}Rules${colors.reset} (shared with the Moul engine, whose tags add a leading v):
  First release of a UTC month  -> YYYY.MM.0   (e.g. 2026.11.0)
  Each later release that month -> MICRO + 1   (e.g. 2026.11.1, 2026.11.2)
  MM is the unpadded month, so every version is valid SemVer.
`)
      process.exit(0)
    } else if (arg === '--dry-run' || arg === '-d') {
      dryRun = true
    } else if (arg === '--changelog' || arg === '-c') {
      scaffoldChangelog = true
    } else if (arg.startsWith('--date=')) {
      const value = arg.slice('--date='.length)
      const parsed = new Date(`${value}T00:00:00Z`)
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        Number.isNaN(parsed.getTime())
      ) {
        console.error(
          `${colors.red}Error:${colors.reset} Invalid --date "${value}". Use YYYY-MM-DD.`,
        )
        process.exit(1)
      }
      now = parsed
    } else if (!arg.startsWith('-')) {
      explicitVersion = arg
    }
  }

  return { explicitVersion, now, dryRun, scaffoldChangelog }
}

function main() {
  const rootDir = resolve(import.meta.dir, '..')
  const options = parseArgs(process.argv.slice(2))

  console.log(
    `\n${colors.bright}${colors.cyan}◆ Moul UI — CalVer Version Bump${colors.reset}\n`,
  )

  const uiPkgPath = join(rootDir, 'ui', 'package.json')
  if (!existsSync(uiPkgPath)) {
    console.error(
      `${colors.red}Error:${colors.reset} Cannot find ui/package.json at ${uiPkgPath}`,
    )
    process.exit(1)
  }

  const currentVersion: string =
    JSON.parse(readFileSync(uiPkgPath, 'utf8')).version ?? '0.0.0'

  let nextVersion: string
  if (options.explicitVersion) {
    if (!parseCalVer(options.explicitVersion)) {
      console.error(
        `${colors.red}Error:${colors.reset} "${options.explicitVersion}" is not a CalVer version (YYYY.MM.MICRO, no zero padding).`,
      )
      process.exit(1)
    }
    if (compareCalVer(options.explicitVersion, currentVersion) <= 0) {
      console.error(
        `${colors.red}Error:${colors.reset} ${options.explicitVersion} is not newer than the current ${currentVersion}.`,
      )
      process.exit(1)
    }
    nextVersion = options.explicitVersion
  } else {
    try {
      nextVersion = computeNextVersion(currentVersion, options.now)
    } catch (error) {
      console.error(
        `${colors.red}Error:${colors.reset} ${(error as Error).message}`,
      )
      process.exit(1)
    }
  }

  console.log(
    `  Current Version: ${colors.yellow}${currentVersion}${colors.reset}`,
  )
  console.log(
    `  Next Version:    ${colors.green}${colors.bright}${nextVersion}${colors.reset}`,
  )
  if (options.dryRun) {
    console.log(
      `  Mode:            ${colors.magenta}[DRY RUN - No files will be modified]${colors.reset}`,
    )
  }
  console.log('')

  let updatedCount = 0

  function updateFile(
    relativePath: string,
    updater: (content: string) => string,
  ) {
    const filePath = join(rootDir, relativePath)
    if (!existsSync(filePath)) return
    const oldContent = readFileSync(filePath, 'utf8')
    const newContent = updater(oldContent)
    if (newContent === oldContent) {
      console.log(
        `  ${colors.dim}• ${relativePath} (no changes needed)${colors.reset}`,
      )
      return
    }
    if (!options.dryRun) writeFileSync(filePath, newContent, 'utf8')
    updatedCount++
    console.log(`  ${colors.green}✓${colors.reset} Updated ${relativePath}`)
  }

  const setPackageVersion = (content: string) => {
    const pkg = JSON.parse(content)
    pkg.version = nextVersion
    return `${JSON.stringify(pkg, null, 2)}\n`
  }

  // ui/package.json is the source of truth; the rest are kept in lockstep.
  updateFile('ui/package.json', setPackageVersion)
  updateFile('package.json', setPackageVersion)
  updateFile('docs/package.json', setPackageVersion)
  updateFile('ui/src/index.ts', (content) =>
    content.replace(
      /export const version = ['"][^'"]+['"]/,
      `export const version = '${nextVersion}'`,
    ),
  )
  // The lockfile records each workspace's version too.
  updateFile('bun.lock', (content) =>
    content.replaceAll(
      `"version": "${currentVersion}"`,
      `"version": "${nextVersion}"`,
    ),
  )

  if (options.scaffoldChangelog) {
    const isoDate = utcIsoDate(options.now)
    const changelogDir = 'docs/src/content/docs/changelog'
    const slug = changelogSlug(nextVersion)
    const relativePath = `${changelogDir}/${slug}.mdx`
    const changelogPath = join(rootDir, relativePath)
    const unreleasedPath = `${changelogDir}/unreleased.mdx`

    if (existsSync(join(rootDir, unreleasedPath))) {
      console.log(
        `  ${colors.yellow}•${colors.reset} ${unreleasedPath} holds this release's notes: rename it and its km copy to ${slug}.mdx, retitle it v${nextVersion}, and add \`date: ${isoDate}\``,
      )
    } else if (existsSync(changelogPath)) {
      console.log(
        `  ${colors.dim}• ${relativePath} already exists${colors.reset}`,
      )
    } else {
      const template = `---
title: v${nextVersion} — Release Summary
description: Release notes for Moul UI v${nextVersion}.
date: ${isoDate}
author: Phearak S. Tha
avatar: https://github.com/thasophearak.png
---

import ComponentPreview from '@/components/ComponentPreview.astro';

State the current state or core problem in the first two sentences.

Build the underlying mental model and background context here. Keep paragraphs between 2 and 4 sentences.

---

## What Changed

Walk through the mechanism step by step, with clean code examples.

<ComponentPreview>
  <moul-button variant="primary">Example</moul-button>
</ComponentPreview>

---

## On Craft

Conclude with a focus on care, craftsmanship, and the long-term vision.
`
      if (!options.dryRun) writeFileSync(changelogPath, template, 'utf8')
      updatedCount++
      console.log(
        `  ${colors.green}✓${colors.reset} Scaffolded ${relativePath}`,
      )
    }
  }

  console.log(
    `\n${colors.bright}${colors.green}✓ Version bump completed!${colors.reset}`,
  )
  console.log(
    `   ${colors.dim}${updatedCount} file(s) ${options.dryRun ? 'would be ' : ''}updated to ${nextVersion}${colors.reset}`,
  )
  console.log(
    `   ${colors.dim}Then run \`bun run build:ui && bun run sync:llms --write\` to stamp it into AGENTS.md and llms.txt.${colors.reset}\n`,
  )
}

main()
