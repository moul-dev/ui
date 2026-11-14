import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
} from '../../test-setup'
import './index'
import { type MoulTracingBeam, tracingBeamProgress } from './TracingBeam'
import { tracingBeamStyles } from './TracingBeam.styles'

const css = tracingBeamStyles.cssText.replace(/\/\*[\s\S]*?\*\//g, '')

const part = (el: MoulTracingBeam, name: string) =>
  el.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`) ?? null

const progress = (el: HTMLElement) =>
  el.style.getPropertyValue('--_tracing-beam-progress')

/** Places `el` on screen: its top at `top`, `height` tall. */
function place(el: Element, top: number, height: number): void {
  el.getBoundingClientRect = () =>
    ({
      top,
      bottom: top + height,
      left: 0,
      right: 600,
      width: 600,
      height,
      x: 0,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect
}

/**
 * happy-dom hands out a new \`CSS\` object on every read, so a spy on one never
 * sees the element's call: replace the global instead.
 */
function stubSupports(isSupported: boolean) {
  const supports = vi.fn(() => isSupported)
  vi.stubGlobal('CSS', { supports })
  return supports
}

function scrollPage(): void {
  window.dispatchEvent(new Event('scroll'))
}

async function beam() {
  return fixture<MoulTracingBeam>(html`<moul-tracing-beam>
    <h2>Four days in Mondulkiri</h2>
    <p>Bou Sra falls, the forest and the elephants.</p>
    <a href="#map">Map</a>
  </moul-tracing-beam>`)
}

describe('tracingBeamProgress', () => {
  const port = { top: 0, bottom: 600 }

  it('starts when a long article reaches the start line and ends when its bottom is in view', () => {
    // 3000px tall, the line halfway down a 600px view.
    expect(tracingBeamProgress({ top: 400, bottom: 3400 }, port, 300)).toBe(0)
    expect(tracingBeamProgress({ top: 300, bottom: 3300 }, port, 300)).toBe(0)
    expect(
      tracingBeamProgress({ top: 0, bottom: 3000 }, port, 300),
    ).toBeCloseTo(300 / 2700)
    expect(tracingBeamProgress({ top: -2400, bottom: 600 }, port, 300)).toBe(1)
    expect(tracingBeamProgress({ top: -2600, bottom: 400 }, port, 300)).toBe(1)
  })

  it('runs a short article from fully in view to its top at the line', () => {
    // 200px tall: fully in view once its bottom is at 600, top at 400.
    expect(tracingBeamProgress({ top: 450, bottom: 650 }, port, 300)).toBe(0)
    expect(tracingBeamProgress({ top: 400, bottom: 600 }, port, 300)).toBe(0)
    expect(tracingBeamProgress({ top: 350, bottom: 550 }, port, 300)).toBe(0.5)
    expect(tracingBeamProgress({ top: 300, bottom: 500 }, port, 300)).toBe(1)
  })

  it('measures from the top of a scroll container, not of the page', () => {
    const panel = { top: 100, bottom: 500 }
    // The line is 200px into the 400px panel, at 300 on screen.
    expect(tracingBeamProgress({ top: 300, bottom: 1300 }, panel, 200)).toBe(0)
    expect(
      tracingBeamProgress({ top: 0, bottom: 1000 }, panel, 200),
    ).toBeCloseTo(300 / 800)
  })

  it('jumps from empty to full when the range has no length', () => {
    expect(tracingBeamProgress({ top: 301, bottom: 601 }, port, 300)).toBe(0)
    expect(tracingBeamProgress({ top: 300, bottom: 600 }, port, 300)).toBe(1)
  })
})

describe('<moul-tracing-beam>', () => {
  afterEach(() => {
    fixtureCleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('wraps the article after a gutter that holds the line and the dot', async () => {
    const el = await beam()
    const rail = part(el, 'rail')
    expect(rail).not.toBeNull()
    expect(part(el, 'track')?.parentElement).toBe(rail)
    expect(part(el, 'beam')?.parentElement).toBe(part(el, 'track'))
    expect(part(el, 'head')?.parentElement).toBe(part(el, 'beam'))
    expect(part(el, 'dot')?.querySelector('[part="dot-light"]')).not.toBeNull()
    const slot = part(el, 'content')?.querySelector('slot')
    expect(slot?.assignedElements().map((node) => node.localName)).toEqual([
      'h2',
      'p',
      'a',
    ])
  })

  it('mirrors the gutter in right-to-left text with logical properties', () => {
    expect(css).toMatch(/:host\s*\{[^}]*padding-inline-start:/)
    expect(css).toMatch(/\.rail\s*\{[^}]*inset-inline-start:\s*0/)
    expect(css).not.toMatch(/\.rail\s*\{[^}]*\bleft:/)
  })

  it('follows the scroll with a native view timeline where CSS has one, and adds no listener', async () => {
    const supports = stubSupports(true)
    const frames = manualAnimationFrames()
    const listen = vi.spyOn(window, 'addEventListener')
    try {
      const el = await beam()
      expect(supports).toHaveBeenCalledWith('animation-timeline: view()')
      expect(listen.mock.calls.some(([type]) => type === 'scroll')).toBe(false)
      scrollPage()
      expect(frames.pending).toBe(0)
      expect(progress(el)).toBe('')
    } finally {
      frames.restore()
    }

    // The timeline lives on the rail, with the same range the fallback computes.
    const native = css.slice(
      css.indexOf('@supports (animation-timeline: view())'),
    )
    expect(native).toMatch(/view-timeline:\s*--_tracing-beam block/)
    expect(native).toMatch(
      /view-timeline-inset:\s*var\(--tracing-beam-start,\s*50%\)\s*0px/,
    )
    expect(native).toMatch(/animation-timeline:\s*--_tracing-beam/)
    expect(native).toMatch(/animation-range:\s*contain 0% contain 100%/)
  })

  describe('script fallback', () => {
    let frames: ManualFrames
    let innerHeight: number

    beforeEach(() => {
      stubSupports(false)
      frames = manualAnimationFrames()
      innerHeight = window.innerHeight
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 600,
      })
    })

    afterEach(() => {
      frames.restore()
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: innerHeight,
      })
    })

    it('writes the progress once per frame while the page scrolls', async () => {
      const el = await beam()
      place(el, 800, 3000)
      frames.step(16)
      expect(progress(el)).toBe('0')

      place(el, 0, 3000)
      scrollPage()
      scrollPage()
      expect(frames.pending).toBe(1)
      frames.step(32)
      expect(Number(progress(el))).toBeCloseTo(300 / 2700, 4)

      place(el, -2400, 3000)
      scrollPage()
      frames.step(48)
      expect(progress(el)).toBe('1')
    })

    it('leaves the variable alone when the progress has not moved', async () => {
      const el = await beam()
      place(el, 800, 3000)
      frames.step(16)
      const write = vi.spyOn(el.style, 'setProperty')
      scrollPage()
      frames.step(32)
      expect(write).not.toHaveBeenCalled()
    })

    it('follows the nearest scroll container instead of the page', async () => {
      const panel = document.createElement('div')
      panel.style.overflowY = 'auto'
      panel.style.overflow = 'auto'
      Object.defineProperty(panel, 'clientHeight', {
        configurable: true,
        get: () => 400,
      })
      place(panel, 100, 400)
      panel.innerHTML = '<moul-tracing-beam><p>Kep</p></moul-tracing-beam>'
      document.body.append(panel)
      try {
        const el = panel.firstElementChild as MoulTracingBeam
        await el.updateComplete
        // The line is halfway down the 400px panel: 300 on screen.
        place(el, 0, 1000)
        panel.dispatchEvent(new Event('scroll'))
        frames.step(16)
        expect(Number(progress(el))).toBeCloseTo(300 / 800, 4)
      } finally {
        panel.remove()
      }
    })

    it('reads --tracing-beam-start as a share of the view or a length', async () => {
      const el = await beam()
      el.style.setProperty('--tracing-beam-start', '120px')
      window.dispatchEvent(new Event('resize'))
      place(el, 120, 3000)
      frames.step(16)
      expect(progress(el)).toBe('0')
      place(el, 0, 3000)
      scrollPage()
      frames.step(32)
      // Starts at 120, ends with its bottom at 600: a 2520px range.
      expect(Number(progress(el))).toBeCloseTo(120 / 2520, 4)

      el.style.setProperty('--tracing-beam-start', '25%')
      window.dispatchEvent(new Event('resize'))
      frames.step(48)
      expect(Number(progress(el))).toBeCloseTo(150 / 2550, 4)
    })

    it('measures again when the article changes size', async () => {
      const el = await beam()
      place(el, 0, 3000)
      frames.step(16)
      const before = progress(el)
      place(el, 0, 1500)
      window.__triggerResize(el, { width: 600, height: 1500 })
      frames.step(32)
      expect(progress(el)).not.toBe(before)
      expect(Number(progress(el))).toBeCloseTo(300 / 1200, 4)
    })

    it('stops listening once removed', async () => {
      const el = await beam()
      frames.step(16)
      el.remove()
      scrollPage()
      expect(frames.pending).toBe(0)
    })
  })

  describe('keyboard and screen readers', () => {
    it('hides the line and the dot from assistive technology and adds no role', async () => {
      const el = await beam()
      expect(part(el, 'rail')?.getAttribute('aria-hidden')).toBe('true')
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(css).toMatch(/\.rail\s*\{[^}]*pointer-events:\s*none/)
    })

    it('leaves links in the article in the tab order', async () => {
      const el = await beam()
      const link = el.querySelector('a') as HTMLAnchorElement
      link.focus()
      expect(document.activeElement).toBe(link)
    })

    it('draws in system colours where the system forces them', () => {
      const forced = css.slice(css.indexOf('@media (forced-colors: active)'))
      expect(forced).toMatch(/Highlight/)
    })
  })

  describe('reduced motion', () => {
    it('keeps following the scroll, without easing, and drops the glowing head', async () => {
      stubSupports(false)
      const motion = mockReducedMotion(true)
      const frames = manualAnimationFrames()
      const innerHeight = window.innerHeight
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 600,
      })
      try {
        const el = await beam()
        place(el, 0, 3000)
        frames.step(16)
        expect(Number(progress(el))).toBeCloseTo(300 / 2700, 4)
      } finally {
        frames.restore()
        motion.restore()
        Object.defineProperty(window, 'innerHeight', {
          configurable: true,
          value: innerHeight,
        })
      }

      // No transition anywhere: the beam is exactly where the scroll is.
      expect(css).not.toMatch(/\btransition\s*:/)
      const reduced = css.slice(
        css.indexOf('@media (prefers-reduced-motion: reduce)'),
      )
      expect(reduced).toMatch(/\.head\s*\{\s*display:\s*none/)
    })
  })
})
