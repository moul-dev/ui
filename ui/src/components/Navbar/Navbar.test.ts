import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
  triggerResize,
} from '../../test-setup'
import '../Banner/Banner'
import './Navbar'
import type { MoulNavbar } from './Navbar'
import { navbarStyles } from './Navbar.styles'

const css = navbarStyles.cssText.replace(/\/\*[\s\S]*?\*\//g, '')

/** The declarations of the rule whose whole selector list is `selector`. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`(?:^|[{}])\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(
    css,
  )
  expect(match, `no rule for ${selector}`).not.toBeNull()
  return match?.[1] ?? ''
}

/** The body of the first `@media` block whose query starts with `query`. */
function mediaBlock(query: string): string {
  const start = css.indexOf(`@media ${query}`)
  expect(start, `no @media ${query}`).toBeGreaterThanOrEqual(0)
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) {
      return css.slice(css.indexOf('{', start) + 1, i)
    }
  }
  return ''
}

/** Gives the page a scroll range of 2000px. */
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

const part = (el: MoulNavbar, name: string) =>
  el.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`) ?? null

describe('<moul-navbar>', () => {
  let frames: ManualFrames
  let page: ReturnType<typeof mockPage>
  let time = 0

  /** Scrolls the page and runs the frame the controller asked for. */
  const scrollPage = (top: number) => {
    page.scrollTo(top)
    time += 16
    frames.step(time)
  }

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

  it('renders the banner above a bar of brand, navigation and actions', async () => {
    const el = await fixture<MoulNavbar>(html`<moul-navbar>
      <a slot="brand" href="/">Moul</a>
      <a href="/docs/">Docs</a>
      <button slot="actions">Sign in</button>
    </moul-navbar>`)
    const base = part(el, 'base')
    expect(
      [...(base?.children ?? [])].map((c) => c.getAttribute('part')),
    ).toEqual(['banner', null])
    const bar = part(el, 'bar')
    expect(
      [...(bar?.children ?? [])].map((c) => c.getAttribute('part')),
    ).toEqual(['brand', 'panel', 'actions'])
    expect(
      part(el, 'banner')?.querySelector('slot[name="banner"]'),
    ).not.toBeNull()
    expect(
      part(el, 'brand')?.querySelector('slot[name="brand"]'),
    ).not.toBeNull()
    expect(
      part(el, 'actions')?.querySelector('slot[name="actions"]'),
    ).not.toBeNull()
    expect(part(el, 'menu-button')).toBeNull()
  })

  it('wraps the default slot in a nav landmark named by label', async () => {
    const el = await fixture<MoulNavbar>(html`<moul-navbar></moul-navbar>`)
    const nav = part(el, 'nav')
    expect(nav?.localName).toBe('nav')
    expect(nav?.getAttribute('aria-label')).toBe('Main')
    expect(nav?.querySelector('slot:not([name])')).not.toBeNull()

    el.label = 'Site'
    await el.updateComplete
    expect(nav?.getAttribute('aria-label')).toBe('Site')
  })

  it('applies its defaults and falls back from an unknown variant', async () => {
    const el = await fixture<MoulNavbar>(html`<moul-navbar></moul-navbar>`)
    expect(el.variant).toBe('bar')
    expect(el.effect).toBe('')
    expect(el.hideOnScroll).toBe(false)
    expect(el.threshold).toBe(24)
    expect(el.collapseBelow).toBe(768)
    expect(el.menuLabel).toBe('Menu')
    expect(el.isScrolled).toBe(false)
    expect(el.isRetracted).toBe(false)
    expect(el.isCollapsed).toBe(false)

    el.variant = 'sideways' as never
    await el.updateComplete
    expect(el.variant).toBe('bar')
    expect(el.getAttribute('variant')).toBe('bar')
  })

  it('is sticky, and lets the pointer through everywhere but the bar and banner', () => {
    const host = rule(':host')
    expect(host).toContain('position: sticky')
    expect(host).toContain('inset-block-start: 0')
    expect(host).toContain('pointer-events: none')
    expect(rule('.bar')).toContain('pointer-events: auto')
    expect(rule('.banner')).toContain('pointer-events: auto')
  })

  it('reflects is-scrolled once the page passes the threshold', async () => {
    const el = await fixture<MoulNavbar>(
      html`<moul-navbar threshold="40"></moul-navbar>`,
    )
    scrollPage(30)
    await el.updateComplete
    expect(el.hasAttribute('is-scrolled')).toBe(false)

    scrollPage(80)
    await el.updateComplete
    expect(el.isScrolled).toBe(true)
    expect(el.hasAttribute('is-scrolled')).toBe(true)

    scrollPage(0)
    await el.updateComplete
    expect(el.hasAttribute('is-scrolled')).toBe(false)
  })

  it('shrinks and turns to glass from the effect tokens once scrolled', () => {
    expect(rule(':host([effect~="shrink"][is-scrolled])')).toContain(
      '--_navbar-h: var(--navbar-shrunk-height, 3.25rem)',
    )
    expect(
      rule(':host([variant="floating"][effect~="shrink"][is-scrolled]) .bar'),
    ).toContain('var(--navbar-shrunk-width, 48rem)')
    expect(rule(':host([effect~="glass"]) .bar::before')).toContain(
      'background: transparent',
    )
    const glass = rule(
      ':host([effect~="glass"][is-scrolled]) .bar::before,\n  :host([effect~="glass"][is-menu-open]) .bar::before',
    )
    expect(glass).toContain('backdrop-filter: blur(16px)')
    // The reserved height never changes, so shrinking never moves the page.
    expect(rule('.frame')).toContain('block-size: var(--navbar-height, 4rem)')
  })

  it('slides out of view on the way down and back on the way up with hide-on-scroll', async () => {
    const el = await fixture<MoulNavbar>(
      html`<moul-navbar hide-on-scroll></moul-navbar>`,
    )
    scrollPage(10)
    await el.updateComplete
    expect(el.isRetracted).toBe(false)

    scrollPage(200)
    await el.updateComplete
    expect(el.isRetracted).toBe(true)
    expect(el.hasAttribute('is-retracted')).toBe(true)
    expect(rule(':host([is-retracted]) .base')).toContain(
      'translate: 0 calc(-100% - 1.5rem)',
    )

    scrollPage(150)
    await el.updateComplete
    expect(el.isRetracted).toBe(false)

    scrollPage(400)
    await el.updateComplete
    expect(el.isRetracted).toBe(true)

    // Back at the top it always shows.
    scrollPage(0)
    await el.updateComplete
    expect(el.isRetracted).toBe(false)
  })

  it('stays in view without hide-on-scroll, and comes back when it is turned off', async () => {
    const el = await fixture<MoulNavbar>(html`<moul-navbar></moul-navbar>`)
    scrollPage(300)
    await el.updateComplete
    expect(el.isRetracted).toBe(false)

    el.hideOnScroll = true
    await el.updateComplete
    scrollPage(600)
    await el.updateComplete
    expect(el.isRetracted).toBe(true)

    el.hideOnScroll = false
    await el.updateComplete
    expect(el.isRetracted).toBe(false)
  })

  it('never hides while focus is inside, and returns when focus moves in', async () => {
    const el = await fixture<MoulNavbar>(html`<moul-navbar hide-on-scroll>
      <a href="/docs/">Docs</a>
    </moul-navbar>`)
    const link = el.querySelector('a') as HTMLAnchorElement

    link.focus()
    scrollPage(300)
    await el.updateComplete
    expect(el.isRetracted).toBe(false)

    link.blur()
    scrollPage(600)
    await el.updateComplete
    expect(el.isRetracted).toBe(true)

    link.focus()
    await el.updateComplete
    expect(el.isRetracted).toBe(false)
  })

  it('follows the scroll container named by for', async () => {
    const panel = document.createElement('div')
    panel.id = 'panel-scroller'
    let top = 0
    Object.defineProperties(panel, {
      scrollHeight: { configurable: true, get: () => 1000 },
      clientHeight: { configurable: true, get: () => 200 },
      scrollTop: { configurable: true, get: () => top },
    })
    document.body.append(panel)
    const el = document.createElement('moul-navbar')
    el.setAttribute('for', 'panel-scroller')
    el.hideOnScroll = true
    panel.append(el)
    await el.updateComplete

    // The page scrolling does nothing.
    scrollPage(500)
    await el.updateComplete
    expect(el.isScrolled).toBe(false)

    top = 300
    panel.dispatchEvent(new Event('scroll'))
    time += 16
    frames.step(time)
    await el.updateComplete
    expect(el.isScrolled).toBe(true)
    expect(el.isRetracted).toBe(true)
  })

  describe('with a banner', () => {
    it('slides a hide-on-scroll banner away on the way down, leaving the banner itself alone', async () => {
      const el = await fixture<MoulNavbar>(html`<moul-navbar>
        <moul-banner slot="banner" hide-on-scroll is-sticky>News</moul-banner>
        <a href="/">Home</a>
      </moul-navbar>`)
      const banner = el.querySelector('moul-banner')
      const base = part(el, 'base') as HTMLElement
      await banner?.updateComplete

      scrollPage(200)
      await el.updateComplete
      expect(base.classList.contains('is-banner-away')).toBe(true)
      expect(el.isRetracted).toBe(false)
      // The navbar moves it; the banner does not follow the scroll itself.
      expect(banner?.isRetracted).toBe(false)
      expect(rule('.base.is-banner-away')).toContain(
        'translate: 0 calc(-1 * var(--_navbar-banner-h, 0px))',
      )

      scrollPage(100)
      await el.updateComplete
      expect(base.classList.contains('is-banner-away')).toBe(false)
    })

    it('keeps a banner without hide-on-scroll in place', async () => {
      const el = await fixture<MoulNavbar>(html`<moul-navbar>
        <moul-banner slot="banner">News</moul-banner>
      </moul-navbar>`)
      scrollPage(400)
      await el.updateComplete
      expect(part(el, 'base')?.classList.contains('is-banner-away')).toBe(false)
    })

    it('writes the banner height for the slide', async () => {
      const el = await fixture<MoulNavbar>(html`<moul-navbar>
        <moul-banner slot="banner" hide-on-scroll>News</moul-banner>
      </moul-navbar>`)
      const box = part(el, 'banner') as HTMLElement
      triggerResize(box, { width: 1000, height: 40 })
      expect(
        part(el, 'base')?.style.getPropertyValue('--_navbar-banner-h'),
      ).toBe('40px')
    })
  })

  describe('collapsing', () => {
    it('collapses below collapse-below pixels of its own width', async () => {
      const el = await fixture<MoulNavbar>(html`<moul-navbar></moul-navbar>`)
      triggerResize(el, { width: 600 })
      await el.updateComplete
      expect(el.isCollapsed).toBe(true)
      expect(el.hasAttribute('is-collapsed')).toBe(true)
      const button = part(el, 'menu-button') as HTMLButtonElement
      expect(button.localName).toBe('button')
      expect(button.getAttribute('aria-expanded')).toBe('false')
      expect(button.getAttribute('aria-controls')).toBe('panel')
      expect(button.getAttribute('aria-label')).toBe('Menu')
      expect(el.shadowRoot?.getElementById('panel')).toBe(part(el, 'panel'))

      triggerResize(el, { width: 1024 })
      await el.updateComplete
      expect(el.isCollapsed).toBe(false)
      expect(part(el, 'menu-button')).toBeNull()
    })

    it('never collapses with collapse-below="0", and ignores a zero width', async () => {
      const el = await fixture<MoulNavbar>(
        html`<moul-navbar collapse-below="0"></moul-navbar>`,
      )
      triggerResize(el, { width: 320 })
      await el.updateComplete
      expect(el.isCollapsed).toBe(false)

      el.collapseBelow = 900
      triggerResize(el, { width: 0 })
      await el.updateComplete
      expect(el.isCollapsed).toBe(false)
    })

    it('keeps the focus order in step with what the reader sees', async () => {
      const el = await fixture<MoulNavbar>(html`<moul-navbar></moul-navbar>`)
      const order = () =>
        [...(part(el, 'bar')?.children ?? [])].map((c) =>
          c.getAttribute('part'),
        )
      expect(order()).toEqual(['brand', 'panel', 'actions'])
      triggerResize(el, { width: 500 })
      await el.updateComplete
      expect(order()).toEqual(['brand', 'actions', 'menu-button', 'panel'])
    })

    it('opens and closes the panel from the menu button, firing openchange', async () => {
      const el = await fixture<MoulNavbar>(
        html`<moul-navbar menu-label="Navigation"></moul-navbar>`,
      )
      triggerResize(el, { width: 500 })
      await el.updateComplete
      const button = part(el, 'menu-button') as HTMLButtonElement
      expect(button.getAttribute('aria-label')).toBe('Navigation')
      const changes: boolean[] = []
      el.addEventListener('openchange', (event) =>
        changes.push((event as CustomEvent).detail.isOpen),
      )

      button.click()
      await el.updateComplete
      expect(el.isMenuOpen).toBe(true)
      expect(el.hasAttribute('is-menu-open')).toBe(true)
      expect(button.getAttribute('aria-expanded')).toBe('true')

      button.click()
      await el.updateComplete
      expect(el.isMenuOpen).toBe(false)
      expect(changes).toEqual([true, false])
    })

    it('hides the closed panel with visibility, so it leaves the focus order', () => {
      const closed = rule(':host([is-collapsed]) .panel')
      expect(closed).toContain('position: absolute')
      expect(closed).toContain('visibility: hidden')
      expect(rule(':host([is-collapsed][is-menu-open]) .panel')).toContain(
        'visibility: visible',
      )
    })

    it('closes on Escape and returns focus to the menu button', async () => {
      const el = await fixture<MoulNavbar>(html`<moul-navbar>
        <a href="/docs/">Docs</a>
      </moul-navbar>`)
      triggerResize(el, { width: 500 })
      await el.updateComplete
      const button = part(el, 'menu-button') as HTMLButtonElement
      button.click()
      await el.updateComplete
      const link = el.querySelector('a') as HTMLAnchorElement
      link.focus()

      const escapeKey = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        composed: true,
        cancelable: true,
      })
      link.dispatchEvent(escapeKey)
      await el.updateComplete
      expect(escapeKey.defaultPrevented).toBe(true)
      expect(el.isMenuOpen).toBe(false)
      expect(el.shadowRoot?.activeElement).toBe(button)
    })

    it('leaves Escape alone while the panel is closed', async () => {
      const el = await fixture<MoulNavbar>(html`<moul-navbar></moul-navbar>`)
      const escapeKey = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      })
      el.dispatchEvent(escapeKey)
      expect(escapeKey.defaultPrevented).toBe(false)
    })

    it('closes when a link in the panel is followed', async () => {
      const el = await fixture<MoulNavbar>(html`<moul-navbar>
        <a href="#pricing">Pricing</a>
        <button type="button">Not a link</button>
      </moul-navbar>`)
      triggerResize(el, { width: 500 })
      await el.updateComplete
      el.setMenuOpen(true)
      await el.updateComplete

      el.querySelector('button')?.click()
      await el.updateComplete
      expect(el.isMenuOpen).toBe(true)

      el.querySelector('a')?.click()
      await el.updateComplete
      expect(el.isMenuOpen).toBe(false)
    })

    it('closes when the reader presses outside the navbar', async () => {
      const el = await fixture<MoulNavbar>(html`<moul-navbar></moul-navbar>`)
      triggerResize(el, { width: 500 })
      await el.updateComplete
      el.setMenuOpen(true)
      await el.updateComplete

      el.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, composed: true }),
      )
      expect(el.isMenuOpen).toBe(true)

      document.body.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, composed: true }),
      )
      await el.updateComplete
      expect(el.isMenuOpen).toBe(false)
    })

    it('closes the panel when it widens past the limit', async () => {
      const el = await fixture<MoulNavbar>(html`<moul-navbar></moul-navbar>`)
      const listener = vi.fn()
      el.addEventListener('openchange', listener)
      triggerResize(el, { width: 500 })
      await el.updateComplete
      el.setMenuOpen(true)
      await el.updateComplete

      triggerResize(el, { width: 1200 })
      await el.updateComplete
      await el.updateComplete
      expect(el.isMenuOpen).toBe(false)
      expect(listener).toHaveBeenCalledTimes(2)
    })

    it('never retracts while the panel is open', async () => {
      const el = await fixture<MoulNavbar>(
        html`<moul-navbar hide-on-scroll></moul-navbar>`,
      )
      triggerResize(el, { width: 500 })
      await el.updateComplete
      el.setMenuOpen(true)
      await el.updateComplete
      scrollPage(400)
      await el.updateComplete
      expect(el.isRetracted).toBe(false)
    })

    it('turns a child navigation menu vertical while collapsed and restores it', async () => {
      const el = await fixture<MoulNavbar>(html`<moul-navbar>
        <moul-navigation-menu></moul-navigation-menu>
        <moul-navigation-menu orientation="horizontal"></moul-navigation-menu>
        <moul-navigation-menu slot="actions"></moul-navigation-menu>
      </moul-navbar>`)
      const [plain, set, inActions] = el.querySelectorAll(
        'moul-navigation-menu',
      )

      triggerResize(el, { width: 500 })
      await el.updateComplete
      expect(plain.getAttribute('orientation')).toBe('vertical')
      expect(set.getAttribute('orientation')).toBe('vertical')
      expect(inActions.hasAttribute('orientation')).toBe(false)

      triggerResize(el, { width: 1200 })
      await el.updateComplete
      expect(plain.hasAttribute('orientation')).toBe(false)
      expect(set.getAttribute('orientation')).toBe('horizontal')
    })

    it('turns a menu added while collapsed vertical, and restores menus when removed', async () => {
      const el = await fixture<MoulNavbar>(html`<moul-navbar></moul-navbar>`)
      triggerResize(el, { width: 500 })
      await el.updateComplete

      const menu = document.createElement('moul-navigation-menu')
      el.append(menu)
      await new Promise((resolve) => setTimeout(resolve))
      expect(menu.getAttribute('orientation')).toBe('vertical')

      el.remove()
      expect(menu.hasAttribute('orientation')).toBe(false)
    })
  })

  describe('reduced motion', () => {
    let motion: ReducedMotionMock

    beforeEach(() => {
      motion = mockReducedMotion(true)
    })

    afterEach(() => {
      motion.restore()
    })

    it('never hides on scroll, and still reports is-scrolled', async () => {
      const el = await fixture<MoulNavbar>(html`<moul-navbar hide-on-scroll>
        <moul-banner slot="banner" hide-on-scroll>News</moul-banner>
      </moul-navbar>`)
      scrollPage(400)
      await el.updateComplete
      expect(el.isScrolled).toBe(true)
      expect(el.isRetracted).toBe(false)
      expect(part(el, 'base')?.classList.contains('is-banner-away')).toBe(false)
    })

    it('brings the bar back when the setting turns on mid-way', async () => {
      motion.set(false)
      const el = await fixture<MoulNavbar>(
        html`<moul-navbar hide-on-scroll></moul-navbar>`,
      )
      scrollPage(400)
      await el.updateComplete
      expect(el.isRetracted).toBe(true)

      motion.set(true)
      await el.updateComplete
      expect(el.isRetracted).toBe(false)
    })

    it('drops every transition in its styles', () => {
      const block = mediaBlock('(prefers-reduced-motion: reduce)')
      for (const selector of [
        '.base',
        '.bar::before',
        '.panel',
        '.menu-line',
      ]) {
        expect(block).toContain(selector)
      }
      expect(block).toContain('transition: none !important')
    })
  })

  it('stops listening when removed', async () => {
    const el = await fixture<MoulNavbar>(
      html`<moul-navbar hide-on-scroll></moul-navbar>`,
    )
    el.remove()
    scrollPage(500)
    expect(el.isScrolled).toBe(false)
    expect(frames.pending).toBe(0)
  })
})
