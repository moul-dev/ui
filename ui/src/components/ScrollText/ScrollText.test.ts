import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
  triggerResize,
} from '../../test-setup'
import './index'
import { type MoulScrollText, scrollTextRange } from './ScrollText'
import { scrollTextStyles } from './ScrollText.styles'

const css = scrollTextStyles.cssText

/** The body of the first `@media` block whose query contains `query`. */
function mediaBlock(query: string): string {
  const start = css.indexOf(`@media (${query})`)
  if (start < 0) return ''
  let depth = 0
  for (let index = css.indexOf('{', start); index < css.length; index++) {
    if (css[index] === '{') depth++
    else if (css[index] === '}' && --depth === 0) {
      return css.slice(css.indexOf('{', start) + 1, index)
    }
  }
  return ''
}

/** Gives the page a 1000px viewport and 3000px of content. */
function mockPage() {
  const page = (document.scrollingElement ??
    document.documentElement) as HTMLElement
  let top = 0
  const pages = new Set([page, document.documentElement])
  for (const el of pages) {
    Object.defineProperties(el, {
      scrollHeight: { configurable: true, get: () => 3000 },
      clientHeight: { configurable: true, get: () => 1000 },
      scrollTop: {
        configurable: true,
        get: () => top,
        set: (value: number) => {
          top = value
        },
      },
    })
  }
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    get: () => 1000,
  })
  return {
    scrollTo(value: number) {
      top = value
      window.dispatchEvent(new Event('scroll'))
    },
    restore() {
      delete (window as unknown as Record<string, unknown>).innerHeight
      for (const el of pages) {
        const own = el as unknown as Record<string, unknown>
        delete own.scrollHeight
        delete own.clientHeight
        delete own.scrollTop
      }
    },
  }
}

async function mount(markup: string): Promise<MoulScrollText> {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = markup
  document.body.append(wrapper)
  const el = wrapper.querySelector('moul-scroll-text') as MoulScrollText
  await el.updateComplete
  return el
}

const words = (el: MoulScrollText) => [
  ...(el.shadowRoot?.querySelectorAll<HTMLElement>('[data-split="word"]') ??
    []),
]

const progressOf = (el: MoulScrollText) =>
  (
    el.shadowRoot?.querySelector('[part="text"]') as HTMLElement
  ).style.getPropertyValue('--_scroll-text-progress')

/** How lit word `index` is, 0 to 1, when the page is scrolled `scrolled` of its 2000px range: the formula in the styles. */
function litAt(el: MoulScrollText, scrolled: number, index: number): number {
  const k = Number(el.style.getPropertyValue('--_scroll-text-k'))
  const c = Number(el.style.getPropertyValue('--_scroll-text-c'))
  return Math.min(1, Math.max(0, (scrolled / 2000) * k - c - index))
}

describe('scrollTextRange', () => {
  it('lights flowing text as it rises past a line 60% down the viewport', () => {
    // The top crosses the line at (1000 − 600) / 1200; a 200px text gets 300px of scrolling.
    expect(
      scrollTextRange({ viewport: 1000, height: 200, isPinned: false }),
    ).toEqual({ from: 0.3333, to: 0.5833 })
  })

  it('lights a long text over its own height', () => {
    expect(
      scrollTextRange({ viewport: 1000, height: 2000, isPinned: false }),
    ).toEqual({ from: 0.1333, to: 0.8 })
  })

  it('lights a pinned section over most of the stretch it stays pinned', () => {
    // Pinned from 1000 / 3500 until 2500 / 3500; lit after 80% of that.
    expect(
      scrollTextRange({ viewport: 1000, height: 2500, isPinned: true }),
    ).toEqual({ from: 0.2857, to: 0.6286 })
  })

  it('treats a pinned section no taller than the viewport as flowing text', () => {
    expect(
      scrollTextRange({ viewport: 1000, height: 800, isPinned: true }),
    ).toEqual(scrollTextRange({ viewport: 1000, height: 800, isPinned: false }))
  })

  it('lights text near the end of the page early enough to finish', () => {
    expect(
      scrollTextRange({
        viewport: 1000,
        height: 200,
        isPinned: false,
        last: 0.4,
      }),
    ).toEqual({ from: 0.15, to: 0.4 })
  })

  it('never returns an empty or inverted range', () => {
    expect(
      scrollTextRange({ viewport: 0, height: 0, isPinned: false }),
    ).toEqual({ from: 0, to: 1 })
    const range = scrollTextRange({
      viewport: 1000,
      height: 200,
      isPinned: false,
      last: 0,
    })
    expect(range.to - range.from).toBeGreaterThanOrEqual(0.01)
    expect(range.from).toBeGreaterThanOrEqual(0)
  })
})

describe('<moul-scroll-text>', () => {
  let frames: ManualFrames
  let page: ReturnType<typeof mockPage>
  let motion: ReducedMotionMock
  let time = 0

  const scrollPage = (top: number) => {
    page.scrollTo(top)
    time += 16
    frames.step(time)
  }

  beforeEach(() => {
    frames = manualAnimationFrames()
    page = mockPage()
    motion = mockReducedMotion(false)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    motion.restore()
    page.restore()
    frames.restore()
  })

  it('splits the text written inside it into words, each with its index', async () => {
    const el = await mount(
      '<moul-scroll-text>Ship on   every\n push</moul-scroll-text>',
    )
    expect(words(el).map((word) => word.textContent)).toEqual([
      'Ship',
      'on',
      'every',
      'push',
    ])
    expect(
      words(el).map((word) => word.style.getPropertyValue('--word-index')),
    ).toEqual(['0', '1', '2', '3'])
  })

  it('shows `text` in place of the text inside it', async () => {
    const el = await mount('<moul-scroll-text>Draft</moul-scroll-text>')
    el.text = 'Ship it today'
    await el.updateComplete
    expect(words(el).map((word) => word.textContent)).toEqual([
      'Ship',
      'it',
      'today',
    ])
  })

  it('splits Khmer at word boundaries', async () => {
    const el = await mount(
      '<moul-scroll-text lang="km">ខ្ញុំស្រលាញ់ភ្នំពេញ</moul-scroll-text>',
    )
    expect(words(el).map((word) => word.textContent)).toEqual([
      'ខ្ញុំ',
      'ស្រលាញ់',
      'ភ្នំពេញ',
    ])
  })

  it('works out where the words light from its size and place on the page', async () => {
    const el = await mount(
      '<moul-scroll-text>Ship on every push</moul-scroll-text>',
    )
    // 200px tall, 1500px down a page with a 1000px viewport and 2000px to scroll.
    triggerResize(el, { width: 600, height: 200, top: 1500 })
    // The top crosses the reading line (600px down) after 900px of scrolling;
    // a 200px text gets 300px of scrolling, so the last word is lit by 1200px.
    expect(litAt(el, 880, 0)).toBe(0)
    expect(litAt(el, 960, 0)).toBeGreaterThan(0.5)
    expect(litAt(el, 960, 3)).toBe(0)
    expect(litAt(el, 1190, 3)).toBeLessThan(1)
    expect(litAt(el, 1200, 3)).toBeCloseTo(1, 2)
  })

  it('lights earlier when the page ends before the text reaches the reading line', async () => {
    const el = await mount(
      '<moul-scroll-text>Ship on every push</moul-scroll-text>',
    )
    // 2900px down a page that can scroll 2000px: it stops 900px from the top.
    triggerResize(el, { width: 600, height: 200, top: 2900 })
    expect(litAt(el, 2000, 3)).toBeCloseTo(1, 2)
    expect(litAt(el, 1000, 0)).toBe(0)
  })

  it('lights a pinned section over the stretch it stays pinned', async () => {
    const el = await mount(
      '<moul-scroll-text is-pinned>Ship on every push</moul-scroll-text>',
    )
    expect(el.isPinned).toBe(true)
    // 2500px tall, its top 200px down: pinned from 200px of scrolling to 1700px.
    triggerResize(el, { width: 600, height: 2500, top: 200 })
    expect(litAt(el, 200, 0)).toBeCloseTo(0, 2)
    expect(litAt(el, 1390, 3)).toBeLessThan(1)
    // Lit after 80% of the pinned stretch, at 1400px.
    expect(litAt(el, 1400, 3)).toBeCloseTo(1, 2)
  })

  it('measures inside a container that scrolls, ignoring wrappers that only clip', async () => {
    const box = document.createElement('div')
    box.style.overflowY = 'auto'
    Object.defineProperties(box, {
      scrollHeight: { configurable: true, get: () => 1400 },
      clientHeight: { configurable: true, get: () => 400 },
      clientTop: { configurable: true, get: () => 0 },
      scrollTop: { configurable: true, get: () => 0 },
    })
    box.getBoundingClientRect = () =>
      ({ top: 100, left: 0, width: 600, height: 400 }) as DOMRect
    box.innerHTML =
      '<div style="overflow: hidden"><moul-scroll-text>Ship on every push</moul-scroll-text></div>'
    document.body.append(box)
    const el = box.querySelector('moul-scroll-text') as MoulScrollText
    await el.updateComplete
    // 700px down the box's content: view progress is (400 − 700) / 600 + scroll × 1000 / 600.
    triggerResize(el, { width: 600, height: 200, top: 800 })
    // The reading line is 240px down the box: the first word reaches it after 460px of 1000.
    const k = Number(el.style.getPropertyValue('--_scroll-text-k'))
    const c = Number(el.style.getPropertyValue('--_scroll-text-c'))
    expect((c / k) * 1000).toBeCloseTo(460, 0)
  })

  it('pins the text in the viewport inside a tall section', () => {
    expect(css).toMatch(
      /:host\(\[is-pinned\]\)\s*\{\s*block-size: var\(--scroll-text-length, 250vh\)/,
    )
    expect(css).toMatch(
      /:host\(\[is-pinned\]\) \.stage\s*\{[^}]*position: sticky/,
    )
  })

  it('follows the scroll, writing one progress value for every word', async () => {
    const el = await mount(
      '<moul-scroll-text>Ship on every push</moul-scroll-text>',
    )
    triggerResize(el, { width: 600, height: 200, top: 900 })
    // How far the page is scrolled, out of its 2000px range.
    scrollPage(100)
    expect(Number(progressOf(el))).toBeCloseTo(0.05, 4)
    scrollPage(600)
    expect(Number(progressOf(el))).toBeCloseTo(0.3, 4)
  })

  it('shows every word until it knows where they light', () => {
    // c defaults to a very large negative number, so each word is clamped to lit.
    expect(css).toContain('var(--_scroll-text-c, -100000)')
    expect(css).toContain('var(--_scroll-text-k, 0)')
  })

  describe('keyboard and screen readers', () => {
    it('reads the whole text once and hides the words', async () => {
      const el = await mount(
        '<moul-scroll-text>Ship on every push</moul-scroll-text>',
      )
      const readable = el.shadowRoot?.querySelector('[data-split="readable"]')
      expect(readable?.textContent).toBe('Ship on every push')
      expect(
        el.shadowRoot
          ?.querySelector('[data-split="visual"]')
          ?.getAttribute('aria-hidden'),
      ).toBe('true')
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
    })

    it('shows every word at full strength when colours are forced or printing', () => {
      expect(mediaBlock('forced-colors: active')).toMatch(
        /\[data-split="word"\]\s*\{\s*opacity: 1/,
      )
      expect(css).toMatch(/@media print\s*\{[\s\S]*opacity: 1/)
    })
  })

  describe('reduced motion', () => {
    it('shows every word and does not pin', () => {
      const block = mediaBlock('prefers-reduced-motion: reduce')
      expect(block).toMatch(/\[data-split="word"\]\s*\{\s*opacity: 1/)
      expect(block).toMatch(/\.stage\s*\{[^}]*position: static/)
      expect(block).toMatch(/:host\(\[is-pinned\]\)\s*\{\s*block-size: auto/)
    })

    it('does not follow the scroll at all', async () => {
      motion.set(true)
      const el = await mount(
        '<moul-scroll-text>Ship on every push</moul-scroll-text>',
      )
      triggerResize(el, { width: 600, height: 200, top: 900 })
      scrollPage(100)
      expect(progressOf(el)).toBe('')
      expect(el.style.getPropertyValue('--_scroll-text-k')).toBe('')
      expect(frames.pending).toBe(0)
    })

    it('stops and starts again when the setting changes', async () => {
      const el = await mount(
        '<moul-scroll-text>Ship on every push</moul-scroll-text>',
      )
      triggerResize(el, { width: 600, height: 200, top: 900 })
      scrollPage(100)
      expect(progressOf(el)).not.toBe('')

      motion.set(true)
      expect(progressOf(el)).toBe('')
      scrollPage(200)
      expect(progressOf(el)).toBe('')

      motion.set(false)
      scrollPage(300)
      expect(Number(progressOf(el))).toBeCloseTo(0.15, 4)
    })
  })
})
