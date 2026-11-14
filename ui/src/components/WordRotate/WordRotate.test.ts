import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
  mockReducedMotion,
} from '../../test-setup'
import './WordRotate'
import type { MoulWordRotate, WordRotateChangeDetail } from './WordRotate'
import { wordRotateStyles } from './WordRotate.styles'

const WORDS = ['fast', 'secure', 'yours']

const shadow = (el: MoulWordRotate) => el.shadowRoot!

const shownWords = (el: MoulWordRotate) =>
  [...shadow(el).querySelectorAll<HTMLElement>('[part="word"]')].map(
    (word) => `${word.dataset.state}:${word.textContent}`,
  )

const windowOf = (el: MoulWordRotate) =>
  shadow(el).querySelector<HTMLElement>('.window')!

/** Renders an element with the default list, on screen, with fake timers running. */
async function rotating(
  template = html`<moul-word-rotate
    .words=${WORDS}
    interval="1000"
    duration="300"
  >fast</moul-word-rotate>`,
  io?: IntersectionMock,
): Promise<MoulWordRotate> {
  const el = await fixture<MoulWordRotate>(template)
  io?.enter(el)
  await el.updateComplete
  return el
}

/** Lets the timers run for `ms`, then waits for the element to render. */
async function wait(el: MoulWordRotate, ms: number): Promise<void> {
  vi.advanceTimersByTime(ms)
  await el.updateComplete
}

describe('<moul-word-rotate>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    vi.useFakeTimers()
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
    vi.useRealTimers()
  })

  it('shows the first word in a box, in place of the slotted text', async () => {
    const el = await rotating(undefined, io)
    expect(shadow(el).querySelector('slot')).toBeNull()
    expect(shadow(el).querySelector('[part="base"]')).not.toBeNull()
    expect(shownWords(el)).toEqual(['rest:fast'])
    expect(el.index).toBe(0)
    expect(el.effect).toBe('slide')
    expect(el.getAttribute('effect')).toBe('slide')
    expect(el.style.getPropertyValue('--_duration')).toBe('300ms')
  })

  it('reads its words from a JSON attribute', async () => {
    const el = await fixture<MoulWordRotate>(
      html`<moul-word-rotate words='["one", "two"]'>one</moul-word-rotate>`,
    )
    expect(el.words).toEqual(['one', 'two'])
    expect(shownWords(el)).toEqual(['rest:one'])
  })

  it('shows the slotted text and does nothing else while words is empty', async () => {
    const el = await fixture<MoulWordRotate>(
      html`<moul-word-rotate interval="1000">fast</moul-word-rotate>`,
    )
    io.enter(el)
    await el.updateComplete
    expect(shadow(el).querySelector('slot')).not.toBeNull()
    expect(shadow(el).querySelector('[part="base"]')).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not start until it is on screen', async () => {
    const el = await rotating()
    await wait(el, 5000)
    expect(el.index).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('moves to the next word every interval, wraps around, and fires wordchange', async () => {
    const el = await rotating(undefined, io)
    const changes: WordRotateChangeDetail[] = []
    el.addEventListener('wordchange', (event) =>
      changes.push((event as CustomEvent<WordRotateChangeDetail>).detail),
    )

    await wait(el, 999)
    expect(el.index).toBe(0)
    await wait(el, 1)
    expect(el.index).toBe(1)
    await wait(el, 1000)
    await wait(el, 1000)
    expect(el.index).toBe(0)
    expect(changes).toEqual([
      { index: 1, word: 'secure' },
      { index: 2, word: 'yours' },
      { index: 0, word: 'fast' },
    ])
  })

  it('fires wordchange as a bubbling, composed event', async () => {
    const el = await rotating(undefined, io)
    const listener = vi.fn()
    document.addEventListener('wordchange', listener)
    try {
      await wait(el, 1000)
      expect(listener).toHaveBeenCalledTimes(1)
    } finally {
      document.removeEventListener('wordchange', listener)
    }
  })

  it('shows the leaving and arriving words during a change, then only the new one', async () => {
    const el = await rotating(undefined, io)
    await wait(el, 1000)
    expect(shownWords(el)).toEqual(['enter:secure', 'leave:fast'])
    expect(windowOf(el).hasAttribute('data-changing')).toBe(true)

    await wait(el, 300)
    expect(shownWords(el)).toEqual(['rest:secure'])
    expect(windowOf(el).hasAttribute('data-changing')).toBe(false)
  })

  it('glides the box from the old word’s width to the new word’s', async () => {
    const original = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth',
    )
    // happy-dom has no layout: make each element 10px per character.
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return (this.textContent?.length ?? 0) * 10
      },
    })
    try {
      const el = await rotating(undefined, io)
      const style = windowOf(el).style
      const setProperty = vi.spyOn(style, 'setProperty')

      await wait(el, 1000)
      // Pinned at "fast" (40px), then left at "secure" (60px) for the transition.
      expect(setProperty.mock.calls).toEqual([
        ['width', '40px'],
        ['width', '60px'],
      ])
      expect(style.width).toBe('60px')

      await wait(el, 300)
      expect(style.width).toBe('')
    } finally {
      if (original) {
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', original)
      }
    }
  })

  it('jumps to a word when index is set, gives it a full interval, and fires nothing', async () => {
    const el = await rotating(undefined, io)
    const listener = vi.fn()
    el.addEventListener('wordchange', listener)

    await wait(el, 600)
    el.index = 2
    await el.updateComplete
    expect(shownWords(el)).toEqual(['enter:yours', 'leave:fast'])

    await wait(el, 999)
    expect(el.index).toBe(2)
    expect(listener).not.toHaveBeenCalled()
    await wait(el, 1)
    expect(el.index).toBe(0)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('wraps an index outside the list', async () => {
    const el = await rotating(undefined, io)
    el.index = 4
    await el.updateComplete
    expect(el.index).toBe(1)
    el.index = -1
    await el.updateComplete
    expect(el.index).toBe(2)
  })

  it('shows a new list at once, keeping the index when it still fits', async () => {
    const el = await rotating(undefined, io)
    el.index = 2
    await el.updateComplete
    el.words = ['alpha', 'beta']
    await el.updateComplete
    expect(el.index).toBe(0)
    expect(shownWords(el)).toEqual(['rest:alpha'])
    expect(shadow(el).querySelector('.readable')?.textContent).toBe(
      'alpha, beta',
    )
  })

  it('falls back to slide for an unknown effect', async () => {
    const el = await fixture<MoulWordRotate>(
      html`<moul-word-rotate effect="spin" .words=${WORDS}></moul-word-rotate>`,
    )
    await el.updateComplete
    expect(el.effect).toBe('slide')
    expect(el.getAttribute('effect')).toBe('slide')
  })

  it('has keyframes for every effect', () => {
    const css = wordRotateStyles.cssText
    for (const effect of ['slide', 'fade', 'blur', 'flip']) {
      expect(css).toContain(`@keyframes moul-word-rotate-${effect}-in`)
      expect(css).toContain(`@keyframes moul-word-rotate-${effect}-out`)
    }
  })

  describe('pausing', () => {
    it('pauses while the pointer is over it', async () => {
      const el = await rotating(undefined, io)
      await wait(el, 500)
      el.dispatchEvent(new PointerEvent('pointerenter'))
      await wait(el, 5000)
      expect(el.index).toBe(0)

      el.dispatchEvent(new PointerEvent('pointerleave'))
      await wait(el, 1000)
      expect(el.index).toBe(1)
    })

    it('pauses while focus is inside it', async () => {
      const el = await rotating(undefined, io)
      el.dispatchEvent(new FocusEvent('focusin'))
      await wait(el, 5000)
      expect(el.index).toBe(0)

      el.dispatchEvent(new FocusEvent('focusout', { relatedTarget: null }))
      await wait(el, 1000)
      expect(el.index).toBe(1)
    })

    it('pauses while off screen', async () => {
      const el = await rotating(undefined, io)
      io.leave(el)
      await wait(el, 5000)
      expect(el.index).toBe(0)
      expect(vi.getTimerCount()).toBe(0)

      io.enter(el)
      await wait(el, 1000)
      expect(el.index).toBe(1)
    })

    it('pauses while is-paused is set', async () => {
      const el = await rotating(undefined, io)
      el.isPaused = true
      await el.updateComplete
      expect(el.hasAttribute('is-paused')).toBe(true)
      await wait(el, 5000)
      expect(el.index).toBe(0)

      el.removeAttribute('is-paused')
      await el.updateComplete
      await wait(el, 1000)
      expect(el.index).toBe(1)
    })
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable', async () => {
      const el = await rotating(undefined, io)
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(shadow(el).querySelector('[tabindex]')).toBeNull()
    })

    it('hides the moving words and reads every word once, joined with commas', async () => {
      const el = await rotating(undefined, io)
      const base = shadow(el).querySelector('[part="base"]')!
      const readable = shadow(el).querySelector('.readable')!
      expect(base.getAttribute('aria-hidden')).toBe('true')
      expect(readable.closest('[aria-hidden]')).toBeNull()
      expect(readable.textContent).toBe('fast, secure, yours')
    })

    it('keeps the readable copy still, so nothing is announced on each change', async () => {
      const el = await rotating(undefined, io)
      const readable = shadow(el).querySelector('.readable')!
      expect(readable.hasAttribute('aria-live')).toBe(false)
      expect(readable.hasAttribute('role')).toBe(false)
      await wait(el, 1000)
      expect(shadow(el).querySelector('.readable')).toBe(readable)
      expect(readable.textContent).toBe('fast, secure, yours')
    })

    it('reads as one sentence with the text around it', async () => {
      const host = await fixture<HTMLParagraphElement>(
        html`<p>Ship <moul-word-rotate .words=${WORDS}>fast</moul-word-rotate> today</p>`,
      )
      const el = host.querySelector('moul-word-rotate')!
      await el.updateComplete
      const spoken = [...host.childNodes]
        .map((node) =>
          node === el
            ? shadow(el).querySelector('.readable')!.textContent
            : node.textContent,
        )
        .join('')
      expect(spoken).toBe('Ship fast, secure, yours today')
    })
  })

  describe('reduced motion', () => {
    it('still changes words, but swaps each in place with no width glide', async () => {
      const motion = mockReducedMotion(true)
      try {
        const el = await rotating(undefined, io)
        const listener = vi.fn()
        el.addEventListener('wordchange', listener)
        await wait(el, 1000)
        expect(el.index).toBe(1)
        expect(shownWords(el)).toEqual(['rest:secure'])
        expect(windowOf(el).hasAttribute('data-changing')).toBe(false)
        expect(windowOf(el).style.width).toBe('')
        expect(listener).toHaveBeenCalledTimes(1)
      } finally {
        motion.restore()
      }
    })

    it('turns off every animation and transition in the stylesheet', () => {
      const block =
        /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*)\}\s*$/.exec(
          wordRotateStyles.cssText,
        )?.[1]
      expect(block).toBeDefined()
      expect(block).toContain('transition: none !important')
      expect(block).toContain('animation: none !important')
    })
  })

  describe('cleanup', () => {
    it('stops its timers and stops watching the viewport when removed', async () => {
      const el = await rotating(undefined, io)
      await wait(el, 1000)
      expect(vi.getTimerCount()).toBeGreaterThan(0)
      expect(io.targets).toContain(el)

      el.remove()
      await el.updateComplete
      expect(vi.getTimerCount()).toBe(0)
      expect(io.targets).not.toContain(el)
    })

    it('finishes a change cut short by a move, and starts again when put back', async () => {
      const el = await rotating(undefined, io)
      const parent = el.parentElement!
      await wait(el, 1000)
      expect(shownWords(el)).toEqual(['enter:secure', 'leave:fast'])

      el.remove()
      parent.append(el)
      io.enter(el)
      await el.updateComplete
      expect(shownWords(el)).toEqual(['rest:secure'])
      await wait(el, 1000)
      expect(el.index).toBe(2)
    })
  })
})
