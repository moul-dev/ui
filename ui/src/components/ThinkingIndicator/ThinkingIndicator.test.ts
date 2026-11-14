import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import './ThinkingIndicator'
import type { MoulThinkingIndicator } from './ThinkingIndicator'

/** A 2D context that records what was drawn. */
function fakeContext() {
  const calls: string[] = []
  const record =
    (name: string) =>
    (..._args: unknown[]) =>
      calls.push(name)
  return {
    calls,
    context: {
      setTransform: record('setTransform'),
      clearRect: record('clearRect'),
      save: record('save'),
      restore: record('restore'),
      beginPath: record('beginPath'),
      arc: record('arc'),
      fill: record('fill'),
      fillStyle: '',
      globalAlpha: 1,
      shadowColor: '',
      shadowBlur: 0,
    },
  }
}

describe('<moul-thinking-indicator>', () => {
  let frames: ManualFrames
  let motion: ReducedMotionMock
  let drawn: ReturnType<typeof fakeContext>

  beforeEach(() => {
    frames = manualAnimationFrames()
    motion = mockReducedMotion(false)
    drawn = fakeContext()
    ;(HTMLCanvasElement.prototype as any).getContext = () => drawn.context
    HTMLCanvasElement.prototype.getBoundingClientRect = () =>
      ({ width: 28, height: 28, top: 0, left: 0 }) as DOMRect
  })

  afterEach(() => {
    frames.restore()
    motion.restore()
    delete (HTMLCanvasElement.prototype as any).getContext
    delete (HTMLCanvasElement.prototype as any).getBoundingClientRect
    vi.restoreAllMocks()
  })

  it('is a polite status that reads its label', async () => {
    const el = await fixture<MoulThinkingIndicator>(
      html`<moul-thinking-indicator></moul-thinking-indicator>`,
    )
    expect(el.getAttribute('role')).toBe('status')
    const label = el.shadowRoot?.querySelector('[part="label"]')
    expect(label?.textContent).toBe('Thinking')
    el.label = 'Searching records'
    await el.updateComplete
    expect(label?.textContent).toBe('Searching records')
  })

  it('keeps an author role and hides the orb from screen readers', async () => {
    const el = await fixture<MoulThinkingIndicator>(
      html`<moul-thinking-indicator role="presentation"></moul-thinking-indicator>`,
    )
    expect(el.getAttribute('role')).toBe('presentation')
    expect(
      el.shadowRoot?.querySelector('canvas')?.getAttribute('aria-hidden'),
    ).toBe('true')
  })

  it('keeps the label readable when hide-label hides it from sight', async () => {
    const el = await fixture<MoulThinkingIndicator>(
      html`<moul-thinking-indicator hide-label label="Working"></moul-thinking-indicator>`,
    )
    expect(el.hideLabel).toBe(true)
    expect(el.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe(
      'Working',
    )
  })

  it('falls back to md for an unknown size', async () => {
    const el = await fixture<MoulThinkingIndicator>(
      html`<moul-thinking-indicator size="huge"></moul-thinking-indicator>`,
    )
    expect(el.size).toBe('md')
  })

  it('draws the orb each frame while motion is allowed', async () => {
    await fixture<MoulThinkingIndicator>(
      html`<moul-thinking-indicator></moul-thinking-indicator>`,
    )
    expect(frames.pending).toBeGreaterThan(0)
    drawn.calls.length = 0
    frames.step(16)
    frames.step(32)
    expect(drawn.calls.filter((c) => c === 'clearRect').length).toBe(2)
    // One glow and one dot per particle each frame.
    expect(drawn.calls.filter((c) => c === 'arc').length).toBe(2 * (1 + 56))
  })

  describe('reduced motion', () => {
    it('draws one still orb and asks for no frames', async () => {
      motion.set(true)
      await fixture<MoulThinkingIndicator>(
        html`<moul-thinking-indicator></moul-thinking-indicator>`,
      )
      expect(frames.pending).toBe(0)
      expect(drawn.calls.filter((c) => c === 'clearRect').length).toBe(1)
    })
  })
})
