#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { Glob } from 'bun'
import {
  CATEGORIES,
  type ComponentCategory,
  type ComponentFamily,
} from './llms-catalog'

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

const rootDir = resolve(import.meta.dir, '..')
const paths = {
  cem: join(rootDir, 'ui', 'dist', 'custom-elements.json'),
  uiPkg: join(rootDir, 'ui', 'package.json'),
  llmsTxt: join(rootDir, 'docs', 'public', 'llms.txt'),
  llmsFull: join(rootDir, 'docs', 'public', 'llms-full.txt'),
  publicAgents: join(rootDir, 'docs', 'public', 'AGENTS.md'),
  rootAgents: join(rootDir, 'AGENTS.md'),
}

const ROOT_AGENTS_START = '<!-- sync:llms:start -->'
const ROOT_AGENTS_END = '<!-- sync:llms:end -->'

// ---------------------------------------------------------------------------
// Custom Elements Manifest parsing
// ---------------------------------------------------------------------------

interface CemType {
  text?: string
}

interface CemAttribute {
  name: string
  fieldName?: string
  type?: CemType
  default?: string
  description?: string
}

interface CemMember {
  kind: string
  name: string
  privacy?: string
  static?: boolean
  readonly?: boolean
  attribute?: string
  type?: CemType
  default?: string
  description?: string
}

interface CemNamed {
  name: string
  type?: CemType
  description?: string
}

interface CemDeclaration {
  kind: string
  name: string
  tagName?: string
  customElement?: boolean
  description?: string
  attributes?: CemAttribute[]
  members?: CemMember[]
  events?: CemNamed[]
  slots?: CemNamed[]
  cssParts?: CemNamed[]
}

interface CemModule {
  path: string
  declarations?: CemDeclaration[]
}

export interface ElementDoc {
  tag: string
  className: string
  module: string
  attributes: CemAttribute[]
  properties: CemMember[]
  events: CemNamed[]
  slots: CemNamed[]
  cssParts: CemNamed[]
}

/** Public fields that are implementation details rather than consumer API. */
function isInternalProperty(member: CemMember): boolean {
  const type = member.type?.text ?? ''
  return /Controller$/.test(type) || member.type === undefined
}

export function readElements(cemPath: string): ElementDoc[] {
  const manifest = JSON.parse(readFileSync(cemPath, 'utf-8')) as {
    modules: CemModule[]
  }
  const elements: ElementDoc[] = []
  for (const mod of manifest.modules) {
    for (const decl of mod.declarations ?? []) {
      if (!decl.customElement || !decl.tagName) continue
      const properties = (decl.members ?? []).filter(
        (m) =>
          m.kind === 'field' &&
          !m.attribute &&
          !m.static &&
          !m.readonly &&
          m.privacy !== 'private' &&
          m.privacy !== 'protected' &&
          !isInternalProperty(m),
      )
      elements.push({
        tag: decl.tagName,
        className: decl.name,
        module: mod.path,
        attributes: decl.attributes ?? [],
        properties,
        events: decl.events ?? [],
        slots: decl.slots ?? [],
        cssParts: decl.cssParts ?? [],
      })
    }
  }
  return elements.sort((a, b) => a.tag.localeCompare(b.tag))
}

/**
 * Assign every CEM element to a catalog family. Elements the catalog does not
 * know about are collected into a synthetic "Other" category so they are still
 * documented (with an auto-generated snippet) instead of silently dropped.
 */
function resolveCategories(elements: ElementDoc[]): {
  categories: ComponentCategory[]
  stale: string[]
} {
  const known = new Set(elements.map((e) => e.tag))
  const cataloged = new Set<string>()
  const stale: string[] = []

  const categories: ComponentCategory[] = CATEGORIES.map((category) => ({
    title: category.title,
    families: category.families
      .map((family) => {
        const tags = family.tags.filter((tag) => {
          if (!known.has(tag)) stale.push(tag)
          return known.has(tag)
        })
        for (const tag of tags) cataloged.add(tag)
        return { ...family, tags }
      })
      .filter((family) => family.tags.length > 0),
  }))

  const uncataloged = elements.filter((e) => !cataloged.has(e.tag))
  if (uncataloged.length > 0) {
    categories.push({
      title: 'Other',
      families: uncataloged.map((e) => ({
        name: e.className.replace(/^Moul/, ''),
        docs: '/docs/components',
        summary: `\`<${e.tag}>\` custom element.`,
        tags: [e.tag],
        snippet: `<${e.tag}></${e.tag}>`,
      })),
    })
  }

  return { categories, stale }
}

/**
 * The CEM records alias names (`BadgeSize`), but agents need the literal
 * values. Collect string-literal union aliases — including the
 * `(typeof CONST)[number]` form used for tones and variants — from source.
 */
function readTypeAliases(): Map<string, string> {
  const aliases = new Map<string, string>()
  const constArrays = new Map<string, string>()
  const glob = new Glob('**/*.ts')
  const srcDir = join(rootDir, 'ui', 'src')
  for (const file of glob.scanSync(srcDir)) {
    if (file.endsWith('.test.ts')) continue
    const source = readFileSync(join(srcDir, file), 'utf-8')
    for (const [, name, body] of source.matchAll(
      /export const (\w+) = \[([^\]]*)\] as const/g,
    )) {
      const values = body.match(/'[^']*'/g)
      if (values) constArrays.set(name, values.join(' | '))
    }
    for (const [, name, body] of source.matchAll(
      /export type (\w+) =\s*((?:\|?\s*'[^']*'\s*)+)(?=\n\S|\n\n|$)/g,
    )) {
      aliases.set(
        name,
        body
          .replace(/^\s*\|\s*/, '')
          .replace(/\s+/g, ' ')
          .trim(),
      )
    }
    for (const [, name, constName] of source.matchAll(
      /export type (\w+) = \(typeof (\w+)\)\[number\]/g,
    )) {
      aliases.set(name, `@${constName}`)
    }
  }
  for (const [name, value] of aliases) {
    if (value.startsWith('@')) {
      const resolved = constArrays.get(value.slice(1))
      if (resolved) aliases.set(name, resolved)
      else aliases.delete(name)
    }
  }
  return aliases
}

let typeAliases = new Map<string, string>()

/** Replace alias identifiers with their literal union, e.g. `BadgeSize` → `'sm' | 'md' | 'lg'`. */
function expandType(text: string | undefined): string | undefined {
  if (!text) return text
  return text.replace(/\b[A-Z]\w*\b/g, (name) => typeAliases.get(name) ?? name)
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const code = (value: string) => `\`${value.replace(/\|/g, '\\|')}\``
const cell = (value: string | undefined) =>
  value ? code(value.replace(/\s+/g, ' ')) : '—'

function renderSnippet(family: ComponentFamily): string {
  let out = `\`\`\`html\n${family.snippet}\n\`\`\`\n`
  if (family.script) out += `\n\`\`\`js\n${family.script}\n\`\`\`\n`
  return out
}

function renderElementApi(element: ElementDoc): string {
  const lines = [`### ${code(`<${element.tag}>`)}`, '']
  lines.push(
    `Class: ${code(element.className)} · Source: ${code(`ui/${element.module}`)}`,
    '',
  )

  if (element.attributes.length > 0) {
    lines.push(
      '**Attributes**',
      '',
      '| Attribute | Property | Type | Default |',
      '| :--- | :--- | :--- | :--- |',
    )
    for (const attr of element.attributes) {
      lines.push(
        `| ${code(attr.name)} | ${cell(attr.fieldName)} | ${cell(expandType(attr.type?.text))} | ${cell(attr.default)} |`,
      )
    }
    lines.push('')
  }

  if (element.properties.length > 0) {
    lines.push(
      '**Properties** (JavaScript only — set on the element instance)',
      '',
      '| Property | Type | Default |',
      '| :--- | :--- | :--- |',
    )
    for (const prop of element.properties) {
      lines.push(
        `| ${code(prop.name)} | ${cell(expandType(prop.type?.text))} | ${cell(prop.default)} |`,
      )
    }
    lines.push('')
  }

  if (element.events.length > 0) {
    lines.push('**Events**', '', '| Event | Type |', '| :--- | :--- |')
    for (const event of element.events) {
      lines.push(`| ${code(event.name)} | ${cell(event.type?.text)} |`)
    }
    lines.push('')
  }

  if (element.slots.length > 0) {
    lines.push('**Slots**', '', '| Slot |', '| :--- |')
    for (const slot of element.slots) {
      lines.push(`| ${slot.name ? code(slot.name) : '(default)'} |`)
    }
    lines.push('')
  }

  if (element.cssParts.length > 0) {
    lines.push(
      `**CSS Parts:** ${element.cssParts.map((p) => code(p.name)).join(', ')}`,
      '',
    )
  }

  return lines.join('\n')
}

const INSTALL = `\`\`\`bash
bun add @moul-dev/ui
# or
npm install @moul-dev/ui
\`\`\``

const SETUP = `\`\`\`js
// Registers every <moul-*> custom element (side-effect import).
import '@moul-dev/ui'
// CSS token layer: colors, spacing, radii, typography, motion.
import '@moul-dev/ui/style.css'
\`\`\`

Without a bundler:

\`\`\`html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@moul-dev/ui/dist/assets/style.css" />
<script type="module" src="https://cdn.jsdelivr.net/npm/@moul-dev/ui/dist/moul-ui.js"></script>
\`\`\``

const CORE_RULES = `- **Imports**: \`import '@moul-dev/ui'\` once registers every \`<moul-*>\` element. Import design tokens with \`import '@moul-dev/ui/style.css'\`. There is no \`@moul-dev/ui/react\`, \`@moul-dev/ui/tokens\`, or \`@moul-dev/ui/tokens.stylex\` entry point.
- **Markup, not JSX components**: Write native custom element tags (\`<moul-button>\`), never PascalCase components (\`<Button>\`). They work in plain HTML, Astro, Lit, Vue, Svelte, and React 19.
- **Attributes are kebab-case**: Boolean state uses presence attributes such as \`is-disabled\`, \`is-open\`, \`is-checked\`, \`is-required\`. The matching JS property is camelCase (\`el.isDisabled = true\`).
- **Rich data is set as properties**: Arrays, objects, and functions (\`data\`, \`series\`, \`columns\`, \`items\`, \`logs\`, \`valueFormatter\`) are assigned in JavaScript, not serialized into attributes.
- **Events are DOM events**: Listen with \`addEventListener\` (\`press\`, \`change\`, \`input\`, \`openchange\`, \`selectionchange\`, \`pagechange\`, \`dismiss\`). Payloads live on \`event.detail\`. There is no \`onPress\` prop.
- **Overlays**: Toggle \`is-open\` (or \`el.isOpen\`) on \`<moul-modal>\`, \`<moul-drawer>\`, \`<moul-alert-dialog>\`, \`<moul-popover>\`, \`<moul-tooltip>\`, \`<moul-command-palette>\`, and react to \`openchange\` (\`detail.isOpen\`).
- **Forms**: Inputs are form-associated via \`ElementInternals\`; give each a \`name\` and it submits with a native \`<form>\` / \`FormData\`.
- **Semantic tones & variants**: \`tone\` is one of \`primary | accent | success | warning | error\`; surface \`variant\` is one of \`solid | flat | shadow | bordered | glass\`. \`<moul-button>\` has its own \`variant\` set (\`primary | secondary | tertiary | outline | ghost | danger | danger-soft\`).
- **Accessibility**: Icon-only buttons (\`is-icon\`) and dot badges (\`is-dot\`) must have an \`aria-label\`.
- **Theming**: Override \`--brand-hue\`, \`--brand-chroma-multiplier\`, \`--brand-font-family\`, \`--brand-font-scale\`, \`--brand-radius-factor\`, and \`--brand-density-factor\` on \`:root\` (or any ancestor). Style internals through \`::part(...)\`.`

function renderLlmsTxt(categories: ComponentCategory[], version: string) {
  const lines = [
    '# Moul UI',
    '',
    `> Moul UI (\`@moul-dev/ui\`, v${version}) is an accessible, standards-first Web Components library built with Lit, Shadow DOM, and native CSS tokens (OKLCH + \`light-dark()\`). Components are framework-agnostic \`<moul-*>\` custom elements.`,
    '',
    '<!-- Generated by `bun run sync:llms --write` from ui/dist/custom-elements.json. Do not edit by hand. -->',
    '',
    '## Quick Start',
    '',
    INSTALL,
    '',
    SETUP,
    '',
    '## Core Rules for LLMs & AI Coding Agents',
    '',
    CORE_RULES,
    '',
    '## Context Files',
    '',
    '- [llms-full.txt](/llms-full.txt): Complete attribute, property, event, slot, and CSS part reference for every element.',
    '- [AGENTS.md](/AGENTS.md): Agent rules, recipes, and anti-patterns.',
    '- [Theme inspector](/theme): Live brand token playground.',
    '',
    '## Component Index',
    '',
  ]

  for (const category of categories) {
    lines.push(`### ${category.title}`, '')
    for (const family of category.families) {
      const tags = family.tags.map((t) => code(`<${t}>`)).join(', ')
      lines.push(
        `- [${family.name}](${family.docs}): ${family.summary} Elements: ${tags}.`,
        '',
        renderSnippet(family),
      )
    }
  }

  return `${lines.join('\n').trimEnd()}\n`
}

function renderLlmsFull(
  categories: ComponentCategory[],
  elements: Map<string, ElementDoc>,
  version: string,
) {
  const lines = [
    '# Moul UI — Full Component Reference',
    '',
    `> Complete API reference for \`@moul-dev/ui\` v${version}: every \`<moul-*>\` custom element with its attributes, JavaScript properties, events, slots, and CSS parts, derived from the Custom Elements Manifest.`,
    '',
    '<!-- Generated by `bun run sync:llms --write` from ui/dist/custom-elements.json. Do not edit by hand. -->',
    '',
    '## Setup',
    '',
    INSTALL,
    '',
    SETUP,
    '',
    '## Conventions',
    '',
    CORE_RULES,
    '',
    '## Exported JavaScript Helpers',
    '',
    '- `toastQueue` — singleton queue: `toastQueue.add({ title, description, tone, variant, duration })` returns an id; mounts `<moul-toast>` elements into a `<moul-toast-region>`.',
    '- `generatePagination(currentPage, totalPages, siblingCount)` — page list with ellipsis markers used by `<moul-pagination>`.',
    '- `parseLogs`, `parseLogLine`, `parseAttributes`, `stripAttributes`, `normalizeLogLevel` — log parsing utilities behind `<moul-logs>`.',
    '- Reactive controllers: `PressController`, `LayoutIndicatorController`, `OverlayPresenceController`, `NumberSpringController`, `FormInternalsController`.',
    '- `SEMANTIC_TONES`, `VISUAL_VARIANTS`, `normalizeTone`, `normalizeVariant`, `semanticToneStyles` — tone/variant system for authoring your own elements.',
    '',
  ]

  for (const category of categories) {
    lines.push('---', '', `# ${category.title}`, '')
    for (const family of category.families) {
      lines.push(
        `## ${family.name}`,
        '',
        `${family.summary} Docs: [${family.docs}](${family.docs})`,
        '',
        renderSnippet(family),
      )
      for (const tag of family.tags) {
        const element = elements.get(tag)
        if (element) lines.push(renderElementApi(element))
      }
    }
  }

  return `${lines.join('\n').trimEnd()}\n`
}

function renderTagIndex(categories: ComponentCategory[]): string {
  const lines: string[] = []
  for (const category of categories) {
    const tags = category.families
      .flatMap((f) => f.tags)
      .map((t) => code(`<${t}>`))
      .join(', ')
    lines.push(`- **${category.title}**: ${tags}`)
  }
  return lines.join('\n')
}

function renderPublicAgents(categories: ComponentCategory[], version: string) {
  return `# Moul UI (\`@moul-dev/ui\`) — AI Agent Guidelines

<!-- Generated by \`bun run sync:llms --write\` from ui/dist/custom-elements.json. Do not edit by hand. -->

\`@moul-dev/ui\` (v${version}) is an accessible, standards-first **Web Components** library built with **Lit**, **Shadow DOM**, and a native **CSS token layer** (OKLCH colors with \`light-dark()\`). Every component is a \`<moul-*>\` custom element that works in plain HTML and any framework.

Use this file as system context when generating code that uses Moul UI. For the full per-element API, read [/llms-full.txt](/llms-full.txt).

---

## 1. Setup

${INSTALL}

${SETUP}

## 2. Rules

${CORE_RULES}

## 3. Recipes

### Form with validation

\`\`\`html
<form id="signup">
  <moul-text-field name="email" type="email" label="Email" is-required></moul-text-field>
  <moul-select name="plan" label="Plan" selected-key="pro">
    <moul-select-item key="free">Free</moul-select-item>
    <moul-select-item key="pro">Pro</moul-select-item>
  </moul-select>
  <moul-checkbox name="terms" is-required>I accept the terms</moul-checkbox>
  <moul-button type="submit" variant="primary">Create account</moul-button>
</form>

<script type="module">
  document.querySelector('#signup').addEventListener('submit', (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    console.log(Object.fromEntries(data))
  })
</script>
\`\`\`

### Confirm before a destructive action

\`\`\`html
<moul-button id="delete" variant="danger">Delete project</moul-button>
<moul-alert-dialog id="confirm" tone="error">
  <span slot="header">Delete project?</span>
  <span slot="body">This action cannot be undone.</span>
</moul-alert-dialog>

<script type="module">
  const dialog = document.querySelector('#confirm')
  document.querySelector('#delete').addEventListener('press', () => {
    dialog.isOpen = true
  })
  dialog.addEventListener('confirm', () => deleteProject())
</script>
\`\`\`

### Chart fed from JavaScript

\`\`\`html
<moul-chart-container title="Revenue" description="Last 6 months">
  <moul-area-chart id="revenue" x-key="month"></moul-area-chart>
</moul-chart-container>

<script type="module">
  const chart = document.querySelector('#revenue')
  chart.data = [
    { month: 'May', total: 4200 },
    { month: 'Jun', total: 5100 },
  ]
  chart.series = [{ key: 'total', name: 'Revenue' }]
  chart.valueFormatter = (v) => \`$\${v.toLocaleString()}\`
</script>
\`\`\`

### Toast notifications

\`\`\`js
import { toastQueue } from '@moul-dev/ui'

toastQueue.add({ title: 'Saved', description: 'Settings updated.', tone: 'success' })
\`\`\`

### React 19

\`\`\`tsx
import '@moul-dev/ui'
import '@moul-dev/ui/style.css'

export function SaveButton({ onSave }: { onSave: () => void }) {
  // React 19 forwards custom events via on<eventname> props.
  return (
    <moul-button variant="primary" onpress={onSave}>
      Save
    </moul-button>
  )
}
\`\`\`

### Theming

\`\`\`css
:root {
  --brand-hue: 160;
  --brand-chroma-multiplier: 1.1;
  --brand-font-family: 'Inter', sans-serif;
  --brand-radius-factor: 1.25;
  --brand-density-factor: 0.9;
}

moul-button::part(base) {
  letter-spacing: 0.01em;
}
\`\`\`

## 4. Anti-patterns

- ❌ \`import { Button } from '@moul-dev/ui'\` and rendering \`<Button onPress={...}>\` — the library ships custom elements, not React components.
- ❌ \`import '@moul-dev/ui/tokens.stylex'\` or any StyleX / React Aria API — removed.
- ❌ \`<moul-badge variant="success">\` — color comes from \`tone\`; \`variant\` controls the surface treatment.
- ❌ \`<moul-modal open>\` — use \`is-open\` / \`isOpen\`.
- ❌ \`<moul-area-chart data='[...]'>\` — assign \`data\` and \`series\` as JavaScript properties.
- ❌ Icon-only \`<moul-button is-icon>\` without \`aria-label\`.

## 5. Element Index

${renderTagIndex(categories)}
`
}

function renderRootAgentsBlock(categories: ComponentCategory[]) {
  return `${ROOT_AGENTS_START}
<!-- Generated by \`bun run sync:llms --write\`. Edit scripts/sync-llms.ts instead. -->

When generating or editing code that uses \`@moul-dev/ui\`:

${CORE_RULES}

**Element index** (full API in \`docs/public/llms-full.txt\`):

${renderTagIndex(categories)}
${ROOT_AGENTS_END}`
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Return the llms-full.txt section for one element, up to the next heading. */
function extractSection(doc: string, tag: string): string | null {
  const heading = `### \`<${tag}>\``
  const start = doc.indexOf(heading)
  if (start === -1) return null
  const rest = doc.slice(start + heading.length)
  const next = rest.search(/\n#{1,3} /)
  return next === -1 ? rest : rest.slice(0, next)
}

function validate(elements: ElementDoc[]): string[] {
  const problems: string[] = []
  const read = (path: string) =>
    existsSync(path) ? readFileSync(path, 'utf-8') : ''

  const llmsTxt = read(paths.llmsTxt)
  const llmsFull = read(paths.llmsFull)

  const missingSnippet = elements
    .filter((e) => !llmsTxt.includes(`<${e.tag}`))
    .map((e) => e.tag)
  if (missingSnippet.length > 0) {
    problems.push(
      `docs/public/llms.txt has no HTML usage snippet for ${missingSnippet.length} element(s):\n${missingSnippet.map((t) => `      <${t}>`).join('\n')}`,
    )
  }

  const missingFull: string[] = []
  const drifted: string[] = []
  for (const element of elements) {
    const section = extractSection(llmsFull, element.tag)
    if (section === null) {
      missingFull.push(element.tag)
      continue
    }
    const expected = [
      ...element.attributes.map((a) => a.name),
      ...element.properties.map((p) => p.name),
      ...element.events.map((e) => e.name),
      ...element.slots.filter((s) => s.name).map((s) => s.name),
    ]
    const absent = expected.filter((name) => !section.includes(`\`${name}\``))
    if (absent.length > 0)
      drifted.push(`<${element.tag}>: ${absent.join(', ')}`)
  }
  if (missingFull.length > 0) {
    problems.push(
      `docs/public/llms-full.txt has no API section for ${missingFull.length} element(s):\n${missingFull.map((t) => `      <${t}>`).join('\n')}`,
    )
  }
  if (drifted.length > 0) {
    problems.push(
      `docs/public/llms-full.txt is missing API members present in the CEM:\n${drifted.map((d) => `      ${d}`).join('\n')}`,
    )
  }

  for (const [label, path] of [
    ['docs/public/AGENTS.md', paths.publicAgents],
    ['AGENTS.md', paths.rootAgents],
  ] as const) {
    const content = read(path)
    for (const pattern of ["import '@moul-dev/ui'", '@moul-dev/ui/style.css']) {
      if (!content.includes(pattern)) {
        problems.push(`${label} does not document the \`${pattern}\` import`)
      }
    }
  }

  return problems
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(`
${colors.bright}Moul UI LLM Context Sync${colors.reset}

${colors.yellow}Usage:${colors.reset}
  bun run sync:llms [options]

${colors.yellow}Options:${colors.reset}
  --write, -w    Regenerate llms.txt, llms-full.txt, docs/public/AGENTS.md, and the
                 generated block in AGENTS.md from ui/dist/custom-elements.json
  --help, -h     Show this help message

Without --write, verifies every custom element in the manifest is documented
and exits with code 1 when any element is missing.

Requires a manifest: run ${colors.cyan}bun run build:ui${colors.reset} first.
`)
}

function writeFile(path: string, content: string) {
  const previous = existsSync(path) ? readFileSync(path, 'utf-8') : null
  const label = path.slice(rootDir.length + 1)
  if (previous === content) {
    console.log(`  ${colors.dim}• ${label} (unchanged)${colors.reset}`)
    return
  }
  writeFileSync(path, content, 'utf-8')
  console.log(`  ${colors.green}✓${colors.reset} Wrote ${label}`)
}

function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    printHelp()
    return
  }
  const shouldWrite = args.includes('--write') || args.includes('-w')

  console.log(
    `\n${colors.bright}${colors.cyan}Moul UI:${colors.reset} ${shouldWrite ? 'Generating' : 'Validating'} LLM context files\n`,
  )

  if (!existsSync(paths.cem)) {
    console.error(
      `${colors.red}Error:${colors.reset} ${paths.cem} not found. Run ${colors.cyan}bun run build:ui${colors.reset} first.`,
    )
    process.exit(1)
  }

  const elements = readElements(paths.cem)
  typeAliases = readTypeAliases()
  const { categories, stale } = resolveCategories(elements)
  const version = JSON.parse(readFileSync(paths.uiPkg, 'utf-8')).version
  console.log(
    `${colors.dim}Found ${elements.length} custom elements in ui/dist/custom-elements.json${colors.reset}`,
  )

  if (stale.length > 0) {
    console.warn(
      `${colors.yellow}⚠${colors.reset} scripts/llms-catalog.ts lists tags missing from the manifest: ${stale.join(', ')}`,
    )
  }
  const other = categories.find((c) => c.title === 'Other')
  if (other) {
    console.warn(
      `${colors.yellow}⚠${colors.reset} Add these elements to scripts/llms-catalog.ts for curated snippets: ${other.families.flatMap((f) => f.tags).join(', ')}`,
    )
  }

  if (shouldWrite) {
    const byTag = new Map(elements.map((e) => [e.tag, e]))
    console.log('')
    writeFile(paths.llmsTxt, renderLlmsTxt(categories, version))
    writeFile(paths.llmsFull, renderLlmsFull(categories, byTag, version))
    writeFile(paths.publicAgents, renderPublicAgents(categories, version))

    const rootAgents = readFileSync(paths.rootAgents, 'utf-8')
    const start = rootAgents.indexOf(ROOT_AGENTS_START)
    const end = rootAgents.indexOf(ROOT_AGENTS_END)
    if (start === -1 || end === -1) {
      console.error(
        `${colors.red}Error:${colors.reset} AGENTS.md is missing the ${ROOT_AGENTS_START} / ${ROOT_AGENTS_END} markers.`,
      )
      process.exit(1)
    }
    writeFile(
      paths.rootAgents,
      rootAgents.slice(0, start) +
        renderRootAgentsBlock(categories) +
        rootAgents.slice(end + ROOT_AGENTS_END.length),
    )
  }

  const problems = validate(elements)
  if (problems.length > 0) {
    console.error(
      `\n${colors.red}${colors.bright}✗ LLM context files are out of sync:${colors.reset}`,
    )
    for (const problem of problems) {
      console.error(`  ${colors.red}•${colors.reset} ${problem}`)
    }
    console.error(
      `\nRun ${colors.cyan}bun run sync:llms --write${colors.reset} to regenerate them.\n`,
    )
    process.exit(1)
  }

  console.log(
    `\n${colors.green}${colors.bright}✓ All ${elements.length} custom elements are documented in llms.txt and llms-full.txt.${colors.reset}\n`,
  )
}

main()
