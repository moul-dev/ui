import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import type { MoulButton } from '../Button/Button'
import type { MoulIconMorph } from '../IconMorph/IconMorph'
import './ThemeToggle'
import type { MoulThemeToggle, ThemeToggleChangeDetail } from './ThemeToggle'

const KEY = 'moul-theme'
const REVEAL = 'data-moul-theme-reveal'
const root = () => document.documentElement

/** Replaces `matchMedia('(prefers-color-scheme: dark)')` with a query the test flips. */
function mockSystemTheme(initial: 'light' | 'dark') {
  let isDark = initial === 'dark'
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const original = window.matchMedia
  window.matchMedia = ((query: string): MediaQueryList => {
    if (!query.includes('prefers-color-scheme')) {
      return original.call(window, query)
    }
    return {
      get matches() {
        return isDark
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: any) =>
        listeners.add(listener),
      removeEventListener: (_type: string, listener: any) =>
        listeners.delete(listener),
      addListener: (listener: any) => listeners.add(listener),
      removeListener: (listener: any) => listeners.delete(listener),
      dispatchEvent: () => false,
    } as unknown as MediaQueryList
  }) as typeof window.matchMedia
  return {
    set(theme: 'light' | 'dark') {
      isDark = theme === 'dark'
      for (const listener of [...listeners]) {
        listener({ matches: isDark } as MediaQueryListEvent)
      }
    },
    listenerCount: () => listeners.size,
    restore() {
      window.matchMedia = original
    },
  }
}

/** Stands in for `document.startViewTransition`; the test runs the update callback. */
function stubViewTransitions() {
  let update: (() => unknown) | undefined
  let markReady = () => {}
  let markFinished = () => {}
  const start = vi.fn((callback: () => unknown) => {
    update = callback
    const ready = new Promise<void>((resolve) => {
      markReady = resolve
    })
    const finished = new Promise<void>((resolve) => {
      markFinished = resolve
    })
    return { ready, finished, updateCallbackDone: ready, skipTransition() {} }
  })
  const animate = vi.fn()
  Object.defineProperty(document, 'startViewTransition', {
    value: start,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(root(), 'animate', {
    value: animate,
    configurable: true,
    writable: true,
  })
  return {
    start,
    animate,
    async run() {
      await update?.()
      markReady()
      await flush()
    },
    async finish() {
      markFinished()
      await flush()
    },
    restore() {
      delete (document as any).startViewTransition
      delete (root() as any).animate
    },
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

function parts(el: MoulThemeToggle) {
  const shadow = el.shadowRoot as ShadowRoot
  const button = shadow.querySelector('moul-button') as MoulButton
  return {
    button,
    native: button.shadowRoot?.querySelector('button') as HTMLButtonElement,
    icon: shadow.querySelector('moul-icon-morph') as MoulIconMorph,
    name: button.querySelector('.sr-only')?.textContent?.trim(),
    status: shadow.querySelector('[role="status"]') as HTMLElement,
  }
}

async function settle(...toggles: MoulThemeToggle[]) {
  await flush()
  for (const toggle of toggles) {
    await toggle.updateComplete
    await parts(toggle).button.updateComplete
  }
}

/** A click on the inner native button, as a pointer, Enter or Space gives it. */
async function press(el: MoulThemeToggle, ...others: MoulThemeToggle[]) {
  parts(el).native.click()
  await settle(el, ...others)
}

const theme = () => ({
  dataTheme: root().getAttribute('data-theme'),
  colorScheme: root().style.colorScheme,
})

describe('<moul-theme-toggle>', () => {
  let system: ReturnType<typeof mockSystemTheme>
  let motion: ReducedMotionMock | undefined
  let transitions: ReturnType<typeof stubViewTransitions> | undefined

  beforeEach(() => {
    localStorage.clear()
    system = mockSystemTheme('light')
  })

  afterEach(() => {
    fixtureCleanup()
    transitions?.restore()
    transitions = undefined
    motion?.restore()
    motion = undefined
    system.restore()
    localStorage.clear()
    root().removeAttribute('data-theme')
    root().removeAttribute(REVEAL)
    root().style.removeProperty('color-scheme')
    vi.restoreAllMocks()
  })

  it('renders an icon-only ghost moul-button with the system icon and applies the theme', async () => {
    const el = await fixture<MoulThemeToggle>(
      html`<moul-theme-toggle></moul-theme-toggle>`,
    )
    await settle(el)
    const { button, icon } = parts(el)
    expect(customElements.get('moul-theme-toggle')).toBeDefined()
    expect(button.isIcon).toBe(true)
    expect(button.variant).toBe('ghost')
    expect(button.size).toBe('md')
    expect(icon.name).toBe('system')
    expect(icon.getAttribute('aria-hidden')).toBe('true')
    expect(el.getAttribute('mode')).toBe('system')
    expect(el.resolvedTheme).toBe('light')
    expect(theme()).toEqual({ dataTheme: 'light', colorScheme: 'light dark' })
  })

  it('keeps its inner button press inside and reports through change', async () => {
    const el = await fixture<MoulThemeToggle>(
      html`<moul-theme-toggle></moul-theme-toggle>`,
    )
    const pressed = vi.fn()
    const changed = vi.fn()
    document.addEventListener('press', pressed)
    el.addEventListener('change', changed)
    try {
      await press(el)
      expect(pressed).not.toHaveBeenCalled()
      expect(changed).toHaveBeenCalledTimes(1)
    } finally {
      document.removeEventListener('press', pressed)
    }
  })

  it('forwards variant and size to the button', async () => {
    const el = await fixture<MoulThemeToggle>(
      html`<moul-theme-toggle variant="outline" size="lg"></moul-theme-toggle>`,
    )
    await settle(el)
    expect(parts(el).button.variant).toBe('outline')
    expect(parts(el).button.size).toBe('lg')
  })

  describe('cycling', () => {
    it('cycles system → light → dark → system, applying and storing each mode', async () => {
      system.set('dark')
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle></moul-theme-toggle>`,
      )
      await settle(el)
      expect(theme()).toEqual({ dataTheme: 'dark', colorScheme: 'light dark' })

      await press(el)
      expect(el.mode).toBe('light')
      expect(parts(el).icon.name).toBe('sun')
      expect(theme()).toEqual({ dataTheme: 'light', colorScheme: 'light' })
      expect(localStorage.getItem(KEY)).toBe('light')

      await press(el)
      expect(el.mode).toBe('dark')
      expect(parts(el).icon.name).toBe('moon')
      expect(theme()).toEqual({ dataTheme: 'dark', colorScheme: 'dark' })
      expect(localStorage.getItem(KEY)).toBe('dark')

      await press(el)
      expect(el.mode).toBe('system')
      expect(el.getAttribute('mode')).toBe('system')
      expect(parts(el).icon.name).toBe('system')
      expect(theme()).toEqual({ dataTheme: 'dark', colorScheme: 'light dark' })
      expect(localStorage.getItem(KEY)).toBe('system')
    })

    it('with modes="light dark" starts light and flips between the two', async () => {
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle modes="light dark"></moul-theme-toggle>`,
      )
      await settle(el)
      expect(el.mode).toBe('light')
      await press(el)
      expect(el.mode).toBe('dark')
      await press(el)
      expect(el.mode).toBe('light')
      expect(theme()).toEqual({ dataTheme: 'light', colorScheme: 'light' })
    })

    it('in a mode its modes leave out, shows the theme on screen and switches away from it', async () => {
      system.set('dark')
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle modes="light dark" mode="system"></moul-theme-toggle>`,
      )
      await settle(el)
      expect(el.mode).toBe('system')
      expect(parts(el).icon.name).toBe('moon')
      expect(parts(el).name).toBe('Theme: Dark. Switch to Light.')
      await press(el)
      expect(el.mode).toBe('light')
    })

    it('ignores unknown and repeated entries in modes', async () => {
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle modes="dark  sepia dark light"></moul-theme-toggle>`,
      )
      await settle(el)
      expect(el.mode).toBe('dark')
      await press(el)
      expect(el.mode).toBe('light')
      await press(el)
      expect(el.mode).toBe('dark')
    })
  })

  describe('storage', () => {
    it('starts from the stored mode, which wins over the mode attribute', async () => {
      localStorage.setItem(KEY, 'dark')
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle mode="light"></moul-theme-toggle>`,
      )
      await settle(el)
      expect(el.mode).toBe('dark')
      expect(theme()).toEqual({ dataTheme: 'dark', colorScheme: 'dark' })
    })

    it('uses the mode attribute when nothing is stored', async () => {
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle mode="dark"></moul-theme-toggle>`,
      )
      await settle(el)
      expect(el.mode).toBe('dark')
    })

    it('ignores stored values that are not a mode or not in modes', async () => {
      localStorage.setItem(KEY, 'sepia')
      const first = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle mode="dark"></moul-theme-toggle>`,
      )
      await settle(first)
      expect(first.mode).toBe('dark')
      fixtureCleanup()

      localStorage.setItem(KEY, 'system')
      const second = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle modes="dark light"></moul-theme-toggle>`,
      )
      await settle(second)
      expect(second.mode).toBe('dark')
    })

    it('reads and writes a custom storage-key', async () => {
      localStorage.setItem('app-theme', 'light')
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle storage-key="app-theme"></moul-theme-toggle>`,
      )
      await settle(el)
      expect(el.mode).toBe('light')
      await press(el)
      expect(localStorage.getItem('app-theme')).toBe('dark')
      expect(localStorage.getItem(KEY)).toBeNull()
    })

    it('with an empty storage-key neither reads nor writes', async () => {
      localStorage.setItem(KEY, 'dark')
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle storage-key=""></moul-theme-toggle>`,
      )
      await settle(el)
      expect(el.mode).toBe('system')
      await press(el)
      expect(el.mode).toBe('light')
      expect(localStorage.getItem(KEY)).toBe('dark')
      expect(theme().colorScheme).toBe('light')
    })

    it('still switches when storage throws', async () => {
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      expect(() => localStorage.getItem(KEY)).toThrow('blocked')
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle></moul-theme-toggle>`,
      )
      await settle(el)
      await press(el)
      expect(el.mode).toBe('light')
      expect(theme().dataTheme).toBe('light')
    })
  })

  describe('sync', () => {
    it('follows prefers-color-scheme live in system mode', async () => {
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle></moul-theme-toggle>`,
      )
      await settle(el)
      expect(system.listenerCount()).toBe(1)
      system.set('dark')
      await settle(el)
      expect(theme()).toEqual({ dataTheme: 'dark', colorScheme: 'light dark' })
      expect(el.resolvedTheme).toBe('dark')
      expect(parts(el).name).toBe('Theme: System (Dark). Switch to Light.')
    })

    it('ignores OS changes outside system mode', async () => {
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle mode="light"></moul-theme-toggle>`,
      )
      await settle(el)
      system.set('dark')
      await settle(el)
      expect(theme()).toEqual({ dataTheme: 'light', colorScheme: 'light' })
    })

    it('keeps every toggle on the page on one mode', async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div>
          <moul-theme-toggle></moul-theme-toggle>
          <moul-theme-toggle mode="dark" modes="light dark"></moul-theme-toggle>
        </div>
      `)
      const [a, b] = wrapper.querySelectorAll('moul-theme-toggle')
      await settle(a, b)
      // The second joins the mode the first started with.
      expect(b.mode).toBe('system')

      await press(a, b)
      expect(b.mode).toBe('light')
      expect(parts(b).icon.name).toBe('sun')
      expect(parts(b).name).toBe('Theme: Light. Switch to Dark.')

      await press(b, a)
      expect(a.mode).toBe('dark')
      expect(parts(a).icon.name).toBe('moon')
    })

    it('switches every toggle when mode is set from outside, without change', async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div>
          <moul-theme-toggle></moul-theme-toggle>
          <moul-theme-toggle></moul-theme-toggle>
        </div>
      `)
      const [a, b] = wrapper.querySelectorAll('moul-theme-toggle')
      await settle(a, b)
      const onChange = vi.fn()
      wrapper.addEventListener('change', onChange)

      a.mode = 'dark'
      await settle(a, b)
      expect(b.mode).toBe('dark')
      expect(theme()).toEqual({ dataTheme: 'dark', colorScheme: 'dark' })
      expect(localStorage.getItem(KEY)).toBe('dark')

      b.setAttribute('mode', 'light')
      await settle(a, b)
      expect(a.mode).toBe('light')
      expect(theme().dataTheme).toBe('light')

      a.mode = 'sepia' as never
      await settle(a, b)
      expect(a.mode).toBe('light')
      expect(onChange).not.toHaveBeenCalled()
    })

    it('follows a mode another tab stores', async () => {
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle></moul-theme-toggle>`,
      )
      await settle(el)
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'other', newValue: 'dark' }),
      )
      window.dispatchEvent(
        new StorageEvent('storage', { key: KEY, newValue: 'sepia' }),
      )
      await settle(el)
      expect(el.mode).toBe('system')

      window.dispatchEvent(
        new StorageEvent('storage', { key: KEY, newValue: 'dark' }),
      )
      await settle(el)
      expect(el.mode).toBe('dark')
      expect(parts(el).icon.name).toBe('moon')
      expect(theme()).toEqual({ dataTheme: 'dark', colorScheme: 'dark' })
      expect(parts(el).status.textContent?.trim()).toBe('')
    })
  })

  describe('change', () => {
    it('fires a cancelable change with the new mode and theme before applying it', async () => {
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle></moul-theme-toggle>`,
      )
      await settle(el)
      const seen: Array<
        ThemeToggleChangeDetail & { dataTheme: string | null }
      > = []
      el.addEventListener('change', (event) => {
        const { detail, bubbles, composed, cancelable } =
          event as CustomEvent<ThemeToggleChangeDetail>
        expect({ bubbles, composed, cancelable }).toEqual({
          bubbles: true,
          composed: true,
          cancelable: true,
        })
        seen.push({ ...detail, dataTheme: theme().dataTheme })
      })
      await press(el)
      await press(el)
      expect(seen).toEqual([
        { mode: 'light', resolvedTheme: 'light', dataTheme: 'light' },
        { mode: 'dark', resolvedTheme: 'dark', dataTheme: 'light' },
      ])
    })

    it('when cancelled leaves <html> and storage to the app but still moves the toggles', async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div>
          <moul-theme-toggle mode="light"></moul-theme-toggle>
          <moul-theme-toggle></moul-theme-toggle>
        </div>
      `)
      const [a, b] = wrapper.querySelectorAll('moul-theme-toggle')
      await settle(a, b)
      a.addEventListener('change', (event) => event.preventDefault())

      await press(a, b)
      expect(a.mode).toBe('dark')
      expect(b.mode).toBe('dark')
      expect(parts(a).icon.name).toBe('moon')
      expect(theme()).toEqual({ dataTheme: 'light', colorScheme: 'light' })
      expect(localStorage.getItem(KEY)).toBeNull()

      // System mode set by the app: OS changes still leave <html> alone.
      await press(a, b)
      expect(a.mode).toBe('system')
      system.set('dark')
      await settle(a, b)
      expect(theme()).toEqual({ dataTheme: 'light', colorScheme: 'light' })
      expect(a.resolvedTheme).toBe('dark')
    })
  })

  describe('reveal', () => {
    it('reveals the new theme in a circle from the button centre inside a view transition', async () => {
      transitions = stubViewTransitions()
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle></moul-theme-toggle>`,
      )
      await settle(el)
      el.getBoundingClientRect = () =>
        ({ left: 100, top: 200, width: 40, height: 40 }) as DOMRect
      const onChange = vi.fn()
      el.addEventListener('change', onChange)
      const sheets = document.adoptedStyleSheets.length

      await press(el)
      expect(transitions.start).toHaveBeenCalledTimes(1)
      expect(root().hasAttribute(REVEAL)).toBe(true)
      expect(document.adoptedStyleSheets).toHaveLength(sheets + 1)
      // `change` waits for the update callback, so the reveal captures it.
      expect(onChange).not.toHaveBeenCalled()
      expect(el.mode).toBe('system')

      await transitions.run()
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(el.mode).toBe('light')
      const radius = Math.ceil(
        Math.hypot(
          Math.max(120, window.innerWidth - 120),
          Math.max(220, window.innerHeight - 220),
        ),
      )
      expect(transitions.animate).toHaveBeenCalledWith(
        {
          clipPath: [
            'circle(0px at 120px 220px)',
            `circle(${radius}px at 120px 220px)`,
          ],
        },
        expect.objectContaining({
          duration: 450,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        }),
      )

      await transitions.finish()
      expect(root().hasAttribute(REVEAL)).toBe(false)

      // The stylesheet is added once and only applies while the attribute is set.
      await press(el)
      expect(document.adoptedStyleSheets).toHaveLength(sheets + 1)
      const sheet = document.adoptedStyleSheets.at(-1) as CSSStyleSheet
      const rules = [...sheet.cssRules].map((rule) => rule.cssText).join('')
      expect(rules).toContain(REVEAL)
    })

    it('switches at once with transition="none"', async () => {
      transitions = stubViewTransitions()
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle transition="none"></moul-theme-toggle>`,
      )
      await settle(el)
      await press(el)
      expect(transitions.start).not.toHaveBeenCalled()
      expect(el.mode).toBe('light')
      expect(root().hasAttribute(REVEAL)).toBe(false)
    })

    it('switches at once under reduced motion', async () => {
      transitions = stubViewTransitions()
      motion = mockReducedMotion(true)
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle></moul-theme-toggle>`,
      )
      await settle(el)
      await press(el)
      expect(transitions.start).not.toHaveBeenCalled()
      expect(el.mode).toBe('light')
      expect(theme().dataTheme).toBe('light')
    })

    it('switches at once without the View Transitions API', async () => {
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle></moul-theme-toggle>`,
      )
      await settle(el)
      expect(typeof document.startViewTransition).not.toBe('function')
      await press(el)
      expect(el.mode).toBe('light')
    })
  })

  describe('keyboard and screen readers', () => {
    it('is one tab stop: the native button inside moul-button', async () => {
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle></moul-theme-toggle>`,
      )
      await settle(el)
      const { button, native } = parts(el)
      expect(native.localName).toBe('button')
      expect(native.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(button.hasAttribute('tabindex')).toBe(false)
      expect(el.shadowRoot?.querySelectorAll('[tabindex]')).toHaveLength(0)
    })

    it('presses on Enter and Space', async () => {
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle></moul-theme-toggle>`,
      )
      await settle(el)
      const { native } = parts(el)
      native.focus()
      // The browser turns Enter (keydown) and Space (keyup) into one click.
      native.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      )
      await press(el)
      expect(el.mode).toBe('light')
      native.dispatchEvent(
        new KeyboardEvent('keyup', { key: ' ', bubbles: true }),
      )
      await press(el)
      expect(el.mode).toBe('dark')
    })

    it('names the button after the mode and the next one', async () => {
      system.set('dark')
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle></moul-theme-toggle>`,
      )
      await settle(el)
      expect(parts(el).name).toBe('Theme: System (Dark). Switch to Light.')
      await press(el)
      expect(parts(el).name).toBe('Theme: Light. Switch to Dark.')
      await press(el)
      expect(parts(el).name).toBe('Theme: Dark. Switch to System.')
    })

    it('takes every word from labels', async () => {
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle
          .labels=${{
            system: 'Système',
            light: 'Clair',
            dark: 'Sombre',
            name: 'Thème : {mode}. Passer à {next}.',
            systemName: 'Thème : {mode} ({theme}). Passer à {next}.',
            announcement: 'Thème {mode}',
          }}
        ></moul-theme-toggle>`,
      )
      await settle(el)
      expect(parts(el).name).toBe('Thème : Système (Clair). Passer à Clair.')
      await press(el)
      expect(parts(el).name).toBe('Thème : Clair. Passer à Sombre.')
      expect(parts(el).status.textContent?.trim()).toBe('Thème Clair')
    })

    it('fills in the default words a partial labels object leaves out', async () => {
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle .labels=${{ dark: 'Night' }} mode="light"></moul-theme-toggle>`,
      )
      await settle(el)
      expect(parts(el).name).toBe('Theme: Light. Switch to Night.')
    })

    it('uses an aria-label on the host as the whole name', async () => {
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle aria-label="Colour scheme"></moul-theme-toggle>`,
      )
      await settle(el)
      expect(parts(el).name).toBe('Colour scheme')
      await press(el)
      expect(parts(el).name).toBe('Colour scheme')
      expect(parts(el).status.textContent?.trim()).toBe('Light theme')
    })

    it('announces the new mode in a polite live region of the pressed toggle only', async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div>
          <moul-theme-toggle></moul-theme-toggle>
          <moul-theme-toggle></moul-theme-toggle>
        </div>
      `)
      const [a, b] = wrapper.querySelectorAll('moul-theme-toggle')
      await settle(a, b)
      const { status } = parts(a)
      expect(status.getAttribute('role')).toBe('status')
      expect(status.textContent?.trim()).toBe('')

      await press(a, b)
      expect(status.textContent?.trim()).toBe('Light theme')
      await press(a, b)
      expect(status.textContent?.trim()).toBe('Dark theme')
      expect(parts(b).status.textContent?.trim()).toBe('')
    })
  })

  describe('cleanup', () => {
    it('stops listening once the last toggle leaves and starts again from storage', async () => {
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle></moul-theme-toggle>`,
      )
      await settle(el)
      await press(el)
      expect(system.listenerCount()).toBe(1)

      el.remove()
      expect(system.listenerCount()).toBe(0)
      window.dispatchEvent(
        new StorageEvent('storage', { key: KEY, newValue: 'dark' }),
      )
      expect(theme().dataTheme).toBe('light')

      localStorage.setItem(KEY, 'dark')
      const next = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle></moul-theme-toggle>`,
      )
      await settle(next)
      expect(next.mode).toBe('dark')
      expect(system.listenerCount()).toBe(1)
    })

    it('keeps listening while another toggle remains', async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div>
          <moul-theme-toggle></moul-theme-toggle>
          <moul-theme-toggle></moul-theme-toggle>
        </div>
      `)
      const [a, b] = wrapper.querySelectorAll('moul-theme-toggle')
      await settle(a, b)
      a.remove()
      expect(system.listenerCount()).toBe(1)
      system.set('dark')
      await settle(b)
      expect(theme().dataTheme).toBe('dark')
    })

    it('ignores a reveal callback that runs after the toggle left', async () => {
      transitions = stubViewTransitions()
      const el = await fixture<MoulThemeToggle>(
        html`<moul-theme-toggle></moul-theme-toggle>`,
      )
      await settle(el)
      const onChange = vi.fn()
      el.addEventListener('change', onChange)
      await press(el)
      el.remove()
      await transitions.run()
      await transitions.finish()
      expect(onChange).not.toHaveBeenCalled()
      expect(root().hasAttribute(REVEAL)).toBe(false)
      expect(theme().dataTheme).toBe('light')
    })
  })
})
