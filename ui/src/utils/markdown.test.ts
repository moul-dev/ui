import { describe, expect, it } from 'vitest'
import {
  completeStreamingTail,
  type MarkdownBlock,
  markdownToText,
  parseInline,
  parseMarkdown,
  safeUrl,
} from './markdown'

const text = (value: string) => ({ type: 'text', text: value })

describe('parseInline', () => {
  it('reads strong, emphasis, strikethrough and code', () => {
    expect(parseInline('a **b** *c* ~~d~~ `e`')).toEqual([
      text('a '),
      { type: 'strong', children: [text('b')] },
      text(' '),
      { type: 'em', children: [text('c')] },
      text(' '),
      { type: 'del', children: [text('d')] },
      text(' '),
      { type: 'code', text: 'e' },
    ])
  })

  it('nests emphasis and reads *** as strong emphasis', () => {
    expect(parseInline('**a *b* c**')).toEqual([
      {
        type: 'strong',
        children: [
          text('a '),
          { type: 'em', children: [text('b')] },
          text(' c'),
        ],
      },
    ])
    expect(parseInline('***x***')).toEqual([
      { type: 'strong', children: [{ type: 'em', children: [text('x')] }] },
    ])
  })

  it('leaves snake_case names and spaced stars alone', () => {
    expect(parseInline('call list_records_by_id now')).toEqual([
      text('call list_records_by_id now'),
    ])
    expect(parseInline('2 * 3 * 4')).toEqual([text('2 * 3 * 4')])
  })

  it('keeps an unclosed marker as text, as a reply streams in', () => {
    expect(parseInline('so **bol')).toEqual([text('so **bol')])
    expect(parseInline('a `cod')).toEqual([text('a `cod')])
  })

  it('does not read emphasis inside code spans', () => {
    expect(parseInline('`a*b*c`')).toEqual([{ type: 'code', text: 'a*b*c' }])
    expect(parseInline('`` a ` b ``')).toEqual([
      { type: 'code', text: 'a ` b' },
    ])
  })

  it('honours backslash escapes', () => {
    expect(parseInline('\\*not em\\*')).toEqual([text('*not em*')])
  })

  it('reads links, autolinks and bare URLs', () => {
    expect(parseInline('[docs](https://moul.dev "Moul")')).toEqual([
      {
        type: 'link',
        href: 'https://moul.dev',
        title: 'Moul',
        children: [text('docs')],
        isImage: false,
      },
    ])
    const [auto] = parseInline('<https://a.dev/x>')
    expect(auto).toMatchObject({ type: 'link', href: 'https://a.dev/x' })
    const bare = parseInline('see https://a.dev/path. Next')
    expect(bare[1]).toMatchObject({
      type: 'link',
      href: 'https://a.dev/path',
    })
    expect(bare[2]).toEqual(text('. Next'))
  })

  it('refuses unsafe link targets but keeps their text', () => {
    const [link] = parseInline('[click](javascript:alert(1))')
    expect(link).toMatchObject({ type: 'link', href: null })
    // An angle-bracket destination may hold whitespace; it is skipped when reading the scheme.
    expect(parseInline('[x](<java\tscript:alert(1)>)')[0]).toMatchObject({
      type: 'link',
      href: null,
    })
  })

  it('turns images into links instead of loading them', () => {
    expect(parseInline('![chart](https://evil.test/p?d=secret)')).toEqual([
      {
        type: 'link',
        href: 'https://evil.test/p?d=secret',
        title: '',
        children: [text('chart')],
        isImage: true,
      },
    ])
  })

  it('reads citations only when the sources exist', () => {
    expect(parseInline('Fact [1][2] and [^3]', { sourceCount: 3 })).toEqual([
      text('Fact '),
      { type: 'citation', index: 1 },
      { type: 'citation', index: 2 },
      text(' and '),
      { type: 'citation', index: 3 },
    ])
    expect(parseInline('a [1, 2]', { sourceCount: 2 })).toEqual([
      text('a '),
      { type: 'citation', index: 1 },
      { type: 'citation', index: 2 },
    ])
    expect(parseInline('items[4]', { sourceCount: 3 })).toEqual([
      text('items[4]'),
    ])
    expect(parseInline('[1]')).toEqual([text('[1]')])
  })

  it('treats each newline as a line break', () => {
    expect(parseInline('a  \nb')).toEqual([
      text('a'),
      { type: 'break' },
      text('b'),
    ])
  })

  it('shows raw HTML as text', () => {
    expect(parseInline('<img src=x onerror=alert(1)>')).toEqual([
      text('<img src=x onerror=alert(1)>'),
    ])
  })
})

describe('safeUrl', () => {
  it('allows http, https, mailto and relative paths', () => {
    expect(safeUrl('https://a.dev')).toBe('https://a.dev')
    expect(safeUrl('MAILTO:a@b.c')).toBe('MAILTO:a@b.c')
    expect(safeUrl('/docs')).toBe('/docs')
    expect(safeUrl('#top')).toBe('#top')
  })

  it('refuses other schemes', () => {
    expect(safeUrl('javascript:alert(1)')).toBeNull()
    expect(safeUrl(' data:text/html,x')).toBeNull()
    expect(safeUrl('vbscript:x')).toBeNull()
    expect(safeUrl('')).toBeNull()
  })
})

describe('parseMarkdown', () => {
  it('reads paragraphs, headings and rules', () => {
    const blocks = parseMarkdown('# Title\n\nOne\ntwo\n\n---\n\n### Sub ###')
    expect(blocks.map((block) => block.type)).toEqual([
      'heading',
      'paragraph',
      'rule',
      'heading',
    ])
    expect(blocks[0]).toEqual({
      type: 'heading',
      level: 1,
      children: [text('Title')],
    })
    expect(blocks[3]).toMatchObject({ level: 3, children: [text('Sub')] })
  })

  it('reads fenced code and keeps an unclosed fence open', () => {
    expect(parseMarkdown('```ts\nconst a = 1\n```\nafter')).toEqual([
      { type: 'code', language: 'ts', code: 'const a = 1', isOpen: false },
      { type: 'paragraph', children: [text('after')] },
    ])
    expect(parseMarkdown('```json\n{"a":')).toEqual([
      { type: 'code', language: 'json', code: '{"a":', isOpen: true },
    ])
  })

  it('keeps markdown inside code fences as code', () => {
    const [block] = parseMarkdown('~~~\n# not a heading\n**x**\n~~~')
    expect(block).toMatchObject({ code: '# not a heading\n**x**' })
  })

  it('reads bullet and ordered lists with nesting and tasks', () => {
    const [list] = parseMarkdown(
      '1. First\n2. Second\n   - nested a\n   - nested b\n3. Third',
    ) as Extract<MarkdownBlock, { type: 'list' }>[]
    expect(list?.ordered).toBe(true)
    expect(list?.items).toHaveLength(3)
    expect(list?.items[1]?.children[1]).toMatchObject({
      type: 'list',
      ordered: false,
    })
    const [tasks] = parseMarkdown('- [x] done\n- [ ] todo') as Extract<
      MarkdownBlock,
      { type: 'list' }
    >[]
    expect(tasks?.items.map((item) => item.checked)).toEqual([true, false])
  })

  it('nests a bullet list under a numbered item indented by two spaces', () => {
    const [list] = parseMarkdown('1. Step\n  - detail') as Extract<
      MarkdownBlock,
      { type: 'list' }
    >[]
    expect(list?.items).toHaveLength(1)
    expect(list?.items[0]?.children[1]).toMatchObject({ type: 'list' })
  })

  it('keeps a list going across blank lines and starts at its first number', () => {
    const [list] = parseMarkdown('3. a\n\n4. b') as Extract<
      MarkdownBlock,
      { type: 'list' }
    >[]
    expect(list?.start).toBe(3)
    expect(list?.items).toHaveLength(2)
  })

  it('reads quotes recursively', () => {
    expect(parseMarkdown('> a\n> > b')).toEqual([
      {
        type: 'quote',
        children: [
          { type: 'paragraph', children: [text('a')] },
          {
            type: 'quote',
            children: [{ type: 'paragraph', children: [text('b')] }],
          },
        ],
      },
    ])
  })

  it('reads tables with alignment and escaped pipes', () => {
    const [table] = parseMarkdown(
      '| Name | Count |\n| :-- | --: |\n| a \\| b | `x|y` |\n| c |',
    )
    expect(table).toMatchObject({
      type: 'table',
      align: ['left', 'right'],
      head: [[text('Name')], [text('Count')]],
    })
    const rows = (table as Extract<MarkdownBlock, { type: 'table' }>).rows
    expect(rows[0]).toEqual([[text('a | b')], [{ type: 'code', text: 'x|y' }]])
    // A short row is padded to the header's width.
    expect(rows[1]).toEqual([[text('c')], []])
  })

  it('reads a table right after a paragraph line', () => {
    const blocks = parseMarkdown('Results:\n| a |\n| - |\n| 1 |')
    expect(blocks.map((block) => block.type)).toEqual(['paragraph', 'table'])
  })

  it('parses any prefix of a document', () => {
    const doc =
      '# Title\n\nSome **bold** text with `code` and [a link](https://a.dev).\n\n- one\n- two\n\n```js\nconst x = 1\n```\n\n| a | b |\n| - | - |\n| 1 | 2 |'
    for (let end = 0; end <= doc.length; end++) {
      expect(() => parseMarkdown(doc.slice(0, end))).not.toThrow()
    }
  })

  it('stops nesting at a safe depth', () => {
    expect(() => parseMarkdown('>'.repeat(5000))).not.toThrow()
    expect(() => parseInline('['.repeat(5000))).not.toThrow()
    expect(() => parseInline('*a '.repeat(3000))).not.toThrow()
  })
})

describe('completeStreamingTail', () => {
  it('closes emphasis and code the last paragraph opened', () => {
    expect(completeStreamingTail('so **bol')).toBe('so **bol**')
    expect(completeStreamingTail('an *ital')).toBe('an *ital*')
    expect(completeStreamingTail('was ~~gon')).toBe('was ~~gon~~')
    expect(completeStreamingTail('run `npm i')).toBe('run `npm i`')
    expect(completeStreamingTail('**a *b')).toBe('**a *b***')
  })

  it('closes before trailing spaces', () => {
    expect(completeStreamingTail('**bold ')).toBe('**bold** ')
  })

  it('holds back a marker that has nothing after it yet', () => {
    expect(completeStreamingTail('Here is **')).toBe('Here is ')
    expect(completeStreamingTail('Run `')).toBe('Run ')
    expect(completeStreamingTail('done**')).toBe('done**')
  })

  it('shows only the text of a half-written link', () => {
    expect(completeStreamingTail('See [the docs](https://moul.de')).toBe(
      'See the docs',
    )
    expect(completeStreamingTail('See [the docs](https://a.dev) ok')).toBe(
      'See [the docs](https://a.dev) ok',
    )
  })

  it('leaves balanced text, list markers and open code fences alone', () => {
    expect(completeStreamingTail('**a** and *b*')).toBe('**a** and *b*')
    expect(completeStreamingTail('* one\n* two')).toBe('* one\n* two')
    expect(completeStreamingTail('```js\nconst a = **')).toBe(
      '```js\nconst a = **',
    )
    expect(completeStreamingTail('`a*b` c')).toBe('`a*b` c')
  })

  it('looks only at the last paragraph', () => {
    expect(completeStreamingTail('**open\n\nnext')).toBe('**open\n\nnext')
  })
})

describe('markdownToText', () => {
  it('drops the syntax and keeps the words', () => {
    expect(
      markdownToText('## Hi\n\n**Bold** and [link](https://a.dev)\n\n- a\n- b'),
    ).toBe('Hi\n\nBold and link\n\n• a\n• b')
  })
})
