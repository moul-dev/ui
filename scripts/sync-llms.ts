#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

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

interface SyncOptions {
  checkOnly: boolean
  verbose: boolean
}

function parseArgs(args: string[]): SyncOptions {
  let checkOnly = false
  let verbose = false

  for (const arg of args) {
    if (arg === '--check') {
      checkOnly = true
    } else if (arg === '--verbose' || arg === '-v') {
      verbose = true
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
${colors.bright}Moul UI LLM Specification Sync & Validator${colors.reset}

${colors.yellow}Usage:${colors.reset}
  bun run sync:llms [options]

${colors.yellow}Options:${colors.reset}
  --check        Verify LLM context files are in sync without writing (for CI)
  --verbose, -v  Print detailed per-component analysis
  --help, -h     Show this help message
`)
      process.exit(0)
    }
  }

  return { checkOnly, verbose }
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

async function main() {
  const rootDir = resolve(__dirname, '..')
  const opts = parseArgs(process.argv.slice(2))

  console.log(
    `\n${colors.bright}${colors.cyan}Moul UI:${colors.reset} Validating & Syncing LLM Specifications\n`,
  )

  const componentsDir = join(rootDir, 'ui', 'src', 'components')
  const indexTsPath = join(rootDir, 'ui', 'src', 'index.ts')
  const llmsTxtPath = join(rootDir, 'docs', 'public', 'llms.txt')
  const llmsFullTxtPath = join(rootDir, 'docs', 'public', 'llms-full.txt')

  // 1. Discover all UI components
  const componentDirs = readdirSync(componentsDir).filter((name) => {
    const full = join(componentsDir, name)
    return statSync(full).isDirectory()
  })

  // 2. Discover all MDX doc files recursively in docs/content/docs/
  const contentDocsDir = join(rootDir, 'docs', 'content', 'docs')
  function getMdxFiles(dir: string): string[] {
    if (!existsSync(dir)) return []
    const results: string[] = []
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...getMdxFiles(full))
      } else if (entry.name.endsWith('.mdx')) {
        results.push(basename(entry.name, '.mdx').toLowerCase())
      }
    }
    return results
  }

  const mdxNames = new Set(getMdxFiles(contentDocsDir))

  // Compound / sub-component mappings
  const compoundSubcomponents: Record<string, string[]> = {
    FieldError: ['form', 'textfield'],
    Label: ['form', 'textfield'],
    Description: ['form', 'textfield'],
    ErrorMessage: ['form', 'textfield'],
    DateField: ['datepicker', 'calendar'],
    LogsViewer: ['logs'],
    ChartContainer: ['areachart', 'barchart', 'linechart'],
    ChartTooltip: ['areachart', 'barchart', 'linechart'],
  }

  // 3. Read exports from ui/src/index.ts
  const indexContent = readFileSync(indexTsPath, 'utf-8')

  // 4. Read llms.txt & llms-full.txt
  const llmsTxt = readFileSync(llmsTxtPath, 'utf-8')
  const llmsFullTxt = readFileSync(llmsFullTxtPath, 'utf-8')

  const issues: string[] = []
  let syncedCount = 0

  console.log(
    `${colors.dim}Scanning ${componentDirs.length} UI components...${colors.reset}\n`,
  )

  for (const comp of componentDirs) {
    const kebab = toKebabCase(comp)
    const lower = comp.toLowerCase()
    const mappedParents = compoundSubcomponents[comp] || []

    const hasDoc =
      mdxNames.has(kebab) ||
      mdxNames.has(lower) ||
      mappedParents.some((p) => mdxNames.has(p))

    const isExported =
      indexContent.includes(`export { ${comp} }`) ||
      indexContent.includes(`export { ${comp},`) ||
      indexContent.includes(`export {\n  ${comp}`) ||
      indexContent.includes(`export {\n  ${comp},`) ||
      indexContent.includes(`from './components/${comp}'`) ||
      indexContent.includes(`from './components/${comp}/`)

    const inLlmsTxt =
      llmsTxt.includes(`[${comp}]`) ||
      llmsTxt.includes(`/${kebab}`) ||
      llmsTxt.includes(`/${lower}`) ||
      mappedParents.some(
        (p) => llmsTxt.includes(`[${p}]`) || llmsTxt.includes(`/${p}`),
      )

    const inLlmsFull =
      llmsFullTxt.includes(`### ${comp}`) ||
      llmsFullTxt.includes(`[${comp}]`) ||
      llmsFullTxt.includes(`#### ${comp}`) ||
      llmsFullTxt.includes(`<${comp}`) ||
      mappedParents.some(
        (p) =>
          llmsFullTxt.includes(`### ${p}`) || llmsFullTxt.includes(`[${p}]`),
      )

    let status = `${colors.green}✓ In Sync${colors.reset}`

    if (!isExported) {
      issues.push(`Component '${comp}' is not exported in ui/src/index.ts`)
      status = `${colors.yellow}⚠ Missing Export${colors.reset}`
    } else if (!hasDoc) {
      issues.push(
        `Component '${comp}' has no matching MDX doc (docs/content/docs/components/${kebab}.mdx)`,
      )
      status = `${colors.yellow}⚠ Missing Doc${colors.reset}`
    } else if (!inLlmsTxt && !inLlmsFull) {
      issues.push(
        `Component '${comp}' is not referenced in docs/public/llms.txt or llms-full.txt`,
      )
      status = `${colors.yellow}⚠ Missing in LLMs${colors.reset}`
    } else {
      syncedCount++
    }

    if (opts.verbose) {
      console.log(`  ${comp.padEnd(25)} ${status}`)
    }
  }

  console.log(
    `\n${colors.bright}Component Sync Summary:${colors.reset} ${syncedCount}/${componentDirs.length} components fully synchronized.`,
  )

  if (issues.length > 0) {
    console.log(
      `\n${colors.yellow}${colors.bright}Identified ${issues.length} potential sync items:${colors.reset}`,
    )
    for (const issue of issues) {
      console.log(`  ${colors.yellow}•${colors.reset} ${issue}`)
    }

    if (opts.checkOnly) {
      console.error(
        `\n${colors.red}Error: LLM spec check failed in --check mode.${colors.reset}`,
      )
      process.exit(1)
    }
  } else {
    console.log(
      `\n${colors.green}${colors.bright}All components, documentation, and LLM references are perfectly in sync!${colors.reset}\n`,
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
