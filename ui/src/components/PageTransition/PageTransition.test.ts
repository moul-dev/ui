import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './index'
import type { MoulPageTransition } from './PageTransition'
import {
  PAGE_TRANSITION_EFFECTS,
  pageTransitionCss,
  pageTransitionStyles,
} from './PageTransition.styles'

interface FakeTransition {
  types: Set<string>
  finish(): void
  finished: Promise<void>
  ready: Promise<void>
  updateCallbackDone: Promise<void>
}

/** A `document.startViewTransition` whose transitions finish when the test says so. */
function mockViewTransitions() {
  const started: FakeTransition[] = []
  const start = vi.fn((update: () => unknown) => {
    let finish = () => {}
    const gate = new Promise<void>((resolve) => {
      finish = resolve
    })
    const done = Promise.resolve().then(() => update())
    const transition: FakeTransition = {
      types: new Set(),
      finish: () => finish(),
      updateCallbackDone: done.then(() => {}),
      ready: done.then(() => {}),
      finished: done.then(() => gate),
    }
    started.push(transition)
    return transition
  })
  const doc = document as unknown as Record<string, unknown>
  doc.startViewTransition = start
  return {
    start,
    started,
    restore() {
      delete doc.startViewTransition
    },
  }
}

/** A `pageswap` or `pagereveal` event, with the transition the browser would attach. */
function pageEvent(
  type: 'pageswap' | 'pagereveal',
  viewTransition: FakeTransition | null,
): Event {
  return Object.assign(new Event(type), { viewTransition })
}

function fakeTransition(): FakeTransition {
  let finish = () => {}
  const finished = new Promise<void>((resolve) => {
    finish = resolve
  })
  return {
    types: new Set(),
    finish: () => finish(),
    finished,
    ready: Promise.resolve(),
    updateCallbackDone: Promise.resolve(),
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve))
const root = () => document.documentElement
const headStyles = () =>
  [...document.head.querySelectorAll('style[data-moul-page-transition]')].map(
    (style) => style.textContent ?? '',
  )

async function transitionElement(effect = 'wipe') {
  return fixture<MoulPageTransition>(
    html`<moul-page-transition effect=${effect}></moul-page-transition>`,
  )
}

describe('<moul-page-transition>', () => {
  let motion: ReducedMotionMock

  beforeEach(() => {
    motion = mockReducedMotion(false)
  })

  afterEach(() => {
    fixtureCleanup()
    motion.restore()
    vi.unstubAllGlobals()
    sessionStorage.clear()
    root().removeAttribute('data-moul-page-transition')
    root().removeAttribute('data-moul-page-transition-direction')
    root().removeAttribute('style')
  })

  it('draws nothing of its own', async () => {
    const el = await transitionElement()
    expect(el.shadowRoot?.children.length).toBe(0)
    expect(pageTransitionStyles.cssText).toMatch(/display:\s*none/)
  })

  it('adds one style to the document head, with the opt-in and the effect, and takes it away when removed', async () => {
    const el = await transitionElement('wipe')
    expect(headStyles()).toHaveLength(1)
    const [text] = headStyles()
    expect(text).toMatch(/@view-transition\s*\{\s*navigation:\s*auto;/)
    expect(text).toMatch(/types:\s*moul-page-wipe;/)
    expect(text).toMatch(/@keyframes moul-page-wipe-out/)
    el.remove()
    expect(headStyles()).toHaveLength(0)
  })

  it('rewrites the style when the effect or the duration changes, and falls back on unknown values', async () => {
    const el = await transitionElement('wipe')
    el.effect = 'circle'
    el.duration = 900
    await el.updateComplete
    let [text] = headStyles()
    expect(text).toMatch(/types:\s*moul-page-circle;/)
    expect(text).toMatch(/animation-duration:\s*900ms/)

    el.setAttribute('effect', 'smoke')
    el.duration = Number.NaN
    await el.updateComplete
    expect(el.effect).toBe('wipe')
    expect(el.duration).toBe(600)
    ;[text] = headStyles()
    expect(text).toMatch(/types:\s*moul-page-wipe;/)
    // The wipe's two halves share the length: 0.6 of it each, the second after 0.4.
    expect(text).toMatch(/animation-duration:\s*360ms/)
    expect(text).toMatch(/animation-delay:\s*240ms/)
  })

  describe('pageTransitionCss', () => {
    it.each(
      PAGE_TRANSITION_EFFECTS,
    )('scopes %s to its own transitions', (effect) => {
      const text = pageTransitionCss(effect, 500)
      expect(text).toContain(
        `html:is(:active-view-transition-type(moul-page-${effect}), [data-moul-page-transition="${effect}"])::view-transition-new(root)`,
      )
      // Nothing outside the scope touches the root transition.
      for (const line of text.split('\n')) {
        if (line.includes('::view-transition')) {
          expect(line).toMatch(/^html:is\(/)
        }
      }
    })

    it('reverses the wipe and the slide in right-to-left text and when going back', () => {
      for (const effect of ['wipe', 'slide'] as const) {
        const text = pageTransitionCss(effect, 500)
        expect(text).toContain(
          ':dir(rtl):not(:is(:active-view-transition-type(moul-page-backward)',
        )
        expect(text).toContain(
          ':dir(ltr):is(:active-view-transition-type(moul-page-backward)',
        )
        expect(text).toContain(`moul-page-${effect}-in-reverse`)
      }
    })

    it('grows the circle from the origin the element writes on <html>', () => {
      const text = pageTransitionCss('circle', 500)
      expect(text).toMatch(
        /circle\(var\(--_moul-page-transition-r, 75vmax\) at var\(--_moul-page-transition-x, 50%\) var\(--_moul-page-transition-y, 50%\)\)/,
      )
    })

    it('colours the wipe from a token the page can override', () => {
      expect(pageTransitionCss('wipe', 500)).toMatch(
        /::view-transition \{\s*background: var\(--page-transition-color, var\(--color-accent, CanvasText\)\);/,
      )
    })
  })

  describe('start()', () => {
    let transitions: ReturnType<typeof mockViewTransitions>

    beforeEach(() => {
      transitions = mockViewTransitions()
    })

    afterEach(() => {
      transitions.restore()
    })

    it('runs the update inside a view transition with its effect, and tidies <html> when it finishes', async () => {
      const el = await transitionElement('slide')
      const update = vi.fn()
      const done = el.start(update)
      expect(transitions.start).toHaveBeenCalledTimes(1)
      expect(root().getAttribute('data-moul-page-transition')).toBe('slide')
      await flush()
      expect(update).toHaveBeenCalledTimes(1)

      let isDone = false
      done.then(() => {
        isDone = true
      })
      await flush()
      expect(isDone).toBe(false)
      transitions.started[0].finish()
      await done
      expect(root().hasAttribute('data-moul-page-transition')).toBe(false)
    })

    it('plays backward when asked', async () => {
      const el = await transitionElement('wipe')
      const done = el.start(() => {}, { direction: 'backward' })
      expect(root().getAttribute('data-moul-page-transition-direction')).toBe(
        'backward',
      )
      transitions.started[0].finish()
      await done
      expect(root().hasAttribute('data-moul-page-transition-direction')).toBe(
        false,
      )
    })

    it('grows the circle from the point given, or from the last press', async () => {
      Object.defineProperties(window, {
        innerWidth: { configurable: true, value: 1000 },
        innerHeight: { configurable: true, value: 800 },
      })
      const el = await transitionElement('circle')
      let done = el.start(() => {}, { x: 100, y: 200 })
      expect(root().style.getPropertyValue('--_moul-page-transition-x')).toBe(
        '100px',
      )
      expect(root().style.getPropertyValue('--_moul-page-transition-y')).toBe(
        '200px',
      )
      // Far enough to reach the opposite corner.
      expect(root().style.getPropertyValue('--_moul-page-transition-r')).toBe(
        `${Math.ceil(Math.hypot(900, 600))}px`,
      )
      transitions.started[0].finish()
      await done

      window.dispatchEvent(
        new PointerEvent('pointerdown', { clientX: 700, clientY: 300 }),
      )
      done = el.start(() => {})
      expect(root().style.getPropertyValue('--_moul-page-transition-x')).toBe(
        '700px',
      )
      transitions.started[1].finish()
      await done
      expect(root().style.getPropertyValue('--_moul-page-transition-x')).toBe(
        '',
      )
    })

    it('leaves <html> to the newest transition when two overlap', async () => {
      const el = await transitionElement('fade')
      const first = el.start(() => {})
      const second = el.start(() => {}, { direction: 'backward' })
      transitions.started[0].finish()
      await first
      expect(root().getAttribute('data-moul-page-transition')).toBe('fade')
      transitions.started[1].finish()
      await second
      expect(root().hasAttribute('data-moul-page-transition')).toBe(false)
    })

    it('rejects when the update fails', async () => {
      const el = await transitionElement()
      const failure = new Error('no route')
      await expect(
        el.start(() => {
          throw failure
        }),
      ).rejects.toBe(failure)
      expect(root().hasAttribute('data-moul-page-transition')).toBe(false)
    })

    it('just runs the update where the browser has no view transitions', async () => {
      transitions.restore()
      const el = await transitionElement()
      const update = vi.fn(async () => {})
      await el.start(update)
      expect(update).toHaveBeenCalledTimes(1)
      expect(root().hasAttribute('data-moul-page-transition')).toBe(false)
    })
  })

  describe('cross-page navigation', () => {
    it('leaves the press point for the next page as a share of the screen', async () => {
      Object.defineProperties(window, {
        innerWidth: { configurable: true, value: 1000 },
        innerHeight: { configurable: true, value: 500 },
      })
      await transitionElement('circle')
      window.dispatchEvent(
        new PointerEvent('pointerdown', { clientX: 250, clientY: 400 }),
      )
      window.dispatchEvent(pageEvent('pageswap', fakeTransition()))
      const saved = JSON.parse(
        sessionStorage.getItem('moul-page-transition-origin') ?? '{}',
      )
      expect(saved.x).toBe(0.25)
      expect(saved.y).toBe(0.8)
    })

    it('marks the revealed page with its effect and origin, and tidies up when the transition ends', async () => {
      Object.defineProperties(window, {
        innerWidth: { configurable: true, value: 800 },
        innerHeight: { configurable: true, value: 600 },
      })
      sessionStorage.setItem(
        'moul-page-transition-origin',
        JSON.stringify({ x: 0.5, y: 0.25, time: Date.now() }),
      )
      await transitionElement('circle')
      const transition = fakeTransition()
      window.dispatchEvent(pageEvent('pagereveal', transition))
      expect(root().getAttribute('data-moul-page-transition')).toBe('circle')
      expect(root().style.getPropertyValue('--_moul-page-transition-x')).toBe(
        '400px',
      )
      expect(root().style.getPropertyValue('--_moul-page-transition-y')).toBe(
        '150px',
      )
      expect(sessionStorage.getItem('moul-page-transition-origin')).toBeNull()
      transition.finish()
      await flush()
      expect(root().hasAttribute('data-moul-page-transition')).toBe(false)
    })

    it('plays backward when the reader went back through the history', async () => {
      vi.stubGlobal('navigation', {
        activation: {
          navigationType: 'traverse',
          entry: { index: 1 },
          from: { index: 2 },
        },
      })
      await transitionElement('slide')
      const transition = fakeTransition()
      window.dispatchEvent(pageEvent('pagereveal', transition))
      expect(transition.types.has('moul-page-backward')).toBe(true)
      expect(root().getAttribute('data-moul-page-transition-direction')).toBe(
        'backward',
      )
    })

    it('does nothing when a page loads without a transition', async () => {
      await transitionElement()
      window.dispatchEvent(pageEvent('pagereveal', null))
      expect(root().hasAttribute('data-moul-page-transition')).toBe(false)
    })
  })

  describe('keyboard and screen readers', () => {
    it('is hidden, takes no focus and has no role', async () => {
      const el = await transitionElement()
      expect(el.getAttribute('aria-hidden')).toBe('true')
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
    })

    it('never stops a link from doing its job', async () => {
      await transitionElement()
      const link = document.createElement('a')
      link.href = '#kampot'
      document.body.append(link)
      const click = new MouseEvent('click', { bubbles: true, cancelable: true })
      link.dispatchEvent(click)
      expect(click.defaultPrevented).toBe(false)
      link.remove()
    })
  })

  describe('reduced motion', () => {
    it('runs the update at once, with no view transition', async () => {
      motion.set(true)
      const transitions = mockViewTransitions()
      try {
        const el = await transitionElement()
        const update = vi.fn()
        await el.start(update)
        expect(update).toHaveBeenCalledTimes(1)
        expect(transitions.start).not.toHaveBeenCalled()
      } finally {
        transitions.restore()
      }
    })

    it('opts in to cross-page transitions only when the reader has not asked for less motion', () => {
      const text = pageTransitionCss('wipe', 600)
      const gate = text.indexOf(
        '@media (prefers-reduced-motion: no-preference)',
      )
      expect(gate).toBe(0)
      expect(text.indexOf('@view-transition')).toBeGreaterThan(gate)
    })
  })
})
