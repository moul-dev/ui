import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import '../Navbar/Navbar'
import './Banner'
import type { MoulBanner } from './Banner'
import { bannerStyles } from './Banner.styles'

const css = bannerStyles.cssText.replace(/\/\*[\s\S]*?\*\//g, '')

function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`(?:^|[{}])\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(
    css,
  )
  expect(match, `no rule for ${selector}`).not.toBeNull()
  return match?.[1] ?? ''
}

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

const part = (el: MoulBanner, name: string) =>
  el.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`) ?? null

/** Lets slotchange events and the render they cause run. */
const settle = () => new Promise((resolve) => setTimeout(resolve))

describe('<moul-banner>', () => {
  let frames: ManualFrames
  let page: ReturnType<typeof mockPage>
  let time = 0

  const scrollPage = (top: number) => {
    page.scrollTo(top)
    time += 16
    frames.step(time)
  }

  beforeEach(() => {
    frames = manualAnimationFrames()
    page = mockPage()
    localStorage.clear()
  })

  afterEach(() => {
    fixtureCleanup()
    document.body.innerHTML = ''
    page.restore()
    frames.restore()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('is a region landmark named by label', async () => {
    const el = await fixture<MoulBanner>(
      html`<moul-banner>Moul UI 1.0 is out.</moul-banner>`,
    )
    expect(el.getAttribute('role')).toBe('region')
    expect(el.getAttribute('aria-label')).toBe('Announcement')

    el.label = 'Release news'
    await el.updateComplete
    expect(el.getAttribute('aria-label')).toBe('Release news')
  })

  it('keeps a name of your own', async () => {
    const el = await fixture<MoulBanner>(
      html`<moul-banner aria-label="Site notice" label="Ignored">Hi</moul-banner>`,
    )
    expect(el.getAttribute('aria-label')).toBe('Site notice')

    const labelled = await fixture<MoulBanner>(
      html`<moul-banner aria-labelledby="x">Hi</moul-banner>`,
    )
    expect(labelled.hasAttribute('aria-label')).toBe(false)
  })

  it('renders the icon, message and action in one row', async () => {
    const el = await fixture<MoulBanner>(html`<moul-banner>
      <span slot="icon">!</span>
      Deploys are back to normal.
      <button slot="action">Status</button>
    </moul-banner>`)
    await settle()
    await el.updateComplete
    const content = part(el, 'content')
    expect(content?.querySelector('slot[name="icon"]')).not.toBeNull()
    expect(content?.querySelector('slot:not([name])')).not.toBeNull()
    expect(content?.querySelector('slot[name="action"]')).not.toBeNull()
    expect(part(el, 'close-button')).toBeNull()
  })

  it('hides the icon and action boxes while their slots are empty', async () => {
    const el = await fixture<MoulBanner>(html`<moul-banner>Plain</moul-banner>`)
    await settle()
    expect(part(el, 'icon')?.hidden).toBe(true)
    expect(part(el, 'action')?.hidden).toBe(true)
    expect(rule('.icon[hidden],\n  .action[hidden]')).toContain('display: none')

    const filled = await fixture<MoulBanner>(html`<moul-banner>
      <span slot="icon">!</span>Hi<a slot="action" href="#">Go</a>
    </moul-banner>`)
    // happy-dom does not always fire slotchange for the first assignment.
    for (const slot of filled.shadowRoot?.querySelectorAll('slot[name]') ??
      []) {
      slot.dispatchEvent(new Event('slotchange'))
    }
    await filled.updateComplete
    expect(part(filled, 'icon')?.hidden).toBe(false)
    expect(part(filled, 'action')?.hidden).toBe(false)
  })

  it('applies its defaults and falls back from unknown values', async () => {
    const el = await fixture<MoulBanner>(html`<moul-banner></moul-banner>`)
    expect(el.tone).toBe('primary')
    expect(el.variant).toBe('solid')
    expect(el.isDismissable).toBe(false)
    expect(el.isSticky).toBe(false)
    expect(el.hideOnScroll).toBe(false)
    expect(el.threshold).toBe(24)

    el.tone = 'loud' as never
    el.variant = 'neon' as never
    await el.updateComplete
    expect(el.tone).toBe('primary')
    expect(el.variant).toBe('solid')
  })

  it('takes its colours from the tone tokens', () => {
    expect(rule(':host([tone="success"])')).toContain(
      '--_banner-solid-bg: var(--color-success)',
    )
    expect(rule(':host([variant="flat"])')).toContain(
      '--_banner-bg: var(--_banner-soft-bg)',
    )
    expect(rule('.base')).toContain(
      'background: var(--banner-background, var(--_banner-bg))',
    )
  })

  it('is sticky with is-sticky', () => {
    const sticky = rule(':host([is-sticky])')
    expect(sticky).toContain('position: sticky')
    expect(sticky).toContain('inset-block-start: 0')
  })

  describe('dismissing', () => {
    it('shows a labelled close button with is-dismissable', async () => {
      const el = await fixture<MoulBanner>(
        html`<moul-banner is-dismissable dismiss-label="Hide news">Hi</moul-banner>`,
      )
      const close = part(el, 'close-button') as HTMLButtonElement
      expect(close.localName).toBe('button')
      expect(close.type).toBe('button')
      expect(close.getAttribute('aria-label')).toBe('Hide news')
    })

    it('fires dismiss, folds away and sets hidden', async () => {
      vi.useFakeTimers()
      const el = await fixture<MoulBanner>(
        html`<moul-banner is-dismissable>Hi</moul-banner>`,
      )
      const listener = vi.fn()
      el.addEventListener('dismiss', listener)
      part(el, 'close-button')?.click()
      await el.updateComplete
      expect(listener).toHaveBeenCalledTimes(1)
      expect((listener.mock.calls[0][0] as Event).cancelable).toBe(true)
      expect(part(el, 'base')?.classList.contains('is-dismissing')).toBe(true)
      expect(rule('.base.is-dismissing')).toContain('grid-template-rows: 0fr')
      expect(el.hidden).toBe(false)

      await vi.advanceTimersByTimeAsync(500)
      expect(el.hidden).toBe(true)
    })

    it('hides as soon as the fold finishes', async () => {
      const el = await fixture<MoulBanner>(
        html`<moul-banner is-dismissable>Hi</moul-banner>`,
      )
      const done = el.dismiss()
      await el.updateComplete
      const base = part(el, 'base') as HTMLElement
      const end = new Event('transitionend') as TransitionEvent
      Object.defineProperty(end, 'propertyName', {
        value: 'grid-template-rows',
      })
      base.dispatchEvent(end)
      expect(await done).toBe(true)
      expect(el.hidden).toBe(true)
    })

    it('stays when a listener prevents the dismiss', async () => {
      const el = await fixture<MoulBanner>(
        html`<moul-banner is-dismissable storage-key="kept">Hi</moul-banner>`,
      )
      el.addEventListener('dismiss', (event) => event.preventDefault())
      expect(await el.dismiss()).toBe(false)
      expect(el.hidden).toBe(false)
      expect(localStorage.getItem('moul-banner:kept')).toBeNull()
    })

    it('remembers the dismissal under storage-key and starts hidden next time', async () => {
      const motion = mockReducedMotion(true)
      const el = await fixture<MoulBanner>(
        html`<moul-banner is-dismissable storage-key="launch">Hi</moul-banner>`,
      )
      expect(await el.dismiss()).toBe(true)
      expect(localStorage.getItem('moul-banner:launch')).toBe('dismissed')

      const again = await fixture<MoulBanner>(
        html`<moul-banner storage-key="launch">Hi</moul-banner>`,
      )
      expect(again.hidden).toBe(true)
      const other = await fixture<MoulBanner>(
        html`<moul-banner storage-key="other">Hi</moul-banner>`,
      )
      expect(other.hidden).toBe(false)
      motion.restore()
    })

    it('still works when storage is blocked', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      const motion = mockReducedMotion(true)
      const el = await fixture<MoulBanner>(
        html`<moul-banner is-dismissable storage-key="x">Hi</moul-banner>`,
      )
      expect(el.hidden).toBe(false)
      expect(await el.dismiss()).toBe(true)
      expect(el.hidden).toBe(true)
      motion.restore()
    })
  })

  describe('hide-on-scroll', () => {
    it('slides a sticky banner away on the way down and back on the way up', async () => {
      const el = await fixture<MoulBanner>(
        html`<moul-banner is-sticky hide-on-scroll>Hi</moul-banner>`,
      )
      scrollPage(10)
      await el.updateComplete
      expect(el.isRetracted).toBe(false)

      scrollPage(200)
      await el.updateComplete
      expect(el.isRetracted).toBe(true)
      expect(el.hasAttribute('is-retracted')).toBe(true)
      expect(rule(':host([is-retracted]) .base')).toContain(
        'translate: 0 -100%',
      )
      expect(rule(':host([is-retracted])')).toContain('pointer-events: none')

      scrollPage(120)
      await el.updateComplete
      expect(el.isRetracted).toBe(false)
    })

    it('does nothing for a banner in the normal flow', async () => {
      const el = await fixture<MoulBanner>(
        html`<moul-banner hide-on-scroll>Hi</moul-banner>`,
      )
      scrollPage(400)
      await el.updateComplete
      expect(el.isRetracted).toBe(false)

      el.isSticky = true
      await el.updateComplete
      scrollPage(800)
      await el.updateComplete
      expect(el.isRetracted).toBe(true)

      el.isSticky = false
      await el.updateComplete
      expect(el.isRetracted).toBe(false)
    })

    it('leaves the sliding to a navbar it rides in', async () => {
      const navbar = await fixture(html`<moul-navbar>
        <moul-banner slot="banner" is-sticky hide-on-scroll>Hi</moul-banner>
      </moul-navbar>`)
      const el = navbar.querySelector('moul-banner') as MoulBanner
      await el.updateComplete
      scrollPage(400)
      await el.updateComplete
      expect(el.isRetracted).toBe(false)
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

    it('hides at once on dismiss', async () => {
      const el = await fixture<MoulBanner>(
        html`<moul-banner is-dismissable>Hi</moul-banner>`,
      )
      part(el, 'close-button')?.click()
      await el.updateComplete
      expect(el.hidden).toBe(true)
    })

    it('never hides on scroll, and comes back when the setting turns on', async () => {
      const el = await fixture<MoulBanner>(
        html`<moul-banner is-sticky hide-on-scroll>Hi</moul-banner>`,
      )
      scrollPage(400)
      await el.updateComplete
      expect(el.isRetracted).toBe(false)

      motion.set(false)
      scrollPage(800)
      await el.updateComplete
      expect(el.isRetracted).toBe(true)

      motion.set(true)
      await el.updateComplete
      expect(el.isRetracted).toBe(false)
    })

    it('drops its transitions', () => {
      const start = css.indexOf('@media (prefers-reduced-motion: reduce)')
      expect(start).toBeGreaterThanOrEqual(0)
      const block = css.slice(start, css.indexOf('@media', start + 10))
      expect(block).toContain('.base')
      expect(block).toContain('transition: none !important')
    })
  })
})
