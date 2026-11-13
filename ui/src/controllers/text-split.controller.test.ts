import { html, LitElement } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { triggerResize } from '../test-setup'
import {
  type SplitTextBy,
  segmentText,
  splitGraphemes,
  splitText,
  TextSplitController,
} from './text-split.controller'

const words = (text: string, locale?: string) =>
  segmentText(text, locale)
    .filter((segment) => segment.kind === 'word')
    .map((segment) => segment.text)

/** Khmer vowel signs, diacritics and the coeng that joins a subscript consonant. */
const KHMER_COMBINING = /^[឴-៓៝]/

describe('segmentText', () => {
  it('keeps punctuation on the word it touches', () => {
    expect(words('Hello, world!')).toEqual(['Hello,', 'world!'])
    expect(words('“Quoted” words (here)')).toEqual([
      '“Quoted”',
      'words',
      '(here)',
    ])
    expect(words('a — b')).toEqual(['a', '—', 'b'])
  })

  it('keeps the spaces between words, runs and line breaks included', () => {
    const segments = segmentText('one  two\nthree')
    expect(segments.map((s) => s.text).join('')).toBe('one  two\nthree')
    expect(
      segments.filter((s) => s.kind === 'space').map((s) => s.text),
    ).toEqual(['  ', '\n'])
  })

  it('splits Khmer, written without spaces, at word boundaries', () => {
    const text = 'សួស្តីពិភពលោក'
    const result = words(text, 'km')
    expect(result.length).toBeGreaterThan(1)
    expect(result.join('')).toBe(text)
  })

  it('never splits a letter from its marks', () => {
    const graphemes = splitGraphemes('ស្រីស្អាត', 'km')
    expect(graphemes.join('')).toBe('ស្រីស្អាត')
    for (const grapheme of graphemes) {
      expect(grapheme).not.toMatch(KHMER_COMBINING)
    }
    expect(splitGraphemes('👩🏽‍🚀é')).toEqual(['👩🏽‍🚀', 'é'])
  })
})

describe('splitText', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  function container(): HTMLElement {
    const el = document.createElement('span')
    document.body.append(el)
    return el
  }

  it('renders words for sight and keeps one readable copy for screen readers', () => {
    const el = container()
    const result = splitText(el, 'Moul builds things')
    const readable = el.querySelector<HTMLElement>('[data-split="readable"]')!
    const visual = el.querySelector<HTMLElement>('[data-split="visual"]')!

    expect(readable.textContent).toBe('Moul builds things')
    expect(readable.style.getPropertyValue('clip-path')).toBe('inset(50%)')
    expect(readable.hasAttribute('aria-hidden')).toBe(false)
    expect(visual.getAttribute('aria-hidden')).toBe('true')
    expect(visual.textContent).toBe('Moul builds things')

    expect(result.words.map((w) => w.textContent)).toEqual([
      'Moul',
      'builds',
      'things',
    ])
    expect(
      result.words.map((w) => w.style.getPropertyValue('--word-index')),
    ).toEqual(['0', '1', '2'])
    expect(result.words[0].style.getPropertyValue('display')).toBe(
      'inline-block',
    )
    expect(result.chars).toEqual([])
    expect(el.style.getPropertyValue('--split-word-count')).toBe('3')
  })

  it('numbers letters across the whole text when split by chars', () => {
    const el = container()
    const result = splitText(el, 'Hi you', { by: 'chars' })
    expect(result.chars.map((c) => c.textContent)).toEqual([
      'H',
      'i',
      'y',
      'o',
      'u',
    ])
    expect(
      result.chars.map((c) => c.style.getPropertyValue('--char-index')),
    ).toEqual(['0', '1', '2', '3', '4'])
    expect(result.chars[2].parentElement).toBe(result.words[1])
    expect(el.style.getPropertyValue('--split-char-count')).toBe('5')
  })

  it('numbers the line each word wrapped onto when split by lines', () => {
    const el = container()
    const tops = [0, 0, 24, 24, 48]
    const original = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const index = Number(this.style.getPropertyValue('--word-index'))
      return { top: tops[index] ?? 0, height: 20 } as DOMRect
    }
    try {
      const result = splitText(el, 'one two three four five', { by: 'lines' })
      expect(result.lineCount).toBe(3)
      expect(
        result.words.map((w) => w.style.getPropertyValue('--line-index')),
      ).toEqual(['0', '0', '1', '1', '2'])
      expect(el.style.getPropertyValue('--split-line-count')).toBe('3')
    } finally {
      HTMLElement.prototype.getBoundingClientRect = original
    }
  })

  it('puts the plain text back on revert', () => {
    const el = container()
    const result = splitText(el, 'Back again', { by: 'chars' })
    result.revert()
    expect(el.childNodes).toHaveLength(1)
    expect(el.textContent).toBe('Back again')
    expect(el.style.getPropertyValue('--split-word-count')).toBe('')
  })
})

let hostCount = 0

class SplitHost extends LitElement {
  static override properties = {
    text: { type: String },
    by: { type: String },
  }
  declare text: string
  declare by: SplitTextBy
  readonly splitter = new TextSplitController(this, {
    container: () => this.renderRoot.querySelector('[part="text"]'),
    text: () => this.text,
    by: () => this.by,
  })
  constructor() {
    super()
    this.text = 'Hello there'
    this.by = 'words'
  }
  protected override render() {
    return html`<span part="text"></span>`
  }
}

async function mountSplit(attrs = ''): Promise<SplitHost> {
  const tag = `split-host-${++hostCount}`
  customElements.define(tag, class extends SplitHost {})
  const wrapper = document.createElement('div')
  wrapper.innerHTML = `<${tag} ${attrs}></${tag}>`
  document.body.append(wrapper)
  const el = wrapper.firstElementChild as SplitHost
  await el.updateComplete
  return el
}

describe('TextSplitController', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('splits after the first render and again only when the text or mode changes', async () => {
    const el = await mountSplit()
    const first = el.splitter.result
    expect(first?.words.map((w) => w.textContent)).toEqual(['Hello', 'there'])

    el.requestUpdate()
    await el.updateComplete
    expect(el.splitter.result).toBe(first)

    el.text = 'Goodbye'
    await el.updateComplete
    expect(el.splitter.result?.words.map((w) => w.textContent)).toEqual([
      'Goodbye',
    ])

    el.by = 'chars'
    await el.updateComplete
    expect(el.splitter.result?.chars).toHaveLength(7)
  })

  it('takes word boundaries from the nearest lang attribute', async () => {
    const Original = Intl.Segmenter
    const locales: unknown[] = []
    ;(Intl as any).Segmenter = class extends Original {
      constructor(locale?: string, options?: Intl.SegmenterOptions) {
        locales.push(locale)
        super(locale, options)
      }
    }
    const wrapper = document.createElement('section')
    wrapper.lang = 'km-KH'
    document.body.append(wrapper)
    const tag = `split-host-${++hostCount}`
    customElements.define(tag, class extends SplitHost {})
    const el = document.createElement(tag) as SplitHost
    el.text = 'ភាសាខ្មែរ'
    wrapper.append(el)
    try {
      await el.updateComplete
      expect(locales).toContain('km-KH')
      expect(el.splitter.result?.words.map((w) => w.textContent).join('')).toBe(
        'ភាសាខ្មែរ',
      )
    } finally {
      ;(Intl as any).Segmenter = Original
    }
  })

  it('renumbers lines when the container width changes', async () => {
    const el = await mountSplit('by="lines"')
    const text = el.shadowRoot!.querySelector<HTMLElement>('[part="text"]')!
    const measure = vi.spyOn(el.splitter.result!, 'measureLines')
    triggerResize(text, { width: 300, height: 40 })
    triggerResize(text, { width: 300, height: 60 })
    expect(measure).toHaveBeenCalledTimes(1)
    triggerResize(text, { width: 200, height: 60 })
    expect(measure).toHaveBeenCalledTimes(2)
  })
})
