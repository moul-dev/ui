import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './index'
import type { MoulNavigationMenu } from './NavigationMenu'
import {
  navigationMenuItemStyles,
  navigationMenuLinkStyles,
  navigationMenuStyles,
} from './NavigationMenu.styles'
import type { MoulNavigationMenuItem } from './NavigationMenuItem'
import type { MoulNavigationMenuLink } from './NavigationMenuLink'

const cssOf = (styles: unknown[]) =>
  styles
    .map((sheet) =>
      sheet && typeof sheet === 'object' && 'cssText' in sheet
        ? String(sheet.cssText)
        : '',
    )
    .join('\n')

const menuCss = cssOf(navigationMenuStyles)
const itemCss = cssOf(navigationMenuItemStyles)
const linkCss = cssOf(navigationMenuLinkStyles)

/** The body of the first `@media` block whose query starts with `query`. */
function mediaBlock(css: string, query: string): string {
  const start = css.indexOf(`@media ${query}`)
  if (start < 0) return ''
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) {
      return css.slice(css.indexOf('{', start) + 1, i)
    }
  }
  return ''
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

async function settle(menu: MoulNavigationMenu): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await menu.updateComplete
    await Promise.all(menu.items.map((item) => item.updateComplete))
    await tick()
  }
}

function template(orientation = 'horizontal') {
  return html`<moul-navigation-menu orientation=${orientation}>
    <moul-navigation-menu-item label="Products">
      <moul-navigation-menu-link
        href="/docs/"
        label="Components"
        description="Ninety elements."
      ></moul-navigation-menu-link>
      <a href="/kit/">Landing kit</a>
    </moul-navigation-menu-item>
    <moul-navigation-menu-item label="Resources" value="res">
      <a href="/guides/">Guides</a>
    </moul-navigation-menu-item>
    <moul-navigation-menu-item label="Pricing" href="/pricing/" is-current></moul-navigation-menu-item>
  </moul-navigation-menu>`
}

const items = (menu: MoulNavigationMenu) =>
  menu.items as [
    MoulNavigationMenuItem,
    MoulNavigationMenuItem,
    MoulNavigationMenuItem,
  ]
const trigger = (item: MoulNavigationMenuItem) =>
  item.triggerEl as HTMLButtonElement

function pointer(
  target: EventTarget,
  type: string,
  pointerType = 'mouse',
): void {
  const event = new Event(type, { bubbles: true, composed: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  target.dispatchEvent(event)
}

/** A click from a mouse (one click counted); keyboard clicks count none. */
function mouseClick(target: HTMLElement): void {
  target.dispatchEvent(
    new MouseEvent('click', { bubbles: true, composed: true, detail: 1 }),
  )
}

function key(target: EventTarget, name: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
  return event
}

/** The element focus is on, looking through shadow roots. */
function deepActive(): Element | null {
  let active = document.activeElement
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement
  }
  return active
}

describe('<moul-navigation-menu>', () => {
  let motion: ReducedMotionMock

  beforeEach(() => {
    motion = mockReducedMotion(false)
  })

  afterEach(() => {
    vi.useRealTimers()
    fixtureCleanup()
    motion.restore()
  })

  it('renders a list of items with native triggers and links', async () => {
    const menu = await fixture<MoulNavigationMenu>(template())
    await settle(menu)
    const list = menu.shadowRoot?.querySelector('[part="list"]')
    expect(list?.getAttribute('role')).toBe('list')
    const [products, resources, pricing] = items(menu)
    expect(products.getAttribute('role')).toBe('listitem')

    const button = trigger(products)
    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(button.getAttribute('aria-controls')).toBe('panel')
    expect(products.panelEl?.id).toBe('panel')
    expect(resources.itemValue).toBe('res')
    expect(products.itemValue).toBe('Products')

    const link = trigger(pricing)
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('/pricing/')
    expect(link.getAttribute('aria-current')).toBe('page')
    expect(pricing.panelEl).toBeNull()
    expect(pricing.hasPanel).toBe(false)
  })

  it('a keyboard click opens a panel, moves focus to its first link and fires openchange', async () => {
    const menu = await fixture<MoulNavigationMenu>(template())
    await settle(menu)
    const values: string[] = []
    menu.addEventListener('openchange', (event) => {
      values.push((event as CustomEvent).detail.value)
    })
    const [products] = items(menu)

    trigger(products).click()
    await settle(menu)

    expect(menu.value).toBe('Products')
    expect(values).toEqual(['Products'])
    expect(products.isOpen).toBe(true)
    expect(products.hasAttribute('is-open')).toBe(true)
    expect(trigger(products).getAttribute('aria-expanded')).toBe('true')
    expect(products.panelEl?.hasAttribute('data-open')).toBe(true)
    const card = products.querySelector(
      'moul-navigation-menu-link',
    ) as MoulNavigationMenuLink
    expect(deepActive()).toBe(card.linkEl)
  })

  it('a mouse click toggles a panel without moving focus', async () => {
    const menu = await fixture<MoulNavigationMenu>(template())
    await settle(menu)
    const [, resources] = items(menu)

    mouseClick(trigger(resources))
    await settle(menu)
    expect(menu.value).toBe('res')
    expect(deepActive()).not.toBe(resources.querySelector('a'))

    mouseClick(trigger(resources))
    await settle(menu)
    expect(menu.value).toBe('')
    expect(resources.isOpen).toBe(false)
  })

  it('hover opens after a short delay, morphs straight to the next item, and closes once the pointer leaves', async () => {
    const menu = await fixture<MoulNavigationMenu>(template())
    await settle(menu)
    vi.useFakeTimers()
    const [products, resources] = items(menu)

    pointer(trigger(products), 'pointerover')
    expect(menu.value).toBe('')
    vi.advanceTimersByTime(130)
    expect(menu.value).toBe('Products')

    // Already open: the next trigger takes over at once.
    pointer(trigger(resources), 'pointerover')
    expect(menu.value).toBe('res')

    pointer(menu, 'pointerleave')
    vi.advanceTimersByTime(200)
    expect(menu.value).toBe('res')
    vi.advanceTimersByTime(100)
    expect(menu.value).toBe('')
  })

  it('a pointer returning to the panel before the delay keeps it open', async () => {
    const menu = await fixture<MoulNavigationMenu>(template())
    await settle(menu)
    const [products] = items(menu)
    mouseClick(trigger(products))
    await settle(menu)
    vi.useFakeTimers()

    pointer(menu, 'pointerleave')
    vi.advanceTimersByTime(100)
    pointer(products.querySelector('a') as HTMLElement, 'pointerover')
    vi.advanceTimersByTime(400)
    expect(menu.value).toBe('Products')
  })

  it('ignores touch hover and keeps a hover-opened panel open on the click that follows', async () => {
    const menu = await fixture<MoulNavigationMenu>(template())
    await settle(menu)
    vi.useFakeTimers()
    const [products] = items(menu)

    pointer(trigger(products), 'pointerover', 'touch')
    vi.advanceTimersByTime(500)
    expect(menu.value).toBe('')

    pointer(trigger(products), 'pointerover')
    vi.advanceTimersByTime(130)
    expect(menu.value).toBe('Products')
    mouseClick(trigger(products))
    expect(menu.value).toBe('Products')
  })

  it('arrow keys, Home and End move focus between the items', async () => {
    const menu = await fixture<MoulNavigationMenu>(template())
    await settle(menu)
    const [products, resources, pricing] = items(menu)

    trigger(products).focus()
    key(trigger(products), 'ArrowRight')
    expect(deepActive()).toBe(trigger(resources))
    key(trigger(resources), 'ArrowRight')
    expect(deepActive()).toBe(trigger(pricing))
    key(trigger(pricing), 'ArrowRight')
    expect(deepActive()).toBe(trigger(pricing))
    key(trigger(pricing), 'Home')
    expect(deepActive()).toBe(trigger(products))
    key(trigger(products), 'End')
    expect(deepActive()).toBe(trigger(pricing))
    const event = key(trigger(pricing), 'ArrowLeft')
    expect(event.defaultPrevented).toBe(true)
    expect(deepActive()).toBe(trigger(resources))
  })

  it('Down opens a horizontal panel and moves focus into it', async () => {
    const menu = await fixture<MoulNavigationMenu>(template())
    await settle(menu)
    const [, resources] = items(menu)
    trigger(resources).focus()

    key(trigger(resources), 'ArrowDown')
    await settle(menu)
    expect(menu.value).toBe('res')
    expect(deepActive()).toBe(resources.querySelector('a'))
  })

  it('Escape closes the panel and returns focus to its trigger', async () => {
    const menu = await fixture<MoulNavigationMenu>(template())
    await settle(menu)
    const [, resources] = items(menu)
    trigger(resources).click()
    await settle(menu)
    const link = resources.querySelector('a') as HTMLAnchorElement
    expect(deepActive()).toBe(link)

    let escaped = false
    document.addEventListener('keydown', () => {
      escaped = true
    })
    const event = key(link, 'Escape')
    await settle(menu)
    expect(event.defaultPrevented).toBe(true)
    expect(escaped).toBe(false)
    expect(menu.value).toBe('')
    expect(deepActive()).toBe(trigger(resources))

    // With nothing open, Escape is left alone for an enclosing navbar.
    const free = key(trigger(resources), 'Escape')
    expect(free.defaultPrevented).toBe(false)
  })

  it('focus moving to another item closes the open panel', async () => {
    const menu = await fixture<MoulNavigationMenu>(template())
    await settle(menu)
    const [products, , pricing] = items(menu)
    trigger(products).click()
    await settle(menu)

    trigger(pricing).focus()
    await settle(menu)
    expect(menu.value).toBe('')
  })

  it('a press outside or a chosen link closes the panel', async () => {
    const menu = await fixture<MoulNavigationMenu>(template())
    await settle(menu)
    const [products] = items(menu)
    mouseClick(trigger(products))
    await settle(menu)

    pointer(document.body, 'pointerdown')
    await settle(menu)
    expect(menu.value).toBe('')

    mouseClick(trigger(products))
    await settle(menu)
    const link = products.querySelector('a') as HTMLAnchorElement
    link.addEventListener('click', (event) => event.preventDefault())
    mouseClick(link)
    await settle(menu)
    expect(menu.value).toBe('')
  })

  it('places the floating surface and the panel under the open trigger', async () => {
    const menu = await fixture<MoulNavigationMenu>(template())
    await settle(menu)
    const [products] = items(menu)
    mouseClick(trigger(products))
    await settle(menu)
    const base = menu.shadowRoot?.querySelector('[part="base"]') as HTMLElement
    expect(base.hasAttribute('data-open')).toBe(true)
    expect(base.style.getPropertyValue('--_nm-w')).toMatch(/px$/)
    expect(base.style.getPropertyValue('--_nm-x')).toBe(
      products.panelEl?.style.left,
    )
    expect(menuCss).toContain('left: var(--_nm-x, 0px)')
    expect(menuCss).toContain('inline-size: var(--_nm-w, 0px)')

    mouseClick(trigger(products))
    await settle(menu)
    expect(base.hasAttribute('data-open')).toBe(false)
  })

  it('centres a wide panel under its trigger but never past the menu start edge', async () => {
    const menu = await fixture<MoulNavigationMenu>(template())
    await settle(menu)
    const [products, resources] = items(menu)
    const base = menu.shadowRoot?.querySelector('[part="base"]') as HTMLElement
    // happy-dom has no layout: the menu starts at 100px, each panel is 400px wide.
    base.getBoundingClientRect = () =>
      ({ left: 100, right: 700, width: 600 }) as DOMRect
    trigger(products).getBoundingClientRect = () =>
      ({ left: 110, width: 60 }) as DOMRect
    trigger(resources).getBoundingClientRect = () =>
      ({ left: 400, width: 80 }) as DOMRect
    for (const item of [products, resources]) {
      Object.defineProperty(item.panelEl as HTMLElement, 'offsetWidth', {
        configurable: true,
        get: () => 400,
      })
    }

    // Centred under Products it would start at -60px; it starts at the menu edge.
    mouseClick(trigger(products))
    await settle(menu)
    expect(base.style.getPropertyValue('--_nm-x')).toBe('0px')
    // The indicator still points at the trigger's centre.
    expect(base.style.getPropertyValue('--_nm-ix')).toBe('40px')

    // Resources has room: centred under its trigger, 440 - 200 - 100.
    mouseClick(trigger(resources))
    await settle(menu)
    expect(base.style.getPropertyValue('--_nm-x')).toBe('140px')
  })

  it('opens the item named by value without an event, and drops an unknown value', async () => {
    const menu = await fixture<MoulNavigationMenu>(template())
    await settle(menu)
    let fired = 0
    menu.addEventListener('openchange', () => {
      fired++
    })
    menu.value = 'res'
    await settle(menu)
    expect(items(menu)[1].isOpen).toBe(true)

    menu.value = 'nothing here'
    await settle(menu)
    expect(menu.value).toBe('')
    expect(items(menu)[1].isOpen).toBe(false)
    expect(fired).toBe(0)
  })

  it('slides the content in and out between items, and swaps it at once under reduced motion', async () => {
    const animate = vi.fn(() => {
      const finished = new Promise<void>(() => {})
      return { finished, cancel: vi.fn() } as unknown as Animation
    })
    const original = HTMLElement.prototype.animate
    HTMLElement.prototype.animate = animate as typeof original
    try {
      const menu = await fixture<MoulNavigationMenu>(template())
      await settle(menu)
      const [products, resources] = items(menu)
      mouseClick(trigger(products))
      await settle(menu)
      mouseClick(trigger(resources))
      await settle(menu)
      const frames = animate.mock.calls.map(
        (call) => (call as unknown as [Keyframe[]])[0],
      )
      // Products faded in, then left to the start while Resources came from the end.
      expect(frames.some((f) => f[1].transform === 'translateX(-24px)')).toBe(
        true,
      )
      expect(frames.some((f) => f[0].transform === 'translateX(24px)')).toBe(
        true,
      )
      expect(products.panelEl?.hasAttribute('data-leaving')).toBe(true)
      expect(products.panelEl?.inert).toBe(true)

      animate.mockClear()
      motion.set(true)
      mouseClick(trigger(products))
      await settle(menu)
      expect(animate).not.toHaveBeenCalled()
      expect(products.isOpen).toBe(true)
    } finally {
      HTMLElement.prototype.animate = original
    }

    for (const css of [menuCss, itemCss, linkCss]) {
      expect(mediaBlock(css, '(prefers-reduced-motion: reduce)')).toMatch(
        /transition:\s*none/,
      )
    }
  })

  describe('vertical', () => {
    it('hands its orientation to the items and opens panels inline on click only', async () => {
      const menu = await fixture<MoulNavigationMenu>(template('vertical'))
      await settle(menu)
      vi.useFakeTimers()
      const [products, resources] = items(menu)
      expect(products.getAttribute('data-orientation')).toBe('vertical')

      pointer(trigger(products), 'pointerover')
      vi.advanceTimersByTime(500)
      expect(menu.value).toBe('')
      vi.useRealTimers()

      mouseClick(trigger(products))
      await settle(menu)
      expect(menu.value).toBe('Products')
      const base = menu.shadowRoot?.querySelector('[part="base"]')
      expect(base?.hasAttribute('data-open')).toBe(false)

      // An outside press leaves a disclosure open.
      pointer(document.body, 'pointerdown')
      await settle(menu)
      expect(menu.value).toBe('Products')

      mouseClick(trigger(resources))
      await settle(menu)
      expect(menu.value).toBe('res')
      expect(products.isOpen).toBe(false)
      expect(itemCss).toContain('grid-template-rows: 0fr')
    })

    it('Up and Down move between the items', async () => {
      const menu = await fixture<MoulNavigationMenu>(template('vertical'))
      await settle(menu)
      const [products, resources] = items(menu)
      trigger(products).focus()
      key(trigger(products), 'ArrowDown')
      expect(deepActive()).toBe(trigger(resources))
      expect(menu.value).toBe('')
      key(trigger(resources), 'ArrowUp')
      expect(deepActive()).toBe(trigger(products))
    })

    it('switching orientation closes what was open', async () => {
      const menu = await fixture<MoulNavigationMenu>(template())
      await settle(menu)
      mouseClick(trigger(items(menu)[0]))
      await settle(menu)
      expect(menu.value).toBe('Products')
      menu.orientation = 'vertical'
      await settle(menu)
      expect(menu.value).toBe('')
      expect(items(menu)[0].getAttribute('data-orientation')).toBe('vertical')
    })
  })

  it('falls back to horizontal for an unknown orientation', async () => {
    const menu = await fixture<MoulNavigationMenu>(
      html`<moul-navigation-menu orientation="diagonal"></moul-navigation-menu>`,
    )
    expect(menu.orientation).toBe('horizontal')
  })
})

describe('<moul-navigation-menu-link>', () => {
  afterEach(() => {
    fixtureCleanup()
  })

  it('is a native link named by its label and described by its description', async () => {
    const card = await fixture<MoulNavigationMenuLink>(
      html`<moul-navigation-menu-link href="/docs/" label="Components" description="Ninety elements." is-current>
        <svg slot="icon" aria-hidden="true"></svg>
      </moul-navigation-menu-link>`,
    )
    const link = card.linkEl as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/docs/')
    expect(link.getAttribute('aria-labelledby')).toBe('label')
    expect(link.getAttribute('aria-describedby')).toBe('description')
    expect(link.getAttribute('aria-current')).toBe('page')
    expect(card.shadowRoot?.getElementById('label')?.textContent).toContain(
      'Components',
    )
    expect(
      card.shadowRoot?.getElementById('description')?.textContent,
    ).toContain('Ninety elements.')
    expect(link.hasAttribute('data-has-icon')).toBe(true)

    card.focus()
    expect(card.shadowRoot?.activeElement).toBe(link)
  })

  it('opens a new tab safely and hides the icon box with no icon', async () => {
    const card = await fixture<MoulNavigationMenuLink>(
      html`<moul-navigation-menu-link href="https://example.com" target="_blank" label="Status"></moul-navigation-menu-link>`,
    )
    const link = card.linkEl as HTMLAnchorElement
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link.hasAttribute('data-has-icon')).toBe(false)
    expect(linkCss).toContain("[data-has-icon] [part~='icon']")
  })
})
