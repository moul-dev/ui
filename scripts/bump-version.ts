#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

// ANSI colors for clean console logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
}

interface BumpOptions {
  explicitVersion?: string
  explicitDate?: string
  dryRun: boolean
  scaffoldChangelog: boolean
}

/**
 * Format a Date object into CalVer prefix YYYY.M (e.g. 2026.9 or 2026.10)
 * Note: MINOR is non-zero-padded single digit for months 1-9 to strictly adhere to SemVer 2.0.0
 */
function formatCalVerPrefix(d: Date): {
  year: number
  month: number
  prefix: string
} {
  const year = d.getFullYear()
  const month = d.getMonth() + 1 // 1-12, no leading zero
  return { year, month, prefix: `${year}.${month}` }
}

/**
 * Format a Date object into ISO YYYY-MM-DD
 */
function formatIsoDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse CLI arguments
 */
function parseArgs(args: string[]): BumpOptions {
  let explicitVersion: string | undefined
  let explicitDate: string | undefined
  let dryRun = false
  let scaffoldChangelog = false

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      console.log(`
${colors.bright}Moul UI CalVer (SemVer-compatible) Bump Script${colors.reset}

${colors.yellow}Usage:${colors.reset}
  bun run bump [options] [version]

${colors.yellow}Options:${colors.reset}
  [version]               Explicit version to set (e.g. 2026.9.24)
  --date=<YYYY-MM-DD>     Specify custom date to base the CalVer on (year & month)
  --changelog, -c         Scaffold a new changelog file in docs/content/changelog/
  --dry-run, -d           Preview changes without modifying any files
  --help, -h              Show this help message

${colors.yellow}Examples:${colors.reset}
  bun run bump                    # Increments patch or rolls to new month (e.g. 2026.9.24 -> 2026.9.25)
  bun run bump --changelog        # Bumps version and scaffolds changelog entry
  bun run bump --dry-run          # Preview changes
  bun run bump 2026.9.24          # Sets version explicitly to 2026.9.24
`)
      process.exit(0)
    } else if (arg === '--dry-run' || arg === '-d') {
      dryRun = true
    } else if (arg === '--changelog' || arg === '-c') {
      scaffoldChangelog = true
    } else if (arg.startsWith('--date=')) {
      explicitDate = arg.slice('--date='.length)
    } else if (!arg.startsWith('-')) {
      explicitVersion = arg
    }
  }

  return { explicitVersion, explicitDate, dryRun, scaffoldChangelog }
}

/**
 * Compute the next SemVer-compatible CalVer version based on current version and target date.
 * Format: YYYY.M.PATCH (e.g. 2026.9.24)
 * - MAJOR: Full Year (YYYY)
 * - MINOR: Month without leading zeroes (1-12, e.g. 9 for September, 10 for October)
 * - PATCH: Micro/patch counter that increments within that month (e.g. 24, 25...)
 */
function computeNextVersion(
  currentVersion: string,
  options: BumpOptions,
): string {
  if (options.explicitVersion) {
    const semverMatch = options.explicitVersion.match(
      /^(\d{2,4})\.(\d{1,2})\.(\d+)$/,
    )
    if (!semverMatch) {
      console.error(
        `${colors.red}Error:${colors.reset} Explicit version "${options.explicitVersion}" does not follow SemVer format (MAJOR.MINOR.PATCH, e.g. 2026.9.24)`,
      )
      process.exit(1)
    }
    // Normalize leading zero in month if provided (e.g. 2026.09.24 -> 2026.9.24)
    if (semverMatch[2].length > 1 && semverMatch[2].startsWith('0')) {
      const normalizedMinor = Number.parseInt(semverMatch[2], 10)
      const normalizedVersion = `${semverMatch[1]}.${normalizedMinor}.${semverMatch[3]}`
      console.warn(
        `  ${colors.yellow}Notice:${colors.reset} Normalized leading zero in month: ${options.explicitVersion} -> ${normalizedVersion}`,
      )
      return normalizedVersion
    }
    return options.explicitVersion
  }

  let targetDate: Date
  if (options.explicitDate) {
    const sanitized = options.explicitDate.replace(/\./g, '-')
    const parsed = new Date(sanitized)
    if (Number.isNaN(parsed.getTime())) {
      console.error(
        `${colors.red}Error:${colors.reset} Invalid date provided: ${options.explicitDate}`,
      )
      process.exit(1)
    }
    targetDate = parsed
  } else {
    targetDate = new Date()
  }

  const {
    year: targetYear,
    month: targetMonth,
    prefix: targetPrefix,
  } = formatCalVerPrefix(targetDate)

  // Parse currentVersion: matches both YYYY.M.PATCH (e.g. 2026.9.24) and YYYY.MM.PATCH
  const match = currentVersion.match(/^(\d{4})\.(0?[1-9]|1[0-2])\.(\d+)$/)

  if (match) {
    const curYear = match[1]
    const curMonth = Number.parseInt(match[2], 10)
    const curPatch = Number.parseInt(match[3], 10)

    if (curYear === String(targetYear) && curMonth === targetMonth) {
      // Same year and month -> increment patch
      return `${targetPrefix}.${curPatch + 1}`
    }
    // New month or year -> start at patch 1
    return `${targetPrefix}.1`
  }

  // If current version is legacy 4-part (e.g. 2026.09.23.1) or unrecognized, start at patch 1
  return `${targetPrefix}.1`
}

/**
 * Main version bump execution
 */
async function main() {
  const rootDir = resolve(import.meta.dir, '..')
  const options = parseArgs(process.argv.slice(2))

  console.log(
    `\n${colors.bright}${colors.cyan}◆ Moul UI — CalVer Version Bump${colors.reset}\n`,
  )

  // 1. Read current version from ui/package.json
  const uiPkgPath = join(rootDir, 'ui', 'package.json')
  if (!existsSync(uiPkgPath)) {
    console.error(
      `${colors.red}Error:${colors.reset} Cannot find ui/package.json at ${uiPkgPath}`,
    )
    process.exit(1)
  }

  const uiPkgJson = JSON.parse(readFileSync(uiPkgPath, 'utf8'))
  const currentVersion = uiPkgJson.version || '0.0.0'
  const nextVersion = computeNextVersion(currentVersion, options)

  console.log(
    `  Current Version: ${colors.yellow}${currentVersion}${colors.reset}`,
  )
  console.log(
    `  Target Version:  ${colors.green}${colors.bright}${nextVersion}${colors.reset}`,
  )
  if (options.dryRun) {
    console.log(
      `  Mode:            ${colors.magenta}[DRY RUN - No files will be modified]${colors.reset}`,
    )
  }
  console.log('')

  const modifiedFiles: string[] = []

  // Helper to read and optionally write file
  function updateFile(
    filePath: string,
    updater: (content: string) => string | null,
    label: string,
  ) {
    if (!existsSync(filePath)) {
      return
    }
    const oldContent = readFileSync(filePath, 'utf8')
    const newContent = updater(oldContent)
    if (newContent !== null && newContent !== oldContent) {
      if (!options.dryRun) {
        writeFileSync(filePath, newContent, 'utf8')
      }
      modifiedFiles.push(label)
      console.log(`  ${colors.green}✓${colors.reset} Updated ${label}`)
    } else {
      console.log(
        `  ${colors.dim}• ${label} (no changes needed)${colors.reset}`,
      )
    }
  }

  // 2. Update ui/package.json
  updateFile(
    uiPkgPath,
    (content) => {
      const pkg = JSON.parse(content)
      pkg.version = nextVersion
      return `${JSON.stringify(pkg, null, 2)}\n`
    },
    'ui/package.json',
  )

  // 3. Update ui/src/index.ts
  const uiIndexTsPath = join(rootDir, 'ui', 'src', 'index.ts')
  updateFile(
    uiIndexTsPath,
    (content) => {
      return content.replace(
        /export const version = ['"][^'"]+['"]/,
        `export const version = '${nextVersion}'`,
      )
    },
    'ui/src/index.ts',
  )

  // 4. Update docs/package.json
  const docsPkgPath = join(rootDir, 'docs', 'package.json')
  updateFile(
    docsPkgPath,
    (content) => {
      const pkg = JSON.parse(content)
      pkg.version = nextVersion
      return `${JSON.stringify(pkg, null, 2)}\n`
    },
    'docs/package.json',
  )

  // 5. Update root package.json
  const rootPkgPath = join(rootDir, 'package.json')
  updateFile(
    rootPkgPath,
    (content) => {
      const pkg = JSON.parse(content)
      pkg.version = nextVersion
      return `${JSON.stringify(pkg, null, 2)}\n`
    },
    'package.json (root)',
  )

  // 6. Update docs/src/pages/_root.tsx data-version
  const rootPagePath = join(rootDir, 'docs', 'src', 'pages', '_root.tsx')
  updateFile(
    rootPagePath,
    (content) => {
      return content.replace(
        /data-version=["'][^"']+["']/,
        `data-version="${nextVersion}"`,
      )
    },
    'docs/src/pages/_root.tsx',
  )

  // 7. Update docs/src/components/home-view.tsx & docs/src/pages/(home)/index.tsx hero version badge
  const homeViewPath = join(
    rootDir,
    'docs',
    'src',
    'components',
    'home-view.tsx',
  )
  updateFile(
    homeViewPath,
    (content) => {
      return content.replace(
        /(<span className="font-mono[^"]*">\s*)v[\d.]+(\s*<\/span>)/g,
        `$1v${nextVersion}$2`,
      )
    },
    'docs/src/components/home-view.tsx',
  )

  const homePagePath = join(
    rootDir,
    'docs',
    'src',
    'pages',
    '(home)',
    'index.tsx',
  )
  updateFile(
    homePagePath,
    (content) => {
      return content.replace(
        /(<span className="font-mono[^"]*">\s*)v[\d.]+(\s*<\/span>)/g,
        `$1v${nextVersion}$2`,
      )
    },
    'docs/src/pages/(home)/index.tsx',
  )

  // 8. Update docs/src/components/sidebar-preview.tsx preview version badge
  const sidebarPreviewPath = join(
    rootDir,
    'docs',
    'src',
    'components',
    'sidebar-preview.tsx',
  )
  updateFile(
    sidebarPreviewPath,
    (content) => {
      return content.replace(
        /(className="text-\[10px\][^"]*font-mono"[^>]*>\s*)v[\d.]+(\s*<\/span>)/g,
        `$1v${nextVersion}$2`,
      )
    },
    'docs/src/components/sidebar-preview.tsx',
  )

  // 9. Update docs/src/components/theme-studio.tsx alert preview
  const themeStudioPath = join(
    rootDir,
    'docs',
    'src',
    'components',
    'theme-studio.tsx',
  )
  updateFile(
    themeStudioPath,
    (content) => {
      return content.replace(
        /Moul UI v[\d.]+( is now ready for deployment\.)/g,
        `Moul UI v${nextVersion}$1`,
      )
    },
    'docs/src/components/theme-studio.tsx',
  )

  // 10. Update docs/public/llms-full.txt
  const llmsFullPath = join(rootDir, 'docs', 'public', 'llms-full.txt')
  updateFile(
    llmsFullPath,
    (content) => {
      return content.replace(
        /<span>v[\d.]+<\/span>/g,
        `<span>v${nextVersion}</span>`,
      )
    },
    'docs/public/llms-full.txt',
  )

  // 11. Update ui/src/sandbox/sections/NavigationSection.tsx
  const navSectionPath = join(
    rootDir,
    'ui',
    'src',
    'sandbox',
    'sections',
    'NavigationSection.tsx',
  )
  updateFile(
    navSectionPath,
    (content) => {
      return content.replace(/Release v[\d.]+/g, `Release v${nextVersion}`)
    },
    'ui/src/sandbox/sections/NavigationSection.tsx',
  )

  // 11. Optionally scaffold changelog file if requested
  if (options.scaffoldChangelog) {
    const todayIso = formatIsoDate(new Date())
    const changelogFilename = `v${todayIso}.mdx`
    const changelogPath = join(
      rootDir,
      'docs',
      'content',
      'changelog',
      changelogFilename,
    )

    if (!existsSync(changelogPath)) {
      const changelogTemplate = `---
title: v${nextVersion} — Release Summary
description: Release notes and architectural updates for Moul UI v${nextVersion}.
date: ${todayIso}
author: Phearak S. Tha
avatar: https://github.com/thasophearak.png
---

This release updates **Moul UI** to **v${nextVersion}**. State the core problem or update in the first two sentences.

Build the underlying mental model and background context here. Keep paragraphs between 2 and 4 sentences. Alternate dense technical explanations with short, punchy statements.

It is fast. It is predictable. And it stays out of your way.

---

## Core Primitives

Walk through the mechanism, philosophy, and implementation step-by-step using functional headers and precise technical descriptions:

- **Component Refinement:** Detail specific architectural improvements, keyboard accessibility, or token integrations.
- **State Handling:** Explain prop changes, event signatures, or focus management.

---

## On Craft and Sustainability

Conclude with a focus on human care, engineering craftsmanship, and long-term maintainability[^1].

Take care of the fundamentals. The rest follows.

[^1]: Technical aside or context regarding zero-runtime styling or performance.
`
      if (!options.dryRun) {
        writeFileSync(changelogPath, changelogTemplate, 'utf8')
      }
      modifiedFiles.push(`docs/content/changelog/${changelogFilename} (NEW)`)
      console.log(
        `  ${colors.green}✓${colors.reset} Scaffolded changelog at docs/content/changelog/${changelogFilename}`,
      )
    } else {
      console.log(
        `  ${colors.dim}• docs/content/changelog/${changelogFilename} already exists${colors.reset}`,
      )
    }
  }

  console.log(
    `\n${colors.bright}${colors.green}✨ Version bump completed!${colors.reset}`,
  )
  console.log(
    `   ${colors.dim}${modifiedFiles.length} file(s) updated to ${nextVersion}${colors.reset}\n`,
  )
}

main().catch((err) => {
  console.error(`\n${colors.red}Error during version bump:${colors.reset}`, err)
  process.exit(1)
})
