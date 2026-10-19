#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

// ANSI colors for clean console logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
}

export function toPascalCase(str: string): string {
  return str
    .replace(/[^A-Za-z0-9]+(.)?/g, (_, chr: string | undefined) =>
      chr ? chr.toUpperCase() : '',
    )
    .replace(/^./, (chr) => chr.toUpperCase())
}

export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

interface GeneratorOptions {
  /** PascalCase directory / file name, e.g. `SegmentedControl`. */
  componentName: string
  /** Lit class name, e.g. `MoulSegmentedControl`. */
  className: string
  /** Custom element tag, e.g. `moul-segmented-control`. */
  tagName: string
  /** Docs route slug, matching existing pages (`segmentedcontrol`). */
  docSlug: string
  description: string
  dryRun: boolean
}

function printHelp() {
  console.log(`
${colors.bright}Moul UI Component Generator${colors.reset}

${colors.yellow}Usage:${colors.reset}
  bun run gen:component <ComponentName> [options]

${colors.yellow}Options:${colors.reset}
  --description, -d <text>   One-line description for JSDoc and the docs page
  --dry-run                  Preview generated files without writing to disk
  --help, -h                 Show this help message

${colors.yellow}Generates:${colors.reset}
  ui/src/components/<ComponentName>/<ComponentName>.ts         LitElement class (moul-<kebab-name>)
  ui/src/components/<ComponentName>/<ComponentName>.styles.ts  Lit css\`\` styles
  ui/src/components/<ComponentName>/<ComponentName>.test.ts    Vitest + @open-wc/testing-helpers
  ui/src/components/<ComponentName>/index.ts                   Barrel export
  docs/src/content/docs/docs/components/<slug>.mdx             Starlight MDX stub with <ComponentPreview>

${colors.yellow}Examples:${colors.reset}
  bun run gen:component Timeline
  bun run gen:component SegmentedControl -d "Segmented single-choice picker"
`)
}

function parseArgs(args: string[]): GeneratorOptions {
  let name = ''
  let description = ''
  let dryRun = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    } else if (arg === '--dry-run') {
      dryRun = true
    } else if (arg === '--description' || arg === '-d') {
      description = args[++i] || ''
    } else if (!arg.startsWith('-') && !name) {
      name = arg
    }
  }

  if (!name) {
    console.error(
      `${colors.red}Error:${colors.reset} Component name is required.`,
    )
    console.error(
      `Example: ${colors.cyan}bun run gen:component SegmentedControl${colors.reset}`,
    )
    process.exit(1)
  }

  const componentName = toPascalCase(name)
  if (!/^[A-Z][A-Za-z0-9]*$/.test(componentName)) {
    console.error(
      `${colors.red}Error:${colors.reset} "${name}" is not a valid component name. Use PascalCase letters and digits, e.g. SegmentedControl.`,
    )
    process.exit(1)
  }

  return {
    componentName,
    className: `Moul${componentName}`,
    tagName: `moul-${toKebabCase(componentName)}`,
    docSlug: componentName.toLowerCase(),
    description:
      description ||
      `${componentName} Web Component built with Lit and Moul CSS tokens.`,
    dryRun,
  }
}

function generateComponentFile(opts: GeneratorOptions): string {
  const { componentName, className, tagName, description } = opts
  return `import { html, LitElement, type PropertyValues } from 'lit'
import {
  normalizeTone,
  normalizeVariant,
  type SemanticTone,
  type VisualVariant,
} from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { ${lowerFirst(componentName)}Styles } from './${componentName}.styles'

export type ${componentName}Size = 'sm' | 'md' | 'lg'

/**
 * ${description}
 *
 * @slot - Default content.
 * @slot prefix - Content rendered before the default slot.
 * @slot suffix - Content rendered after the default slot.
 * @csspart base - The wrapper element.
 */
export class ${className} extends LitElement {
  static override styles = ${lowerFirst(componentName)}Styles

  static override properties = {
    tone: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
  }

  declare tone: SemanticTone
  declare variant: VisualVariant
  declare size: ${componentName}Size
  declare isDisabled: boolean

  constructor() {
    super()
    this.tone = 'primary'
    this.variant = 'flat'
    this.size = 'md'
    this.isDisabled = false
  }

  protected override willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps)
    if (changedProps.has('tone')) {
      const normalized = normalizeTone(this.tone)
      if (this.tone !== normalized) this.tone = normalized
    }
    if (changedProps.has('variant')) {
      const normalized = normalizeVariant(this.variant)
      if (this.variant !== normalized) this.variant = normalized
    }
    if (changedProps.has('isDisabled')) {
      if (this.isDisabled) {
        this.setAttribute('aria-disabled', 'true')
      } else {
        this.removeAttribute('aria-disabled')
      }
    }
  }

  protected override render() {
    return html\`
      <div part="base">
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
      </div>
    \`
  }
}

defineElement('${tagName}', ${className})

declare global {
  interface HTMLElementTagNameMap {
    '${tagName}': ${className}
  }
}
`
}

function generateStylesFile(opts: GeneratorOptions): string {
  return `import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const ${lowerFirst(opts.componentName)}Styles = [
  resetStyles,
  semanticToneStyles,
  css\`
    :host {
      display: inline-flex;
      box-sizing: border-box;
      font-family: var(--font-family-base);
      border-radius: var(--radius-md, 0.5rem);
      transition:
        background-color 150ms ease,
        border-color 150ms ease,
        color 150ms ease;
    }

    :host([hidden]) {
      display: none;
    }

    :host([is-disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }

    [part='base'] {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
    }

    :host([size='sm']) [part='base'] {
      padding: var(--spacing-1, 0.25rem) var(--spacing-2, 0.5rem);
      font-size: var(--font-size-sm, 0.875rem);
    }

    :host([size='md']) [part='base'],
    :host(:not([size])) [part='base'] {
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      font-size: var(--font-size-md, 1rem);
    }

    :host([size='lg']) [part='base'] {
      padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
      font-size: var(--font-size-lg, 1.125rem);
    }
  \`,
]
`
}

function generateIndexFile(opts: GeneratorOptions): string {
  const { componentName, className } = opts
  return `export type { ${componentName}Size } from './${componentName}'
export { ${className}, ${className} as ${componentName} } from './${componentName}'
`
}

function generateTestFile(opts: GeneratorOptions): string {
  const { componentName, className, tagName } = opts
  return `import { fixture, html } from '@open-wc/testing-helpers'
import { describe, expect, it } from 'vitest'
import './${componentName}'
import type { ${className} } from './${componentName}'

describe('<${tagName}>', () => {
  it('is registered as a custom element with an open shadow root', async () => {
    const el = await fixture<${className}>(html\`<${tagName}>Content</${tagName}>\`)
    expect(customElements.get('${tagName}')).toBeDefined()
    expect(el.shadowRoot).not.toBeNull()
    expect(el.shadowRoot?.querySelector('[part="base"]')).not.toBeNull()
  })

  it('applies default attribute values', async () => {
    const el = await fixture<${className}>(html\`<${tagName}></${tagName}>\`)
    expect(el.tone).toBe('primary')
    expect(el.variant).toBe('flat')
    expect(el.size).toBe('md')
    expect(el.getAttribute('size')).toBe('md')
  })

  it('falls back to defaults for invalid tone and variant values', async () => {
    const el = await fixture<${className}>(
      html\`<${tagName} tone="nope" variant="nope"></${tagName}>\`,
    )
    await el.updateComplete
    expect(el.tone).toBe('primary')
    expect(el.variant).toBe('flat')
  })

  it('reflects is-disabled to aria-disabled', async () => {
    const el = await fixture<${className}>(html\`<${tagName} is-disabled></${tagName}>\`)
    expect(el.isDisabled).toBe(true)
    expect(el.getAttribute('aria-disabled')).toBe('true')
    el.isDisabled = false
    await el.updateComplete
    expect(el.hasAttribute('aria-disabled')).toBe(false)
  })
})
`
}

function generateMdxDoc(opts: GeneratorOptions): string {
  const { componentName, tagName, description } = opts
  return `---
title: ${componentName}
description: ${description}
---

import ComponentPreview from '@/components/ComponentPreview.astro';

# ${componentName}

The \`<${tagName}>\` component is a standards-first Web Component built with Lit 3 and styled with OKLCH CSS tokens.

## Preview

<ComponentPreview>
  <${tagName} size="sm">Small</${tagName}>
  <${tagName} size="md">Medium</${tagName}>
  <${tagName} size="lg">Large</${tagName}>
</ComponentPreview>

## Import

\`\`\`ts
import '@moul-dev/ui';
import '@moul-dev/ui/style.css';
\`\`\`

## HTML Usage

\`\`\`html
<${tagName} tone="primary" variant="flat" size="md">${componentName} content</${tagName}>
\`\`\`

## Attributes & Properties

| Name | Type | Default |
| :--- | :--- | :--- |
| \`tone\` | \`SemanticTone\` | \`'primary'\` |
| \`variant\` | \`VisualVariant\` | \`'flat'\` |
| \`size\` | \`'sm' \\| 'md' \\| 'lg'\` | \`'md'\` |
| \`is-disabled\` | \`boolean\` | \`false\` |

## Slots

| Name | Description |
| :--- | :--- |
| (default) | Main content. |
| \`prefix\` | Content before the main content. |
| \`suffix\` | Content after the main content. |
`
}

function lowerFirst(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1)
}

/**
 * Register the new element in the public entry point: value export, type
 * import, and `HTMLElementTagNameMap` entry. Returns null when an anchor is
 * missing so the caller can print manual instructions instead of guessing.
 */
function updateIndexTs(content: string, opts: GeneratorOptions): string | null {
  const { componentName, className, tagName } = opts
  const typeImportsAnchor = '// Custom Element Type Imports'
  const mapClose = /\n {2}\}\n\}\s*$/

  if (!content.includes(typeImportsAnchor) || !mapClose.test(content)) {
    return null
  }

  const exportBlock = `export type { ${componentName}Size } from './components/${componentName}'
export {
  ${className},
  ${className} as ${componentName},
} from './components/${componentName}'

`
  const typeImport = `import type { ${className} } from './components/${componentName}'\n`

  let next = content.replace(
    typeImportsAnchor,
    `${exportBlock}${typeImportsAnchor}`,
  )
  next = next.replace(
    new RegExp(`(${typeImportsAnchor}[^\\n]*\\n)`),
    `$1${typeImport}`,
  )
  next = next.replace(mapClose, `\n    '${tagName}': ${className}\n  }\n}\n`)
  return next
}

function main() {
  const rootDir = resolve(import.meta.dir, '..')
  const opts = parseArgs(process.argv.slice(2))

  console.log(
    `\n${colors.bright}${colors.cyan}Moul UI Scaffolding:${colors.reset} Generating ${colors.green}<${opts.tagName}>${colors.reset} (${opts.className})\n`,
  )

  const componentDir = join(
    rootDir,
    'ui',
    'src',
    'components',
    opts.componentName,
  )
  const docPath = join(
    rootDir,
    'docs',
    'src',
    'content',
    'docs',
    'docs',
    'components',
    `${opts.docSlug}.mdx`,
  )
  const indexTsPath = join(rootDir, 'ui', 'src', 'index.ts')

  if (existsSync(componentDir)) {
    console.error(
      `${colors.red}Error:${colors.reset} Component directory already exists: ${componentDir}`,
    )
    process.exit(1)
  }
  if (existsSync(docPath)) {
    console.error(
      `${colors.red}Error:${colors.reset} Docs page already exists: ${docPath}`,
    )
    process.exit(1)
  }

  const files = [
    {
      path: join(componentDir, `${opts.componentName}.ts`),
      content: generateComponentFile(opts),
      desc: 'LitElement class',
    },
    {
      path: join(componentDir, `${opts.componentName}.styles.ts`),
      content: generateStylesFile(opts),
      desc: 'Lit css`` styles',
    },
    {
      path: join(componentDir, `${opts.componentName}.test.ts`),
      content: generateTestFile(opts),
      desc: 'Vitest unit tests',
    },
    {
      path: join(componentDir, 'index.ts'),
      content: generateIndexFile(opts),
      desc: 'Barrel export',
    },
    {
      path: docPath,
      content: generateMdxDoc(opts),
      desc: 'Starlight MDX documentation stub',
    },
  ]

  const rel = (path: string) => path.slice(rootDir.length + 1)

  if (opts.dryRun) {
    console.log(
      `${colors.yellow}[DRY RUN]${colors.reset} The following files would be created:\n`,
    )
    for (const file of files) {
      console.log(
        `  ${colors.green}+${colors.reset} ${rel(file.path)} ${colors.dim}(${file.desc})${colors.reset}`,
      )
    }
    console.log(
      `\n  ${colors.cyan}~${colors.reset} Register exports and tag map entry in ${rel(indexTsPath)}`,
    )
    return
  }

  for (const file of files) {
    mkdirSync(dirname(file.path), { recursive: true })
    writeFileSync(file.path, file.content, 'utf-8')
    console.log(`  ${colors.green}✓ Created${colors.reset} ${rel(file.path)}`)
  }

  const indexContent = readFileSync(indexTsPath, 'utf-8')
  const updatedIndex = updateIndexTs(indexContent, opts)
  if (updatedIndex) {
    writeFileSync(indexTsPath, updatedIndex, 'utf-8')
    console.log(`  ${colors.green}✓ Updated${colors.reset} ${rel(indexTsPath)}`)
  } else {
    console.warn(
      `  ${colors.yellow}⚠ Could not locate export anchors in ${rel(indexTsPath)}; add the export and HTMLElementTagNameMap entry manually.${colors.reset}`,
    )
  }

  // Let Biome own import order and line wrapping so generated code always
  // passes `bun run lint`, regardless of where it was spliced in.
  const touched = [...files.map((f) => f.path), indexTsPath].filter((p) =>
    p.endsWith('.ts'),
  )
  const biome = Bun.spawnSync(
    ['bunx', 'biome', 'check', '--write', ...touched],
    { cwd: rootDir, stdout: 'ignore', stderr: 'pipe' },
  )
  if (biome.exitCode === 0) {
    console.log(`  ${colors.green}✓ Formatted${colors.reset} with Biome`)
  } else {
    console.warn(
      `  ${colors.yellow}⚠ Biome reported issues; run ${colors.cyan}bun run lint${colors.yellow} to review.${colors.reset}`,
    )
  }

  console.log(
    `\n${colors.bright}${colors.green}Success!${colors.reset} <${opts.tagName}> has been generated.\n`,
  )
  console.log('Next steps:')
  console.log(
    `  1. Implement the element in ${colors.dim}ui/src/components/${opts.componentName}/${opts.componentName}.ts${colors.reset}`,
  )
  console.log(
    `  2. Add it to the sandbox in ${colors.dim}ui/src/sandbox.ts${colors.reset}`,
  )
  console.log(
    `  3. Add a catalog entry in ${colors.dim}scripts/llms-catalog.ts${colors.reset}, then run ${colors.cyan}bun run build:ui && bun run sync:llms --write${colors.reset}`,
  )
  console.log(`  4. Run tests: ${colors.cyan}bun run test${colors.reset}`)
}

main()
