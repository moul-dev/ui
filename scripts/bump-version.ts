#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  bumpVersion,
  changelogSlug,
  compareSemVer,
  isReleaseType,
  parseSemVer,
  type ReleaseType,
  utcIsoDate,
} from './semver'

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

const USAGE = `
${colors.bright}Moul Web Component — SemVer Bump${colors.reset}

${colors.yellow}Usage:${colors.reset}
  bun run bump <major|minor|patch|prerelease> [options]
  bun run bump <version> [options]

${colors.yellow}Release types:${colors.reset}
  major        Breaking changes        1.4.2 -> 2.0.0    1.0.0-alpha.3 -> 1.0.0
  minor        New, compatible API     1.4.2 -> 1.5.0    1.5.0-beta.1  -> 1.5.0
  patch        Compatible fixes        1.4.2 -> 1.4.3    1.4.3-rc.2    -> 1.4.3
  prerelease   Next build of channel   1.0.0-alpha.1 -> 1.0.0-alpha.2

${colors.yellow}Options:${colors.reset}
  --preid=<id>         With major, minor or patch: open a prerelease of that version
                       (1.4.2 + minor --preid=beta -> 1.5.0-beta.1).
                       With prerelease: switch channel (1.0.0-alpha.2 -> 1.0.0-beta.1),
                       or start one from a release (1.0.0 -> 1.0.1-rc.1).
  [version]            Explicit SemVer to set; it must sort after the current version
  --changelog, -c      Scaffold docs/src/content/docs/changelog/<version-with-dashes>.mdx
  --dry-run, -d        Preview changes without modifying any files
  --help, -h           Show this help message

The Moul engine tags the same versions with a leading v (v1.0.0-alpha.1).
`

interface BumpOptions {
  releaseType?: ReleaseType
  explicitVersion?: string
  preid?: string
  dryRun: boolean
  scaffoldChangelog: boolean
}

function fail(message: string): never {
  console.error(`${colors.red}Error:${colors.reset} ${message}`)
  process.exit(1)
}

function parseArgs(args: string[]): BumpOptions {
  const options: BumpOptions = { dryRun: false, scaffoldChangelog: false }

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      console.log(USAGE)
      process.exit(0)
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true
    } else if (arg === '--changelog' || arg === '-c') {
      options.scaffoldChangelog = true
    } else if (arg.startsWith('--preid=')) {
      options.preid = arg.slice('--preid='.length)
    } else if (arg.startsWith('-')) {
      fail(`Unknown option "${arg}". Run \`bun run bump --help\`.`)
    } else if (options.releaseType || options.explicitVersion) {
      fail(`Unexpected argument "${arg}": pass one release type or version.`)
    } else if (isReleaseType(arg)) {
      options.releaseType = arg
    } else {
      options.explicitVersion = arg
    }
  }

  if (!options.releaseType && !options.explicitVersion) {
    console.log(USAGE)
    fail('Pass a release type (major, minor, patch, prerelease) or a version.')
  }
  if (options.explicitVersion && options.preid !== undefined) {
    fail('--preid only applies to a release type, not an explicit version.')
  }
  return options
}

function nextVersionFor(currentVersion: string, options: BumpOptions): string {
  if (!parseSemVer(currentVersion)) {
    fail(`ui/package.json has "${currentVersion}", which is not SemVer.`)
  }
  if (options.explicitVersion) {
    if (!parseSemVer(options.explicitVersion)) {
      fail(
        `"${options.explicitVersion}" is not SemVer (MAJOR.MINOR.PATCH with an optional -prerelease, no leading v).`,
      )
    }
    if (compareSemVer(options.explicitVersion, currentVersion) <= 0) {
      fail(
        `${options.explicitVersion} does not sort after the current ${currentVersion}.`,
      )
    }
    return options.explicitVersion
  }
  try {
    return bumpVersion(
      currentVersion,
      options.releaseType as ReleaseType,
      options.preid,
    )
  } catch (error) {
    fail((error as Error).message)
  }
}

function main() {
  const rootDir = resolve(import.meta.dir, '..')
  const options = parseArgs(process.argv.slice(2))

  console.log(
    `\n${colors.bright}${colors.cyan}◆ Moul Web Component — SemVer Version Bump${colors.reset}\n`,
  )

  const uiPkgPath = join(rootDir, 'ui', 'package.json')
  if (!existsSync(uiPkgPath)) {
    fail(`Cannot find ui/package.json at ${uiPkgPath}`)
  }

  const currentVersion: string =
    JSON.parse(readFileSync(uiPkgPath, 'utf8')).version ?? '0.0.0'
  const nextVersion = nextVersionFor(currentVersion, options)

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
    const isoDate = utcIsoDate(new Date())
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
description: Release notes for @moul-dev/web-component v${nextVersion}.
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
