import { fixtureCleanup } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import './index'
import type { MoulProgressNav } from './ProgressNav'
import { progressNavStyles } from './ProgressNav.styles'

const css = progressNavStyles.cssText

/** Lets renders and slot changes run. */
const settle = () => new Promise((resolve) => setTimeout(resolve))

const VIEWPORT = 1000
/** Where each heading sits in the page, in px from its top. */
const POSITIONS = [400, 1200, 1600, 2400, 3200]

/**
 * A page with a 4000px scroll range in a 1000px viewport, whose headings
 * move up as it scrolls. Headings report their place through
 * getBoundingClientRect, since happy-dom does no layout.
 */
function mockPage() {
  const page = document.scrollingElement ?? document.documentElement
  let top = 0
  const originalHeight = window.innerHeight
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: VIEWPORT,
  })
  Object.defineProperties(page, {
    scrollHeight: { configurable: true, get: () => 5000 },
    clientHeight: { configurable: true, get: () => VIEWPORT },
    scrollTop: {
      configurable: true,
      get: () => top,
      set: (value: number) => {
        top = value
      },
    },
  })
  return {
    get top() {
      return top
    },
    scrollTo(value: number) {
      top = value
      window.dispatchEvent(new Event('scroll'))
    },
    place(el: Element, at: number) {
      el.getBoundingClientRect = () =>
        ({
          top: at - top,
          bottom: at - top + 32,
          left: 0,
          right: 600,
          width: 600,
          height: 32,
          x: 0,
          y: at - top,
          toJSON: () => ({}),
        }) as DOMRect
    },
    restore() {
      const own = page as unknown as Record<string, unknown>
      delete own.scrollHeight
      delete own.clientHeight
      delete own.scrollTop
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: originalHeight,
      })
    },
  }
}

type Page = ReturnType<typeof mockPage>

/** An article with h2 and h3 headings, one without text-derived id clashes. */
function article(page: Page, id = 'article'): HTMLElement {
  const el = document.createElement('article')
  el.id = id
  el.innerHTML = `
    <h2>Getting started</h2><p>…</p>
    <h3 id="install">Install</h3><p>…</p>
    <h3>Import</h3><p>…</p>
    <h2>Theming</h2><p>…</p>
    <h2>Getting started</h2><p>…</p>
  `
  document.body.append(el)
  el.querySelectorAll('h2, h3').forEach((heading, i) => {
    page.place(heading, POSITIONS[i])
  })
  return el
}

async function mount(attrs = 'for="article"'): Promise<MoulProgressNav> {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = `<moul-progress-nav ${attrs}></moul-progress-nav>`
  const el = wrapper.firstElementChild as MoulProgressNav
  document.body.append(el)
  await el.updateComplete
  return el
}

const shadow = (el: MoulProgressNav) => el.shadowRoot as ShadowRoot
const pill = (el: MoulProgressNav) =>
  shadow(el).querySelector<HTMLButtonElement>(
    '[part="pill"]',
  ) as HTMLButtonElement
const base = (el: MoulProgressNav) =>
  shadow(el).querySelector<HTMLElement>('[part="base"]') as HTMLElement
const current = (el: MoulProgressNav) =>
  shadow(el)
    .querySelector('[part="current"] .text:not(.leaving)')
    ?.textContent?.trim()
const links = (el: MoulProgressNav) => [
  ...shadow(el).querySelectorAll<HTMLAnchorElement>('[part="link"]'),
]

describe('<moul-progress-nav>', () => {
  let frames: ManualFrames
  let motion: ReducedMotionMock
  let page: Page

  beforeEach(() => {
    frames = manualAnimationFrames()
    motion = mockReducedMotion(false)
    page = mockPage()
  })

  afterEach(() => {
    fixtureCleanup()
    document.body.innerHTML = ''
    page.restore()
    motion.restore()
    frames.restore()
    history.replaceState(null, '', location.pathname)
  })

  async function scrollTo(el: MoulProgressNav, top: number, time = 16) {
    page.scrollTo(top)
    frames.step(time)
    await el.updateComplete
  }

  it('is a labelled nav with a pill that controls the list', async () => {
    article(page)
    const el = await mount()
    const nav = base(el)
    expect(nav.localName).toBe('nav')
    expect(nav.getAttribute('aria-label')).toBe('On this page')
    expect(pill(el).getAttribute('aria-expanded')).toBe('false')
    expect(pill(el).getAttribute('aria-controls')).toBe('panel')
    expect(shadow(el).getElementById('panel')).not.toBeNull()
    expect(
      shadow(el).querySelector('[part="ring"]')?.getAttribute('aria-hidden'),
    ).toBe('true')
  })

  it('applies its defaults and falls back from an unknown placement', async () => {
    const el = await mount('placement="sideways"')
    expect(el.headings).toBe('h2, h3')
    expect(el.placement).toBe('bottom')
    expect(el.label).toBe('On this page')
    expect(el.isAlwaysVisible).toBe(false)
  })

  it('lists the headings in its article and gives each one without an id a unique one', async () => {
    const container = article(page)
    const el = await mount()
    const ids = [...container.querySelectorAll('h2, h3')].map((h) => h.id)
    expect(ids).toEqual([
      'getting-started',
      'install',
      'import',
      'theming',
      'getting-started-2',
    ])
    expect(links(el).map((link) => link.getAttribute('href'))).toEqual(
      ids.map((id) => `#${id}`),
    )
  })

  it('nests deeper headings under the one before them', async () => {
    article(page)
    const el = await mount()
    const root = shadow(el).querySelector('#list') as HTMLElement
    const child = (li: Element, tag: string) =>
      [...li.children].find((node) => node.localName === tag)
    const topLevel = [...root.children].map((li) => child(li, 'a')?.textContent)
    expect(topLevel).toEqual(['Getting started', 'Theming', 'Getting started'])
    const nested = child(root.children[0], 'ol')
    expect(
      [...(nested?.querySelectorAll('a') ?? [])].map((a) => a.textContent),
    ).toEqual(['Install', 'Import'])
  })

  it('reads headings from main, then the body, when for is empty', async () => {
    const main = document.createElement('main')
    main.innerHTML = '<h2>Inside main</h2>'
    document.body.append(main)
    const outside = document.createElement('h2')
    outside.textContent = 'Outside main'
    document.body.append(outside)
    const el = await mount('')
    expect(links(el).map((link) => link.textContent)).toEqual(['Inside main'])
  })

  it('uses the headings selector', async () => {
    article(page)
    const el = await mount('for="article" headings="h2"')
    expect(links(el)).toHaveLength(3)
  })

  it('waits for an article that is not there yet', async () => {
    const el = await mount('for="later"')
    expect(links(el)).toHaveLength(0)
    article(page, 'later')
    await settle()
    await el.updateComplete
    expect(links(el)).toHaveLength(5)
  })

  describe('the active heading', () => {
    it('stays hidden until the reader reaches the first heading', async () => {
      article(page)
      const el = await mount()
      expect(base(el).hasAttribute('data-shown')).toBe(false)
      expect(el.activeHeading).toBeNull()

      // The first heading (at 400) passes the line 250px down the view.
      await scrollTo(el, 200)
      expect(base(el).hasAttribute('data-shown')).toBe(true)
      expect(current(el)).toBe('Getting started')
    })

    it('shows from the start with is-always-visible, naming the list', async () => {
      article(page)
      const el = await mount('for="article" is-always-visible')
      expect(base(el).hasAttribute('data-shown')).toBe(true)
      expect(current(el)).toBe('On this page')
    })

    it('follows the last heading that has passed a quarter of the way down', async () => {
      const container = article(page)
      const el = await mount()
      const headings = [...container.querySelectorAll('h2, h3')]

      await scrollTo(el, 1000) // Install (1200) is at 200
      expect(el.activeHeading).toBe(headings[1])
      expect(current(el)).toBe('Install')

      await scrollTo(el, 1500, 32) // Import (1600) is at 100
      expect(el.activeHeading).toBe(headings[2])

      await scrollTo(el, 300, 48)
      expect(el.activeHeading).toBe(headings[0])
    })

    it('takes the last heading in view at the very end of the page', async () => {
      const container = article(page)
      const el = await mount()
      // The range ends at 4000: the last heading (3200) is at -800 then, but
      // a short final section would never reach the line; here Theming
      // (2400) is the last one passed and the last one is in view anyway.
      const last = container.querySelectorAll('h2, h3')[4]
      page.place(last, 4600)
      await scrollTo(el, 4000)
      expect(el.activeHeading).toBe(last)
    })

    it('slides the old heading away, hidden from screen readers', async () => {
      article(page)
      const el = await mount()
      await scrollTo(el, 200)
      await scrollTo(el, 1000, 32)
      const leaving = shadow(el).querySelector('.leaving')
      expect(leaving?.textContent?.trim()).toBe('Getting started')
      expect(leaving?.getAttribute('aria-hidden')).toBe('true')
      expect(
        shadow(el)
          .querySelector('[part="current"]')
          ?.getAttribute('data-direction'),
      ).toBe('forward')

      leaving?.dispatchEvent(new Event('animationend'))
      await el.updateComplete
      expect(shadow(el).querySelector('.leaving')).toBeNull()
    })

    it('reads the active heading after the label, for screen readers', async () => {
      article(page)
      const el = await mount()
      await scrollTo(el, 200)
      expect(pill(el).textContent?.replace(/\s+/g, ' ').trim()).toBe(
        'On this page: Getting started',
      )
    })

    it('fills the ring from the scroll progress', async () => {
      article(page)
      const el = await mount()
      await scrollTo(el, 2000)
      expect(el.style.getPropertyValue('--scroll-progress')).toBe('0.5')
      expect(css).toContain(
        'stroke-dashoffset: calc((1 - var(--scroll-progress, 0)) * 100px)',
      )
    })
  })

  describe('the list', () => {
    it('opens from the pill, marking the active heading', async () => {
      article(page)
      const el = await mount()
      await scrollTo(el, 1000)
      const onOpen = vi.fn()
      el.addEventListener('openchange', onOpen)

      pill(el).click()
      await el.updateComplete
      expect(el.isOpen).toBe(true)
      expect(pill(el).getAttribute('aria-expanded')).toBe('true')
      expect(base(el).hasAttribute('data-open')).toBe(true)
      expect(onOpen).toHaveBeenCalledOnce()
      expect(onOpen.mock.calls[0][0].detail).toEqual({ isOpen: true })
      const currentLinks = links(el).filter((link) =>
        link.hasAttribute('aria-current'),
      )
      expect(currentLinks.map((link) => link.textContent)).toEqual(['Install'])
      expect(currentLinks[0].getAttribute('aria-current')).toBe('location')
    })

    it('closes on Escape and returns focus to the pill', async () => {
      article(page)
      const el = await mount()
      await scrollTo(el, 1000)
      pill(el).click()
      await el.updateComplete
      links(el)[0].focus()
      links(el)[0].dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          composed: true,
        }),
      )
      await el.updateComplete
      expect(el.isOpen).toBe(false)
      expect(shadow(el).activeElement).toBe(pill(el))
    })

    it('opens with Down on the pill and moves through the links with the arrows', async () => {
      article(page)
      const el = await mount()
      await scrollTo(el, 1000)
      pill(el).focus()
      pill(el).dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          bubbles: true,
          composed: true,
        }),
      )
      await el.updateComplete
      await el.updateComplete
      expect(el.isOpen).toBe(true)
      // Focus lands on the active link.
      expect(shadow(el).activeElement?.textContent).toBe('Install')

      const key = (name: string) =>
        (shadow(el).activeElement as HTMLElement).dispatchEvent(
          new KeyboardEvent('keydown', {
            key: name,
            bubbles: true,
            composed: true,
          }),
        )
      key('ArrowDown')
      expect(shadow(el).activeElement?.textContent).toBe('Import')
      key('End')
      expect(
        links(el).indexOf(shadow(el).activeElement as HTMLAnchorElement),
      ).toBe(4)
      key('Home')
      expect(
        links(el).indexOf(shadow(el).activeElement as HTMLAnchorElement),
      ).toBe(0)
      key('ArrowUp')
      expect(
        links(el).indexOf(shadow(el).activeElement as HTMLAnchorElement),
      ).toBe(0)
    })

    it('closes when a press lands outside it', async () => {
      article(page)
      const el = await mount()
      await scrollTo(el, 1000)
      pill(el).click()
      await el.updateComplete
      document.body.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, composed: true }),
      )
      expect(el.isOpen).toBe(false)
    })

    it('jumps smoothly to a heading, focuses it and records it in the address', async () => {
      const container = article(page)
      const el = await mount()
      await scrollTo(el, 1000)
      pill(el).click()
      await el.updateComplete
      const theming = container.querySelectorAll('h2, h3')[3] as HTMLElement
      const scrollIntoView = vi.fn()
      theming.scrollIntoView = scrollIntoView

      links(el)[3].dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }),
      )
      await el.updateComplete
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      })
      expect(theming.getAttribute('tabindex')).toBe('-1')
      expect(document.activeElement).toBe(theming)
      expect(location.hash).toBe('#theming')
      expect(el.isOpen).toBe(false)
      expect(el.activeHeading).toBe(theming)
    })
  })

  describe('reduced motion', () => {
    it('jumps to a heading at once', async () => {
      motion.set(true)
      const container = article(page)
      const el = await mount()
      await scrollTo(el, 1000)
      const install = container.querySelectorAll('h2, h3')[1] as HTMLElement
      const scrollIntoView = vi.fn()
      install.scrollIntoView = scrollIntoView
      links(el)[1].dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }),
      )
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'start',
      })
    })

    it('swaps the heading text in place, with nothing sliding away', async () => {
      motion.set(true)
      article(page)
      const el = await mount()
      await scrollTo(el, 200)
      await scrollTo(el, 1000, 32)
      expect(current(el)).toBe('Install')
      expect(shadow(el).querySelector('.leaving')).toBeNull()
    })

    it('turns off every transition and animation in its styles', () => {
      const block = css.slice(css.indexOf('@media (prefers-reduced-motion'))
      expect(block).toContain('transition: none')
      expect(block).toContain('animation: none')
      expect(block).toMatch(/\.leaving\s*\{\s*display: none/)
    })
  })

  it('stops following the page when it is removed', async () => {
    article(page)
    const el = await mount()
    el.remove()
    expect(() => page.scrollTo(1000)).not.toThrow()
    frames.step(16)
    expect(el.style.getPropertyValue('--scroll-progress')).toBe('0')
  })
})
