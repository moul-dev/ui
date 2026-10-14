#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

interface GeneratorOptions {
  componentName: string
  kebabName: string
  description: string
  category: string
  dryRun: boolean
}

function parseArgs(args: string[]): GeneratorOptions {
  let name = ''
  let description = ''
  let category = 'general'
  let dryRun = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--help' || arg === '-h') {
      console.log(`
${colors.bright}Moul UI Component Generator${colors.reset}

${colors.yellow}Usage:${colors.reset}
  bun run gen:component <ComponentName> [options]

${colors.yellow}Options:${colors.reset}
  --description, -d <text>   Component description for docs and JSDoc
  --category, -c <name>      Category
  --dry-run                  Preview generated files without writing to disk
  --help, -h                 Show this help message
`)
      process.exit(0)
    } else if (arg === '--dry-run') {
      dryRun = true
    } else if (arg === '--description' || arg === '-d') {
      description = args[++i] || ''
    } else if (arg === '--category' || arg === '-c') {
      category = args[++i] || 'general'
    } else if (!arg.startsWith('-') && !name) {
      name = arg
    }
  }

  if (!name) {
    console.error(
      `${colors.red}Error:${colors.reset} Please provide a component name (e.g. bun run gen:component Badge)`,
    )
    process.exit(1)
  }

  const kebabName = toKebabCase(name)
  return {
    componentName: name,
    kebabName,
    description:
      description || `${name} component built with Lit and Bootstrap 6.`,
    category,
    dryRun,
  }
}

function generateComponentFile(opts: GeneratorOptions): string {
  const { componentName, kebabName } = opts
  return `import { html } from 'lit'
import { property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { ${toKebabCase(componentName).replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Styles } from './${componentName}.styles.js'

export type ${componentName}Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'

/**
 * \`<moul-${kebabName}>\` component.
 * ${opts.description}
 */
export class ${componentName} extends MoulBase {
  static override styles = [
    ...MoulBase.styles,
    ${toKebabCase(componentName).replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Styles,
  ]

  @property({ type: String, reflect: true })
  variant: ${componentName}Variant = 'primary'

  override render() {
    return html\`
      <div class="moul-${kebabName} alert-\${this.variant}" role="region">
        <slot></slot>
      </div>
    \`
  }
}
`
}

function generateStylesFile(opts: GeneratorOptions): string {
  const { componentName, kebabName } = opts
  const fnName = toKebabCase(componentName).replace(/-([a-z])/g, (_, c) =>
    c.toUpperCase(),
  )
  return `import { css } from 'lit'

export const ${fnName}Styles = css\`
  :host {
    display: block;
    box-sizing: border-box;
  }
  .moul-${kebabName} {
    box-sizing: border-box;
    font-family: inherit;
  }
\`
`
}

function generateIndexFile(opts: GeneratorOptions): string {
  const { componentName, kebabName } = opts
  return `import { ${componentName} } from './${componentName}.js'

export { ${componentName} } from './${componentName}.js'
export type { ${componentName}Variant } from './${componentName}.js'

if (!customElements.get('moul-${kebabName}')) {
  customElements.define('moul-${kebabName}', ${componentName})
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-${kebabName}': ${componentName}
  }
}
`
}

function generateMdxDoc(opts: GeneratorOptions): string {
  const { componentName, kebabName, description } = opts
  return `---
title: ${componentName}
description: ${description}
---

import ComponentPreview from '../../../components/ComponentPreview.astro'
import PropsTable from '../../../components/PropsTable.astro'

## Default

<ComponentPreview>
  <moul-${kebabName} variant="primary">${componentName} content</moul-${kebabName}>
</ComponentPreview>

\`\`\`html
<moul-${kebabName} variant="primary">
  ${componentName} content
</moul-${kebabName}>
\`\`\`

## Props

<PropsTable
  type={{
    variant: {
      type: "'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'",
      default: "'primary'",
      description: 'Visual color variant.',
    },
  }}
/>
`
}

async function main() {
  const rootDir = resolve(__dirname, '..')
  const opts = parseArgs(process.argv.slice(2))

  console.log(
    `\n${colors.bright}${colors.cyan}Moul UI Scaffolding:${colors.reset} Generating ${colors.green}${opts.componentName}${colors.reset}\n`,
  )

  const componentDir = join(
    rootDir,
    'ui',
    'src',
    'components',
    opts.componentName,
  )
  const docDir = existsSync(
    join(rootDir, 'docs', 'src', 'content', 'docs', 'components'),
  )
    ? join(rootDir, 'docs', 'src', 'content', 'docs', 'components')
    : join(rootDir, 'docs', 'content', 'docs', 'components')
  const docPath = join(docDir, `${opts.kebabName}.mdx`)
  const indexTsPath = join(rootDir, 'ui', 'src', 'index.ts')

  if (existsSync(componentDir)) {
    console.error(
      `${colors.red}Error:${colors.reset} Component directory already exists: ${componentDir}`,
    )
    process.exit(1)
  }

  const files = [
    {
      path: join(componentDir, `${opts.componentName}.ts`),
      content: generateComponentFile(opts),
      desc: 'Lit component implementation',
    },
    {
      path: join(componentDir, `${opts.componentName}.styles.ts`),
      content: generateStylesFile(opts),
      desc: 'Lit CSS stylesheet',
    },
    {
      path: join(componentDir, 'index.ts'),
      content: generateIndexFile(opts),
      desc: 'Barrel export and custom element registration',
    },
    {
      path: docPath,
      content: generateMdxDoc(opts),
      desc: 'Astro Starlight MDX documentation',
    },
  ]

  if (opts.dryRun) {
    console.log(
      `${colors.yellow}[DRY RUN]${colors.reset} The following files would be created:\n`,
    )
    for (const file of files) {
      console.log(
        `  ${colors.green}+${colors.reset} ${file.path} ${colors.dim}(${file.desc})${colors.reset}`,
      )
    }
    console.log(
      `\n  ${colors.cyan}~${colors.reset} Append export to ${indexTsPath}`,
    )
    return
  }

  // Create component directory
  mkdirSync(componentDir, { recursive: true })

  // Write files
  for (const file of files) {
    writeFileSync(file.path, file.content, 'utf-8')
    console.log(`  ${colors.green}✓ Created${colors.reset} ${file.path}`)
  }

  // Append export to ui/src/index.ts
  if (existsSync(indexTsPath)) {
    const indexContent = readFileSync(indexTsPath, 'utf-8')
    const exportStatement = `\nexport * from './components/${opts.componentName}/index.js'\n`
    writeFileSync(
      indexTsPath,
      indexContent.trimEnd() + exportStatement,
      'utf-8',
    )
    console.log(`  ${colors.green}✓ Updated${colors.reset} ${indexTsPath}`)
  }

  console.log(
    `\n${colors.bright}${colors.green}Success!${colors.reset} Component ${colors.cyan}${opts.componentName}${colors.reset} has been generated.\n`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
