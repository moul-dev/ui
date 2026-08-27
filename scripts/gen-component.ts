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

function toPascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter) => letter.toUpperCase())
    .replace(/[\s-_]+/g, '')
}

interface GeneratorOptions {
  componentName: string
  kebabName: string
  description: string
  category: string
  dryRun: boolean
  isAria: boolean
}

function parseArgs(args: string[]): GeneratorOptions {
  let name = ''
  let description = ''
  let category = 'general'
  let dryRun = false
  let isAria = true

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--help' || arg === '-h') {
      console.log(`
${colors.bright}Moul UI Component Generator${colors.reset}

${colors.yellow}Usage:${colors.reset}
  bun run gen:component <ComponentName> [options]

${colors.yellow}Options:${colors.reset}
  --description, -d <text>   Component description for docs and JSDoc
  --category, -c <name>      Category (actions, forms, overlays, feedback, navigation, layout, charts)
  --no-aria                  Generate simple HTML element component instead of React Aria primitive
  --dry-run                  Preview generated files without writing to disk
  --help, -h                 Show this help message

${colors.yellow}Examples:${colors.reset}
  bun run gen:component Timeline
  bun run gen:component SegmentedControl -d "Segmented toggle picker" -c actions
`)
      process.exit(0)
    }

    if (arg === '--dry-run') {
      dryRun = true
    } else if (arg === '--no-aria') {
      isAria = false
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
      `${colors.red}Error:${colors.reset} Component name is required.`,
    )
    console.error(
      `Example: ${colors.cyan}bun run gen:component SegmentedControl${colors.reset}`,
    )
    process.exit(1)
  }

  const pascalName = toPascalCase(name)
  const kebabName = toKebabCase(pascalName)
  const defaultDesc = `${pascalName} component built with React Aria and StyleX.`

  return {
    componentName: pascalName,
    kebabName,
    description: description || defaultDesc,
    category,
    dryRun,
    isAria,
  }
}

function generateComponentFile(opts: GeneratorOptions): string {
  const { componentName, description, isAria } = opts

  if (isAria) {
    return `'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { styles } from './${componentName}.styles'

export type ${componentName}Variant = 'neutral' | 'primary' | 'subtle'
export type ${componentName}Size = 'sm' | 'md' | 'lg'

export interface ${componentName}Props extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  /** Visual variant style */
  variant?: ${componentName}Variant
  /** Component size */
  size?: ${componentName}Size
  /** StyleX override styles */
  style?: StyleXStyles
  /** Custom CSS class names */
  className?: string
  /** Children elements */
  children?: React.ReactNode
}

/**
 * ${description}
 */
export const ${componentName} = React.forwardRef<HTMLDivElement, ${componentName}Props>(
  function ${componentName}(
    {
      variant = 'neutral',
      size = 'md',
      style,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.base,
      styles[variant],
      styles[size],
      style,
    )

    return (
      <div
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {children}
      </div>
    )
  },
)
`
  }

  return `import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { styles } from './${componentName}.styles'

export interface ${componentName}Props extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  /** StyleX override styles */
  style?: StyleXStyles
  /** Custom CSS class names */
  className?: string
  /** Children elements */
  children?: React.ReactNode
}

/**
 * ${description}
 */
export const ${componentName} = React.forwardRef<HTMLDivElement, ${componentName}Props>(
  function ${componentName}({ style, className, children, ...rest }, ref) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.base,
      style,
    )

    return (
      <div
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {children}
      </div>
    )
  },
)
`
}

function generateStylesFile(_opts: GeneratorOptions): string {
  return `import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    fontFamily: tokens.fontFamilySans,
    color: tokens.colorNeutral900,
    borderRadius: tokens.radiusMd,
    transitionProperty: 'background-color, border-color, color, box-shadow',
    transitionDuration: '150ms',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  sm: {
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
  },
  md: {
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing3,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
  },
  lg: {
    paddingBlock: tokens.spacing3,
    paddingInline: tokens.spacing4,
    fontSize: tokens.fontSizeLg,
    lineHeight: tokens.lineHeightLg,
  },
  neutral: {
    backgroundColor: tokens.colorNeutral100,
    borderColor: tokens.colorBorderSubtle,
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  primary: {
    backgroundColor: tokens.colorPrimary100,
    color: tokens.colorPrimary700,
    borderColor: tokens.colorPrimary300,
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  subtle: {
    backgroundColor: 'transparent',
    color: tokens.colorNeutral700,
  },
})
`
}

function generateIndexFile(opts: GeneratorOptions): string {
  const { componentName } = opts
  return `export { ${componentName} } from './${componentName}'
export type {
  ${componentName}Props,
  ${componentName}Size,
  ${componentName}Variant,
} from './${componentName}'
`
}

function generateTestFile(opts: GeneratorOptions): string {
  const { componentName } = opts
  return `import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { ${componentName} } from './${componentName}'

describe('${componentName}', () => {
  it('renders children correctly', () => {
    render(<${componentName}>Test Content</${componentName}>)
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('supports custom className and ref forwarding', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(
      <${componentName} ref={ref} className="custom-test-class" data-testid="${opts.kebabName}">
        Hello
      </${componentName}>,
    )
    const element = screen.getByTestId('${opts.kebabName}')
    expect(element).toHaveClass('custom-test-class')
    expect(ref.current).toBe(element)
  })

  it('renders variants and sizes without throwing', () => {
    const { container } = render(
      <div>
        <${componentName} variant="primary" size="sm">Small Primary</${componentName}>
        <${componentName} variant="neutral" size="md">Medium Neutral</${componentName}>
        <${componentName} variant="subtle" size="lg">Large Subtle</${componentName}>
      </div>,
    )
    expect(container).toBeInTheDocument()
  })
})
`
}

function generateMdxDoc(opts: GeneratorOptions): string {
  const { componentName, description } = opts
  return `---
title: ${componentName}
description: ${description}
---

import { ${componentName} } from '@moul-dev/ui';

# ${componentName}

${description}

## Preview

<ComponentPlayground component="${componentName}" />

## Import

\`\`\`tsx
import { ${componentName} } from '@moul-dev/ui';
\`\`\`

## Usage

\`\`\`tsx
<${componentName} variant="neutral" size="md">
  ${componentName} Content
</${componentName}>
\`\`\`

## Sizes

\`\`\`tsx
<div className="flex items-center gap-3">
  <${componentName} size="sm">Small</${componentName}>
  <${componentName} size="md">Medium</${componentName}>
  <${componentName} size="lg">Large</${componentName}>
</div>
\`\`\`

## Variants

\`\`\`tsx
<div className="flex items-center gap-3">
  <${componentName} variant="neutral">Neutral</${componentName}>
  <${componentName} variant="primary">Primary</${componentName}>
  <${componentName} variant="subtle">Subtle</${componentName}>
</div>
\`\`\`

## Props

<TypeTable
  type={{
    size: {
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'The size scaling of the component.',
    },
    variant: {
      type: "'neutral' | 'primary' | 'subtle'",
      default: "'neutral'",
      description: 'The visual variant style.',
    },
    className: {
      type: 'string',
      description: 'Custom CSS class name.',
    },
  }}
/>
`
}

async function main() {
  const rootDir = resolve(__dirname, '..')
  const opts = parseArgs(process.argv.slice(2))

  console.log(
    `\\n${colors.bright}${colors.cyan}Moul UI Scaffolding:${colors.reset} Generating ${colors.green}${opts.componentName}${colors.reset}\\n`,
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
    'content',
    'docs',
    'components',
    `${opts.kebabName}.mdx`,
  )
  const indexTsPath = join(rootDir, 'ui', 'src', 'index.ts')

  if (existsSync(componentDir)) {
    console.error(
      `${colors.red}Error:${colors.reset} Component directory already exists: ${componentDir}`,
    )
    process.exit(1)
  }

  const files = [
    {
      path: join(componentDir, `${opts.componentName}.tsx`),
      content: generateComponentFile(opts),
      desc: 'Component implementation',
    },
    {
      path: join(componentDir, `${opts.componentName}.styles.ts`),
      content: generateStylesFile(opts),
      desc: 'StyleX style declarations',
    },
    {
      path: join(componentDir, 'index.ts'),
      content: generateIndexFile(opts),
      desc: 'Barrel export',
    },
    {
      path: join(componentDir, `${opts.componentName}.test.tsx`),
      content: generateTestFile(opts),
      desc: 'Vitest unit tests',
    },
    {
      path: docPath,
      content: generateMdxDoc(opts),
      desc: 'Fumadocs MDX documentation',
    },
  ]

  if (opts.dryRun) {
    console.log(
      `${colors.yellow}[DRY RUN]${colors.reset} The following files would be created:\\n`,
    )
    for (const file of files) {
      console.log(
        `  ${colors.green}+${colors.reset} ${file.path} ${colors.dim}(${file.desc})${colors.reset}`,
      )
    }
    console.log(
      `\\n  ${colors.cyan}~${colors.reset} Append export to ${indexTsPath}`,
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
    const exportStatement = `\\nexport { ${opts.componentName} } from './components/${opts.componentName}'\\nexport type {\\n  ${opts.componentName}Props,\\n  ${opts.componentName}Size,\\n  ${opts.componentName}Variant,\\n} from './components/${opts.componentName}'\\n`
    writeFileSync(
      indexTsPath,
      indexContent.trimEnd() + exportStatement,
      'utf-8',
    )
    console.log(`  ${colors.green}✓ Updated${colors.reset} ${indexTsPath}`)
  }

  console.log(
    `\\n${colors.bright}${colors.green}Success!${colors.reset} Component ${colors.cyan}${opts.componentName}${colors.reset} has been generated.\\n`,
  )
  console.log('Next steps:')
  console.log(
    `  1. Customize styles in: ${colors.dim}ui/src/components/${opts.componentName}/${opts.componentName}.styles.ts${colors.reset}`,
  )
  console.log(
    `  2. Add showcase in: ${colors.dim}ui/src/sandbox/sections/...${colors.reset}`,
  )
  console.log(`  3. Run tests: ${colors.dim}bun test${colors.reset}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
