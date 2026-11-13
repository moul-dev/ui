import type { ReactiveController, ReactiveControllerHost } from 'lit'

/**
 * `chars` splits into letters (grapheme clusters, so a Khmer consonant keeps
 * its subscripts and vowels), `words` into words, and `lines` into words
 * tagged with the line they wrapped onto.
 */
export type SplitTextBy = 'chars' | 'words' | 'lines'

export interface TextSegment {
  kind: 'word' | 'space'
  text: string
  /** The word's grapheme clusters; empty for spaces. */
  chars: string[]
}

export interface SplitTextOptions {
  by?: SplitTextBy
  /** BCP 47 language for word and letter boundaries, e.g. `km`. Defaults to the runtime's. */
  locale?: string
}

export interface SplitTextResult {
  by: SplitTextBy
  words: HTMLElement[]
  /** Empty unless split by `chars`. */
  chars: HTMLElement[]
  /** Number of wrapped lines; 0 unless split by `lines`. */
  lineCount: number
  /** Recomputes `--line-index` after the container's width changes. Only does work when split by `lines`. */
  measureLines(): void
  /** Puts the plain text back. */
  revert(): void
}

type SegmenterGranularity = 'grapheme' | 'word'

interface Segmenter {
  segment(input: string): Iterable<{ segment: string; isWordLike?: boolean }>
}

const segmenters = new Map<string, Segmenter | null>()

function segmenter(
  granularity: SegmenterGranularity,
  locale: string | undefined,
): Segmenter | null {
  const key = `${granularity}:${locale ?? ''}`
  if (!segmenters.has(key)) {
    const Ctor = (
      Intl as unknown as {
        Segmenter?: new (
          locale: string | undefined,
          options: { granularity: SegmenterGranularity },
        ) => Segmenter
      }
    ).Segmenter
    let instance: Segmenter | null = null
    if (typeof Ctor === 'function') {
      try {
        instance = new Ctor(locale, { granularity })
      } catch {
        // An unknown locale tag: fall back to the default.
        instance = new Ctor(undefined, { granularity })
      }
    }
    segmenters.set(key, instance)
  }
  return segmenters.get(key) ?? null
}

/** Splits a word into grapheme clusters, the units a reader sees as letters. */
export function splitGraphemes(word: string, locale?: string): string[] {
  const graphemes = segmenter('grapheme', locale)
  if (!graphemes) return Array.from(word)
  return Array.from(graphemes.segment(word), (part) => part.segment)
}

/**
 * Breaks text into words and the spaces between them. Punctuation stays on
 * the word it touches, so a comma never wraps onto a line by itself. Scripts
 * written without spaces between words, such as Khmer and Thai, are split at
 * dictionary word boundaries where the runtime has `Intl.Segmenter`.
 */
export function segmentText(text: string, locale?: string): TextSegment[] {
  const words = segmenter('word', locale)
  const segments: TextSegment[] = []
  for (const token of text.split(/(\s+)/)) {
    if (token === '') continue
    if (/^\s+$/.test(token)) {
      segments.push({ kind: 'space', text: token, chars: [] })
      continue
    }
    const parts = words
      ? Array.from(words.segment(token))
      : [{ segment: token, isWordLike: true }]
    let pending = ''
    const tokenWords: string[] = []
    for (const part of parts) {
      if (part.isWordLike) {
        tokenWords.push(pending + part.segment)
        pending = ''
      } else if (tokenWords.length > 0) {
        tokenWords[tokenWords.length - 1] += part.segment
      } else {
        // Leading punctuation, such as an opening quote, joins the next word.
        pending += part.segment
      }
    }
    if (pending) tokenWords.push(pending)
    for (const word of tokenWords) {
      segments.push({
        kind: 'word',
        text: word,
        chars: splitGraphemes(word, locale),
      })
    }
  }
  return segments
}

/** Hides the readable copy from sight but not from screen readers. */
function hideVisually(el: HTMLElement): void {
  const style = el.style
  style.setProperty('position', 'absolute')
  style.setProperty('width', '1px')
  style.setProperty('height', '1px')
  style.setProperty('margin', '-1px')
  style.setProperty('padding', '0')
  style.setProperty('overflow', 'hidden')
  style.setProperty('clip-path', 'inset(50%)')
  style.setProperty('white-space', 'nowrap')
  style.setProperty('border', '0')
  style.setProperty('user-select', 'none')
}

/**
 * Renders `text` into `container` as one span per word (and per letter when
 * split by `chars`), so each piece can be animated on its own. Every piece
 * is an `inline-block` carrying its position as CSS variables, for staggered
 * delays such as `animation-delay: calc(var(--char-index) * 30ms)`:
 *
 * - words: `data-split="word"`, `--word-index`, and `--line-index` when split by `lines`;
 * - letters: `data-split="char"`, `--char-index`;
 * - the container: `--split-word-count`, `--split-char-count`, `--split-line-count`.
 *
 * The pieces are hidden from assistive technology and the text is kept once,
 * whole, in a visually hidden span, so a screen reader reads the sentence
 * instead of one letter at a time. Styles are set through the CSSOM, which a
 * strict Content Security Policy allows.
 */
export function splitText(
  container: HTMLElement,
  text: string,
  options: SplitTextOptions = {},
): SplitTextResult {
  const by = options.by ?? 'words'
  const doc = container.ownerDocument
  const readable = doc.createElement('span')
  readable.textContent = text
  readable.dataset.split = 'readable'
  hideVisually(readable)

  const visual = doc.createElement('span')
  visual.setAttribute('aria-hidden', 'true')
  visual.dataset.split = 'visual'

  const words: HTMLElement[] = []
  const chars: HTMLElement[] = []
  for (const segment of segmentText(text, options.locale)) {
    if (segment.kind === 'space') {
      visual.append(doc.createTextNode(segment.text))
      continue
    }
    const word = doc.createElement('span')
    word.dataset.split = 'word'
    word.style.setProperty('display', 'inline-block')
    word.style.setProperty('--word-index', String(words.length))
    if (by === 'chars') {
      for (const letter of segment.chars) {
        const char = doc.createElement('span')
        char.dataset.split = 'char'
        char.textContent = letter
        char.style.setProperty('display', 'inline-block')
        char.style.setProperty('--char-index', String(chars.length))
        word.append(char)
        chars.push(char)
      }
    } else {
      word.textContent = segment.text
    }
    visual.append(word)
    words.push(word)
  }

  container.replaceChildren(readable, visual)
  container.style.setProperty('--split-word-count', String(words.length))
  container.style.setProperty('--split-char-count', String(chars.length))

  const result: SplitTextResult = {
    by,
    words,
    chars,
    lineCount: 0,
    measureLines() {
      if (by !== 'lines') return
      result.lineCount = assignLines(words)
      container.style.setProperty(
        '--split-line-count',
        String(result.lineCount),
      )
    },
    revert() {
      container.replaceChildren(doc.createTextNode(text))
      for (const name of [
        '--split-word-count',
        '--split-char-count',
        '--split-line-count',
      ]) {
        container.style.removeProperty(name)
      }
    },
  }
  result.measureLines()
  return result
}

/**
 * Numbers each word with the line it wrapped onto, by comparing the top
 * edges of consecutive words. Returns the number of lines.
 */
function assignLines(words: HTMLElement[]): number {
  let line = -1
  let lineTop = Number.NEGATIVE_INFINITY
  for (const word of words) {
    const box = word.getBoundingClientRect()
    // A word sits on a new line once its top passes the middle of the previous line.
    if (line < 0 || box.top > lineTop + Math.max(box.height, 1) / 2) {
      line += 1
      lineTop = box.top
    }
    word.style.setProperty('--line-index', String(line))
  }
  return line + 1
}

export interface TextSplitControllerOptions {
  /** Element the pieces are rendered into, usually an empty span in the host's shadow root. */
  container: () => HTMLElement | null
  /** Text to split. Read after every host update; a change re-splits. */
  text: () => string
  /** How to split. Read after every host update. Defaults to `words`. */
  by?: () => SplitTextBy
  /** Language for word and letter boundaries. Defaults to the nearest `lang` attribute above the host. */
  locale?: () => string | undefined
}

/**
 * Keeps a host's text split as its content changes: re-splits after any
 * update that changes the text or the split mode, and, when split by
 * `lines`, renumbers lines whenever the container's width changes.
 * The pieces are in `result`; see `splitText` for the markup and variables.
 */
export class TextSplitController implements ReactiveController {
  public result: SplitTextResult | null = null

  private readonly host: ReactiveControllerHost & HTMLElement
  private readonly options: TextSplitControllerOptions
  private container: HTMLElement | null = null
  private key = ''
  private observer: ResizeObserver | null = null
  private lastWidth = -1

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: TextSplitControllerOptions,
  ) {
    this.host = host
    this.options = options
    this.host.addController(this)
  }

  public hostUpdated(): void {
    this.split()
  }

  public hostDisconnected(): void {
    this.observer?.disconnect()
    this.observer = null
  }

  public hostConnected(): void {
    // Reconnecting after a move: watch the width again.
    if (this.container && this.result?.by === 'lines')
      this.watchWidth(this.container)
  }

  /** Splits now if the text, mode or container changed since the last split. */
  public split(): void {
    const container = this.options.container()
    if (!container) return
    const text = this.options.text()
    const by = this.options.by?.() ?? 'words'
    const locale = this.options.locale?.() ?? this.inheritedLocale()
    const key = `${by}\u0000${locale ?? ''}\u0000${text}`
    if (container === this.container && key === this.key) return

    this.container = container
    this.key = key
    this.result = splitText(container, text, { by, locale })
    this.observer?.disconnect()
    this.observer = null
    if (by === 'lines') this.watchWidth(container)
  }

  private watchWidth(container: HTMLElement): void {
    if (typeof ResizeObserver !== 'function') return
    this.observer?.disconnect()
    this.lastWidth = -1
    this.observer = new ResizeObserver((entries) => {
      const width = entries[entries.length - 1]?.contentRect.width ?? 0
      // Height changes follow from re-wrapping; only a new width can move words between lines.
      if (width === this.lastWidth) return
      this.lastWidth = width
      this.result?.measureLines()
    })
    this.observer.observe(container)
  }

  private inheritedLocale(): string | undefined {
    const lang = this.host.closest?.('[lang]')?.getAttribute('lang')
    return lang || undefined
  }
}
