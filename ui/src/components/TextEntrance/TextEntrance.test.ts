import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import './TextEntrance'
import type { MoulTextEntrance } from './TextEntrance'
import { textEntranceStyles } from './TextEntrance.styles'

const base = (el: MoulTextEntrance) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!

const pieces = (el: MoulTextEntrance, kind: 'word' | 'char') =>
  [...base(el).querySelectorAll<HTMLElement>(`[data-split="${kind}"]`)].map(
    (piece) => piece.textContent,
  )

/** Lets the light-DOM observer report, then the element re-render. */
async function settled(el: MoulTextEntrance): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve))
  await el.updateComplete
}

describe('<moul-text-entrance>', () => {
  let io: IntersectionMock
  let motion: ReducedMotionMock | null = null

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
    motion?.restore()
    motion = null
    vi.useRealTimers()
  })

  it('splits the text written inside it into words', async () => {
    const el = await fixture<MoulTextEntrance>(
      html`<moul-text-entrance>
        Ship   on Friday
      </moul-text-entrance>`,
    )
    expect(el.currentText).toBe('Ship on Friday')
    expect(pieces(el, 'word')).toEqual(['Ship', 'on', 'Friday'])
    // The spaces between the pieces stay, so the sentence wraps and reads as text.
    expect(base(el).querySelector('[data-split="visual"]')?.textContent).toBe(
      'Ship on Friday',
    )
  })

  it('prefers the text attribute over the text inside', async () => {
    const el = await fixture<MoulTextEntrance>(
      html`<moul-text-entrance text="Logs you can search"
        >Fallback</moul-text-entrance
      >`,
    )
    expect(pieces(el, 'word')).toEqual(['Logs', 'you', 'can', 'search'])
  })

  it('splits again when the text inside changes', async () => {
    const el = await fixture<MoulTextEntrance>(
      html`<moul-text-entrance>Old words</moul-text-entrance>`,
    )
    el.textContent = 'Brand new words'
    await settled(el)
    expect(pieces(el, 'word')).toEqual(['Brand', 'new', 'words'])

    el.firstChild!.nodeValue = 'Edited in place'
    await settled(el)
    expect(pieces(el, 'word')).toEqual(['Edited', 'in', 'place'])
  })

  it('numbers letters by grapheme, keeping Khmer letters whole', async () => {
    const el = await fixture<MoulTextEntrance>(
      html`<div lang="km">
        <moul-text-entrance by="chars">ស្រីស្អាត</moul-text-entrance>
      </div>`,
    )
    const entrance = el.querySelector('moul-text-entrance')!
    await entrance.updateComplete
    const chars = [
      ...base(entrance).querySelectorAll<HTMLElement>('[data-split="char"]'),
    ]
    expect(chars.map((c) => c.textContent).join('')).toBe('ស្រីស្អាត')
    expect(chars.length).toBeLessThan('ស្រីស្អាត'.length)
    expect(chars.map((c) => c.style.getPropertyValue('--char-index'))).toEqual(
      chars.map((_, index) => String(index)),
    )
  })

  it('stays hidden until it enters the viewport, then comes in once', async () => {
    const el = await fixture<MoulTextEntrance>(
      html`<moul-text-entrance>Hello there</moul-text-entrance>`,
    )
    expect(el.isRevealed).toBe(false)
    io.enter(el)
    await el.updateComplete
    expect(el.hasAttribute('is-revealed')).toBe(true)

    io.leave(el)
    await el.updateComplete
    expect(el.isRevealed).toBe(true)
  })

  it('hides again on leaving with is-repeating, and comes in on the next entry', async () => {
    const el = await fixture<MoulTextEntrance>(
      html`<moul-text-entrance is-repeating>Hello there</moul-text-entrance>`,
    )
    io.enter(el)
    await el.updateComplete
    io.leave(el)
    await el.updateComplete
    expect(el.isRevealed).toBe(false)
    io.enter(el)
    await el.updateComplete
    expect(el.isRevealed).toBe(true)

    io.leave(el)
    el.isRepeating = false
    await el.updateComplete
    expect(el.isRevealed).toBe(true)
  })

  it('reveals at once where IntersectionObserver is missing', async () => {
    io.restore()
    const original = globalThis.IntersectionObserver
    // @ts-expect-error: simulating a runtime without the API
    delete globalThis.IntersectionObserver
    try {
      const el = await fixture<MoulTextEntrance>(
        html`<moul-text-entrance>Hello</moul-text-entrance>`,
      )
      await el.updateComplete
      expect(el.isRevealed).toBe(true)
    } finally {
      globalThis.IntersectionObserver = original
    }
  })

  it('staggers by the split when stagger is unset', async () => {
    const el = await fixture<MoulTextEntrance>(
      html`<moul-text-entrance>Hello there</moul-text-entrance>`,
    )
    expect(el.style.getPropertyValue('--_stagger')).toBe('60ms')
    el.by = 'chars'
    await el.updateComplete
    expect(el.style.getPropertyValue('--_stagger')).toBe('25ms')
    el.by = 'lines'
    await el.updateComplete
    expect(el.style.getPropertyValue('--_stagger')).toBe('150ms')
    el.stagger = 90
    await el.updateComplete
    expect(el.style.getPropertyValue('--_stagger')).toBe('90ms')
    el.removeAttribute('stagger')
    el.stagger = null
    await el.updateComplete
    expect(el.style.getPropertyValue('--_stagger')).toBe('150ms')
  })

  it('writes its timing as CSS variables', async () => {
    const el = await fixture<MoulTextEntrance>(
      html`<moul-text-entrance duration="300" delay="120" stagger="-5"
        >Hi</moul-text-entrance
      >`,
    )
    expect(el.style.getPropertyValue('--_duration')).toBe('300ms')
    expect(el.style.getPropertyValue('--_delay')).toBe('120ms')
    expect(el.style.getPropertyValue('--_stagger')).toBe('0ms')
  })

  it('falls back to the defaults for an unknown effect or split', async () => {
    const el = await fixture<MoulTextEntrance>(
      html`<moul-text-entrance effect="wobble" by="sentences"
        >Hi there</moul-text-entrance
      >`,
    )
    await el.updateComplete
    expect(el.getAttribute('effect')).toBe('blur-up')
    expect(el.getAttribute('by')).toBe('words')
  })

  it('animates each piece from CSS, delayed by its index', () => {
    const css = textEntranceStyles.cssText
    expect(css).toContain('@keyframes moul-text-entrance-in')
    expect(css).toMatch(
      /var\(--_delay, 0ms\) \+ var\(--_index\) \* var\(--_stagger, 60ms\)/,
    )
    expect(css).toContain('--_index: var(--line-index, 0)')
  })

  it('replays with play(): hidden for a moment, then in again', async () => {
    const el = await fixture<MoulTextEntrance>(
      html`<moul-text-entrance>Hello there</moul-text-entrance>`,
    )
    io.enter(el)
    await el.updateComplete
    const before: Array<string | null> = []
    const observer = new MutationObserver((records) => {
      for (const record of records) before.push(record.oldValue)
    })
    observer.observe(el, {
      attributeFilter: ['is-revealed'],
      attributeOldValue: true,
    })
    void el.play()
    await el.updateComplete
    await settled(el)
    observer.disconnect()
    expect(before).toEqual(['', null])
    expect(el.isRevealed).toBe(true)
  })

  it('resolves play() once the last piece is in', async () => {
    const el = await fixture<MoulTextEntrance>(
      html`<moul-text-entrance delay="100" duration="500"
        >One two three</moul-text-entrance
      >`,
    )
    vi.useFakeTimers()
    let isDone = false
    const done = el.play().then(() => {
      isDone = true
    })
    // Delay, then two gaps of 60 ms before the third word, then its 500 ms.
    await vi.advanceTimersByTimeAsync(719)
    expect(isDone).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await done
    expect(isDone).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('times play() by lines when split by lines', async () => {
    const el = await fixture<MoulTextEntrance>(
      html`<moul-text-entrance by="lines">One two three</moul-text-entrance>`,
    )
    vi.useFakeTimers()
    let isDone = false
    void el.play().then(() => {
      isDone = true
    })
    // happy-dom has no layout, so every word sits on the one line.
    await vi.advanceTimersByTimeAsync(500)
    expect(isDone).toBe(true)
  })

  it('resolves a waiting play() and clears its timer on disconnect', async () => {
    const el = await fixture<MoulTextEntrance>(
      html`<moul-text-entrance>One two three</moul-text-entrance>`,
    )
    vi.useFakeTimers()
    const done = el.play()
    await vi.advanceTimersByTimeAsync(10)
    el.remove()
    await done
    expect(vi.getTimerCount()).toBe(0)

    // The light-DOM observer is gone too: edits while detached change nothing.
    vi.useRealTimers()
    el.textContent = 'Changed'
    await new Promise((resolve) => setTimeout(resolve))
    expect(el.currentText).toBe('One two three')
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role', async () => {
      const el = await fixture<MoulTextEntrance>(
        html`<moul-text-entrance>Hello there</moul-text-entrance>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.shadowRoot!.querySelector('[tabindex]')).toBeNull()
    })

    it('keeps one readable copy and hides the pieces', async () => {
      const el = await fixture<MoulTextEntrance>(
        html`<moul-text-entrance by="chars">Hello there</moul-text-entrance>`,
      )
      const readable = base(el).querySelector<HTMLElement>(
        '[data-split="readable"]',
      )!
      const visual = base(el).querySelector('[data-split="visual"]')!
      expect(readable.textContent).toBe('Hello there')
      expect(readable.closest('[aria-hidden]')).toBeNull()
      expect(readable.style.getPropertyValue('clip-path')).toBe('inset(50%)')
      expect(visual.getAttribute('aria-hidden')).toBe('true')
      expect(visual.querySelectorAll('[data-split="char"]').length).toBe(10)
    })
  })

  describe('reduced motion', () => {
    it('shows the whole text at once, with no animation', () => {
      const css = textEntranceStyles.cssText
      const block =
        /@media \(prefers-reduced-motion: reduce\), print \{([\s\S]*)\}\s*$/.exec(
          css,
        )?.[1]
      expect(block).toBeDefined()
      expect(block).toContain('opacity: 1 !important')
      expect(block).toContain('animation: none !important')
    })

    it('resolves play() at once', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulTextEntrance>(
        html`<moul-text-entrance>Hello there</moul-text-entrance>`,
      )
      vi.useFakeTimers()
      await el.play()
      expect(el.isRevealed).toBe(true)
      expect(vi.getTimerCount()).toBe(0)
    })

    it('resolves a running play() when reduced motion turns on', async () => {
      motion = mockReducedMotion(false)
      const el = await fixture<MoulTextEntrance>(
        html`<moul-text-entrance>Hello there</moul-text-entrance>`,
      )
      expect(motion.listenerCount()).toBe(1)
      vi.useFakeTimers()
      const done = el.play()
      await vi.advanceTimersByTimeAsync(10)
      motion.set(true)
      await done
      expect(vi.getTimerCount()).toBe(0)
      el.remove()
      expect(motion.listenerCount()).toBe(0)
    })
  })
})
