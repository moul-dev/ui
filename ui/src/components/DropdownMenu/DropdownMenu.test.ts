import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import '../Button/Button'
import './DropdownMenu'
import type { DropdownMenuActionDetail, MoulDropdownMenu } from './DropdownMenu'
import type { MoulMenuGroup } from './MenuGroup'
import type { MoulMenuItem } from './MenuItem'

/** Focus as the user sees it: down through open shadow roots. */
function active(): Element | null {
  let el = document.activeElement
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement
  return el
}

async function settle(el: MoulDropdownMenu): Promise<void> {
  await el.updateComplete
  await new Promise((resolve) => setTimeout(resolve))
}

/** Presses a key on whatever has focus (or `target`), keydown then keyup, like a keyboard. */
async function press(
  el: MoulDropdownMenu,
  key: string,
  target: Element | null = active(),
): Promise<KeyboardEvent> {
  const init = { key, bubbles: true, composed: true, cancelable: true }
  const down = new KeyboardEvent('keydown', init)
  target?.dispatchEvent(down)
  target?.dispatchEvent(new KeyboardEvent('keyup', init))
  await settle(el)
  return down
}

const isShown = (el: MoulDropdownMenu) =>
  Boolean(el.popoverEl?.matches(':popover-open'))

function mountMenu({ placement = 'bottom-start', variant = 'default' } = {}) {
  return fixture<MoulDropdownMenu>(html`
    <moul-dropdown-menu placement=${placement} variant=${variant}>
      <button slot="trigger">Actions</button>
      <moul-menu-item value="cut" is-disabled>Cut</moul-menu-item>
      <moul-menu-item value="copy" shortcut="⌘C">Copy</moul-menu-item>
      <moul-menu-item value="paste">Paste</moul-menu-item>
      <moul-menu-separator></moul-menu-separator>
      <moul-menu-item variant="danger">Delete forever</moul-menu-item>
    </moul-dropdown-menu>
  `)
}

const trigger = (el: MoulDropdownMenu) =>
  el.querySelector<HTMLButtonElement>('[slot="trigger"]') as HTMLButtonElement

let motion: ReducedMotionMock | null = null

afterEach(() => {
  motion?.restore()
  motion = null
  vi.restoreAllMocks()
  fixtureCleanup()
})

describe('<moul-dropdown-menu>', () => {
  it('registers all four elements with their defaults', async () => {
    const el = await mountMenu()
    for (const tag of [
      'moul-dropdown-menu',
      'moul-menu-item',
      'moul-menu-group',
      'moul-menu-separator',
    ]) {
      expect(customElements.get(tag)).toBeDefined()
    }
    expect(el.isOpen).toBe(false)
    expect(el.placement).toBe('bottom-start')
    expect(el.variant).toBe('default')
    expect(el.items.map((item) => item.label)).toEqual([
      'Cut',
      'Copy',
      'Paste',
      'Delete forever',
    ])
  })

  describe('ARIA', () => {
    it('marks the trigger as a menu button and the surface as a menu', async () => {
      const el = await mountMenu()
      const button = trigger(el)
      expect(button.getAttribute('aria-haspopup')).toBe('menu')
      expect(button.getAttribute('aria-expanded')).toBe('false')
      expect(el.menuEl?.getAttribute('role')).toBe('menu')
      expect(el.menuEl?.getAttribute('aria-label')).toBe('Actions')

      button.click()
      await settle(el)
      expect(button.getAttribute('aria-expanded')).toBe('true')

      el.label = 'Clipboard'
      await settle(el)
      expect(el.menuEl?.getAttribute('aria-label')).toBe('Clipboard')
    })

    it('gives items, groups and separators their roles and states', async () => {
      const el = await fixture<MoulDropdownMenu>(html`
        <moul-dropdown-menu>
          <button slot="trigger">View</button>
          <moul-menu-item>Refresh</moul-menu-item>
          <moul-menu-item type="checkbox" is-checked>Show grid</moul-menu-item>
          <moul-menu-separator></moul-menu-separator>
          <moul-menu-group label="Sort by">
            <moul-menu-item type="radio" is-checked>Name</moul-menu-item>
            <moul-menu-item type="radio" is-disabled>Size</moul-menu-item>
          </moul-menu-group>
        </moul-dropdown-menu>
      `)
      const [refresh, grid, name, size] = el.items
      await Promise.all(el.items.map((item) => item.updateComplete))
      expect(refresh.getAttribute('role')).toBe('menuitem')
      expect(refresh.hasAttribute('aria-checked')).toBe(false)
      expect(refresh.getAttribute('tabindex')).toBe('-1')
      expect(grid.getAttribute('role')).toBe('menuitemcheckbox')
      expect(grid.getAttribute('aria-checked')).toBe('true')
      expect(name.getAttribute('role')).toBe('menuitemradio')
      expect(name.getAttribute('aria-checked')).toBe('true')
      expect(size.getAttribute('aria-checked')).toBe('false')
      expect(size.getAttribute('aria-disabled')).toBe('true')

      const group = el.querySelector<MoulMenuGroup>('moul-menu-group')
      expect(group?.getAttribute('role')).toBe('group')
      expect(group?.getAttribute('aria-label')).toBe('Sort by')
      const heading = group?.shadowRoot?.querySelector('[part="label"]')
      expect(heading?.textContent).toBe('Sort by')
      expect(heading?.getAttribute('aria-hidden')).toBe('true')
      expect(
        el.querySelector('moul-menu-separator')?.getAttribute('role'),
      ).toBe('separator')
    })

    it('puts the menu-button ARIA on a moul-button and on its inner button', async () => {
      const el = await fixture<MoulDropdownMenu>(html`
        <moul-dropdown-menu>
          <moul-button slot="trigger" variant="secondary">Options</moul-button>
          <moul-menu-item>One</moul-menu-item>
        </moul-dropdown-menu>
      `)
      const host = el.querySelector('moul-button') as HTMLElement
      await settle(el)
      const inner = host.shadowRoot?.querySelector('button') as HTMLElement
      for (const node of [host, inner]) {
        expect(node.getAttribute('aria-haspopup')).toBe('menu')
        expect(node.getAttribute('aria-expanded')).toBe('false')
      }

      inner.focus()
      await press(el, 'Enter')
      expect(inner.getAttribute('aria-expanded')).toBe('true')
      expect(active()).toBe(el.items[0])

      await press(el, 'Escape')
      expect(el.isOpen).toBe(false)
      expect(inner.getAttribute('aria-expanded')).toBe('false')
      expect(active()).toBe(inner)
    })

    it('renders the shortcut as a hint hidden from screen readers', async () => {
      const el = await mountMenu()
      const copy = el.items[1]
      const hint = copy.shadowRoot?.querySelector('[part="shortcut"]')
      expect(hint?.textContent).toBe('⌘C')
      expect(hint?.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('opening and closing', () => {
    it('toggles on a pointer click and focuses the menu surface', async () => {
      const el = await mountMenu()
      const changes: boolean[] = []
      el.addEventListener('openchange', (e) =>
        changes.push((e as CustomEvent<{ isOpen: boolean }>).detail.isOpen),
      )
      trigger(el).dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true, detail: 1 }),
      )
      await settle(el)
      expect(el.isOpen).toBe(true)
      expect(el.hasAttribute('is-open')).toBe(true)
      expect(isShown(el)).toBe(true)
      expect(active()).toBe(el.menuEl)

      trigger(el).dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true, detail: 1 }),
      )
      await settle(el)
      expect(el.isOpen).toBe(false)
      expect(changes).toEqual([true, false])
    })

    it('closes on a pointer press outside, but not on one inside', async () => {
      const el = await mountMenu()
      await el.show()
      el.items[2].dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, composed: true }),
      )
      expect(el.isOpen).toBe(true)
      document.body.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, composed: true }),
      )
      await settle(el)
      expect(el.isOpen).toBe(false)
    })

    for (const key of ['Enter', ' ', 'ArrowDown']) {
      it(`opens with ${key === ' ' ? 'Space' : key} and focuses the first enabled item`, async () => {
        const el = await mountMenu()
        trigger(el).focus()
        const event = await press(el, key)
        expect(event.defaultPrevented).toBe(true)
        expect(el.isOpen).toBe(true)
        // "Cut" is disabled, so focus lands on "Copy".
        expect(active()).toBe(el.items[1])
      })
    }

    it('opens with ArrowUp and focuses the last enabled item', async () => {
      const el = await mountMenu()
      trigger(el).focus()
      await press(el, 'ArrowUp')
      expect(el.isOpen).toBe(true)
      expect(active()).toBe(el.items[3])
    })

    it('ignores the click a button synthesizes from a handled Enter', async () => {
      const el = await mountMenu()
      const button = trigger(el)
      button.focus()
      const init = { key: 'Enter', bubbles: true, cancelable: true }
      button.dispatchEvent(new KeyboardEvent('keydown', init))
      button.click() // what a native button does on Enter
      await settle(el)
      expect(el.isOpen).toBe(true)
      button.dispatchEvent(new KeyboardEvent('keyup', init))
    })

    it('Escape closes and returns focus to the trigger', async () => {
      const el = await mountMenu()
      trigger(el).focus()
      await press(el, 'ArrowDown')
      const event = await press(el, 'Escape')
      expect(event.defaultPrevented).toBe(true)
      expect(el.isOpen).toBe(false)
      expect(active()).toBe(trigger(el))
    })

    it('Tab closes without pulling focus back', async () => {
      const el = await mountMenu()
      trigger(el).focus()
      await press(el, 'ArrowDown')
      const item = active()
      const event = await press(el, 'Tab')
      expect(event.defaultPrevented).toBe(false)
      expect(el.isOpen).toBe(false)
      expect(active()).toBe(item)
    })

    it('show(), hide() and toggle() drive it, and is-open opens without moving focus', async () => {
      const el = await mountMenu()
      await el.show()
      expect(el.isOpen).toBe(true)
      expect(active()).toBe(el.items[1])
      await el.hide()
      expect(el.isOpen).toBe(false)
      expect(active()).toBe(trigger(el))
      await el.toggle()
      expect(el.isOpen).toBe(true)
      await el.toggle()
      expect(el.isOpen).toBe(false)

      trigger(el).focus()
      el.isOpen = true
      await settle(el)
      expect(isShown(el)).toBe(true)
      expect(active()).toBe(trigger(el))
    })

    it('does not open while disabled, and closes when disabled', async () => {
      const el = await mountMenu()
      el.isDisabled = true
      await settle(el)
      expect(trigger(el).getAttribute('aria-disabled')).toBe('true')
      trigger(el).click()
      trigger(el).focus()
      await press(el, 'ArrowDown')
      await el.show()
      expect(el.isOpen).toBe(false)

      el.isDisabled = false
      await settle(el)
      expect(trigger(el).hasAttribute('aria-disabled')).toBe(false)
      await el.show()
      el.isDisabled = true
      await settle(el)
      expect(el.isOpen).toBe(false)
    })
  })

  describe('focus inside the menu', () => {
    it('moves with the arrow keys, wraps, and reaches disabled items', async () => {
      const el = await mountMenu()
      const [cut, copy, paste, del] = el.items
      trigger(el).focus()
      await press(el, 'ArrowDown')
      expect(active()).toBe(copy)
      await press(el, 'ArrowDown')
      expect(active()).toBe(paste)
      await press(el, 'ArrowDown')
      expect(active()).toBe(del)
      await press(el, 'ArrowDown')
      expect(active()).toBe(cut)
      await press(el, 'ArrowUp')
      expect(active()).toBe(del)
    })

    it('Home and End go to the first and last item', async () => {
      const el = await mountMenu()
      trigger(el).focus()
      await press(el, 'ArrowDown')
      await press(el, 'End')
      expect(active()).toBe(el.items[3])
      await press(el, 'Home')
      expect(active()).toBe(el.items[0])
    })

    it('arrow keys from the surface (after a pointer open) enter the items', async () => {
      const el = await mountMenu()
      trigger(el).dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true, detail: 1 }),
      )
      await settle(el)
      expect(active()).toBe(el.menuEl)
      await press(el, 'ArrowDown')
      expect(active()).toBe(el.items[1])
    })

    it('type-ahead jumps to matching labels and cycles on a repeated letter', async () => {
      const el = await mountMenu()
      const [cut, copy, paste, del] = el.items
      trigger(el).focus()
      await press(el, 'ArrowDown')
      await press(el, 'p')
      expect(active()).toBe(paste)
      // Typed together, "pd" matches nothing, so focus stays.
      await press(el, 'd')
      expect(active()).toBe(paste)
      await new Promise((resolve) => setTimeout(resolve, 550))
      await press(el, 'c')
      expect(active()).toBe(cut)
      await press(el, 'c')
      expect(active()).toBe(copy)
      await new Promise((resolve) => setTimeout(resolve, 550))
      await press(el, 'd')
      await press(el, 'e')
      expect(active()).toBe(del)
      await new Promise((resolve) => setTimeout(resolve, 550))
      await press(el, 'z')
      expect(active()).toBe(del)
    })

    it('hovering an item focuses it; leaving drops the highlight', async () => {
      const el = await mountMenu()
      await el.show()
      const paste = el.items[2]
      paste.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          composed: true,
          pointerType: 'mouse',
        }),
      )
      expect(active()).toBe(paste)
      el.items[0].dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          composed: true,
          pointerType: 'mouse',
        }),
      )
      expect(active()).toBe(el.menuEl)
    })
  })

  describe('activation', () => {
    it('fires action with the value and item, closes and returns focus', async () => {
      const el = await mountMenu()
      const actions: DropdownMenuActionDetail[] = []
      el.addEventListener('action', (e) =>
        actions.push((e as CustomEvent<DropdownMenuActionDetail>).detail),
      )
      trigger(el).focus()
      await press(el, 'ArrowDown')
      await press(el, 'Enter')
      expect(actions).toEqual([{ value: 'copy', item: el.items[1] }])
      expect(el.isOpen).toBe(false)
      expect(active()).toBe(trigger(el))

      await el.show()
      await press(el, ' ', el.items[2])
      expect(actions[1].value).toBe('paste')

      await el.show()
      el.items[3].click()
      await settle(el)
      // No value: the label stands in.
      expect(actions[2]).toEqual({ value: 'Delete forever', item: el.items[3] })
      expect(el.isOpen).toBe(false)
    })

    it('ignores disabled items for Enter, Space and clicks', async () => {
      const el = await mountMenu()
      const onAction = vi.fn()
      el.addEventListener('action', onAction)
      await el.show()
      const cut = el.items[0]
      cut.focus()
      await press(el, 'Enter')
      await press(el, ' ')
      cut.click()
      await settle(el)
      expect(onAction).not.toHaveBeenCalled()
      expect(el.isOpen).toBe(true)
    })

    it('toggles checkbox items and keeps the menu open', async () => {
      const el = await fixture<MoulDropdownMenu>(html`
        <moul-dropdown-menu>
          <button slot="trigger">View</button>
          <moul-menu-item type="checkbox" value="grid">Grid</moul-menu-item>
        </moul-dropdown-menu>
      `)
      const onAction = vi.fn()
      el.addEventListener('action', onAction)
      await el.show()
      const grid = el.items[0]
      await press(el, 'Enter')
      await grid.updateComplete
      expect(grid.isChecked).toBe(true)
      expect(grid.getAttribute('aria-checked')).toBe('true')
      expect(el.isOpen).toBe(true)
      expect(active()).toBe(grid)
      grid.click()
      await grid.updateComplete
      expect(grid.isChecked).toBe(false)
      expect(onAction).toHaveBeenCalledTimes(2)
      expect(onAction.mock.calls[0][0].detail.value).toBe('grid')
    })

    it('keeps radio items exclusive per group, and per menu without a group', async () => {
      const el = await fixture<MoulDropdownMenu>(html`
        <moul-dropdown-menu>
          <button slot="trigger">View</button>
          <moul-menu-item type="radio" value="s" is-checked>Small</moul-menu-item>
          <moul-menu-item type="radio" value="l">Large</moul-menu-item>
          <moul-menu-group label="Sort">
            <moul-menu-item type="radio" value="name" is-checked>Name</moul-menu-item>
            <moul-menu-item type="radio" value="date">Date</moul-menu-item>
          </moul-menu-group>
          <moul-menu-group label="Order">
            <moul-menu-item type="radio" value="asc" is-checked>Ascending</moul-menu-item>
            <moul-menu-item type="radio" value="desc">Descending</moul-menu-item>
          </moul-menu-group>
        </moul-dropdown-menu>
      `)
      const [small, large, name, date, asc, desc] = el.items
      await el.show()
      date.click()
      await settle(el)
      expect([name.isChecked, date.isChecked]).toEqual([false, true])
      expect([small.isChecked, asc.isChecked]).toEqual([true, true])
      large.click()
      desc.click()
      await settle(el)
      expect([small.isChecked, large.isChecked]).toEqual([false, true])
      expect([asc.isChecked, desc.isChecked]).toEqual([false, true])
      expect(date.isChecked).toBe(true)
      expect(el.isOpen).toBe(true)
    })

    it('navigates link items through their anchor', async () => {
      const el = await fixture<MoulDropdownMenu>(html`
        <moul-dropdown-menu>
          <button slot="trigger">Help</button>
          <moul-menu-item href="/docs" target="_blank">Docs</moul-menu-item>
          <moul-menu-item href="/old" is-disabled>Old docs</moul-menu-item>
        </moul-dropdown-menu>
      `)
      const [docs, old] = el.items
      await docs.updateComplete
      const link = docs.shadowRoot?.querySelector('a') as HTMLAnchorElement
      expect(link.getAttribute('href')).toBe('/docs')
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('tabindex')).toBe('-1')
      expect(old.shadowRoot?.querySelector('a')).toBeNull()

      const clicks = vi.fn((e: Event) => e.preventDefault())
      link.addEventListener('click', clicks)
      const onAction = vi.fn()
      el.addEventListener('action', onAction)
      await el.show()
      await press(el, 'Enter')
      expect(clicks).toHaveBeenCalledTimes(1)
      expect(onAction).toHaveBeenCalledTimes(1)
      expect(el.isOpen).toBe(false)
    })
  })

  describe('placement', () => {
    function stubGeometry(
      el: MoulDropdownMenu,
      rect: { left: number; top: number; width: number; height: number },
    ) {
      const { left, top, width, height } = rect
      trigger(el).getBoundingClientRect = () =>
        ({
          left,
          top,
          width,
          height,
          right: left + width,
          bottom: top + height,
          x: left,
          y: top,
        }) as DOMRect
      const popover = el.popoverEl as HTMLElement
      Object.defineProperty(popover, 'offsetHeight', { value: 200 })
      Object.defineProperty(popover, 'offsetWidth', { value: 160 })
    }

    it('hangs below the trigger, aligned to its start, growing from its edge', async () => {
      const el = await mountMenu()
      stubGeometry(el, { left: 100, top: 40, width: 80, height: 32 })
      await el.show()
      const popover = el.popoverEl as HTMLElement
      expect(popover.style.top).toBe('78px')
      expect(popover.style.left).toBe('100px')
      expect(popover.style.transformOrigin).toBe('40px 0px')
      expect(popover.getAttribute('data-side')).toBe('bottom')
    })

    it('aligns to the end and flips above when there is no room below', async () => {
      const el = await mountMenu({ placement: 'bottom-end' })
      const top = window.innerHeight - 60
      stubGeometry(el, { left: 300, top, width: 80, height: 32 })
      await el.show()
      const popover = el.popoverEl as HTMLElement
      expect(popover.style.left).toBe('220px')
      expect(popover.style.top).toBe(`${top - 6 - 200}px`)
      expect(popover.getAttribute('data-side')).toBe('top')
      expect(popover.style.transformOrigin).toBe('120px 100%')
    })
  })

  describe('forwarded slot', () => {
    class TestSplitHost extends HTMLElement {
      constructor() {
        super()
        this.attachShadow({ mode: 'open' }).innerHTML = `
          <moul-dropdown-menu placement="bottom-end">
            <button slot="trigger" aria-label="More actions">v</button>
            <slot name="menu"></slot>
          </moul-dropdown-menu>
        `
      }
    }
    if (!customElements.get('test-split-host')) {
      customElements.define('test-split-host', TestSplitHost)
    }

    async function mountHost() {
      const host = await fixture<HTMLElement>(html`
        <test-split-host>
          <moul-menu-item slot="menu" value="dup">Duplicate</moul-menu-item>
          <moul-menu-group slot="menu" label="Sort">
            <moul-menu-item type="radio" value="name" is-checked>Name</moul-menu-item>
            <moul-menu-item type="radio" value="date">Date</moul-menu-item>
          </moul-menu-group>
        </test-split-host>
      `)
      const el = host.shadowRoot?.querySelector(
        'moul-dropdown-menu',
      ) as MoulDropdownMenu
      await settle(el)
      const button = host.shadowRoot?.querySelector('button') as HTMLElement
      return { host, el, button }
    }

    it('finds forwarded items, groups included', async () => {
      const { host, el } = await mountHost()
      expect(el.items).toEqual(
        Array.from(host.querySelectorAll<MoulMenuItem>('moul-menu-item')),
      )
      expect(el.menuEl?.getAttribute('aria-label')).toBe('More actions')
    })

    it('navigates, keeps radios exclusive, fires action and returns focus', async () => {
      const { host, el, button } = await mountHost()
      const [dup, name, date] = el.items
      const actions: DropdownMenuActionDetail[] = []
      host.addEventListener('action', (e) =>
        actions.push((e as CustomEvent<DropdownMenuActionDetail>).detail),
      )

      button.focus()
      await press(el, 'ArrowDown')
      expect(el.isOpen).toBe(true)
      expect(button.getAttribute('aria-expanded')).toBe('true')
      expect(active()).toBe(dup)
      await press(el, 'ArrowDown')
      expect(active()).toBe(name)
      await press(el, 'End')
      expect(active()).toBe(date)
      await press(el, 'n')
      expect(active()).toBe(name)
      await press(el, 'ArrowDown')
      await press(el, ' ')
      expect([name.isChecked, date.isChecked]).toEqual([false, true])
      expect(actions).toEqual([{ value: 'date', item: date }])
      expect(el.isOpen).toBe(true)

      dup.click()
      await settle(el)
      expect(actions[1]).toEqual({ value: 'dup', item: dup })
      expect(el.isOpen).toBe(false)
      expect(active()).toBe(button)

      await el.show()
      expect(active()).toBe(dup)
      await press(el, 'Escape')
      expect(el.isOpen).toBe(false)
      expect(active()).toBe(button)
    })

    it('treats a press on a forwarded item as inside', async () => {
      const { el } = await mountHost()
      await el.show()
      el.items[1].dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, composed: true }),
      )
      expect(el.isOpen).toBe(true)
    })
  })

  describe('motion', () => {
    it('grows from the trigger and staggers the rows in', async () => {
      motion = mockReducedMotion(false)
      const el = await mountMenu()
      const opening = el.show()
      const rows = Array.from(el.children).filter(
        (row) => row.slot !== 'trigger',
      ) as HTMLElement[]
      expect(rows[0].style.opacity).toBe('0')
      await opening
      await new Promise((resolve) => setTimeout(resolve, 400))
      for (const row of rows) expect(row.style.opacity).toBe('')
    })

    it('gooey: pours blobs out of a pill through the goo filter, then settles', async () => {
      motion = mockReducedMotion(false)
      const el = await mountMenu({ variant: 'gooey' })
      const rect =
        (left: number, top: number, width: number, height: number) => () =>
          ({
            left,
            top,
            width,
            height,
            right: left + width,
            bottom: top + height,
            x: left,
            y: top,
          }) as DOMRect
      trigger(el).getBoundingClientRect = rect(100, 40, 80, 32)
      ;(el.menuEl as HTMLElement).getBoundingClientRect = rect(
        100,
        78,
        160,
        172,
      )
      const rows = Array.from(el.children).filter(
        (row) => row.slot !== 'trigger',
      ) as HTMLElement[]
      rows.forEach((row, i) => {
        row.getBoundingClientRect = rect(106, 84 + i * 38, 148, 36)
      })

      const filter = el.shadowRoot?.querySelector('filter')
      expect(filter?.querySelector('feGaussianBlur')).not.toBeNull()
      expect(
        filter?.querySelector('feColorMatrix')?.getAttribute('values'),
      ).toMatch(/0 0 0 19 -8$/)
      const fill = el.shadowRoot?.querySelector('.goo-fill') as HTMLElement
      expect(fill.style.filter).toBe(`url(#${filter?.id})`)

      const opening = el.show()
      const popover = el.popoverEl as HTMLElement
      expect(popover.hasAttribute('data-goo')).toBe(true)
      // One pill plus one blob per row; the pill sits on the trigger's bottom edge.
      expect(fill.children.length).toBe(rows.length + 1)
      const pill = fill.children[0] as HTMLElement
      expect(pill.style.width).toBe('80px')
      expect(pill.style.top).toBe('-16px')
      expect(rows[0].style.opacity).toBe('0')
      await opening
      expect(popover.hasAttribute('data-goo')).toBe(false)
      expect(rows[0].style.opacity).toBe('')

      const closing = el.hide()
      expect(popover.hasAttribute('data-goo')).toBe(true)
      expect(isShown(el)).toBe(true)
      await closing
      expect(isShown(el)).toBe(false)
      expect(popover.hasAttribute('data-goo')).toBe(false)
    }, 5000)

    it('reduced motion: no stagger and no goo; it appears and disappears at once', async () => {
      motion = mockReducedMotion(true)
      const el = await mountMenu({ variant: 'gooey' })
      trigger(el).getBoundingClientRect = () =>
        ({
          left: 0,
          top: 0,
          width: 80,
          height: 32,
          right: 80,
          bottom: 32,
        }) as DOMRect
      ;(el.menuEl as HTMLElement).getBoundingClientRect = () =>
        ({
          left: 0,
          top: 38,
          width: 160,
          height: 120,
          right: 160,
          bottom: 158,
        }) as DOMRect
      const rows = Array.from(el.children).filter(
        (row) => row.slot !== 'trigger',
      ) as HTMLElement[]
      const opening = el.show()
      expect(el.popoverEl?.hasAttribute('data-goo')).toBe(false)
      expect(rows[0].style.opacity).toBe('')
      await opening
      expect(isShown(el)).toBe(true)
      expect(el.shadowRoot?.querySelector('.goo-fill')?.children.length).toBe(0)
      expect(el.popoverEl?.style.transform ?? '').toBe('')
      await el.hide()
      expect(isShown(el)).toBe(false)
    })
  })
})
