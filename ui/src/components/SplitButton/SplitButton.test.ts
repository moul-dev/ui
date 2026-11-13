import { fixture, fixtureCleanup } from '@open-wc/testing-helpers'
import type { CSSResult } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import type { MoulButton } from '../Button/Button'
import type {
  DropdownMenuActionDetail,
  MoulDropdownMenu,
} from '../DropdownMenu/DropdownMenu'
import type { MoulMenuItem } from '../DropdownMenu/MenuItem'
import './SplitButton'
import { MoulSplitButton } from './SplitButton'

/** Focus as the user sees it: down through open shadow roots. */
function active(): Element | null {
  let el = document.activeElement
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement
  return el
}

async function settle(el: MoulSplitButton): Promise<void> {
  await el.updateComplete
  await new Promise((resolve) => setTimeout(resolve))
}

function parts(el: MoulSplitButton) {
  const root = el.shadowRoot as ShadowRoot
  const main = root.querySelector('[part~="main"]') as MoulButton
  const chevron = root.querySelector('[part~="trigger"]') as MoulButton
  const menu = root.querySelector('moul-dropdown-menu') as MoulDropdownMenu
  const inner = (button: MoulButton) =>
    button.shadowRoot?.querySelector('button') as HTMLButtonElement
  return {
    main,
    chevron,
    menu,
    mainButton: inner(main),
    chevronButton: inner(chevron),
  }
}

/** Presses a key on whatever has focus (or `target`), keydown then keyup, like a keyboard. */
async function press(
  el: MoulSplitButton,
  key: string,
  target: Element | null = active(),
  init: KeyboardEventInit = {},
): Promise<KeyboardEvent> {
  const options = { key, bubbles: true, composed: true, cancelable: true }
  const down = new KeyboardEvent('keydown', { ...options, ...init })
  target?.dispatchEvent(down)
  target?.dispatchEvent(new KeyboardEvent('keyup', options))
  await settle(el)
  return down
}

const pointerClick = (target: Element) =>
  target.dispatchEvent(
    new MouseEvent('click', { bubbles: true, composed: true, detail: 1 }),
  )

/** A "Deploy" split button; `attrs` is raw markup, so tests can set any attribute. */
function mount(attrs = '') {
  return fixture<MoulSplitButton>(`
    <moul-split-button ${attrs}>
      <svg slot="prefix" aria-hidden="true"></svg>
      Deploy
      <moul-menu-item slot="menu" value="staging">Deploy to staging</moul-menu-item>
      <moul-menu-item slot="menu" value="schedule" is-disabled>Schedule deploy</moul-menu-item>
      <moul-menu-separator slot="menu"></moul-menu-separator>
      <moul-menu-item slot="menu" value="rollback">Roll back</moul-menu-item>
    </moul-split-button>
  `)
}

const items = (el: MoulSplitButton) =>
  Array.from(el.querySelectorAll<MoulMenuItem>('moul-menu-item'))

let motion: ReducedMotionMock | null = null

afterEach(() => {
  motion?.restore()
  motion = null
  vi.restoreAllMocks()
  fixtureCleanup()
})

describe('<moul-split-button>', () => {
  it('registers with its defaults', async () => {
    const el = await mount()
    await settle(el)
    expect(customElements.get('moul-split-button')).toBe(MoulSplitButton)
    expect(el.variant).toBe('primary')
    expect(el.size).toBe('md')
    expect(el.isDisabled).toBe(false)
    expect(el.isPending).toBe(false)
    expect(el.menuLabel).toBe('More actions')
    expect(el.placement).toBe('bottom-end')
  })

  it('forwards the label and prefix to the main part and the items to the menu', async () => {
    const el = await mount()
    await settle(el)
    const { main, menu, chevron } = parts(el)
    const slotted = (button: MoulButton, selector: string) =>
      (
        button.shadowRoot?.querySelector(selector) as HTMLSlotElement
      ).assignedNodes({ flatten: true })

    expect(
      slotted(main, 'slot:not([name])')
        .map((node) => node.textContent)
        .join('')
        .trim(),
    ).toBe('Deploy')
    expect(slotted(main, 'slot[name="prefix"]')).toEqual([
      el.querySelector('svg'),
    ])
    expect(menu.triggerEl).toBe(chevron)
    expect(menu.items).toEqual(items(el))
  })

  describe('press', () => {
    it('fires press from the main part, out of the split button', async () => {
      const el = await mount()
      await settle(el)
      const { main, chevron, mainButton } = parts(el)
      const paths: EventTarget[][] = []
      const onPress = (e: Event) => paths.push(e.composedPath())
      document.addEventListener('press', onPress)
      mainButton.click()
      document.removeEventListener('press', onPress)
      // Browsers retarget it to the split button; happy-dom leaves the target inside.
      expect(paths).toHaveLength(1)
      expect(paths[0][0]).toBe(main)
      expect(paths[0]).toContain(el)
      expect(paths[0]).not.toContain(chevron)
    })

    it('never fires press for the chevron, by click or by key', async () => {
      const el = await mount()
      await settle(el)
      const onPress = vi.fn()
      el.addEventListener('press', onPress)
      document.addEventListener('press', onPress)
      const { chevronButton, menu } = parts(el)

      pointerClick(chevronButton)
      await settle(el)
      expect(menu.isOpen).toBe(true)
      pointerClick(chevronButton)
      await settle(el)
      expect(menu.isOpen).toBe(false)

      // Enter as a browser does it: keydown, the click it synthesizes, keyup.
      chevronButton.focus()
      const init = { key: 'Enter', bubbles: true, composed: true }
      chevronButton.dispatchEvent(new KeyboardEvent('keydown', init))
      chevronButton.click()
      chevronButton.dispatchEvent(new KeyboardEvent('keyup', init))
      await settle(el)
      expect(menu.isOpen).toBe(true)
      expect(onPress).not.toHaveBeenCalled()
      document.removeEventListener('press', onPress)
    })
  })

  describe('menu', () => {
    it('fires action from a forwarded item, closes and returns focus to the chevron', async () => {
      const el = await mount()
      await settle(el)
      const { chevronButton, menu } = parts(el)
      const actions: DropdownMenuActionDetail[] = []
      el.addEventListener('action', (e) =>
        actions.push((e as CustomEvent<DropdownMenuActionDetail>).detail),
      )
      const changes: boolean[] = []
      el.addEventListener('openchange', (e) =>
        changes.push((e as CustomEvent<{ isOpen: boolean }>).detail.isOpen),
      )

      chevronButton.focus()
      await press(el, 'ArrowDown')
      expect(active()).toBe(items(el)[0])
      await press(el, 'End')
      await press(el, 'Enter')
      expect(actions).toEqual([{ value: 'rollback', item: items(el)[2] }])
      expect(menu.isOpen).toBe(false)
      expect(active()).toBe(chevronButton)

      await el.showMenu()
      items(el)[0].click()
      await settle(el)
      expect(actions[1]).toEqual({ value: 'staging', item: items(el)[0] })
      expect(changes).toEqual([true, false, true, false])
    })

    it('opens on a chevron click, focusing the menu surface', async () => {
      const el = await mount()
      await settle(el)
      const { chevronButton, menu } = parts(el)
      pointerClick(chevronButton)
      await settle(el)
      expect(menu.isOpen).toBe(true)
      expect(active()).toBe(menu.menuEl)
      await press(el, 'ArrowDown')
      expect(active()).toBe(items(el)[0])
    })

    for (const [key, index] of [
      ['Enter', 0],
      [' ', 0],
      ['ArrowDown', 0],
      ['ArrowUp', 2],
    ] as const) {
      it(`opens with ${key === ' ' ? 'Space' : key} on the chevron`, async () => {
        const el = await mount()
        await settle(el)
        parts(el).chevronButton.focus()
        const event = await press(el, key)
        expect(event.defaultPrevented).toBe(true)
        expect(parts(el).menu.isOpen).toBe(true)
        // "Schedule deploy" is disabled, so ArrowUp lands on "Roll back".
        expect(active()).toBe(items(el)[index])
      })
    }

    it('Alt+ArrowDown on the main part opens the menu on the first item', async () => {
      const el = await mount()
      await settle(el)
      const { mainButton, menu } = parts(el)
      mainButton.focus()
      const plain = await press(el, 'ArrowDown')
      expect(plain.defaultPrevented).toBe(false)
      expect(menu.isOpen).toBe(false)

      const alt = await press(el, 'ArrowDown', mainButton, { altKey: true })
      expect(alt.defaultPrevented).toBe(true)
      expect(menu.isOpen).toBe(true)
      expect(active()).toBe(items(el)[0])
    })

    it('Escape closes and returns focus to the chevron', async () => {
      const el = await mount()
      await settle(el)
      const { chevronButton, menu, mainButton } = parts(el)
      mainButton.focus()
      await press(el, 'ArrowDown', mainButton, { altKey: true })
      expect(menu.isOpen).toBe(true)
      const event = await press(el, 'Escape')
      expect(event.defaultPrevented).toBe(true)
      expect(menu.isOpen).toBe(false)
      expect(active()).toBe(chevronButton)
    })

    it('showMenu() and hideMenu() drive the menu', async () => {
      const el = await mount()
      await settle(el)
      const { menu, chevronButton } = parts(el)
      await el.showMenu()
      expect(menu.isOpen).toBe(true)
      expect(active()).toBe(items(el)[0])
      await el.hideMenu()
      expect(menu.isOpen).toBe(false)
      expect(active()).toBe(chevronButton)
    })

    it('makes the menu at least as wide as the whole split button', async () => {
      const el = await mount()
      await settle(el)
      el.getBoundingClientRect = () => ({ width: 212.4 }) as DOMRect
      await el.showMenu()
      expect(
        parts(el).menu.style.getPropertyValue('--dropdown-menu-min-width'),
      ).toBe('max(10rem, 212px)')
    })

    it('turns the chevron over while the menu is open', async () => {
      const el = await mount()
      await settle(el)
      const { menu } = parts(el)
      const chevron = el.shadowRoot?.querySelector('[part~="chevron"]')
      expect(chevron?.closest('moul-dropdown-menu')).toBe(menu)
      await el.showMenu()
      expect(menu.hasAttribute('is-open')).toBe(true)
      expect(chevron?.matches('.dropdown[is-open] .chevron')).toBe(true)
      await el.hideMenu()
      expect(chevron?.matches('.dropdown[is-open] .chevron')).toBe(false)
      expect(css()).toMatch(
        /\.dropdown\[is-open\] \.chevron\s*\{\s*transform: rotate\(180deg\)/,
      )
    })
  })

  describe('ARIA', () => {
    it('marks the chevron as a named menu button on its host and inner button', async () => {
      const el = await mount()
      await settle(el)
      const { chevron, chevronButton, menu } = parts(el)
      for (const node of [chevron, chevronButton]) {
        expect(node.getAttribute('aria-haspopup')).toBe('menu')
        expect(node.getAttribute('aria-expanded')).toBe('false')
      }
      expect(chevron.getAttribute('aria-label')).toBe('More actions')
      // The inner button's name comes from its slotted, visually hidden text.
      expect(chevron.textContent?.trim()).toBe('More actions')
      expect(
        chevron
          .querySelector('[part~="chevron"] svg')
          ?.getAttribute('aria-hidden'),
      ).toBe('true')
      expect(menu.menuEl?.getAttribute('aria-label')).toBe('More actions')

      await el.showMenu()
      expect(chevronButton.getAttribute('aria-expanded')).toBe('true')
      expect(chevron.getAttribute('aria-expanded')).toBe('true')
    })

    it('leaves the main part a plain button', async () => {
      const el = await mount()
      await settle(el)
      const { mainButton } = parts(el)
      expect(mainButton.hasAttribute('aria-haspopup')).toBe(false)
      expect(mainButton.hasAttribute('aria-expanded')).toBe(false)
    })
  })

  describe('attributes', () => {
    it('forwards variant and size to both parts', async () => {
      const el = await mount('variant="outline" size="sm"')
      await settle(el)
      let { main, chevron } = parts(el)
      for (const button of [main, chevron]) {
        expect(button.variant).toBe('outline')
        expect(button.size).toBe('sm')
      }
      expect(chevron.isIcon).toBe(true)

      el.variant = 'danger'
      el.size = 'lg'
      await settle(el)
      ;({ main, chevron } = parts(el))
      for (const button of [main, chevron]) {
        expect(button.variant).toBe('danger')
        expect(button.size).toBe('lg')
      }
    })

    it('renders unsupported variants, danger-soft included, as primary', async () => {
      const el = await mount('variant="danger-soft"')
      await settle(el)
      expect(el.getAttribute('variant')).toBe('danger-soft')
      const { main, chevron } = parts(el)
      expect(main.variant).toBe('primary')
      expect(chevron.variant).toBe('primary')
    })

    it('names the chevron and the menu with menu-label', async () => {
      const el = await mount('menu-label="Deploy options"')
      await settle(el)
      const { chevron, menu } = parts(el)
      expect(chevron.getAttribute('aria-label')).toBe('Deploy options')
      expect(chevron.textContent?.trim()).toBe('Deploy options')
      expect(menu.label).toBe('Deploy options')
      expect(menu.menuEl?.getAttribute('aria-label')).toBe('Deploy options')

      el.menuLabel = ''
      await settle(el)
      expect(chevron.getAttribute('aria-label')).toBe('More actions')
    })

    it('forwards placement to the menu', async () => {
      const el = await mount('placement="top-start"')
      await settle(el)
      expect(parts(el).menu.placement).toBe('top-start')
      el.placement = 'bottom-start'
      await settle(el)
      expect(parts(el).menu.placement).toBe('bottom-start')
    })
  })

  describe('states', () => {
    it('is-disabled turns off both parts and the menu', async () => {
      const el = await mount('is-disabled')
      await settle(el)
      const { main, chevron, mainButton, chevronButton, menu } = parts(el)
      expect(main.isDisabled).toBe(true)
      expect(chevron.isDisabled).toBe(true)
      expect(menu.isDisabled).toBe(true)
      expect(mainButton.disabled).toBe(true)
      expect(chevronButton.disabled).toBe(true)
      expect(chevronButton.getAttribute('aria-disabled')).toBe('true')

      const onPress = vi.fn()
      el.addEventListener('press', onPress)
      mainButton.click()
      pointerClick(chevronButton)
      await el.showMenu()
      await settle(el)
      expect(onPress).not.toHaveBeenCalled()
      expect(menu.isOpen).toBe(false)
    })

    it('closes an open menu when it becomes disabled', async () => {
      const el = await mount()
      await settle(el)
      const { menu } = parts(el)
      await el.showMenu()
      el.isDisabled = true
      await settle(el)
      expect(menu.isOpen).toBe(false)
      expect(menu.hasAttribute('is-open')).toBe(false)

      el.isDisabled = false
      await settle(el)
      await el.showMenu()
      expect(menu.isOpen).toBe(true)
    })

    it('is-pending holds the main part only; the chevron and menu stay usable', async () => {
      const el = await mount('is-pending')
      await settle(el)
      const { main, chevron, mainButton, chevronButton, menu } = parts(el)
      expect(main.isPending).toBe(true)
      expect(main.getAttribute('aria-busy')).toBe('true')
      expect(mainButton.getAttribute('aria-busy')).toBe('true')
      expect(chevron.isPending).toBe(false)
      expect(chevronButton.disabled).toBe(false)

      const onPress = vi.fn()
      el.addEventListener('press', onPress)
      mainButton.click()
      expect(onPress).not.toHaveBeenCalled()

      // The pending main part keeps focus, and Alt+ArrowDown still opens the menu.
      mainButton.focus()
      expect(active()).toBe(mainButton)
      await press(el, 'ArrowDown', mainButton, { altKey: true })
      expect(menu.isOpen).toBe(true)
      await press(el, 'Escape')
      pointerClick(chevronButton)
      await settle(el)
      expect(menu.isOpen).toBe(true)

      el.isPending = false
      await settle(el)
      mainButton.click()
      expect(onPress).toHaveBeenCalledTimes(1)
    })
  })

  describe('motion', () => {
    it('reduced motion: the chevron turns at once and the menu items do not stagger', async () => {
      expect(css()).toMatch(
        /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.chevron\s*\{\s*transition: none;/,
      )
      expect(css()).toMatch(/\.chevron\s*\{[^}]*transition: transform/)

      motion = mockReducedMotion(true)
      const el = await mount()
      await settle(el)
      const { menu } = parts(el)
      const opening = menu.show()
      for (const row of el.querySelectorAll<HTMLElement>('[slot="menu"]')) {
        expect(row.style.opacity).toBe('')
      }
      await opening
      expect(menu.isOpen).toBe(true)
      expect(menu.popoverEl?.matches(':popover-open')).toBe(true)
    })

    it('without reduced motion, the forwarded items stagger in', async () => {
      motion = mockReducedMotion(false)
      const el = await mount()
      await settle(el)
      const { menu } = parts(el)
      const opening = menu.show()
      expect(
        el.querySelector<HTMLElement>('[slot="menu"]')?.style.opacity,
      ).toBe('0')
      await opening
    })
  })
})

/** The component's stylesheet text. */
function css(): string {
  return (MoulSplitButton.styles as CSSResult[])
    .map((sheet) => sheet.cssText)
    .join('\n')
}
