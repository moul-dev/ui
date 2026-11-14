/**
 * The element checklist, as a test. Every `<moul-*>` element ships with:
 *
 * 1. a description in the Custom Elements Manifest, because agents pick
 *    components from that text (the class JSDoc summary);
 * 2. keyboard and screen reader behaviour, written down in the JSDoc;
 * 3. a reduced-motion path, written down in the JSDoc and present in the
 *    code whenever the element animates;
 * 4. light and dark themes: colours come from tokens, never literals;
 * 5. a demo page (English and Khmer) and a test.
 *
 * The JSDoc this test reads looks like this (`bun run gen:component` writes it):
 *
 *   /**
 *    * Text that types itself, letter by letter, with a blinking cursor.
 *    *
 *    * Keyboard and screen readers: not focusable; the whole text is read once.
 *    *
 *    * Reduced motion: the text appears at once and the cursor does not blink.
 *    *
 *    * @slot - The text to type.
 *    *\/
 *
 * The checks read source files, so they run without a build. They are
 * necessary, not sufficient: a test still has to show the keyboard and
 * reduced-motion behaviour works.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = resolve(__dirname)
const COMPONENTS = join(SRC, 'components')
const DOCS = resolve(SRC, '../../docs/src/content/docs')
const THIS_FILE = resolve(__filename)

/**
 * Elements exempt from the three documentation checks (summary, keyboard and
 * screen readers, reduced motion) until their JSDoc is written; every other
 * check applies. It held the elements that shipped before the checklist and is
 * empty now that they are all documented. Remove a tag once its JSDoc passes:
 * the last test below fails until you do, so this list only shrinks.
 */
const DOCUMENTED_BEFORE_CHECKLIST = new Set<string>()

/**
 * Elements that still lack a docs demo. It is empty now that the line and
 * area chart pages wire `<moul-chart-tooltip>` to `point-hover`; the list only
 * shrinks.
 */
const WITHOUT_DEMO = new Set<string>()

const KEYBOARD_LABEL = 'Keyboard and screen readers:'
const REDUCED_MOTION_LABEL = 'Reduced motion:'

/** Signs that an element moves: CSS animations and transitions, or script-driven motion. */
const MOTION =
  /@keyframes|\banimation(?:-name)?\s*:|\btransition(?:-property)?\s*:|\banimate\(|requestAnimationFrame\(/

/** Signs of a reduced-motion branch: the media query, the helpers, or a controller that honours it. */
const REDUCED_MOTION_PATH =
  /prefers-reduced-motion|prefersReducedMotion\(|watchReducedMotion\(|subtleAnimate\(|animateActiveIndicator\(|\b(?:Press|OverlayPresence|NumberSpring|Pointer|Drag|CanvasLoop)Controller\b/

/** Colour literals that would look the same in both themes. */
const COLOR_LITERAL =
  /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl)a?\(|\b(?:oklch|oklab|lch|lab)\(\s*[\d.]/

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

const isTest = (path: string) => path.endsWith('.test.ts')

interface ElementSource {
  tag: string
  className: string
  /** The file that registers the element. */
  file: string
  /** Every non-test source file in the element's folder. */
  folderSource: string
  /** The `*.styles.ts` files in the element's folder. */
  styles: string
  jsdoc: string | null
}

function classJsdoc(source: string, className: string): string | null {
  const match = new RegExp(`export class ${className}\\b`).exec(source)
  if (!match) return null
  const before = source.slice(0, match.index).trimEnd()
  if (!before.endsWith('*/')) return null
  const start = before.lastIndexOf('/**')
  return start < 0 ? null : before.slice(start + 3, -2)
}

function readElements(): ElementSource[] {
  const elements: ElementSource[] = []
  for (const file of walk(COMPONENTS)) {
    if (!file.endsWith('.ts') || isTest(file)) continue
    const source = readFileSync(file, 'utf8')
    for (const [, tag, className] of source.matchAll(
      /defineElement\(\s*'(moul-[\w-]+)',\s*(\w+)\s*\)/g,
    )) {
      const folder = dirname(file)
      const siblings = walk(folder).filter(
        (path) => path.endsWith('.ts') && !isTest(path),
      )
      elements.push({
        tag,
        className,
        file,
        folderSource: siblings
          .map((path) => readFileSync(path, 'utf8'))
          .join('\n'),
        styles: siblings
          .filter((path) => path.endsWith('.styles.ts'))
          .map((path) => readFileSync(path, 'utf8'))
          .join('\n'),
        jsdoc: classJsdoc(source, className),
      })
    }
  }
  return elements
}

interface JsdocParts {
  summary: string
  keyboard: string | null
  reducedMotion: string | null
}

/** Splits a class JSDoc into its summary and labelled paragraphs, stopping at the first tag. */
function readJsdoc(jsdoc: string): JsdocParts {
  const lines = jsdoc.split('\n').map((line) => line.replace(/^\s*\* ?/, ''))
  const firstTag = lines.findIndex((line) => line.trimStart().startsWith('@'))
  const text = (firstTag < 0 ? lines : lines.slice(0, firstTag)).join('\n')
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  const labelled = (label: string) => {
    const paragraph = paragraphs.find((p) => p.startsWith(label))
    return paragraph === undefined ? null : paragraph.slice(label.length).trim()
  }
  const summary = paragraphs.find(
    (p) => !p.startsWith(KEYBOARD_LABEL) && !p.startsWith(REDUCED_MOTION_LABEL),
  )
  return {
    summary: summary ?? '',
    keyboard: labelled(KEYBOARD_LABEL),
    reducedMotion: labelled(REDUCED_MOTION_LABEL),
  }
}

const isWritten = (text: string | null) =>
  text !== null && text.length > 0 && !/\bTODO\b/.test(text)

function documentationGaps(element: ElementSource): string[] {
  if (!element.jsdoc) return ['no JSDoc on the class']
  const parts = readJsdoc(element.jsdoc)
  const gaps: string[] = []
  if (!isWritten(parts.summary)) gaps.push('no summary')
  if (!isWritten(parts.keyboard)) gaps.push(`no "${KEYBOARD_LABEL}" paragraph`)
  if (!isWritten(parts.reducedMotion)) {
    gaps.push(`no "${REDUCED_MOTION_LABEL}" paragraph`)
  }
  return gaps
}

/**
 * Removes the places a colour literal is fine: comments, `var(--token, fallback)`
 * fallbacks, and masks and shadows, which use black only for its alpha and so
 * read the same in both themes.
 */
function stripAllowedColors(css: string): string {
  let out = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\b(?:mask[\w-]*|box-shadow|text-shadow)\s*:[^;]*;/g, '')
  let start = out.indexOf('var(')
  while (start >= 0) {
    let depth = 0
    let end = start + 3
    for (; end < out.length; end++) {
      if (out[end] === '(') depth++
      else if (out[end] === ')' && --depth === 0) break
    }
    out = `${out.slice(0, start)}var()${out.slice(end + 1)}`
    start = out.indexOf('var(', start + 5)
  }
  return out
}

const englishPages = walk(join(DOCS, 'docs')).filter((path) =>
  path.endsWith('.mdx'),
)
const khmerTwin = (page: string) => join(DOCS, 'km', relative(DOCS, page))
const testCorpus = walk(SRC)
  .filter((path) => isTest(path) && resolve(path) !== THIS_FILE)
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n')

const elements = readElements()
const tagPattern = (tag: string) => new RegExp(`<${tag}[\\s>/]`)

describe('Element checklist', () => {
  it('finds the registered elements', () => {
    expect(elements.length).toBeGreaterThanOrEqual(
      DOCUMENTED_BEFORE_CHECKLIST.size,
    )
  })

  describe.each(
    elements.map((element) => [element.tag, element] as const),
  )('<%s>', (tag, element) => {
    it.skipIf(DOCUMENTED_BEFORE_CHECKLIST.has(tag))(
      'documents a summary, keyboard and screen reader behaviour, and reduced motion in its JSDoc',
      () => {
        expect(documentationGaps(element), relative(SRC, element.file)).toEqual(
          [],
        )
      },
    )

    it('has a reduced-motion path if it animates', () => {
      if (!MOTION.test(element.folderSource)) return
      expect(
        REDUCED_MOTION_PATH.test(element.folderSource),
        `${relative(SRC, dirname(element.file))} animates but never checks prefers-reduced-motion`,
      ).toBe(true)
    })

    it('takes its colours from tokens, so light and dark themes both work', () => {
      const literal = COLOR_LITERAL.exec(stripAllowedColors(element.styles))
      expect(literal?.[0] ?? null, `colour literal in ${tag} styles`).toBeNull()
    })

    it.skipIf(WITHOUT_DEMO.has(tag))(
      'has a demo on an English docs page with a Khmer twin',
      () => {
        const pages = englishPages.filter((page) =>
          tagPattern(tag).test(readFileSync(page, 'utf8')),
        )
        expect(pages.length, `no docs page renders <${tag}>`).toBeGreaterThan(0)
        for (const page of pages) {
          expect(
            existsSync(khmerTwin(page)),
            `${relative(DOCS, page)} has no Khmer twin`,
          ).toBe(true)
        }
      },
    )

    it('has a test', () => {
      expect(testCorpus.includes(tag), `no test mentions ${tag}`).toBe(true)
    })

    it('has no unfinished checklist items in its own test file', () => {
      const ownTest = join(
        dirname(element.file),
        `${basename(element.file, '.ts')}.test.ts`,
      )
      if (!existsSync(ownTest)) return
      const todo = /\bit\.todo\(\s*['"`]([^'"`]+)/.exec(
        readFileSync(ownTest, 'utf8'),
      )
      expect(todo?.[1] ?? null, relative(SRC, ownTest)).toBeNull()
    })
  })

  it('lists only elements that still exist and still have gaps', () => {
    const tags = new Set(elements.map((element) => element.tag))
    for (const tag of [...DOCUMENTED_BEFORE_CHECKLIST, ...WITHOUT_DEMO]) {
      expect(tags.has(tag), `${tag} is listed but no longer registered`).toBe(
        true,
      )
    }
    const nowDocumented = elements
      .filter(
        (element) =>
          DOCUMENTED_BEFORE_CHECKLIST.has(element.tag) &&
          documentationGaps(element).length === 0,
      )
      .map((element) => element.tag)
    expect(
      nowDocumented,
      'documented now: remove from DOCUMENTED_BEFORE_CHECKLIST',
    ).toEqual([])
  })
})

describe('readJsdoc', () => {
  it('separates the summary from the labelled paragraphs and stops at tags', () => {
    const parts = readJsdoc(`
     * Text that types itself.
     * One letter at a time.
     *
     * Keyboard and screen readers: not focusable;
     * the whole text is read once.
     *
     * Reduced motion: the text appears at once.
     *
     * @slot - The text.
     * Keyboard and screen readers: ignored after a tag.
    `)
    expect(parts).toEqual({
      summary: 'Text that types itself. One letter at a time.',
      keyboard: 'not focusable; the whole text is read once.',
      reducedMotion: 'the text appears at once.',
    })
  })

  it('treats TODO placeholders as unwritten', () => {
    expect(isWritten('TODO: describe focus order')).toBe(false)
    expect(isWritten('')).toBe(false)
    expect(isWritten(null)).toBe(false)
    expect(isWritten('Tab moves focus to the handle.')).toBe(true)
  })
})
