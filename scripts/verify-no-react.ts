#!/usr/bin/env bun
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
}

type Target = 'all' | 'ui' | 'docs'
type DepBlock = 'dependencies' | 'devDependencies' | 'peerDependencies'

const DEP_BLOCKS: DepBlock[] = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
]

// Explicit banned package set
const BANNED_EXACT = new Set([
  'react',
  'react-dom',
  'react-aria',
  'react-aria-components',
  'react-stately',
  'react-server-dom-webpack',
  'recharts',
  'input-otp',
  'waku',
  'lucide-react',
  '@lit/react',
  '@phosphor-icons/react',
  '@testing-library/react',
  '@testing-library/jest-dom',
  '@vitejs/plugin-react',
  '@astrojs/react',
])

// Pattern matchers for banned packages
const BANNED_PATTERNS: RegExp[] = [
  /^react(-.*)?$/,
  /^@types\/react(-.*)?$/,
  /^@stylexjs\//,
  /^fumadocs-/,
  /^@tanstack\/react-/,
  /(-|\/)react$/,
]

function isBannedPackage(name: string): boolean {
  if (BANNED_EXACT.has(name)) {
    return true
  }
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(name)) {
      return true
    }
  }
  return false
}

interface Violation {
  file: string
  block: DepBlock
  pkg: string
  version: string
}

function checkManifest(filePath: string, relativePath: string): Violation[] {
  if (!existsSync(filePath)) {
    console.error(
      `${colors.red}Error: Manifest file not found: ${filePath}${colors.reset}`,
    )
    process.exit(1)
  }

  let pkgJson: Record<string, any>
  try {
    pkgJson = JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch (err) {
    console.error(
      `${colors.red}Error parsing JSON in ${filePath}:${colors.reset}`,
      err,
    )
    process.exit(1)
  }

  const violations: Violation[] = []

  for (const block of DEP_BLOCKS) {
    const deps = pkgJson[block]
    if (deps && typeof deps === 'object') {
      for (const [depName, depVersion] of Object.entries(deps)) {
        if (isBannedPackage(depName)) {
          violations.push({
            file: relativePath,
            block,
            pkg: depName,
            version: String(depVersion),
          })
        }
      }
    }
  }

  return violations
}

function main() {
  const rootDir = resolve(import.meta.dir, '..')
  const rawTarget = process.argv[2] || 'all'
  const target = rawTarget.toLowerCase() as Target

  if (target !== 'all' && target !== 'ui' && target !== 'docs') {
    console.error(
      `${colors.red}Invalid target '${rawTarget}'. Supported targets: all, ui, docs.${colors.reset}`,
    )
    console.error('Usage: bun ./scripts/verify-no-react.ts [all|ui|docs]')
    process.exit(1)
  }

  const targetsToCheck: Array<{ absPath: string; relPath: string }> = []
  if (target === 'all' || target === 'ui') {
    targetsToCheck.push({
      absPath: join(rootDir, 'ui', 'package.json'),
      relPath: 'ui/package.json',
    })
  }
  if (target === 'all' || target === 'docs') {
    targetsToCheck.push({
      absPath: join(rootDir, 'docs', 'package.json'),
      relPath: 'docs/package.json',
    })
  }

  const allViolations: Violation[] = []
  for (const t of targetsToCheck) {
    allViolations.push(...checkManifest(t.absPath, t.relPath))
  }

  if (allViolations.length > 0) {
    console.error(
      `\n${colors.red}${colors.bright}❌ Disallowed packages detected!${colors.reset}`,
    )
    console.error(
      `${colors.red}Found ${allViolations.length} prohibited package(s) matching banned criteria (React, StyleX, Recharts, Fumadocs, etc.):${colors.reset}\n`,
    )

    const grouped = new Map<
      string,
      Map<DepBlock, Array<{ pkg: string; version: string }>>
    >()
    for (const v of allViolations) {
      if (!grouped.has(v.file)) {
        grouped.set(v.file, new Map())
      }
      const fileMap = grouped.get(v.file)!
      if (!fileMap.has(v.block)) {
        fileMap.set(v.block, [])
      }
      fileMap.get(v.block)!.push({ pkg: v.pkg, version: v.version })
    }

    for (const [file, blockMap] of grouped.entries()) {
      console.error(`${colors.bright}${colors.yellow}${file}:${colors.reset}`)
      for (const [block, items] of blockMap.entries()) {
        console.error(`  ${colors.cyan}[${block}]${colors.reset}`)
        for (const item of items) {
          console.error(
            `    ${colors.red}- ${item.pkg}${colors.reset} (${colors.dim}${item.version}${colors.reset})`,
          )
        }
      }
      console.error('')
    }

    console.error(
      `${colors.yellow}Please remove all React, StyleX, and legacy dependencies before proceeding.${colors.reset}\n`,
    )
    process.exit(1)
  }

  console.log(
    `${colors.green}✓ [verify-no-react] Target '${target}': Zero disallowed React/legacy packages found across inspected manifests.${colors.reset}`,
  )
  process.exit(0)
}

main()
