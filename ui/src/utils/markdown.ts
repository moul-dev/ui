/**
 * A small Markdown parser for text that a language model writes, used by
 * `<moul-streaming-response>`. It reads the CommonMark and GitHub features
 * models actually produce (paragraphs, headings, emphasis, inline and fenced
 * code, links, lists with tasks, quotes, tables and rules) and turns them into
 * plain data. Elements render that data with Lit as text, never as HTML, so
 * markup in a reply is shown, not run.
 *
 * It is built for text that is still arriving. Any prefix of a document
 * parses: an unclosed code fence is a code block that is still open, and an
 * unclosed `**` stays literal until its closer arrives.
 *
 * Two things are left out on purpose. Raw HTML is shown as text. Images are
 * not loaded: `![alt](url)` becomes a link to the image, because a reply can
 * be steered by a prompt injection into an image URL that carries data out of
 * the page when the browser fetches it.
 */

export type MarkdownInline =
  | { type: 'text'; text: string }
  | { type: 'strong'; children: MarkdownInline[] }
  | { type: 'em'; children: MarkdownInline[] }
  | { type: 'del'; children: MarkdownInline[] }
  | { type: 'code'; text: string }
  | {
      type: 'link'
      /** A safe URL, or null when the written one was refused (shown as text). */
      href: string | null
      title: string
      children: MarkdownInline[]
      /** Written as an image: `![alt](url)`. */
      isImage: boolean
    }
  | { type: 'citation'; index: number }
  | { type: 'break' }

export type TableAlign = 'left' | 'center' | 'right' | null

export interface MarkdownListItem {
  /** A task item's state; null for a plain item. */
  checked: boolean | null
  children: MarkdownBlock[]
}

export type MarkdownBlock =
  | { type: 'paragraph'; children: MarkdownInline[] }
  | { type: 'heading'; level: number; children: MarkdownInline[] }
  | {
      type: 'code'
      language: string
      code: string
      /** The closing fence has not arrived yet. */
      isOpen: boolean
    }
  | { type: 'quote'; children: MarkdownBlock[] }
  | {
      type: 'list'
      ordered: boolean
      start: number
      items: MarkdownListItem[]
    }
  | {
      type: 'table'
      align: TableAlign[]
      head: MarkdownInline[][]
      rows: MarkdownInline[][][]
    }
  | { type: 'rule' }

export interface MarkdownOptions {
  /**
   * How many sources citations can point at. `[1]`, `[^1]` and `[1, 2]` become
   * citations when every number is from 1 to this; 0 (the default) turns
   * citations off.
   */
  sourceCount?: number
}

/** Nesting deeper than this is read as text, so a hostile reply cannot exhaust the stack. */
const MAX_DEPTH = 12

const FENCE = /^ {0,3}(`{3,}|~{3,})[ \t]*([^`\s]*)[^`]*$/
const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/
const QUOTE = /^ {0,3}>/
const LIST_ITEM = /^( {0,3})([-*+]|\d{1,9}[.)])(?:([ \t]+)(.*)|$)/
const TABLE_DELIMITER =
  /^ {0,3}\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/
const TASK = /^\[([ xX])\][ \t]+/
const ASCII_PUNCTUATION = /[!-/:-@[-`{-~]/

const isBlank = (line: string) => line.trim() === ''
const indentOf = (line: string) => /^ */.exec(line)?.[0].length ?? 0

/** True when `line` starts a block that ends a paragraph. */
function interruptsParagraph(line: string): boolean {
  if (FENCE.test(line) || HEADING.test(line) || RULE.test(line)) return true
  if (QUOTE.test(line)) return true
  const item = LIST_ITEM.exec(line)
  // A paragraph is only cut by a list that starts at 1 and has text.
  return (
    !!item &&
    !!item[4]?.trim() &&
    (/^[-*+]$/.test(item[2] ?? '') || /^1[.)]$/.test(item[2] ?? ''))
  )
}

/** Splits a table row into cells at pipes that are not escaped or inside code. */
function splitRow(line: string): string[] {
  let row = line.trim()
  if (row.startsWith('|')) row = row.slice(1)
  if (row.endsWith('|') && !row.endsWith('\\|')) row = row.slice(0, -1)
  const cells: string[] = []
  let cell = ''
  let ticks = 0
  for (let i = 0; i < row.length; i++) {
    const ch = row[i] as string
    if (ch === '\\' && row[i + 1] === '|') {
      cell += '|'
      i++
    } else if (ch === '`') {
      ticks = ticks ? 0 : 1
      cell += ch
    } else if (ch === '|' && !ticks) {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += ch
    }
  }
  cells.push(cell.trim())
  return cells
}

function alignOf(cell: string): TableAlign {
  const left = cell.startsWith(':')
  const right = cell.endsWith(':')
  return left && right ? 'center' : right ? 'right' : left ? 'left' : null
}

class BlockParser {
  private readonly options: Required<MarkdownOptions>
  private readonly depth: number

  constructor(options: Required<MarkdownOptions>, depth: number) {
    this.options = options
    this.depth = depth
  }

  private inline(text: string): MarkdownInline[] {
    return parseInline(text, this.options)
  }

  parse(lines: string[]): MarkdownBlock[] {
    const blocks: MarkdownBlock[] = []
    let i = 0
    while (i < lines.length) {
      const line = lines[i] as string
      if (isBlank(line)) {
        i++
        continue
      }

      const fence = FENCE.exec(line)
      if (fence) {
        const marker = fence[1] as string
        const indent = indentOf(line)
        const body: string[] = []
        let j = i + 1
        let isOpen = true
        for (; j < lines.length; j++) {
          const next = lines[j] as string
          const close = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(next)
          if (
            close &&
            close[1]?.[0] === marker[0] &&
            (close[1]?.length ?? 0) >= marker.length
          ) {
            isOpen = false
            break
          }
          body.push(next.slice(Math.min(indent, indentOf(next))))
        }
        blocks.push({
          type: 'code',
          language: (fence[2] ?? '').toLowerCase(),
          code: body.join('\n'),
          isOpen,
        })
        i = isOpen ? j : j + 1
        continue
      }

      const heading = HEADING.exec(line)
      if (heading) {
        blocks.push({
          type: 'heading',
          level: heading[1]?.length ?? 1,
          children: this.inline(heading[2] ?? ''),
        })
        i++
        continue
      }

      if (RULE.test(line)) {
        blocks.push({ type: 'rule' })
        i++
        continue
      }

      if (QUOTE.test(line) && this.depth < MAX_DEPTH) {
        const inner: string[] = []
        while (i < lines.length && !isBlank(lines[i] as string)) {
          const next = lines[i] as string
          if (QUOTE.test(next)) inner.push(next.replace(/^ {0,3}> ?/, ''))
          else if (inner.length && !interruptsParagraph(next)) inner.push(next)
          else break
          i++
        }
        blocks.push({ type: 'quote', children: this.child().parse(inner) })
        continue
      }

      if (LIST_ITEM.test(line) && this.depth < MAX_DEPTH) {
        i = this.parseList(lines, i, blocks)
        continue
      }

      const next = lines[i + 1]
      if (
        line.includes('|') &&
        next !== undefined &&
        TABLE_DELIMITER.test(next) &&
        next.includes('-')
      ) {
        const head = splitRow(line)
        const align = splitRow(next).map(alignOf)
        const rows: MarkdownInline[][][] = []
        let j = i + 2
        for (; j < lines.length; j++) {
          const row = lines[j] as string
          if (isBlank(row) || !row.includes('|')) break
          const cells = splitRow(row)
          rows.push(head.map((_, c) => this.inline(cells[c] ?? '')))
        }
        blocks.push({
          type: 'table',
          align: head.map((_, c) => align[c] ?? null),
          head: head.map((cell) => this.inline(cell)),
          rows,
        })
        i = j
        continue
      }

      const paragraph: string[] = [line.trim()]
      i++
      while (i < lines.length) {
        const more = lines[i] as string
        if (isBlank(more) || interruptsParagraph(more)) break
        // A table can start right under a paragraph line.
        if (more.includes('|') && TABLE_DELIMITER.test(lines[i + 1] ?? '')) {
          break
        }
        paragraph.push(more.trim())
        i++
      }
      blocks.push({
        type: 'paragraph',
        children: this.inline(paragraph.join('\n')),
      })
    }
    return blocks
  }

  private child(): BlockParser {
    return new BlockParser(this.options, this.depth + 1)
  }

  /** Reads one list starting at `start` into `blocks`; returns the line after it. */
  private parseList(
    lines: string[],
    start: number,
    blocks: MarkdownBlock[],
  ): number {
    const first = LIST_ITEM.exec(lines[start] as string) as RegExpExecArray
    const ordered = /\d/.test(first[2] as string)
    const listIndent = (first[1] as string).length
    const list: Extract<MarkdownBlock, { type: 'list' }> = {
      type: 'list',
      ordered,
      start: ordered ? Number.parseInt(first[2] as string, 10) : 1,
      items: [],
    }
    let i = start
    while (i < lines.length) {
      const match = LIST_ITEM.exec(lines[i] as string)
      if (
        !match ||
        /\d/.test(match[2] as string) !== ordered ||
        (match[1] as string).length > listIndent + 1
      ) {
        break
      }
      const indent = (match[1] as string).length
      const spacing = (match[3] ?? ' ').length
      const contentIndent =
        indent + (match[2] as string).length + (spacing > 4 ? 1 : spacing)
      // A nested list marker needs less room than the text above it.
      const childIndent = Math.min(contentIndent, indent + 2)
      let text = match[4] ?? ''
      let checked: boolean | null = null
      const task = TASK.exec(text)
      if (task) {
        checked = task[1] !== ' '
        text = text.slice(task[0].length)
      }
      const itemLines = [text]
      i++
      while (i < lines.length) {
        const line = lines[i] as string
        if (isBlank(line)) {
          let k = i + 1
          while (k < lines.length && isBlank(lines[k] as string)) k++
          const after = lines[k]
          if (after !== undefined && indentOf(after) >= childIndent) {
            for (; i < k; i++) itemLines.push('')
            continue
          }
          break
        }
        const indentHere = indentOf(line)
        const isItem = LIST_ITEM.test(line)
        if (isItem && indentHere >= childIndent) {
          itemLines.push(line.slice(Math.min(indentHere, contentIndent)))
        } else if (!isItem && indentHere >= contentIndent) {
          itemLines.push(line.slice(contentIndent))
        } else if (isItem || interruptsParagraph(line)) {
          break
        } else {
          // Lazy continuation of the item's paragraph.
          itemLines.push(line.trim())
        }
        i++
      }
      list.items.push({ checked, children: this.child().parse(itemLines) })
      // Blank lines between items keep the list going.
      let k = i
      while (k < lines.length && isBlank(lines[k] as string)) k++
      const next = LIST_ITEM.exec(lines[k] ?? '')
      if (
        !next ||
        /\d/.test(next[2] as string) !== ordered ||
        (next[1] as string).length > listIndent + 1
      ) {
        break
      }
      i = k
    }
    blocks.push(list)
    return i
  }
}

/** Parses Markdown into blocks. Any prefix of a document parses. */
export function parseMarkdown(
  source: string,
  options: MarkdownOptions = {},
): MarkdownBlock[] {
  const lines = source
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, '    ')
    .split('\n')
  return new BlockParser({ sourceCount: options.sourceCount ?? 0 }, 0).parse(
    lines,
  )
}

// ---------------------------------------------------------------------------
// Inline
// ---------------------------------------------------------------------------

const SAFE_SCHEME = /^(?:https?:|mailto:)/i
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i

/**
 * The URL when it is safe to link to: `http`, `https` and `mailto`, or a
 * relative path. Anything else (`javascript:`, `data:`, `vbscript:`) is null.
 */
export function safeUrl(url: string): string | null {
  const href = url.trim()
  // Browsers skip control characters and whitespace when they read a URL's
  // scheme (`java\tscript:`), so the check must too.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: that is the point
  const probe = href.replace(/[\u0000- \u007F]+/g, '')
  if (!probe) return null
  if (SAFE_SCHEME.test(probe)) return href
  return HAS_SCHEME.test(probe) ? null : href
}

const BARE_URL = /^https?:\/\/[^\s<]*[^\s<.,:;"')\]!?*_~]/
const AUTOLINK = /^<((?:https?:\/\/|mailto:)[^\s<>]+)>/i
const CITATION = /^\[\^?(\d{1,3}(?:[ \t]*,[ \t]*\d{1,3})*)\]/

/** Finds the matching `]` for a `[` at `open`, skipping code spans and escapes. */
function closingBracket(src: string, open: number): number {
  let depth = 0
  for (let i = open; i < src.length; i++) {
    const ch = src[i]
    if (ch === '\\') i++
    else if (ch === '`') {
      const run = /^`+/.exec(src.slice(i))?.[0] ?? '`'
      const end = src.indexOf(run, i + run.length)
      if (end > 0) i = end + run.length - 1
    } else if (ch === '[') depth++
    else if (ch === ']' && --depth === 0) return i
  }
  return -1
}

/** Reads `(url "title")` at `open`; returns the url, title and the index after `)`. */
function linkDestination(
  src: string,
  open: number,
): { url: string; title: string; end: number } | null {
  if (src[open] !== '(') return null
  let i = open + 1
  while (src[i] === ' ') i++
  let url = ''
  if (src[i] === '<') {
    const close = src.indexOf('>', i)
    if (close < 0) return null
    url = src.slice(i + 1, close)
    i = close + 1
  } else {
    let depth = 0
    for (; i < src.length; i++) {
      const ch = src[i] as string
      if (ch === '\\' && i + 1 < src.length) {
        url += src[++i]
        continue
      }
      if (ch === '(') depth++
      else if (ch === ')') {
        if (depth === 0) break
        depth--
      } else if (/\s/.test(ch)) break
      url += ch
    }
  }
  while (src[i] === ' ') i++
  let title = ''
  const quote = src[i]
  if (quote === '"' || quote === "'") {
    const close = src.indexOf(quote, i + 1)
    if (close < 0) return null
    title = src.slice(i + 1, close)
    i = close + 1
    while (src[i] === ' ') i++
  }
  return src[i] === ')' ? { url, title, end: i + 1 } : null
}

const isSpace = (ch: string | undefined) => ch === undefined || /\s/.test(ch)
const isWordChar = (ch: string | undefined) =>
  ch !== undefined && /[\p{L}\p{N}]/u.test(ch)

/**
 * Finds the closer of an emphasis run `delim` opened before `from`. A closer
 * follows a non-space; an underscore closer is not followed by a letter, so
 * `snake_case_names` stay as they are. Code spans are skipped.
 */
function findCloser(src: string, from: number, delim: string): number {
  const ch = delim[0] as string
  for (let i = from; i < src.length; i++) {
    const c = src[i]
    if (c === '\\') {
      i++
      continue
    }
    if (c === '`') {
      const run = /^`+/.exec(src.slice(i))?.[0] ?? '`'
      const end = src.indexOf(run, i + run.length)
      if (end > 0) i = end + run.length - 1
      continue
    }
    if (c !== ch) continue
    let run = 1
    while (src[i + run] === ch) run++
    const fits =
      run === delim.length ||
      // `***` closes both `*` and `**`.
      (run === 3 && delim.length < 3)
    if (
      fits &&
      i > from &&
      !isSpace(src[i - 1]) &&
      !(ch === '_' && isWordChar(src[i + run]))
    ) {
      return run === 3 && delim.length < 3 ? i + (3 - delim.length) : i
    }
    i += run - 1
  }
  return -1
}

/** Parses inline Markdown: emphasis, code, links, citations and breaks. */
export function parseInline(
  src: string,
  options: MarkdownOptions = {},
  depth = 0,
): MarkdownInline[] {
  const sourceCount = options.sourceCount ?? 0
  const out: MarkdownInline[] = []
  let text = ''
  const flush = (): void => {
    if (text) out.push({ type: 'text', text })
    text = ''
  }
  const nested = (part: string) => parseInline(part, options, depth + 1)

  let i = 0
  while (i < src.length) {
    const ch = src[i] as string
    const rest = src.slice(i)

    if (ch === '\\') {
      const next = src[i + 1]
      if (next === '\n') {
        flush()
        out.push({ type: 'break' })
        i += 2
        continue
      }
      if (next !== undefined && ASCII_PUNCTUATION.test(next)) {
        text += next
        i += 2
        continue
      }
    }

    if (ch === '\n') {
      // A chat reply means its line breaks, so every newline is one.
      text = text.replace(/ +$/, '')
      flush()
      out.push({ type: 'break' })
      i++
      continue
    }

    if (ch === '`') {
      const run = /^`+/.exec(rest)?.[0] as string
      let end = src.indexOf(run, i + run.length)
      // A longer run of backticks is not the closer.
      while (end > 0 && src[end + run.length] === '`') {
        end = src.indexOf(run, end + run.length + 1)
      }
      if (end > 0) {
        let code = src.slice(i + run.length, end).replace(/\n/g, ' ')
        if (/^ .* $/.test(code) && code.trim()) code = code.slice(1, -1)
        flush()
        out.push({ type: 'code', text: code })
        i = end + run.length
        continue
      }
      text += run
      i += run.length
      continue
    }

    if (ch === '[' && sourceCount > 0) {
      const citation = CITATION.exec(rest)
      if (citation && src[i + citation[0].length] !== '(') {
        const numbers = (citation[1] as string)
          .split(',')
          .map((n) => Number.parseInt(n, 10))
        if (numbers.every((n) => n >= 1 && n <= sourceCount)) {
          flush()
          for (const index of numbers) out.push({ type: 'citation', index })
          i += citation[0].length
          continue
        }
      }
    }

    const isImage = ch === '!' && src[i + 1] === '['
    if ((ch === '[' || isImage) && depth < MAX_DEPTH) {
      const open = isImage ? i + 1 : i
      const close = closingBracket(src, open)
      const destination = close > 0 ? linkDestination(src, close + 1) : null
      if (destination) {
        const label = src.slice(open + 1, close)
        flush()
        out.push({
          type: 'link',
          href: safeUrl(destination.url),
          title: destination.title,
          children: isImage
            ? [{ type: 'text', text: label || destination.url }]
            : nested(label),
          isImage,
        })
        i = destination.end
        continue
      }
    }

    if (ch === '<') {
      const auto = AUTOLINK.exec(rest)
      if (auto) {
        flush()
        const url = auto[1] as string
        out.push({
          type: 'link',
          href: safeUrl(url),
          title: '',
          children: [{ type: 'text', text: url.replace(/^mailto:/i, '') }],
          isImage: false,
        })
        i += auto[0].length
        continue
      }
    }

    if (ch === 'h' && !isWordChar(src[i - 1])) {
      const bare = BARE_URL.exec(rest)
      if (bare) {
        flush()
        out.push({
          type: 'link',
          href: safeUrl(bare[0]),
          title: '',
          children: [{ type: 'text', text: bare[0] }],
          isImage: false,
        })
        i += bare[0].length
        continue
      }
    }

    if ((ch === '*' || ch === '_' || ch === '~') && depth < MAX_DEPTH) {
      let run = 1
      while (src[i + run] === ch) run++
      const opensHere =
        !isSpace(src[i + run]) && !(ch === '_' && isWordChar(src[i - 1]))
      if (ch === '~' && run === 2 && opensHere) {
        const end = findCloser(src, i + 2, '~~')
        if (end > 0) {
          flush()
          out.push({ type: 'del', children: nested(src.slice(i + 2, end)) })
          i = end + 2
          continue
        }
      } else if (ch !== '~' && run <= 3 && opensHere) {
        const tries = run === 3 ? ['***', '**', '*'] : [ch.repeat(run)]
        let matched = false
        for (const delim of tries) {
          const size = delim.length
          const end = findCloser(src, i + size, ch.repeat(size))
          if (end <= 0) continue
          const inner = src.slice(i + size, end)
          flush()
          // A `***` opener closed by `**` or `*` keeps its other stars in `inner`.
          if (size === 3) {
            out.push({
              type: 'strong',
              children: [{ type: 'em', children: nested(inner) }],
            })
          } else if (size === 2) {
            out.push({ type: 'strong', children: nested(inner) })
          } else {
            out.push({ type: 'em', children: nested(inner) })
          }
          i = end + size
          matched = true
          break
        }
        if (matched) continue
      }
      text += ch.repeat(run)
      i += run
      continue
    }

    text += ch
    i++
  }
  flush()
  return out
}

// ---------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------

const OPEN_FENCE = /^ {0,3}(`{3,}|~{3,})/gm
const PARTIAL_LINK = /!?\[([^\]\n]*)\]\([^)\s]*$/

/**
 * Finishes the last paragraph of text that is still arriving, so it renders
 * as it will once complete: an opened `**`, `~~`, `*` or code span is closed,
 * a half-written link shows only its text, and a marker that has just
 * arrived with nothing after it is held back. Text inside an open code fence
 * is left alone. Only for display while streaming; the text itself is not
 * changed.
 */
export function completeStreamingTail(text: string): string {
  const fences = text.match(OPEN_FENCE) ?? []
  if (fences.length % 2 === 1) return text
  const start = text.lastIndexOf('\n\n') + 1
  let head = text.slice(0, start)
  let tail = text.slice(start)

  tail = tail.replace(PARTIAL_LINK, '$1')
  // A marker with nothing after it yet would only show as stars.
  tail = tail.replace(/(?:\*{1,3}|~{1,2}|`+)$/, (marker, offset: number) =>
    offset === 0 || /\s/.test(tail[offset - 1] ?? '') || marker.startsWith('`')
      ? ''
      : marker,
  )

  const ticks = (tail.match(/`/g) ?? []).length
  if (ticks % 2 === 1) return `${head}${tail}\``

  const plain = tail.replace(/`[^`]*`/g, '')
  let closers = ''
  const doubles = (plain.match(/\*\*/g) ?? []).length
  const singles = (
    plain
      .replace(/\*\*/g, '')
      .replace(/^[ \t]*\*[ \t]/gm, '')
      .match(/\*/g) ?? []
  ).length
  // A lone marker at the very end is a closer without an opener; leave it be.
  const trimmed = plain.trimEnd()
  if (singles % 2 === 1 && !/[^*]\*$/.test(trimmed)) closers += '*'
  if (doubles % 2 === 1 && !trimmed.endsWith('**')) closers += '**'
  if ((plain.match(/~~/g) ?? []).length % 2 === 1 && !trimmed.endsWith('~~')) {
    closers += '~~'
  }
  if (!closers) return head + tail
  // Closers go before trailing spaces, where a closing marker must touch text.
  const body = tail.replace(/\s+$/, '')
  head += body + closers + tail.slice(body.length)
  return head
}

// ---------------------------------------------------------------------------
// Plain text
// ---------------------------------------------------------------------------

function inlineText(nodes: MarkdownInline[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
        case 'code':
          return node.text
        case 'break':
          return '\n'
        case 'citation':
          return `[${node.index}]`
        case 'link':
        case 'strong':
        case 'em':
        case 'del':
          return inlineText(node.children)
        default:
          return ''
      }
    })
    .join('')
}

function blocksText(blocks: MarkdownBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
        case 'heading':
          return inlineText(block.children)
        case 'code':
          return block.code
        case 'quote':
          return blocksText(block.children)
        case 'list':
          return block.items
            .map(
              (item, i) =>
                `${block.ordered ? `${block.start + i}.` : '•'} ${blocksText(item.children)}`,
            )
            .join('\n')
        case 'table':
          return [block.head, ...block.rows]
            .map((row) => row.map(inlineText).join(' | '))
            .join('\n')
        default:
          return ''
      }
    })
    .filter(Boolean)
    .join('\n\n')
}

/** The words of a Markdown document without its syntax, for announcements and previews. */
export function markdownToText(source: string): string {
  return blocksText(parseMarkdown(source))
}
