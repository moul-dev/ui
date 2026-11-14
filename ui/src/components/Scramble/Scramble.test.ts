import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { splitGraphemes } from '../../controllers/text-split.controller'
import {
  type IntersectionMock,
  type ManualFrames,
  manualAnimationFrames,
  mockIntersectionObserver,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import './Scramble'
import type { MoulScramble } from './Scramble'
import { scrambleStyles } from './Scramble.styles'

const chars = (el: MoulScramble) => [
  ...el.shadowRoot!.querySelectorAll<HTMLElement>('.char'),
]

/** The final letters, and which of them still show a random glyph. */
const scrambling = (el: MoulScramble) =>
  chars(el).map((char) => char.hasAttribute('data-glyph'))

const glyphs = (el: MoulScramble) =>
  chars(el).map((char) => char.dataset.glyph ?? null)

const visible = (el: MoulScramble) =>
  el.shadowRoot!.querySelector('[part="text"]')!.textContent

const readable = (el: MoulScramble) =>
  el.shadowRoot!.querySelector('.readable')!.textContent

const allCss = scrambleStyles.map((sheet) => sheet.cssText).join('\n')

describe('<moul-scramble>', () => {
  let io: IntersectionMock
  let frames: ManualFrames
  let motion: ReducedMotionMock | null = null

  beforeEach(() => {
    io = mockIntersectionObserver()
    frames = manualAnimationFrames()
  })

  afterEach(() => {
    io.restore()
    frames.restore()
    motion?.restore()
    motion = null
    vi.restoreAllMocks()
  })

  /** Runs one frame at `time` and lets the element render it. */
  async function frame(el: MoulScramble, time: number): Promise<void> {
    frames.step(time)
    await el.updateComplete
  }

  it('renders the text inside it as letters, with plain spaces between words', async () => {
    const el = await fixture<MoulScramble>(
      html`<moul-scramble trigger="manual">
        Hi  you
      </moul-scramble>`,
    )
    expect(el.currentText).toBe('Hi you')
    expect(chars(el).map((char) => char.textContent)).toEqual([
      'H',
      'i',
      'y',
      'o',
      'u',
    ])
    // Spaces are text, never letters, so they never scramble.
    expect(visible(el)).toBe('Hi you')
    expect(scrambling(el)).toEqual([false, false, false, false, false])
  })

  it('shows noise until it enters the viewport, then resolves from start to end', async () => {
    const el = await fixture<MoulScramble>(
      html`<moul-scramble duration="800">abcd</moul-scramble>`,
    )
    expect(scrambling(el)).toEqual([true, true, true, true])
    expect(frames.pending).toBe(0)

    io.enter(el)
    // Letter i resolves at (i + 1) / 4 of 800 ms.
    await frame(el, 1000)
    await frame(el, 1100)
    expect(scrambling(el)).toEqual([true, true, true, true])
    await frame(el, 1200)
    expect(scrambling(el)).toEqual([false, true, true, true])
    await frame(el, 1300)
    expect(scrambling(el)).toEqual([false, true, true, true])
    await frame(el, 1400)
    expect(scrambling(el)).toEqual([false, false, true, true])
    await frame(el, 1500)
    await frame(el, 1600)
    expect(scrambling(el)).toEqual([false, false, false, true])
    await frame(el, 1700)
    await frame(el, 1800)
    expect(scrambling(el)).toEqual([false, false, false, false])
    // Done: the loop stops.
    expect(frames.pending).toBe(0)

    // Plays once: leaving and entering again changes nothing.
    io.leave(el)
    io.enter(el)
    expect(frames.pending).toBe(0)
  })

  it('changes glyphs every 50 ms or so, not every frame', async () => {
    let seed = 0
    vi.spyOn(Math, 'random').mockImplementation(() => {
      seed = (seed + 0.37) % 1
      return seed
    })
    const el = await fixture<MoulScramble>(
      html`<moul-scramble trigger="manual" duration="10000">abc</moul-scramble>`,
    )
    io.enter(el)
    void el.play()
    await el.updateComplete
    const first = glyphs(el)
    expect(first.every((glyph) => glyph !== null)).toBe(true)
    await frame(el, 0)
    for (const time of [16, 32, 48]) await frame(el, time)
    expect(glyphs(el)).toEqual(first)
    await frame(el, 64)
    expect(glyphs(el)).not.toEqual(first)
  })

  it('scrambles through the given charset only', async () => {
    const el = await fixture<MoulScramble>(
      html`<moul-scramble trigger="manual" charset="#%">abcdef</moul-scramble>`,
    )
    io.enter(el)
    void el.play()
    await el.updateComplete
    for (const glyph of glyphs(el)) expect(['#', '%']).toContain(glyph)
  })

  it('resolves play() once every letter is final, and restarts on a second play()', async () => {
    const el = await fixture<MoulScramble>(
      html`<moul-scramble trigger="manual" duration="200">ab</moul-scramble>`,
    )
    io.enter(el)
    let isDone = false
    const done = el.play().then(() => {
      isDone = true
    })
    await frame(el, 0)
    await frame(el, 100)
    expect(scrambling(el)).toEqual([false, true])
    void el.play()
    await el.updateComplete
    expect(scrambling(el)).toEqual([true, true])
    await frame(el, 200)
    await frame(el, 300)
    await frame(el, 400)
    await done
    expect(isDone).toBe(true)
    expect(scrambling(el)).toEqual([false, false])
  })

  it('stops while off screen and carries on where it was', async () => {
    const el = await fixture<MoulScramble>(
      html`<moul-scramble duration="400">abcd</moul-scramble>`,
    )
    io.enter(el)
    await frame(el, 0)
    await frame(el, 100)
    expect(scrambling(el)).toEqual([false, true, true, true])
    io.leave(el)
    expect(frames.pending).toBe(0)
    io.enter(el)
    // The first frame back counts from itself, not from when it left.
    await frame(el, 5000)
    expect(scrambling(el)).toEqual([false, true, true, true])
    await frame(el, 5100)
    expect(scrambling(el)).toEqual([false, false, true, true])
  })

  it('plays on pointerenter and on focus inside with trigger="hover"', async () => {
    const el = await fixture<MoulScramble>(
      html`<moul-scramble trigger="hover">ab</moul-scramble>`,
    )
    io.enter(el)
    await el.updateComplete
    expect(scrambling(el)).toEqual([false, false])
    expect(frames.pending).toBe(0)

    el.dispatchEvent(new Event('pointerenter'))
    await el.updateComplete
    expect(scrambling(el)).toEqual([true, true])
    for (const time of [0, 100, 200, 300, 400, 500, 600, 700, 800]) {
      await frame(el, time)
    }
    expect(scrambling(el)).toEqual([false, false])

    el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await el.updateComplete
    expect(scrambling(el)).toEqual([true, true])
  })

  it('waits for play() with trigger="manual"', async () => {
    const el = await fixture<MoulScramble>(
      html`<moul-scramble trigger="manual">ab</moul-scramble>`,
    )
    io.enter(el)
    el.dispatchEvent(new Event('pointerenter'))
    await el.updateComplete
    expect(scrambling(el)).toEqual([false, false])
    expect(frames.pending).toBe(0)
  })

  it('falls back to view for an unknown trigger', async () => {
    const el = await fixture<MoulScramble>(
      html`<moul-scramble trigger="click">ab</moul-scramble>`,
    )
    expect(el.getAttribute('trigger')).toBe('view')
  })

  it('resolves to new text when the text inside changes', async () => {
    const el = await fixture<MoulScramble>(
      html`<moul-scramble trigger="manual">Old</moul-scramble>`,
    )
    el.textContent = 'New text'
    await new Promise((resolve) => setTimeout(resolve))
    await el.updateComplete
    expect(readable(el)).toBe('New text')
    expect(visible(el)).toBe('New text')
    expect(scrambling(el).every((isScrambling) => !isScrambling)).toBe(true)
  })

  it('keeps Khmer letters whole', async () => {
    const text = 'ស្រីស្អាត'
    // The language can sit on the element itself or on any ancestor.
    const el = await fixture<MoulScramble>(
      html`<moul-scramble lang="km" trigger="manual">${text}</moul-scramble>`,
    )
    expect(chars(el).map((char) => char.textContent)).toEqual(
      splitGraphemes(text, 'km'),
    )
  })

  it('stops the loop, shows the final text and resolves play() on disconnect', async () => {
    const el = await fixture<MoulScramble>(
      html`<moul-scramble trigger="hover">abc</moul-scramble>`,
    )
    io.enter(el)
    const done = el.play()
    await frame(el, 0)
    expect(frames.pending).toBe(1)
    el.remove()
    await done
    expect(frames.pending).toBe(0)
    await el.updateComplete
    expect(scrambling(el)).toEqual([false, false, false])
    // Its listeners are gone too.
    el.dispatchEvent(new Event('pointerenter'))
    expect(frames.pending).toBe(0)
  })

  it('keeps each letter the width of its final glyph', () => {
    expect(allCss).toMatch(/\.char\[data-glyph\] \{\s*visibility: hidden/)
    expect(allCss).toContain('content: attr(data-glyph)')
    expect(allCss).toMatch(/::after \{[^}]*position: absolute/)
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and reads only the final text', async () => {
      const el = await fixture<MoulScramble>(
        html`<moul-scramble>Hello there</moul-scramble>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.shadowRoot!.querySelector('[tabindex]')).toBeNull()
      // Noise before it enters the viewport, but the readable copy is final.
      expect(scrambling(el).every(Boolean)).toBe(true)
      expect(readable(el)).toBe('Hello there')
      expect(
        el.shadowRoot!.querySelector('.readable')!.closest('[aria-hidden]'),
      ).toBeNull()
      expect(
        el
          .shadowRoot!.querySelector('[part="text"]')!
          .getAttribute('aria-hidden'),
      ).toBe('true')
    })
  })

  describe('reduced motion', () => {
    it('shows the final text at once and resolves play() at once', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulScramble>(
        html`<moul-scramble>abc</moul-scramble>`,
      )
      expect(scrambling(el)).toEqual([false, false, false])
      io.enter(el)
      await el.play()
      await el.updateComplete
      expect(scrambling(el)).toEqual([false, false, false])
      expect(frames.pending).toBe(0)
      expect(allCss).toMatch(
        /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*content: none/,
      )
    })

    it('shows the final text when reduced motion turns on mid-scramble', async () => {
      motion = mockReducedMotion(false)
      const el = await fixture<MoulScramble>(
        html`<moul-scramble trigger="manual">abc</moul-scramble>`,
      )
      io.enter(el)
      const done = el.play()
      await frame(el, 0)
      motion.set(true)
      await done
      await el.updateComplete
      expect(scrambling(el)).toEqual([false, false, false])
      expect(frames.pending).toBe(0)
      el.remove()
      expect(motion.listenerCount()).toBe(0)
    })
  })
})
