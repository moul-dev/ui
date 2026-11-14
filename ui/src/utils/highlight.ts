/**
 * A small syntax highlighter for `<moul-code-block>`, `<moul-code-comparison>`
 * and the payloads in `<moul-activity-feed>`. It splits source text into typed
 * tokens with a handful of sticky regular expressions per language, so it
 * stays a few kilobytes and needs no dependency. It colours what readers scan
 * for (comments, strings, keywords, names) and does not parse: a token it
 * cannot place is left as plain text, never dropped or reordered, so the
 * output always reads back as the input.
 *
 * Tokens are plain data. Elements render them with Lit as text, never as
 * HTML, so highlighted code cannot inject markup.
 */

export type CodeTokenType =
  | 'comment'
  | 'string'
  | 'number'
  | 'keyword'
  | 'literal'
  | 'function'
  | 'type'
  | 'property'
  | 'tag'
  | 'attr'
  | 'variable'
  | 'operator'
  | 'punctuation'
  | 'meta'
  | 'inserted'
  | 'deleted'

export interface CodeToken {
  /** What the text is; `null` for plain text. */
  type: CodeTokenType | null
  text: string
}

type Classify = CodeTokenType | null | ((match: string) => CodeTokenType | null)
/** A sticky pattern, the type of what it matches, and the state to enter: a name pushes it, `pop` leaves the current one. */
type Rule = [pattern: RegExp, type: Classify, next?: string]
type Grammar = Record<string, Rule[]>

const words = (list: string) => new Set(list.split(' '))

const LINE_COMMENT = /\/\/[^\n]*/y
const BLOCK_COMMENT = /\/\*[\s\S]*?(?:\*\/|$)/y
const DOUBLE_STRING = /"(?:\\.|[^\\"\n])*"?/y
const SINGLE_STRING = /'(?:\\.|[^\\'\n])*'?/y
const HASH_COMMENT = /(?<!\S)#[^\n]*/y
const NUMBER =
  /(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*(?:\.[\d_]+)?|\.\d[\d_]*)(?:[eE][+-]?\d+)?)n?/y
const OPERATOR = /=>|->|[-+*/%=!<>&|^~?:]+/y
const PUNCTUATION = /[{}()[\];,.]/y

const JS_KEYWORDS =
  'as async await break case catch class const continue debugger default delete do else export extends finally for from function get if import in instanceof let new of return set static super switch throw try typeof var void while with yield'
const TS_KEYWORDS = `${JS_KEYWORDS} abstract asserts declare enum implements infer interface is keyof module namespace override private protected public readonly satisfies type`
const JS_LITERALS = words('true false null undefined NaN Infinity this')

const TS_TYPES = words(
  'any bigint boolean never number object string symbol unknown',
)

/** JavaScript and TypeScript share everything but their keywords and built-in types. */
function scriptGrammar(
  keywordList: string,
  types = new Set<string>(),
): Grammar {
  const keywords = words(keywordList)
  return {
    root: [
      [LINE_COMMENT, 'comment'],
      [BLOCK_COMMENT, 'comment'],
      [/`(?:\\[\s\S]|\$\{[^}]*\}|[^\\`])*`?/y, 'string'],
      [DOUBLE_STRING, 'string'],
      [SINGLE_STRING, 'string'],
      [NUMBER, 'number'],
      [/@[A-Za-z_$][\w$]*/y, 'meta'],
      [
        /[A-Za-z_$][\w$]*(?=\s*(?:<[^<>()\n]*>)?\s*\()/y,
        (w) => (keywords.has(w) ? 'keyword' : 'function'),
      ],
      [/[A-Z][A-Z\d_]+\b/y, 'literal'],
      [/[A-Z][\w$]*/y, 'type'],
      [
        /[A-Za-z_$][\w$]*/y,
        (w) =>
          keywords.has(w)
            ? 'keyword'
            : JS_LITERALS.has(w)
              ? 'literal'
              : types.has(w)
                ? 'type'
                : null,
      ],
      [OPERATOR, 'operator'],
      [PUNCTUATION, 'punctuation'],
    ],
  }
}

const JSON_GRAMMAR: Grammar = {
  root: [
    [LINE_COMMENT, 'comment'],
    [BLOCK_COMMENT, 'comment'],
    [/"(?:\\.|[^\\"\n])*"(?=\s*:)/y, 'property'],
    [DOUBLE_STRING, 'string'],
    [/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y, 'number'],
    [/(?:true|false|null)\b/y, 'literal'],
    [/[{}[\],:]/y, 'punctuation'],
  ],
}

const HTML_GRAMMAR: Grammar = {
  root: [
    [/<!--[\s\S]*?(?:-->|$)/y, 'comment'],
    [/<![A-Za-z][^>]*>?/y, 'meta'],
    [/<\/?[A-Za-z][\w:.-]*/y, 'tag', 'tag'],
    [/&(?:#\d+|#x[\da-fA-F]+|\w+);/y, 'literal'],
    [/[^<&]+/y, null],
  ],
  tag: [
    [/\s+/y, null],
    [/\/?>/y, 'tag', 'pop'],
    [/"[^"]*"?|'[^']*'?/y, 'string'],
    [/=/y, 'punctuation'],
    [/[^\s"'>/=]+/y, 'attr'],
    [/\//y, 'tag'],
  ],
}

const CSS_SHARED: Rule[] = [
  [BLOCK_COMMENT, 'comment'],
  [DOUBLE_STRING, 'string'],
  [SINGLE_STRING, 'string'],
]

const CSS_GRAMMAR: Grammar = {
  // Outside a block: selectors and at-rules.
  root: [
    ...CSS_SHARED,
    [/@[\w-]+/y, 'keyword'],
    [/\{/y, 'punctuation', 'block'],
    [/[.#][\w-]+/y, 'type'],
    [/::?[\w-]+/y, 'keyword'],
    [/--[\w-]+/y, 'variable'],
    [/[A-Za-z][\w-]*/y, 'tag'],
    [/[,>+~*]/y, 'operator'],
    [/[()[\]=:;]/y, 'punctuation'],
  ],
  // Inside braces: declarations, and nested rules.
  block: [
    ...CSS_SHARED,
    [/\}/y, 'punctuation', 'pop'],
    [/\{/y, 'punctuation', 'block'],
    [/@[\w-]+/y, 'keyword'],
    [/--[\w-]+/y, 'variable'],
    [/[\w-]+(?=\s*:(?!:)[^;{}]*(?:[;}]|$))/y, 'property'],
    [/#[\da-fA-F]{3,8}\b/y, 'number'],
    [/-?(?:\d+\.?\d*|\.\d+)(?:%|[a-zA-Z]+)?/y, 'number'],
    [/[\w-]+(?=\()/y, 'function'],
    [/!important\b/y, 'keyword'],
    [/[.#&][\w-]+|::?[\w-]+/y, 'type'],
    [/[A-Za-z][\w-]*/y, null],
    [/[:;,()]/y, 'punctuation'],
  ],
}

/** Builtins that take arguments, like a command does. */
const SHELL_KEYWORDS = words(
  'return export local readonly unset source alias set exit',
)
const SHELL_SHARED: Rule[] = [
  [HASH_COMMENT, 'comment'],
  [/"(?:\\[\s\S]|[^\\"])*"?/y, 'string'],
  [/'[^']*'?/y, 'string'],
  [/\$\{[^}\n]*\}?|\$[\w@#?*!$]+/y, 'variable'],
]

const SHELL_GRAMMAR: Grammar = {
  // Where a command name is expected.
  root: [
    [/[ \t]+/y, null],
    [/\\\n/y, null],
    ...SHELL_SHARED,
    [/[A-Za-z_]\w*(?==)/y, 'variable'],
    [/=/y, 'operator'],
    [/&&|\|\||[|;&()]/y, 'operator'],
    // Control words are followed by another command, so they stay here.
    [
      /(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|in|function|select|time|!)(?=[\s;]|$)/y,
      'keyword',
    ],
    [
      /[^\s|&;()<>"'$#`\\=]+/y,
      (w) => (SHELL_KEYWORDS.has(w) ? 'keyword' : 'function'),
      'args',
    ],
  ],
  // After the command name, until the end of the command.
  args: [
    [/\\\n/y, null],
    [/\n/y, null, 'pop'],
    [/&&|\|\||[|;&]/y, 'operator', 'pop'],
    ...SHELL_SHARED,
    [/(?<!\S)--?[A-Za-z][\w-]*/y, 'attr'],
    [/\d*[<>]+&?\d*/y, 'operator'],
    [/(?<!\S)\d+(?![^\s;|&])/y, 'number'],
    [/[^\s|&;<>"'$#`\\]+/y, null],
  ],
}

const PY_KEYWORDS = words(
  'and as assert async await break class continue def del elif else except finally for from global if import in is lambda match case nonlocal not or pass raise return try while with yield',
)
const PY_LITERALS = words('True False None self cls')

const PYTHON_GRAMMAR: Grammar = {
  root: [
    [/#[^\n]*/y, 'comment'],
    [/[rRbBuUfF]{0,2}(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$))/y, 'string'],
    [/[rRbBuUfF]{0,2}(?:"(?:\\.|[^\\"\n])*"?|'(?:\\.|[^\\'\n])*'?)/y, 'string'],
    [/@[\w.]+/y, 'meta'],
    [NUMBER, 'number'],
    [/(?<=\b(?:def|class)\s+)[A-Za-z_]\w*/y, 'function'],
    [
      /[A-Za-z_]\w*(?=\s*\()/y,
      (w) =>
        PY_KEYWORDS.has(w)
          ? 'keyword'
          : PY_LITERALS.has(w)
            ? 'literal'
            : 'function',
    ],
    [
      /[A-Za-z_]\w*/y,
      (w) =>
        PY_KEYWORDS.has(w)
          ? 'keyword'
          : PY_LITERALS.has(w)
            ? 'literal'
            : /^[A-Z]/.test(w)
              ? 'type'
              : null,
    ],
    [OPERATOR, 'operator'],
    [PUNCTUATION, 'punctuation'],
  ],
}

const RUST_KEYWORDS = words(
  'as async await break const continue crate dyn else enum extern fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait type unsafe use where while',
)

const RUST_GRAMMAR: Grammar = {
  root: [
    [LINE_COMMENT, 'comment'],
    [BLOCK_COMMENT, 'comment'],
    [/#!?\[[^\]\n]*\]?/y, 'meta'],
    [/b?r(#*)"[\s\S]*?(?:"\1|$)/y, 'string'],
    [/b?"(?:\\[\s\S]|[^\\"])*"?/y, 'string'],
    [/b?'(?:\\(?:x[\da-fA-F]{2}|u\{[\da-fA-F]+\}|.)|[^\\'\n])'/y, 'string'],
    [/'[A-Za-z_]\w*/y, 'type'],
    [
      /(?:0x[\da-fA-F_]+|0o[0-7_]+|0b[01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)(?:[iu](?:8|16|32|64|128|size)|f32|f64)?/y,
      'number',
    ],
    [/[A-Za-z_]\w*!/y, 'function'],
    [
      /[A-Za-z_]\w*(?=\s*(?:::\s*<[^<>\n]*>\s*)?\()/y,
      (w) =>
        RUST_KEYWORDS.has(w)
          ? 'keyword'
          : /^[A-Z]/.test(w)
            ? 'type'
            : 'function',
    ],
    [/(?:true|false)\b/y, 'literal'],
    [/[A-Z][A-Z\d_]+\b/y, 'literal'],
    [/[A-Z]\w*/y, 'type'],
    [/[A-Za-z_]\w*/y, (w) => (RUST_KEYWORDS.has(w) ? 'keyword' : null)],
    [OPERATOR, 'operator'],
    [PUNCTUATION, 'punctuation'],
  ],
}

const SQL_KEYWORDS = words(
  'ADD ALL ALTER AND ANY AS ASC BEGIN BETWEEN BY CASCADE CASE CHECK COLUMN COMMIT CONFLICT CONSTRAINT CREATE CROSS DATABASE DEFAULT DELETE DESC DISTINCT DO DROP ELSE END EXCEPT EXISTS EXPLAIN FOREIGN FROM FULL GRANT GROUP HAVING IF ILIKE IN INDEX INNER INSERT INTERSECT INTO IS JOIN KEY LEFT LIKE LIMIT NOT NOTHING NULL OFFSET ON OR ORDER OUTER PRIMARY REFERENCES RETURNING REVOKE RIGHT ROLLBACK SELECT SET TABLE THEN TO TRANSACTION TRIGGER UNION UNIQUE UPDATE USING VALUES VIEW WHEN WHERE WITH',
)
const SQL_TYPES = words(
  'BIGINT BLOB BOOLEAN BOOL BYTEA CHAR DATE DECIMAL DOUBLE FLOAT INT INTEGER INTERVAL JSON JSONB NUMERIC REAL SERIAL SMALLINT TEXT TIME TIMESTAMP TIMESTAMPTZ UUID VARCHAR',
)

const SQL_GRAMMAR: Grammar = {
  root: [
    [/--[^\n]*/y, 'comment'],
    [BLOCK_COMMENT, 'comment'],
    [/'(?:''|[^'])*'?/y, 'string'],
    [/"(?:""|[^"])*"?|`[^`\n]*`?/y, 'property'],
    [/\$\d+|[:@][A-Za-z_]\w*/y, 'variable'],
    [NUMBER, 'number'],
    [
      /[A-Za-z_]\w*(?=\s*\()/y,
      (w) => {
        const upper = w.toUpperCase()
        if (SQL_KEYWORDS.has(upper)) return 'keyword'
        return SQL_TYPES.has(upper) ? 'type' : 'function'
      },
    ],
    [
      /[A-Za-z_]\w*/y,
      (w) => {
        const upper = w.toUpperCase()
        if (upper === 'TRUE' || upper === 'FALSE') return 'literal'
        if (SQL_KEYWORDS.has(upper)) return 'keyword'
        return SQL_TYPES.has(upper) ? 'type' : null
      },
    ],
    [/[-+*/%=<>!|]+/y, 'operator'],
    [/[(),;.]/y, 'punctuation'],
  ],
}

const DIFF_GRAMMAR: Grammar = {
  root: [
    [/^(?:\+\+\+|---)[^\n]*/my, 'meta'],
    [/^@@[^\n]*/my, 'keyword'],
    [/^\+[^\n]*/my, 'inserted'],
    [/^-[^\n]*/my, 'deleted'],
    [/^(?:diff|index)\b[^\n]*/my, 'comment'],
    [/[^\n]+/y, null],
  ],
}

const YAML_GRAMMAR: Grammar = {
  root: [
    [HASH_COMMENT, 'comment'],
    [
      /(?:"(?:\\.|[^\\"\n])*"|'(?:''|[^'\n])*'|[A-Za-z_$][\w.$/-]*)(?=[ \t]*:(?:\s|$))/y,
      'property',
    ],
    [DOUBLE_STRING, 'string'],
    [/'(?:''|[^'\n])*'?/y, 'string'],
    [/[&*][\w-]+/y, 'variable'],
    [/!{1,2}[\w/:.-]*/y, 'meta'],
    [/(?<![\w.-])(?:true|false|yes|no|on|off|null|~)(?![\w.-])/iy, 'literal'],
    [/(?<![\w.-])-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?(?![\w.-])/y, 'number'],
    [/(?<=^[ \t]*)-(?=\s)/my, 'punctuation'],
    [/[A-Za-z_][\w.-]*/y, null],
    [/[:{}[\],|>]/y, 'punctuation'],
  ],
}

const GRAMMARS: Record<string, Grammar> = {
  javascript: scriptGrammar(JS_KEYWORDS),
  typescript: scriptGrammar(TS_KEYWORDS, TS_TYPES),
  json: JSON_GRAMMAR,
  html: HTML_GRAMMAR,
  css: CSS_GRAMMAR,
  shell: SHELL_GRAMMAR,
  python: PYTHON_GRAMMAR,
  rust: RUST_GRAMMAR,
  sql: SQL_GRAMMAR,
  diff: DIFF_GRAMMAR,
  yaml: YAML_GRAMMAR,
}

/** Every name a language goes by, mapped to its grammar and the label a code block shows. */
const LANGUAGES: Record<string, [grammar: string, label: string]> = {
  js: ['javascript', 'JavaScript'],
  javascript: ['javascript', 'JavaScript'],
  jsx: ['javascript', 'JSX'],
  mjs: ['javascript', 'JavaScript'],
  cjs: ['javascript', 'JavaScript'],
  ts: ['typescript', 'TypeScript'],
  typescript: ['typescript', 'TypeScript'],
  tsx: ['typescript', 'TSX'],
  mts: ['typescript', 'TypeScript'],
  json: ['json', 'JSON'],
  jsonc: ['json', 'JSONC'],
  json5: ['json', 'JSON5'],
  html: ['html', 'HTML'],
  xml: ['html', 'XML'],
  svg: ['html', 'SVG'],
  vue: ['html', 'Vue'],
  svelte: ['html', 'Svelte'],
  astro: ['html', 'Astro'],
  css: ['css', 'CSS'],
  scss: ['css', 'SCSS'],
  less: ['css', 'Less'],
  sh: ['shell', 'Shell'],
  bash: ['shell', 'Bash'],
  zsh: ['shell', 'Zsh'],
  shell: ['shell', 'Shell'],
  py: ['python', 'Python'],
  python: ['python', 'Python'],
  rs: ['rust', 'Rust'],
  rust: ['rust', 'Rust'],
  sql: ['sql', 'SQL'],
  psql: ['sql', 'SQL'],
  postgres: ['sql', 'SQL'],
  sqlite: ['sql', 'SQL'],
  diff: ['diff', 'Diff'],
  patch: ['diff', 'Diff'],
  yaml: ['yaml', 'YAML'],
  yml: ['yaml', 'YAML'],
  text: ['', 'Text'],
  txt: ['', 'Text'],
  plain: ['', 'Text'],
  plaintext: ['', 'Text'],
}

/** The name a code block shows for `language` (`ts` → `TypeScript`); the name itself when it is not one the highlighter knows. */
export function languageLabel(language: string): string {
  return LANGUAGES[language.trim().toLowerCase()]?.[1] ?? language.trim()
}

/** True when `language` gets colours rather than plain text. */
export function isHighlighted(language: string): boolean {
  return !!LANGUAGES[language.trim().toLowerCase()]?.[0]
}

/**
 * Splits `code` into tokens in `language`. An unknown language, or one marked
 * as plain text, comes back as a single plain token. The tokens' texts joined
 * together are always exactly `code`.
 */
export function tokenize(code: string, language: string): CodeToken[] {
  const grammar = GRAMMARS[LANGUAGES[language.trim().toLowerCase()]?.[0] ?? '']
  if (!grammar || !code) return code ? [{ type: null, text: code }] : []
  const tokens: CodeToken[] = []
  const stack = ['root']
  let plain = ''
  let pos = 0
  const emit = (type: CodeTokenType | null, text: string): void => {
    if (type === null) {
      plain += text
      return
    }
    if (plain) tokens.push({ type: null, text: plain })
    plain = ''
    tokens.push({ type, text })
  }
  scan: while (pos < code.length) {
    const rules = grammar[stack[stack.length - 1]] ?? grammar.root
    for (const [pattern, classify, next] of rules) {
      pattern.lastIndex = pos
      const match = pattern.exec(code)?.[0]
      if (!match) continue
      emit(typeof classify === 'function' ? classify(match) : classify, match)
      pos += match.length
      if (next === 'pop') {
        if (stack.length > 1) stack.pop()
      } else if (next) {
        stack.push(next)
      }
      continue scan
    }
    emit(null, code[pos] as string)
    pos++
  }
  if (plain) tokens.push({ type: null, text: plain })
  return tokens
}

/**
 * Highlights `code` and splits the result into lines, cutting tokens that
 * span several lines (block comments, template strings) at each newline.
 * There is always at least one line.
 */
export function highlightLines(code: string, language: string): CodeToken[][] {
  const lines: CodeToken[][] = [[]]
  for (const token of tokenize(code, language)) {
    const parts = token.text.split('\n')
    parts.forEach((text, index) => {
      if (index > 0) lines.push([])
      if (text) lines[lines.length - 1]?.push({ type: token.type, text })
    })
  }
  return lines
}

/**
 * Normalises code written inside markup: unifies line endings, drops the
 * blank lines around it and removes the indentation every line shares.
 */
export function dedent(code: string): string {
  const lines = code.replace(/\r\n?/g, '\n').split('\n')
  while (lines.length && !lines[0]?.trim()) lines.shift()
  while (lines.length && !lines[lines.length - 1]?.trim()) lines.pop()
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => /^[ \t]*/.exec(line)?.[0].length ?? 0)
  const shared = indents.length ? Math.min(...indents) : 0
  return lines.map((line) => line.slice(shared)).join('\n')
}

/**
 * Parses a line list such as `"1, 3-5"` into 1-based line numbers. Anything
 * that is not a positive number or a range of them is ignored.
 */
export function parseLineList(list: string | null | undefined): Set<number> {
  const lines = new Set<number>()
  for (const part of (list ?? '').split(',')) {
    const match = /^\s*(\d+)\s*(?:-\s*(\d+)\s*)?$/.exec(part)
    if (!match) continue
    const from = Number(match[1])
    const to = match[2] ? Number(match[2]) : from
    for (let line = Math.min(from, to); line <= Math.max(from, to); line++) {
      if (line > 0) lines.add(line)
      if (lines.size > 10000) return lines
    }
  }
  return lines
}
