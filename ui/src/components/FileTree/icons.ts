import { type SVGTemplateResult, svg } from 'lit'

/** The groups of files the tree draws its own icon for. */
export type FileKind =
  | 'folder'
  | 'code'
  | 'markup'
  | 'style'
  | 'data'
  | 'doc'
  | 'image'
  | 'file'

const EXTENSIONS: Record<string, Exclude<FileKind, 'folder' | 'file'>> = {}
const group = (kind: Exclude<FileKind, 'folder' | 'file'>, list: string) => {
  for (const ext of list.split(' ')) EXTENSIONS[ext] = kind
}
group(
  'code',
  'ts tsx mts cts js jsx mjs cjs rs go py rb java kt kts swift c h cc cpp hpp cs php lua sh bash zsh fish ps1 sql dart scala ex exs zig wasm',
)
group('markup', 'html htm xml vue svelte astro hbs njk liquid')
group('style', 'css scss sass less styl pcss')
group(
  'data',
  'json jsonc json5 yaml yml toml ini env lock csv tsv conf cfg properties graphql gql proto',
)
group('doc', 'md mdx markdown txt rst adoc pdf rtf')
group('image', 'png jpg jpeg gif webp avif ico bmp svg tiff heic')

/** Files known by their whole name rather than an extension. */
const NAMES: Record<string, Exclude<FileKind, 'folder' | 'file'>> = {
  dockerfile: 'code',
  makefile: 'code',
  license: 'doc',
  readme: 'doc',
  changelog: 'doc',
  '.gitignore': 'data',
  '.gitattributes': 'data',
  '.editorconfig': 'data',
  '.npmrc': 'data',
  '.prettierrc': 'data',
  '.env': 'data',
}

/** The icon group for a file name, from its extension or its whole name. */
export function fileKind(name: string): FileKind {
  const lower = name.toLowerCase()
  if (NAMES[lower]) return NAMES[lower]
  // `.env.local`, `.env.production`: settings, whatever comes after.
  if (lower === '.env' || lower.startsWith('.env.')) return 'data'
  const dot = lower.lastIndexOf('.')
  if (dot <= 0) return 'file'
  return EXTENSIONS[lower.slice(dot + 1)] ?? 'file'
}

const page = svg`<path d="M9 2H4.5A1.5 1.5 0 0 0 3 3.5v9A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V6z"/><path d="M9 2v4h4"/>`

const GLYPHS: Record<Exclude<FileKind, 'folder'>, SVGTemplateResult> = {
  file: svg``,
  code: svg`<path d="M6.5 8.25 5 9.75l1.5 1.5M9.5 8.25l1.5 1.5-1.5 1.5"/>`,
  markup: svg`<path d="M6.25 8.5 5 9.75 6.25 11M9.75 8.5 11 9.75 9.75 11M8.6 8l-1.2 3.5"/>`,
  style: svg`<path d="M6.75 8v3.5M9.25 8v3.5M5.5 9.1h5M5.5 10.4h5"/>`,
  data: svg`<path d="M7 8.25h-.5a.5.5 0 0 0-.5.5v.5l-.5.5.5.5v.5a.5.5 0 0 0 .5.5H7M9 8.25h.5a.5.5 0 0 1 .5.5v.5l.5.5-.5.5v.5a.5.5 0 0 1-.5.5H9"/>`,
  doc: svg`<path d="M5.5 8.5h5M5.5 10h5M5.5 11.5h3"/>`,
  image: svg`<path d="m5 12 2-2.5 1.5 1.5 1-1L11 12z"/><circle cx="6.5" cy="8.25" r=".75"/>`,
}

const frame = (content: SVGTemplateResult) => svg`<svg
  viewBox="0 0 16 16"
  fill="none"
  stroke="currentColor"
  stroke-width="1.25"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>${content}</svg>`

const folderClosed = frame(
  svg`<path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.6l1.5 1.5h4.9A1.5 1.5 0 0 1 14 6v5.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5z"/>`,
)
const folderOpen = frame(
  svg`<path d="M2 11.5v-7A1.5 1.5 0 0 1 3.5 3h2.6l1.5 1.5h3.9A1.5 1.5 0 0 1 13 6v1"/><path d="M2.3 12.4 3.6 8a1.5 1.5 0 0 1 1.4-1h8.6a1 1 0 0 1 .95 1.3l-1.2 3.7a1.5 1.5 0 0 1-1.4 1H3.5a1.3 1.3 0 0 1-1.2-.6z"/>`,
)

const FILE_ICONS = Object.fromEntries(
  Object.entries(GLYPHS).map(([kind, glyph]) => [
    kind,
    frame(svg`${page}${glyph}`),
  ]),
) as Record<Exclude<FileKind, 'folder'>, SVGTemplateResult>

export function fileIcon(kind: FileKind, isOpen = false): SVGTemplateResult {
  if (kind === 'folder') return isOpen ? folderOpen : folderClosed
  return FILE_ICONS[kind]
}
