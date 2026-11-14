import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './ScrollFrame'
import { findScrollRoot } from '../../utils/scroll-root'
import type { MoulScrollFrame } from './ScrollFrame'
import { scrollFrameStyles } from './ScrollFrame.styles'

/** Lets slotchange events and the renders they cause run. */
const settle = () => new Promise((resolve) => setTimeout(resolve))

const part = (el: MoulScrollFrame, name: string) =>
  el.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`) as HTMLElement

const progressOf = (el: MoulScrollFrame) =>
  part(el, 'base').style.getPropertyValue('--_scroll-frame-progress')

/** Puts the base `top` pixels below the top of an 800px viewport, 400px tall. */
function placeBase(el: MoulScrollFrame, top: number): void {
  part(el, 'base').getBoundingClientRect = () =>
    ({
      left: 0,
      top,
      width: 600,
      height: 400,
      right: 600,
      bottom: top + 400,
      x: 0,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect
}

function stubSupports(answer: (query: string) => boolean): void {
  vi.stubGlobal('CSS', { supports: answer })
}

/** Scrolls the page and lets the fallback's frame run. */
async function scrollPage(): Promise<void> {
  window.dispatchEvent(new Event('scroll'))
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
}

describe('<moul-scroll-frame>', () => {
  let motion: ReducedMotionMock

  beforeEach(() => {
    motion = mockReducedMotion(false)
    // happy-dom says yes to every CSS.supports query, and its CSS object
    // cannot be spied on; most tests want the fallback.
    stubSupports(() => false)
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
    })
  })

  afterEach(() => {
    motion.restore()
    vi.unstubAllGlobals()
  })

  async function frame(
    markup = html`<moul-scroll-frame>
      <h2 slot="header">Your whole stack, one screen</h2>
      <div class="screen">Dashboard</div>
    </moul-scroll-frame>`,
  ) {
    const el = await fixture<MoulScrollFrame>(markup)
    await settle()
    return el
  }

  it('renders a header and a frame around the content, with sensible defaults', async () => {
    const el = await frame()
    expect(customElements.get('moul-scroll-frame')).toBeDefined()
    expect(
      part(el, 'header').querySelector('slot[name="header"]'),
    ).not.toBeNull()
    expect(part(el, 'frame').querySelector('slot:not([name])')).not.toBeNull()
    expect(el.tilt).toBe(20)
    expect(
      part(el, 'base').style.getPropertyValue('--_scroll-frame-tilt'),
    ).toBe('20')
  })

  it('shows the header wrapper only when the header slot has content', async () => {
    const withHeader = await frame()
    expect(part(withHeader, 'base').classList.contains('has-header')).toBe(true)
    const without = await frame(
      html`<moul-scroll-frame><div>Screen</div></moul-scroll-frame>`,
    )
    expect(part(without, 'base').classList.contains('has-header')).toBe(false)
  })

  it('keeps tilt within 0 to 60 degrees and falls back on bad numbers', async () => {
    const el = await frame(
      html`<moul-scroll-frame tilt="90"></moul-scroll-frame>`,
    )
    expect(el.tilt).toBe(60)
    el.tilt = Number.NaN
    await el.updateComplete
    expect(el.tilt).toBe(20)
  })

  it('lies flat as it scrolls in, by script where there is no view timeline', async () => {
    const el = await frame()
    expect(el.isNative).toBe(false)
    // Its top edge just inside the bottom of the viewport: the start.
    placeBase(el, 790)
    await scrollPage()
    expect(Number(progressOf(el))).toBeCloseTo(10 / 1200, 3)
    // Its middle at the middle of the viewport: half way, so flat.
    placeBase(el, 200)
    await scrollPage()
    expect(Number(progressOf(el))).toBeCloseTo(0.5, 3)
    const css = scrollFrameStyles.cssText
    expect(css).toContain('min(1, var(--_scroll-frame-progress, 1) * 2)')
  })

  it('runs no script where the browser has view timelines', async () => {
    stubSupports((query) => query === 'animation-timeline: view()')
    const el = await frame()
    expect(el.isNative).toBe(true)
    placeBase(el, 200)
    await scrollPage()
    expect(progressOf(el)).toBe('')
    const css = scrollFrameStyles.cssText
    expect(css).toContain('animation-timeline: --_scroll-frame')
    expect(css).toContain('animation-range: cover 0% cover 50%')
  })

  it('follows the nearest scroll container, as a CSS view timeline does', async () => {
    const box = await fixture<HTMLDivElement>(
      html`<div style="height: 10rem; overflow-y: auto">
        <section><moul-scroll-frame><div>Screen</div></moul-scroll-frame></section>
      </div>`,
    )
    const el = box.querySelector('moul-scroll-frame') as MoulScrollFrame
    expect(findScrollRoot(el)).toBe(box)
    const onPage = await frame()
    expect(findScrollRoot(onPage)).toBeNull()
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role; the header and content read in order', async () => {
      const el = await frame(
        html`<moul-scroll-frame>
          <h2 slot="header">Plan the trip</h2>
          <a href="#app">Open the app</a>
        </moul-scroll-frame>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.getAttribute('role')).toBeNull()
      const link = el.querySelector('a') as HTMLAnchorElement
      link.focus()
      expect(document.activeElement).toBe(link)
      expect(el.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        'Plan the trip Open the app',
      )
    })
  })

  describe('reduced motion', () => {
    it('is flat from the start and follows no scroll when the user asks for reduced motion', async () => {
      motion.set(true)
      const el = await frame()
      placeBase(el, 790)
      await scrollPage()
      expect(progressOf(el)).toBe('')
    })

    it('stops following the scroll, and lies flat, when the setting turns on', async () => {
      const el = await frame()
      placeBase(el, 790)
      await scrollPage()
      expect(progressOf(el)).not.toBe('')
      motion.set(true)
      expect(progressOf(el)).toBe('')
      motion.set(false)
      await scrollPage()
      expect(progressOf(el)).not.toBe('')
    })

    it('has a stylesheet branch that drops the animations and transforms', () => {
      const css = scrollFrameStyles.cssText
      const block = css.slice(css.indexOf('@media (prefers-reduced-motion'))
      expect(block).toContain('animation: none')
      expect(block).toContain('transform: none')
      expect(block).toContain('translate: none')
    })
  })
})
