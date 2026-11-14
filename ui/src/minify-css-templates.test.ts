import { describe, expect, it } from 'vitest'
import { minifyCss, minifyCssTemplates } from '../minify-css-templates'

const one = (text: string) => minifyCss([text])?.[0]

describe('minifyCss', () => {
  it('drops comments and the whitespace punctuation makes redundant', () => {
    expect(
      one(`
      :host {
        /* A comment
           over lines. */
        display: block;
        margin: 0 auto ;
      }
      .a > .b, .c { color: red }
    `),
    ).toBe(' :host{display:block;margin:0 auto;}.a>.b,.c{color:red}')
  })

  it('keeps whitespace that separates tokens', () => {
    expect(one('.a :hover { }')).toBe('.a :hover{}')
    expect(one('@media (min-width: 40rem) and (hover: hover) {}')).toBe(
      '@media (min-width:40rem) and (hover:hover){}',
    )
    expect(one('width: calc(100% - 2 * var(--gap));')).toBe(
      'width:calc(100% - 2 * var(--gap));',
    )
    expect(one(':is(.a) .b {}')).toBe(':is(.a) .b{}')
    expect(one('a/* no space */b')).toBe('a/**/b')
  })

  it('keeps strings, escapes and unquoted URLs as written', () => {
    expect(one(`content: '  /* kept */  ' ;`)).toBe(`content:'  /* kept */  ';`)
    expect(one(`font-family: "Noto Sans Khmer", serif;`)).toBe(
      'font-family:"Noto Sans Khmer",serif;',
    )
    expect(one('.\\31 0 {}')).toBe('.\\31 0{}')
    expect(one('.a\\: b {}')).toBe('.a\\: b{}')
    expect(one('background: url(a/*b*/c.png) ;')).toBe(
      'background:url(a/*b*/c.png);',
    )
  })

  it('keeps the space-toggle idiom', () => {
    expect(one('--on: ;')).toBe('--on: ;')
  })

  it('keeps a space next to an interpolation unless punctuation makes it redundant', () => {
    expect(minifyCss(['.a { color: ', '; } ', ' .b {}'])).toEqual([
      '.a{color:',
      ';}',
      ' .b{}',
    ])
    expect(minifyCss(['.a ', ' {}'])).toEqual(['.a ', '{}'])
  })

  it('follows a string across an interpolation', () => {
    expect(minifyCss([`content: '  `, `  ' ;`])).toEqual([
      `content:'  `,
      `  ';`,
    ])
  })

  it('gives up on what it cannot follow', () => {
    expect(minifyCss(['/* a ', ' */'])).toBeNull()
    expect(minifyCss([`content: '`])).toBeNull()
  })
})

describe('minifyCssTemplates', () => {
  it("minifies only Lit's css tag, under any local name", () => {
    const source = [
      "import { css as litCss, html } from 'lit'",
      "import { css } from './not-lit'",
      'const a = litCss`\n  :host {\n    display: block;\n  }\n`',
      'const b = css`\n  :host {}\n`',
      'const c = html`<p>\n  text\n</p>`',
      "const d = '/* string */ { a: b }'",
    ].join('\n')
    expect(minifyCssTemplates(source, 'x.ts')).toBe(
      [
        "import { css as litCss, html } from 'lit'",
        "import { css } from './not-lit'",
        'const a = litCss` :host{display:block;}`',
        'const b = css`\n  :host {}\n`',
        'const c = html`<p>\n  text\n</p>`',
        "const d = '/* string */ { a: b }'",
      ].join('\n'),
    )
  })

  it('writes escapes back so Lit receives the same text', () => {
    const source = [
      "import { css } from 'lit'",
      'const a = css`',
      "  .\\\\:open::after { content: '\\\\2022  \\`' ; }",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: source under test
      '  .a { width: ${size}px ; }',
      '`',
    ].join('\n')
    expect(minifyCssTemplates(source, 'x.ts')).toBe(
      [
        "import { css } from 'lit'",
        // biome-ignore lint/suspicious/noTemplateCurlyInString: source under test
        "const a = css` .\\\\:open::after{content:'\\\\2022  \\`';}.a{width:${size}px;}`",
      ].join('\n'),
    )
  })
})
