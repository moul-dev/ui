import { prefersReducedMotion } from './motion'

/**
 * The "vanish" effect of `<moul-text-field>` and `<moul-prompt-input>`: the
 * text that was just sent breaks into letters that drift away and blur out.
 * The field itself is cleared at once; what moves is a copy laid over it.
 */

/** Beyond this many pieces the text fades as one block, to keep the frame rate. */
const MAX_PIECES = 400
const DURATION = 620
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
/** Scripts whose letters join; split apart they would change shape, so their words move whole. */
const JOINING_SCRIPT = /[؀-ࣿ܀-ݏ߀-߿᠀-᢯]/

const segmenters = new Map<string, Intl.Segmenter | null>()

function segmenter(granularity: 'grapheme' | 'word'): Intl.Segmenter | null {
  if (!segmenters.has(granularity)) {
    segmenters.set(
      granularity,
      typeof Intl !== 'undefined' && 'Segmenter' in Intl
        ? new Intl.Segmenter(undefined, { granularity })
        : null,
    )
  }
  return segmenters.get(granularity) ?? null
}

/** Letters as readers see them: a Khmer consonant keeps its vowel signs and subscripts. */
export function graphemes(text: string): string[] {
  const split = segmenter('grapheme')
  return split
    ? Array.from(split.segment(text), (part) => part.segment)
    : Array.from(text)
}

/**
 * Words and the spaces between them. Scripts written without spaces, such as
 * Khmer, split at dictionary boundaries where the runtime has `Intl.Segmenter`.
 */
function words(text: string): string[] {
  const split = segmenter('word')
  return split
    ? Array.from(split.segment(text), (part) => part.segment)
    : text.split(/(\s+)/).filter(Boolean)
}

export interface ScatterTextOptions {
  /** Show every letter as a dot, for a password. */
  isMasked?: boolean
  /** Moves the copy as the field's own scroll did. */
  scrollLeft?: number
  scrollTop?: number
}

function blowAway(
  piece: HTMLElement,
  progress: number,
  direction: number,
): Animation {
  const dx = direction * (10 + Math.random() * 34)
  const dy = -(4 + Math.random() * 26) + (Math.random() < 0.2 ? 18 : 0)
  const turn = (Math.random() - 0.5) * 40
  return piece.animate(
    [
      { opacity: 1, filter: 'blur(0px)', transform: 'none' },
      {
        opacity: 0,
        filter: 'blur(4px)',
        transform: `translate(${dx}px, ${dy}px) rotate(${turn}deg) scale(0.6)`,
      },
    ],
    {
      duration: DURATION * (0.7 + Math.random() * 0.5),
      delay: progress * 280,
      easing: EASING,
      fill: 'forwards',
    },
  )
}

/**
 * Fills `layer` with a copy of `text` and blows it away letter by letter.
 * Resolves once the letters are gone and `layer` is empty again. The layer
 * must sit exactly over the field's text, with the same font, padding and
 * wrapping; words are kept whole so the copy wraps where the field did.
 * Under reduced motion, or without the Web Animations API, it resolves at
 * once and draws nothing.
 */
export function scatterText(
  layer: HTMLElement,
  text: string,
  options: ScatterTextOptions = {},
): Promise<void> {
  layer.replaceChildren()
  if (!text || prefersReducedMotion() || typeof layer.animate !== 'function') {
    return Promise.resolve()
  }
  const direction = getComputedStyle(layer).direction === 'rtl' ? -1 : 1
  const shown = options.isMasked ? '•'.repeat(graphemes(text).length) : text
  const inner = document.createElement('span')
  inner.style.display = 'block'
  inner.style.translate = `${-(options.scrollLeft ?? 0)}px ${-(options.scrollTop ?? 0)}px`
  layer.append(inner)

  const pieces: HTMLElement[] = []
  const tooMany = graphemes(shown).length > MAX_PIECES
  if (tooMany) {
    inner.textContent = shown
  } else {
    for (const word of words(shown)) {
      if (/^\s+$/.test(word)) {
        inner.append(word)
        continue
      }
      const box = document.createElement('span')
      box.style.whiteSpace = 'nowrap'
      inner.append(box)
      if (JOINING_SCRIPT.test(word)) {
        box.style.display = 'inline-block'
        box.textContent = word
        pieces.push(box)
        continue
      }
      for (const letter of graphemes(word)) {
        const span = document.createElement('span')
        span.style.display = 'inline-block'
        span.textContent = letter
        box.append(span)
        pieces.push(span)
      }
    }
  }

  const animations = tooMany
    ? [
        inner.animate(
          [
            { opacity: 1, filter: 'blur(0px)', transform: 'none' },
            {
              opacity: 0,
              filter: 'blur(6px)',
              transform: 'translateY(-12px)',
            },
          ],
          { duration: DURATION, easing: EASING, fill: 'forwards' },
        ),
      ]
    : pieces.map((piece, index) =>
        blowAway(
          piece,
          pieces.length > 1 ? index / (pieces.length - 1) : 0,
          direction,
        ),
      )

  return Promise.allSettled(animations.map((animation) => animation.finished))
    .then(() => undefined)
    .finally(() => layer.replaceChildren())
}
