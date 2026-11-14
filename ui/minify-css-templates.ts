/**
 * Build-time minifier for Lit `css` tagged templates.
 *
 * Lit ships a `css` template's text as written, so every comment and every
 * indent in a `.styles.ts` file would reach the published bundles. This
 * rewrites the templates in each source module before it is compiled:
 * comments go, whitespace runs become one space, and the space next to
 * punctuation that never needs it (`{ } ; , >`, after `:` and `(`, before
 * `)`) goes too. Nothing else changes: strings, escapes and `url()` stay
 * byte for byte, as do `html` and `svg` templates and plain strings.
 *
 * Only templates whose tag is `css` imported from Lit are touched. A template
 * the scanner cannot follow (a comment that spans an interpolation, a string
 * left open at the end) is left exactly as written.
 */
import ts from 'typescript'

/** Modules whose `css` export is Lit's tag. */
const LIT_MODULES = new Set(['lit', 'lit-element', '@lit/reactive-element'])

/** Characters CSS never needs whitespace next to, on either side. */
const BARE = '{};,>'
/** Whitespace after these can go: `color: red`, `( a`. */
const BARE_AFTER = `${BARE}:(`
/**
 * Whitespace before these can go: `a )`. Never before `:` or `(`, where a
 * space is a descendant combinator (`a :hover`) or ends a keyword (`and (`).
 */
const BARE_BEFORE = `${BARE})`

const UNQUOTED_URL = /url\(\s*[^\s"')]/iy

const isSpace = (char: string) =>
  char === ' ' ||
  char === '\t' ||
  char === '\n' ||
  char === '\r' ||
  char === '\f'
const isHex = (char: string) => /^[0-9a-f]$/i.test(char)

/** Index just past the string's closing `quote`, or -1 if it is still open. */
function stringEnd(text: string, from: number, quote: string): number {
  for (let i = from; i < text.length; i++) {
    if (text[i] === '\\') i++
    else if (text[i] === quote) return i + 1
  }
  return -1
}

/**
 * Minifies the cooked text of one `css` template, given as the strings
 * between its interpolations. Returns `null` when it cannot be minified
 * safely, so the template is left as written.
 *
 * Whitespace next to an interpolation is kept as one space unless the
 * character on this side makes it redundant, because the interpolated value
 * is unknown here. The template's own start and end are treated the same
 * way, since a `css` result can itself be interpolated into another one.
 */
export function minifyCss(parts: readonly string[]): string[] | null {
  const minified: string[] = []
  // The quote of a string still open at the end of the previous part.
  let openQuote = ''
  for (const text of parts) {
    let out = ''
    // The last character written, '' at an interpolation or template edge.
    let prev = ''
    // What separates `prev` from the next character: whitespace, or a
    // comment with no whitespace around it, which still separates tokens.
    let gap: '' | 'space' | 'comment' = ''
    let i = 0

    const closeGap = (next: string) => {
      const redundant =
        (prev !== '' && BARE_AFTER.includes(prev)) ||
        (next !== '' && BARE_BEFORE.includes(next))
      // `--toggle: ;` is the space-toggle idiom; older engines reject `--toggle:;`.
      const spaceToggle = prev === ':' && (next === ';' || next === '}')
      if (gap === 'space' && (!redundant || spaceToggle)) out += ' '
      else if (gap === 'comment' && !redundant) out += '/**/'
      gap = ''
    }

    if (openQuote) {
      const end = stringEnd(text, 0, openQuote)
      if (end === -1) {
        minified.push(text)
        continue
      }
      out = text.slice(0, end)
      prev = openQuote
      openQuote = ''
      i = end
    }

    while (i < text.length) {
      const char = text[i]
      if (isSpace(char)) {
        gap = 'space'
        i++
        continue
      }
      if (char === '/' && text[i + 1] === '*') {
        const end = text.indexOf('*/', i + 2)
        if (end === -1) return null
        if (!gap) gap = 'comment'
        i = end + 2
        continue
      }

      const startsToken = gap !== '' || !/[\w-]/.test(out.at(-1) ?? '')
      closeGap(char)

      if (char === '"' || char === "'") {
        const end = stringEnd(text, i + 1, char)
        if (end === -1) {
          out += text.slice(i)
          openQuote = char
          break
        }
        out += text.slice(i, end)
        prev = char
        i = end
        continue
      }

      if (char === '\\') {
        // A CSS escape: up to six hex digits and the one whitespace that
        // ends them (significant: `\31 0` is not `\310`), or any one char.
        let end = i + 2
        if (isHex(text[i + 1] ?? '')) {
          end = i + 1
          while (end < text.length && end - i <= 6 && isHex(text[end])) end++
          if (text[end] === '\r' && text[end + 1] === '\n') end += 2
          else if (isSpace(text[end] ?? '')) end++
        }
        out += text.slice(i, end)
        prev = 'a'
        i = end
        continue
      }

      UNQUOTED_URL.lastIndex = i
      if (startsToken && UNQUOTED_URL.test(text)) {
        // An unquoted URL is one token; `/*` or `;` inside it is not CSS.
        const end = text.indexOf(')', i)
        if (end !== -1) {
          out += text.slice(i, end + 1)
          prev = ')'
          i = end + 1
          continue
        }
      }

      out += char
      prev = char
      i++
    }

    if (!openQuote) closeGap('')
    minified.push(out)
  }
  return openQuote ? null : minified
}

/** Writes cooked template text back as raw template source. */
function toTemplateSource(cooked: string): string {
  return cooked.replace(/\\|`|\$\{|\r/g, (match) =>
    match === '\r' ? '\\r' : `\\${match}`,
  )
}

/** Local names bound to Lit's `css` tag by the module's imports. */
function cssTagNames(source: ts.SourceFile): Set<string> {
  const names = new Set<string>()
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !LIT_MODULES.has(statement.moduleSpecifier.text) ||
      statement.importClause?.isTypeOnly
    ) {
      continue
    }
    const bindings = statement.importClause?.namedBindings
    if (!bindings || !ts.isNamedImports(bindings)) continue
    for (const element of bindings.elements) {
      if (
        !element.isTypeOnly &&
        (element.propertyName ?? element.name).text === 'css'
      ) {
        names.add(element.name.text)
      }
    }
  }
  return names
}

interface TemplatePart {
  /** Cooked text, as Lit receives it. */
  text: string
  /** Source range of the raw text, without the backticks and `${`/`}`. */
  start: number
  end: number
}

function templateParts(
  template: ts.TemplateLiteral,
  source: ts.SourceFile,
): TemplatePart[] {
  const literals: ts.TemplateLiteralLikeNode[] =
    ts.isNoSubstitutionTemplateLiteral(template)
      ? [template]
      : [template.head, ...template.templateSpans.map((span) => span.literal)]
  return literals.map((literal) => ({
    text: literal.text,
    start: literal.getStart(source) + 1,
    // Each part ends with a backtick, or with `${` before an interpolation.
    end:
      literal.kind === ts.SyntaxKind.TemplateHead ||
      literal.kind === ts.SyntaxKind.TemplateMiddle
        ? literal.end - 2
        : literal.end - 1,
  }))
}

/** Returns `code` with every Lit `css` template in it minified. */
export function minifyCssTemplates(code: string, fileName: string): string {
  const source = ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    true,
  )
  const tags = cssTagNames(source)
  if (tags.size === 0) return code

  const edits: { start: number; end: number; text: string }[] = []
  const visit = (node: ts.Node): void => {
    if (
      ts.isTaggedTemplateExpression(node) &&
      ts.isIdentifier(node.tag) &&
      tags.has(node.tag.text)
    ) {
      const parts = templateParts(node.template, source)
      const minified = minifyCss(parts.map((part) => part.text))
      minified?.forEach((text, index) => {
        edits.push({ ...parts[index], text: toTemplateSource(text) })
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(source)

  let result = code
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end)
  }
  return result
}
