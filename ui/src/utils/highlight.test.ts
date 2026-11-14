import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  type CodeToken,
  dedent,
  highlightLines,
  isHighlighted,
  languageLabel,
  parseLineList,
  tokenize,
} from './highlight'

/** The tokens of `type` in `code`, as text. */
function of(code: string, language: string, type: CodeToken['type']): string[] {
  return tokenize(code, language)
    .filter((token) => token.type === type)
    .map((token) => token.text)
}

const LANGUAGES = [
  'ts',
  'js',
  'json',
  'html',
  'css',
  'bash',
  'python',
  'rust',
  'sql',
  'diff',
  'yaml',
  'text',
  'unknown',
]

describe('tokenize', () => {
  it('never loses or reorders text, in any language', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 120 }),
        fc.constantFrom(...LANGUAGES),
        (code, language) => {
          const text = tokenize(code, language)
            .map((token) => token.text)
            .join('')
          expect(text).toBe(code)
        },
      ),
      { numRuns: 400 },
    )
  })

  it('returns unknown languages and plain text as one plain token', () => {
    expect(tokenize('const a = 1', 'cobol')).toEqual([
      { type: null, text: 'const a = 1' },
    ])
    expect(tokenize('const a = 1', 'text')).toEqual([
      { type: null, text: 'const a = 1' },
    ])
    expect(tokenize('', 'ts')).toEqual([])
  })

  it('colours TypeScript', () => {
    const code = `// greet
export async function greet(name: string): Promise<void> {
  const MAX = 3 /* ok */
  console.log(\`hi \${name}\`, 'x', 42, true)
}`
    expect(of(code, 'ts', 'comment')).toEqual(['// greet', '/* ok */'])
    expect(of(code, 'ts', 'keyword')).toEqual([
      'export',
      'async',
      'function',
      'void',
      'const',
    ])
    expect(of(code, 'ts', 'function')).toEqual(['greet', 'log'])
    expect(of(code, 'ts', 'type')).toEqual(['string', 'Promise'])
    // biome-ignore lint/suspicious/noTemplateCurlyInString: the template literal is the token under test
    expect(of(code, 'ts', 'string')).toEqual(['`hi ${name}`', "'x'"])
    expect(of(code, 'ts', 'number')).toEqual(['3', '42'])
    expect(of(code, 'ts', 'literal')).toEqual(['MAX', 'true'])
  })

  it('keeps TypeScript-only words out of JavaScript keywords', () => {
    expect(of('const type = 1', 'js', 'keyword')).toEqual(['const'])
    expect(of('type A = string', 'ts', 'keyword')).toEqual(['type'])
  })

  it('tells JSON keys from string values', () => {
    const code = '{"name": "moul", "ok": true, "n": -1.5e3, "x": null}'
    expect(of(code, 'json', 'property')).toEqual([
      '"name"',
      '"ok"',
      '"n"',
      '"x"',
    ])
    expect(of(code, 'json', 'string')).toEqual(['"moul"'])
    expect(of(code, 'json', 'literal')).toEqual(['true', 'null'])
    expect(of(code, 'json', 'number')).toEqual(['-1.5e3'])
  })

  it('colours HTML tags, attributes and values', () => {
    const code =
      '<!-- note --><moul-button variant="primary" is-icon>Hi &amp; bye</moul-button>'
    expect(of(code, 'html', 'comment')).toEqual(['<!-- note -->'])
    expect(of(code, 'html', 'tag')).toEqual([
      '<moul-button',
      '>',
      '</moul-button',
      '>',
    ])
    expect(of(code, 'html', 'attr')).toEqual(['variant', 'is-icon'])
    expect(of(code, 'html', 'string')).toEqual(['"primary"'])
    expect(of(code, 'html', 'literal')).toEqual(['&amp;'])
  })

  it('tells CSS selectors from declarations', () => {
    const code =
      '.card:hover { color: var(--color-fg); margin: 0 1.5rem !important; }'
    expect(of(code, 'css', 'type')).toEqual(['.card'])
    expect(of(code, 'css', 'keyword')).toEqual([':hover', '!important'])
    expect(of(code, 'css', 'property')).toEqual(['color', 'margin'])
    expect(of(code, 'css', 'function')).toEqual(['var'])
    expect(of(code, 'css', 'variable')).toEqual(['--color-fg'])
    expect(of(code, 'css', 'number')).toEqual(['0', '1.5rem'])
  })

  it('colours shell commands, flags and variables', () => {
    const code = `# install
bun add @moul-dev/web-component --exact && echo "$HOME" # done
if test -f x; then ls; fi`
    expect(of(code, 'bash', 'comment')).toEqual(['# install', '# done'])
    expect(of(code, 'bash', 'function')).toEqual(['bun', 'echo', 'test', 'ls'])
    expect(of(code, 'bash', 'attr')).toEqual(['--exact', '-f'])
    expect(of(code, 'bash', 'string')).toEqual(['"$HOME"'])
    expect(of(code, 'bash', 'keyword')).toEqual(['if', 'then', 'fi'])
  })

  it('colours Python, Rust, SQL and YAML', () => {
    expect(of('def run(x):\n  return None', 'python', 'function')).toEqual([
      'run',
    ])
    expect(of('def run(x):\n  return None', 'python', 'literal')).toEqual([
      'None',
    ])
    expect(of('let s: &\'static str = r#"a"#;', 'rust', 'string')).toEqual([
      'r#"a"#',
    ])
    expect(of('println!("{}", x)', 'rust', 'function')).toEqual(['println!'])
    expect(
      of("select id from users where name = 'a'", 'sql', 'keyword'),
    ).toEqual(['select', 'from', 'where'])
    expect(
      of('name: moul\nversion: 1.2\nok: true', 'yaml', 'property'),
    ).toEqual(['name', 'version', 'ok'])
    expect(of('name: moul\nversion: 1.2\nok: true', 'yaml', 'literal')).toEqual(
      ['true'],
    )
  })

  it('marks diff lines as inserted or deleted', () => {
    const code = '--- a.ts\n+++ b.ts\n@@ -1 +1 @@\n-old\n+new\n same'
    expect(of(code, 'diff', 'deleted')).toEqual(['-old'])
    expect(of(code, 'diff', 'inserted')).toEqual(['+new'])
    expect(of(code, 'diff', 'meta')).toEqual(['--- a.ts', '+++ b.ts'])
  })
})

describe('highlightLines', () => {
  it('cuts tokens that span lines at each newline', () => {
    const lines = highlightLines('/* a\nb */\nx', 'js')
    expect(lines).toEqual([
      [{ type: 'comment', text: '/* a' }],
      [{ type: 'comment', text: 'b */' }],
      [{ type: null, text: 'x' }],
    ])
  })

  it('keeps empty lines and always returns one line', () => {
    expect(highlightLines('a\n\nb', 'text')).toHaveLength(3)
    expect(highlightLines('', 'ts')).toEqual([[]])
  })
})

describe('helpers', () => {
  it('names languages', () => {
    expect(languageLabel('ts')).toBe('TypeScript')
    expect(languageLabel('YML')).toBe('YAML')
    expect(languageLabel('cobol')).toBe('cobol')
    expect(isHighlighted('bash')).toBe(true)
    expect(isHighlighted('text')).toBe(false)
  })

  it('dedents code written inside markup', () => {
    expect(dedent('\n    a\n      b\n\n    c\n  ')).toBe('a\n  b\n\nc')
    expect(dedent('a\r\nb')).toBe('a\nb')
  })

  it('parses line lists', () => {
    expect([...parseLineList('1, 3-5, 9-8, x, 0')]).toEqual([1, 3, 4, 5, 8, 9])
    expect(parseLineList(null).size).toBe(0)
  })
})
