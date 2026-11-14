import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
} from '../../test-setup'
import './ScrollProgress'
import type { MoulScrollProgress } from './ScrollProgress'
import { scrollProgressStyles } from './ScrollProgress.styles'

/** The declarations of the rule whose whole selector is `selector`. */
function rule(selector: string): string {
  const css = scrollProgressStyles.cssText.replace(/\/\*[\s\S]*?\*\//g, '')
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`(?:^|[{}])\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(
    css,
  )
  expect(match, `no rule for ${selector}`).not.toBeNull()
  return match?.[1] ?? ''
}

const progress = (el: HTMLElement) =>
  el.style.getPropertyValue('--scroll-progress')

type Scroller = HTMLElement & { scrollTo(top: number): void }

/** A container with a fixed scroll range: 1000px of content in a 200px box. */
function scroller(id: string, parent: ParentNode = document.body): Scroller {
  const el = document.createElement('div') as Scroller
  el.id = id
  let top = 0
  Object.defineProperties(el, {
    scrollHeight: { configurable: true, get: () => 1000 },
    clientHeight: { configurable: true, get: () => 200 },
    scrollTop: {
      configurable: true,
      get: () => top,
      set: (value: number) => {
        top = value
      },
    },
  })
  el.scrollTo = (value: number) => {
    top = value
    el.dispatchEvent(new Event('scroll'))
  }
  parent.append(el)
  return el
}

/** Gives the page a scroll range of 2000px (3000px of content in a 1000px viewport). */
function mockPage() {
  const page = document.scrollingElement ?? document.documentElement
  let top = 0
  Object.defineProperties(page, {
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
  return {
    scrollTo(value: number) {
      top = value
      window.dispatchEvent(new Event('scroll'))
    },
    restore() {
      const own = page as unknown as Record<string, unknown>
      delete own.scrollHeight
      delete own.clientHeight
      delete own.scrollTop
    },
  }
}

describe('<moul-scroll-progress>', () => {
  let frames: ManualFrames
  let page: ReturnType<typeof mockPage>

  beforeEach(() => {
    frames = manualAnimationFrames()
    page = mockPage()
  })

  afterEach(() => {
    fixtureCleanup()
    document.body.innerHTML = ''
    page.restore()
    frames.restore()
  })

  it('renders a track and the bar inside it', async () => {
    const el = await fixture<MoulScrollProgress>(
      html`<moul-scroll-progress></moul-scroll-progress>`,
    )
    const base = el.shadowRoot?.querySelector('[part="base"]')
    expect(base?.querySelector('[part="bar"]')).not.toBeNull()
  })

  it('follows the page by default, writing its progress as the bar scale', async () => {
    const el = await fixture<MoulScrollProgress>(
      html`<moul-scroll-progress></moul-scroll-progress>`,
    )
    expect(progress(el)).toBe('0')

    page.scrollTo(500)
    frames.step(16)
    expect(progress(el)).toBe('0.25')

    page.scrollTo(2000)
    frames.step(32)
    expect(progress(el)).toBe('1')

    // The bar is scaled by that variable from the inline start.
    const bar = rule('[part="bar"]')
    expect(bar).toContain('transform: scaleX(var(--scroll-progress, 0))')
    expect(bar).toContain('transform-origin: left')
    expect(rule(':host(:dir(rtl)) [part="bar"]')).toContain(
      'transform-origin: right',
    )
  })

  it('follows the scroll container named by for, not the page', async () => {
    const panel = scroller('panel')
    const el = await fixture<MoulScrollProgress>(
      html`<moul-scroll-progress
        for="panel"
        placement="inline"
      ></moul-scroll-progress>`,
    )
    expect(el.htmlFor).toBe('panel')

    panel.scrollTo(400)
    frames.step(16)
    expect(progress(el)).toBe('0.5')

    page.scrollTo(2000)
    frames.step(32)
    expect(progress(el)).toBe('0.5')
  })

  it('re-resolves when for changes, and goes back to the page when it is cleared', async () => {
    const one = scroller('one')
    const two = scroller('two')
    const el = await fixture<MoulScrollProgress>(
      html`<moul-scroll-progress for="one"></moul-scroll-progress>`,
    )
    one.scrollTo(200)
    frames.step(16)
    expect(progress(el)).toBe('0.25')

    two.scrollTo(800)
    el.htmlFor = 'two'
    await el.updateComplete
    expect(progress(el)).toBe('1')
    one.scrollTo(0)
    expect(frames.pending).toBe(0)

    el.removeAttribute('for')
    await el.updateComplete
    page.scrollTo(1000)
    frames.step(32)
    expect(progress(el)).toBe('0.5')
    two.scrollTo(0)
    expect(frames.pending).toBe(0)
  })

  it('keeps an empty bar while for names no element, then follows it once it appears', async () => {
    const el = await fixture<MoulScrollProgress>(
      html`<moul-scroll-progress for="later"></moul-scroll-progress>`,
    )
    // Not the page's progress in the meantime, nor one inherited from an ancestor.
    expect(progress(el)).toBe('0')
    page.scrollTo(1000)
    frames.step(16)
    expect(progress(el)).toBe('0')

    const later = scroller('later')
    await new Promise((resolve) => setTimeout(resolve))
    later.scrollTo(200)
    frames.step(32)
    expect(progress(el)).toBe('0.25')
  })

  it('finds the container in its own shadow root', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = host.attachShadow({ mode: 'open' })
    const panel = scroller('panel', root)
    const el = document.createElement('moul-scroll-progress')
    el.htmlFor = 'panel'
    root.append(el)
    await el.updateComplete

    panel.scrollTo(600)
    frames.step(16)
    expect(progress(el)).toBe('0.75')
  })

  it('stops listening when disconnected, and follows again when reconnected', async () => {
    const panel = scroller('panel')
    const el = await fixture<MoulScrollProgress>(
      html`<moul-scroll-progress for="panel"></moul-scroll-progress>`,
    )
    const parent = el.parentElement as HTMLElement
    el.remove()
    panel.scrollTo(400)
    page.scrollTo(400)
    expect(frames.pending).toBe(0)

    parent.append(el)
    await el.updateComplete
    expect(progress(el)).toBe('0.5')
  })

  it('passes the container to a native scroll timeline where the browser has one', async () => {
    const created: unknown[] = []
    const animate = vi.fn(() => ({
      cancel: vi.fn(),
      effect: { getComputedTiming: () => ({ progress: 0 }) },
    }))
    vi.stubGlobal(
      'ScrollTimeline',
      class {
        constructor(options: unknown) {
          created.push(options)
        }
      },
    )
    vi.stubGlobal('CSS', { supports: () => false, registerProperty: vi.fn() })
    ;(HTMLElement.prototype as any).animate = animate
    try {
      const panel = scroller('panel')
      const el = await fixture<MoulScrollProgress>(
        html`<moul-scroll-progress for="panel"></moul-scroll-progress>`,
      )
      expect(created).toEqual([{ source: panel, axis: 'block' }])
      expect(animate).toHaveBeenCalledWith(
        { '--scroll-progress': ['0', '1'] },
        expect.objectContaining({ easing: 'linear' }),
      )
      expect(animate.mock.contexts[0]).toBe(el)
    } finally {
      vi.unstubAllGlobals()
      delete (HTMLElement.prototype as any).animate
    }
  })

  describe('placement', () => {
    it('defaults to top, and falls back to it for an unknown value', async () => {
      const el = await fixture<MoulScrollProgress>(
        html`<moul-scroll-progress></moul-scroll-progress>`,
      )
      expect(el.placement).toBe('top')
      expect(el.getAttribute('placement')).toBe('top')

      el.setAttribute('placement', 'middle')
      await el.updateComplete
      expect(el.placement).toBe('top')
      expect(el.getAttribute('placement')).toBe('top')

      el.placement = 'bottom'
      await el.updateComplete
      expect(el.getAttribute('placement')).toBe('bottom')
    })

    it('is fixed along the top above page content, along the bottom, or in the flow', () => {
      const host = rule(':host')
      expect(host).toContain('position: fixed')
      expect(host).toContain('inset-block-start: 0')
      expect(host).toContain('inset-inline: 0')
      expect(host).toContain('z-index: var(--z-dropdown')
      expect(host).toContain('pointer-events: none')

      const bottom = rule(':host([placement="bottom"])')
      expect(bottom).toContain('inset-block-start: auto')
      expect(bottom).toContain('inset-block-end: 0')

      const inline = rule(':host([placement="inline"])')
      expect(inline).toContain('position: relative')
      expect(inline).toContain('inset: auto')
    })
  })

  describe('tone and colour', () => {
    it('defaults to primary, and falls back to it for an unknown tone', async () => {
      const el = await fixture<MoulScrollProgress>(
        html`<moul-scroll-progress tone="purple"></moul-scroll-progress>`,
      )
      await el.updateComplete
      expect(el.tone).toBe('primary')
      expect(el.getAttribute('tone')).toBe('primary')

      el.tone = 'success'
      await el.updateComplete
      expect(el.getAttribute('tone')).toBe('success')
    })

    it('fills with the tone colour unless --scroll-progress-color overrides it', () => {
      expect(rule(':host')).toContain('--_tone: var(--color-accent)')
      expect(rule(':host([tone="accent"])')).toContain(
        'var(--color-primary-500)',
      )
      expect(rule(':host([tone="success"])')).toContain('var(--color-success)')
      expect(rule(':host([tone="warning"])')).toContain('var(--color-warning)')
      expect(rule(':host([tone="error"])')).toContain('var(--color-danger)')
      expect(rule('[part="bar"]')).toContain(
        'background: var(--scroll-progress-color, var(--_tone))',
      )
      expect(rule(':host')).toContain(
        'block-size: var(--scroll-progress-height, 3px)',
      )
      expect(rule('[part="base"]')).toContain(
        'background: var(--scroll-progress-track, transparent)',
      )
    })
  })

  describe('keyboard and screen readers', () => {
    it('is hidden from screen readers and never focusable', async () => {
      const el = await fixture<MoulScrollProgress>(
        html`<moul-scroll-progress></moul-scroll-progress>`,
      )
      expect(el.getAttribute('aria-hidden')).toBe('true')
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.shadowRoot?.querySelector('[tabindex], [role]')).toBeNull()
    })
  })

  describe('reduced motion', () => {
    it('keeps following the scroll, with no easing of its own', async () => {
      const motion = mockReducedMotion(true)
      try {
        const el = await fixture<MoulScrollProgress>(
          html`<moul-scroll-progress></moul-scroll-progress>`,
        )
        page.scrollTo(1500)
        frames.step(16)
        expect(progress(el)).toBe('0.75')
        expect(scrollProgressStyles.cssText).not.toMatch(
          /@keyframes|animation|transition/,
        )
      } finally {
        motion.restore()
      }
    })
  })
})
