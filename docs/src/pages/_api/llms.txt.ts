import { llms } from 'fumadocs-core/source'
import { source } from '@/lib/source'

export function GET() {
  const fumadocsIndex = llms(source).index()
  const header = `# Moul UI

> Moul UI (@moul-dev/ui) is an accessible, zero-runtime React component library built with React Aria Components and StyleX.

## Quick Start
- **Package**: \`@moul-dev/ui\`
- **Install**: \`bun add @moul-dev/ui\` (or \`npm install @moul-dev/ui\`)
- **Stylesheet**: \`import '@moul-dev/ui/style.css'\`
- **Theme Provider**: \`import { ThemeProvider } from '@moul-dev/ui'\`

## AI Agent Rules & Key Conventions
- **Imports**: Always import components directly from \`@moul-dev/ui\`.
- **Button Activation**: Use \`onPress\` instead of \`onClick\` on \`<Button>\`, \`<Link>\`, and interactive triggers.
- **Selection State**: Single-item components use \`isSelected\` / \`onChange\`. Collection components (\`Select\`, \`Tabs\`, \`Table\`, \`Sidebar\`) use \`selectedKey\` / \`selectedKeys\` and \`onSelectionChange\`.
- **Dialogs & Overlays**: Use \`isOpen\` and \`onOpenChange\` on \`<ModalOverlay>\`, \`<Popover>\`, and \`<AlertDialog>\`.
- **Dynamic Theming**: CSS variables (\`--brand-hue\`, \`--brand-chroma-multiplier\`, \`--brand-density-factor\`, \`--brand-radius-factor\`) provide zero-runtime customizable aesthetics.

## Context Files & Agent Instructions
- **Full Documentation (All Pages & Types)**: [/llms-full.txt](/llms-full.txt)
- **Agent Instructions & Code Recipes**: [/AGENTS.md](/AGENTS.md)

---

`
  return new Response(header + fumadocsIndex)
}

export async function getConfig() {
  return {
    render: 'static' as const,
  } as const
}
