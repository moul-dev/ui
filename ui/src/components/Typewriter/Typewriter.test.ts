import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { splitGraphemes } from '../../controllers/text-split.controller'
import {
  type IntersectionMock,
  mockIntersectionObserver,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import './Typewriter'
import type { MoulTypewriter } from './Typewriter'
import { typewriterStyles } from './Typewriter.styles'

const typed = (el: MoulTypewriter) =>
  el.shadowRoot!.querySelector('[part="text"]')!.textContent ?? ''

const readable = (el: MoulTypewriter) =>
  el.shadowRoot!.querySelector('.readable')!.textContent

const cursor = (el: MoulTypewriter) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="cursor"]')

const allCss = typewriterStyles.map((sheet) => sheet.cssText).join('\n')

/** Runs the timers for `ms` and lets the element render what they changed. */
async function advance(el: MoulTypewriter, ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms)
  await el.updateComplete
}

/** Mounts the element, then takes over the clock and puts it on screen. */
async function mount(
  io: IntersectionMock,
  template: ReturnType<typeof html>,
): Promise<MoulTypewriter> {
  const el = await fixture<MoulTypewriter>(template)
  vi.useFakeTimers()
  io.enter(el)
  await el.updateComplete
  return el
}

describe('<moul-typewriter>', () => {
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

  it('waits for the viewport, then types the text inside it one letter at a time', async () => {
    const el = await fixture<MoulTypewriter>(
      html`<moul-typewriter>
        Ship it
      </moul-typewriter>`,
    )
    vi.useFakeTimers()
    await advance(el, 1000)
    expect(typed(el)).toBe('')

    io.enter(el)
    await advance(el, 0)
    expect(typed(el)).toBe('S')
    await advance(el, 60)
    expect(typed(el)).toBe('Sh')
    await advance(el, 59)
    expect(typed(el)).toBe('Sh')
    await advance(el, 1 + 60 * 4)
    expect(typed(el)).toBe('Ship it')
    // A run without is-looping stops on the full text: nothing is left to do.
    expect(vi.getTimerCount()).toBe(0)
    expect(cursor(el)!.classList.contains('is-done')).toBe(true)
  })

  it('prefers the text attribute and honours delay and typing-speed', async () => {
    const el = await mount(
      io,
      html`<moul-typewriter text="Hey" delay="200" typing-speed="100"
        >Fallback</moul-typewriter
      >`,
    )
    await advance(el, 199)
    expect(typed(el)).toBe('')
    await advance(el, 1)
    expect(typed(el)).toBe('H')
    await advance(el, 100)
    expect(typed(el)).toBe('He')
  })

  it('types whole grapheme clusters, so Khmer letters keep their marks', async () => {
    const text = 'ស្រីស្អាត'
    const clusters = splitGraphemes(text, 'km')
    expect(clusters.length).toBeLessThan(text.length)
    const host = await fixture<HTMLElement>(
      html`<div lang="km"><moul-typewriter>${text}</moul-typewriter></div>`,
    )
    const el = host.querySelector('moul-typewriter')!
    vi.useFakeTimers()
    io.enter(el)
    await advance(el, 0)
    expect(typed(el)).toBe(clusters[0])
    await advance(el, 60)
    expect(typed(el)).toBe(clusters[0] + clusters[1])
  })

  it('types each word, holds it, deletes it and types the next, stopping on the last', async () => {
    const el = await mount(
      io,
      html`<moul-typewriter
        words='["ab","cd"]'
        typing-speed="10"
        delete-speed="5"
        hold="100"
      ></moul-typewriter>`,
    )
    await advance(el, 10)
    expect(typed(el)).toBe('ab')
    // Holding: the word stays and the cursor blinks.
    await advance(el, 99)
    expect(typed(el)).toBe('ab')
    expect(cursor(el)!.className).toBe('')
    await advance(el, 1)
    await advance(el, 5)
    expect(typed(el)).toBe('a')
    expect(cursor(el)!.classList.contains('is-busy')).toBe(true)
    await advance(el, 5)
    expect(typed(el)).toBe('')
    await advance(el, 10)
    expect(typed(el)).toBe('c')
    await advance(el, 10)
    expect(typed(el)).toBe('cd')
    await advance(el, 5000)
    expect(typed(el)).toBe('cd')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('starts again from the first word with is-looping', async () => {
    const el = await mount(
      io,
      html`<moul-typewriter
        words='["ab","cd"]'
        typing-speed="10"
        delete-speed="10"
        hold="100"
        is-looping
      ></moul-typewriter>`,
    )
    // Type ab, hold, delete, type cd, hold, delete: 10 + 100 + 20 + 20 + 100 + 20.
    await advance(el, 270)
    expect(typed(el)).toBe('')
    await advance(el, 10)
    expect(typed(el)).toBe('a')
  })

  it('freezes while off screen and carries on when it returns', async () => {
    const el = await mount(io, html`<moul-typewriter>Hello</moul-typewriter>`)
    await advance(el, 60)
    expect(typed(el)).toBe('He')
    io.leave(el)
    await advance(el, 1000)
    expect(typed(el)).toBe('He')
    expect(vi.getTimerCount()).toBe(0)
    io.enter(el)
    await advance(el, 60)
    expect(typed(el)).toBe('Hel')
  })

  it('freezes while is-paused is set', async () => {
    const el = await mount(io, html`<moul-typewriter>Hello</moul-typewriter>`)
    await advance(el, 0)
    el.isPaused = true
    await advance(el, 1000)
    expect(typed(el)).toBe('H')
    expect(allCss).toMatch(
      /:host\(\[is-paused\]\) \[part="cursor"\] \{\s*animation: none/,
    )
    el.isPaused = false
    await advance(el, 60)
    expect(typed(el)).toBe('He')
  })

  it('restarts from the beginning with play(), resolving once the text is typed', async () => {
    const el = await mount(io, html`<moul-typewriter>Hi</moul-typewriter>`)
    await advance(el, 60)
    expect(typed(el)).toBe('Hi')

    let isDone = false
    const done = el.play().then(() => {
      isDone = true
    })
    await el.updateComplete
    expect(typed(el)).toBe('')
    await advance(el, 0)
    expect(typed(el)).toBe('H')
    expect(isDone).toBe(false)
    await advance(el, 60)
    await done
    expect(isDone).toBe(true)
  })

  it('types new text from the beginning when the text inside changes', async () => {
    // happy-dom reports DOM mutations on its own real timer, so this test keeps the real clock.
    const el = await fixture<MoulTypewriter>(
      html`<moul-typewriter typing-speed="5000">Hello</moul-typewriter>`,
    )
    io.enter(el)
    await vi.waitFor(() => expect(typed(el)).toBe('H'))
    el.textContent = 'Bye'
    await vi.waitFor(() => expect(readable(el)).toBe('Bye'))
    await vi.waitFor(() => expect(typed(el)).toBe('B'))
    el.remove()
  })

  it('stops its timer on disconnect and carries on when put back', async () => {
    const el = await mount(io, html`<moul-typewriter>Hello</moul-typewriter>`)
    const parent = el.parentElement!
    el.remove()
    expect(vi.getTimerCount()).toBe(0)
    parent.append(el)
    await advance(el, 60)
    expect(typed(el)).toBe('He')
  })

  it('shows no cursor with hide-cursor', async () => {
    const el = await mount(
      io,
      html`<moul-typewriter hide-cursor>Hi</moul-typewriter>`,
    )
    await advance(el, 0)
    expect(cursor(el)).toBeNull()
    expect(typed(el)).toBe('H')
  })

  it('keeps the cursor on the same line as the last typed letter', async () => {
    const el = await mount(io, html`<moul-typewriter>Hi you</moul-typewriter>`)
    await advance(el, 60 * 2)
    const tail = el.shadowRoot!.querySelector('.tail')!
    expect(tail.textContent).toBe(' ')
    expect(tail.lastElementChild?.getAttribute('part')).toBe('cursor')
    expect(allCss).toMatch(/\.tail \{\s*white-space: nowrap/)
  })

  it('blinks the cursor with steps() in currentColor, overridable', () => {
    expect(allCss).toContain('steps(1, end) infinite')
    expect(allCss).toContain('var(--typewriter-cursor-color, currentColor)')
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and hides the typed text and cursor', async () => {
      const el = await mount(io, html`<moul-typewriter>Hello</moul-typewriter>`)
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.shadowRoot!.querySelector('[tabindex]')).toBeNull()
      const text = el.shadowRoot!.querySelector('[part="text"]')!
      expect(text.getAttribute('aria-hidden')).toBe('true')
      expect(text.contains(cursor(el))).toBe(true)
      expect(el.shadowRoot!.querySelector('[aria-live]')).toBeNull()
    })

    it('holds the whole text in a readable copy that does not change while typing', async () => {
      const el = await mount(io, html`<moul-typewriter>Hello</moul-typewriter>`)
      expect(readable(el)).toBe('Hello')
      await advance(el, 60)
      expect(typed(el)).toBe('He')
      expect(readable(el)).toBe('Hello')
      expect(
        el.shadowRoot!.querySelector('.readable')!.closest('[aria-hidden]'),
      ).toBeNull()
    })

    it('reads every word, joined with commas', async () => {
      const el = await fixture<MoulTypewriter>(
        html`<moul-typewriter
          .words=${['fast', 'safe', 'small']}
        ></moul-typewriter>`,
      )
      expect(readable(el)).toBe('fast, safe, small')
    })
  })

  describe('reduced motion', () => {
    it('shows the text at once, with a cursor that does not blink', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulTypewriter>(
        html`<moul-typewriter>Hello there</moul-typewriter>`,
      )
      expect(typed(el)).toBe('Hello there')
      const block =
        /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\}\s*\}/.exec(
          allCss,
        )?.[1]
      expect(block).toContain('animation: none !important')
    })

    it('swaps whole words every hold, and still pauses', async () => {
      motion = mockReducedMotion(true)
      const el = await mount(
        io,
        html`<moul-typewriter
          words='["one","two","three"]'
          hold="1000"
        ></moul-typewriter>`,
      )
      await advance(el, 0)
      expect(typed(el)).toBe('one')
      await advance(el, 999)
      expect(typed(el)).toBe('one')
      await advance(el, 1)
      expect(typed(el)).toBe('two')
      el.isPaused = true
      await advance(el, 5000)
      expect(typed(el)).toBe('two')
      el.isPaused = false
      await advance(el, 1000)
      expect(typed(el)).toBe('three')
      expect(vi.getTimerCount()).toBe(0)
    })

    it('shows the whole word when reduced motion turns on mid-word', async () => {
      motion = mockReducedMotion(false)
      const el = await mount(io, html`<moul-typewriter>Hello</moul-typewriter>`)
      await advance(el, 0)
      expect(typed(el)).toBe('H')
      motion.set(true)
      await el.updateComplete
      expect(typed(el)).toBe('Hello')
      el.remove()
      expect(motion.listenerCount()).toBe(0)
    })
  })
})
