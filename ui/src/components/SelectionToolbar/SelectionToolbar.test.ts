import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import '../Button/Button'
import '../Table/Table'
import type { MoulButton } from '../Button/Button'
import type { MoulTable, TableColumn } from '../Table/Table'
import './SelectionToolbar'
import type { MoulSelectionToolbar } from './SelectionToolbar'

interface File {
  id: string
  name: string
}

const COLUMNS: TableColumn<File>[] = [{ key: 'name', title: 'Name' }]
const FILES: File[] = [
  { id: 'a', name: 'invoice.pdf' },
  { id: 'b', name: 'photo.jpg' },
  { id: 'c', name: 'notes.txt' },
]

const part = (toolbar: MoulSelectionToolbar, name: string): HTMLElement =>
  toolbar.shadowRoot!.querySelector<HTMLElement>(`[part~="${name}"]`)!

const bar = (toolbar: MoulSelectionToolbar) => part(toolbar, 'bar')
const clearButton = (toolbar: MoulSelectionToolbar) =>
  part(toolbar, 'clear-button') as HTMLButtonElement
const status = (toolbar: MoulSelectionToolbar) =>
  part(toolbar, 'status').textContent?.trim() ?? ''
const buttons = (toolbar: MoulSelectionToolbar) => [
  ...toolbar.querySelectorAll<MoulButton>('moul-button'),
]
const inner = (button: MoulButton) =>
  button.shadowRoot!.querySelector<HTMLButtonElement>('button')!
const rowBoxes = (table: MoulTable) => [
  ...table.shadowRoot!.querySelectorAll<HTMLInputElement>(
    'tbody input[type="checkbox"]',
  ),
]

/** The innermost focused element, through shadow roots. */
function deepActive(): Element | null {
  let active = document.activeElement
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement
  }
  return active
}

function events(target: EventTarget, type: string): unknown[] {
  const details: unknown[] = []
  target.addEventListener(type, (event) =>
    details.push((event as CustomEvent).detail),
  )
  return details
}

function key(target: Element, name: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
  return event
}

async function settle(toolbar: MoulSelectionToolbar): Promise<void> {
  await toolbar.updateComplete
  await Promise.all(buttons(toolbar).map((button) => button.updateComplete))
  await toolbar.updateComplete
}

async function mount(
  template = html`
    <moul-selection-toolbar count="3">
      <moul-button size="sm" variant="secondary">Archive</moul-button>
      <moul-button size="sm" variant="secondary">Export</moul-button>
      <moul-button size="sm" variant="danger-soft">Delete</moul-button>
    </moul-selection-toolbar>
  `,
): Promise<MoulSelectionToolbar> {
  const toolbar = await fixture<MoulSelectionToolbar>(template)
  await settle(toolbar)
  return toolbar
}

/** A selectable table and a toolbar bound to it, in one fixture. */
async function mountBound(selectedKeys: string[] = []): Promise<{
  table: MoulTable
  toolbar: MoulSelectionToolbar
}> {
  const root = await fixture<HTMLDivElement>(html`
    <div>
      <moul-table
        id="files"
        is-selectable
        aria-label="Files"
        .columns=${COLUMNS}
        .data=${FILES}
        .selectedKeys=${selectedKeys}
      ></moul-table>
      <moul-selection-toolbar for="files" position="sticky">
        <moul-button size="sm">Archive</moul-button>
        <moul-button size="sm">Delete</moul-button>
      </moul-selection-toolbar>
    </div>
  `)
  const table = root.querySelector('moul-table')!
  const toolbar = root.querySelector('moul-selection-toolbar')!
  await table.updateComplete
  await settle(toolbar)
  return { table, toolbar }
}

describe('<moul-selection-toolbar>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('visibility', () => {
    it('shows the bar only while count is above zero', async () => {
      motion = mockReducedMotion(true)
      const toolbar = await mount(
        html`<moul-selection-toolbar></moul-selection-toolbar>`,
      )
      expect(toolbar.count).toBe(0)
      expect(toolbar.getAttribute('count')).toBe('0')
      expect(bar(toolbar).hidden).toBe(true)
      expect(bar(toolbar).hasAttribute('inert')).toBe(true)

      toolbar.count = 3
      await settle(toolbar)
      expect(bar(toolbar).hidden).toBe(false)
      expect(bar(toolbar).hasAttribute('inert')).toBe(false)
      expect(
        part(toolbar, 'label').textContent?.replace(/\s+/g, ' ').trim(),
      ).toBe('3 selected')
      expect(toolbar.getAttribute('count')).toBe('3')

      toolbar.count = 0
      await settle(toolbar)
      expect(bar(toolbar).hidden).toBe(true)
    })

    it('keeps the bar inert but on screen while it slides away', async () => {
      motion = mockReducedMotion(false)
      const toolbar = await mount()
      expect(bar(toolbar).hidden).toBe(false)

      toolbar.count = 0
      await settle(toolbar)
      expect(bar(toolbar).hasAttribute('inert')).toBe(true)
      expect(bar(toolbar).hidden).toBe(false)
      // The last count stays on screen while the bar goes
      expect(part(toolbar, 'count').textContent).toBe('3')
      await vi.waitFor(() => expect(bar(toolbar).hidden).toBe(true))
    })

    it('fires openchange when the bar appears and goes, not on first render', async () => {
      motion = mockReducedMotion(true)
      const changes: unknown[] = []
      const toolbar = await fixture<MoulSelectionToolbar>(html`
        <moul-selection-toolbar
          count="2"
          @openchange=${(event: CustomEvent) => changes.push(event.detail)}
        ></moul-selection-toolbar>
      `)
      await settle(toolbar)
      expect(changes).toEqual([])

      toolbar.count = 5
      await settle(toolbar)
      expect(changes).toEqual([])

      toolbar.count = 0
      await settle(toolbar)
      toolbar.count = 1
      await settle(toolbar)
      expect(changes).toEqual([{ isOpen: false }, { isOpen: true }])
    })

    it('reflects position, fixed by default, and pins fixed to the safe area', async () => {
      const toolbar = await mount()
      expect(toolbar.position).toBe('fixed')
      expect(toolbar.getAttribute('position')).toBe('fixed')
      toolbar.position = 'sticky'
      await settle(toolbar)
      expect(toolbar.getAttribute('position')).toBe('sticky')

      const css = (
        customElements.get('moul-selection-toolbar') as unknown as {
          styles: { cssText: string }[]
        }
      ).styles
        .map((style) => style.cssText)
        .join('\n')
      expect(css).toMatch(
        /:host\(\[position="fixed"\]\)\s*{\s*position: fixed;[^}]*env\(safe-area-inset-bottom/,
      )
      expect(css).toMatch(
        /:host\(\[position="sticky"\]\)\s*{\s*position: sticky;/,
      )
      expect(css).toContain(':host([position="static"])')
    })
  })

  describe('label', () => {
    it('names the toolbar with label, "Bulk actions" by default', async () => {
      const toolbar = await mount()
      expect(bar(toolbar).getAttribute('role')).toBe('toolbar')
      expect(bar(toolbar).getAttribute('aria-label')).toBe('Bulk actions')
      expect(bar(toolbar).getAttribute('aria-describedby')).toBe('label')
      expect(part(toolbar, 'label').id).toBe('label')

      toolbar.label = 'File actions'
      toolbar.clearLabel = 'Deselect all'
      await settle(toolbar)
      expect(bar(toolbar).getAttribute('aria-label')).toBe('File actions')
      expect(clearButton(toolbar).getAttribute('aria-label')).toBe(
        'Deselect all',
      )
    })

    it('replaces the default text with the label slot', async () => {
      const toolbar = await mount(html`
        <moul-selection-toolbar count="2">
          <span slot="label">2 files</span>
          <moul-button size="sm">Archive</moul-button>
        </moul-selection-toolbar>
      `)
      const slot =
        toolbar.shadowRoot!.querySelector<HTMLSlotElement>(
          'slot[name="label"]',
        )!
      expect(slot.assignedNodes().map((node) => node.textContent)).toEqual([
        '2 files',
      ])
      // The label is not an action: arrows skip it
      expect(buttons(toolbar)).toHaveLength(1)
    })
  })

  describe('binding to a table', () => {
    it('reads the selection on connect and follows selectionchange', async () => {
      const { table, toolbar } = await mountBound(['b'])
      expect(toolbar.count).toBe(1)

      rowBoxes(table)[0].click()
      await settle(toolbar)
      expect(toolbar.count).toBe(2)

      table.shadowRoot!.querySelector<HTMLInputElement>('thead input')!.click()
      await settle(toolbar)
      expect(toolbar.count).toBe(3)

      table.clearSelection()
      await settle(toolbar)
      expect(toolbar.count).toBe(0)
    })

    it('ignores selectionchange from elements inside the table', async () => {
      const { table, toolbar } = await mountBound(['a'])
      const child = document.createElement('span')
      table.append(child)
      child.dispatchEvent(
        new CustomEvent('selectionchange', {
          bubbles: true,
          composed: true,
          detail: { selectedKeys: ['x', 'y', 'z', 'w'] },
        }),
      )
      expect(toolbar.count).toBe(1)
    })

    it('binds to a table that appears later', async () => {
      const root = await fixture<HTMLDivElement>(html`
        <div>
          <moul-selection-toolbar for="late"></moul-selection-toolbar>
        </div>
      `)
      const toolbar = root.querySelector('moul-selection-toolbar')!
      await settle(toolbar)
      expect(toolbar.count).toBe(0)

      const table = document.createElement('moul-table')
      table.isSelectable = true
      table.columns = COLUMNS
      table.data = FILES
      table.selectedKeys = ['a', 'c']
      table.id = 'late'
      root.append(table)
      await vi.waitFor(() => expect(toolbar.count).toBe(2))

      await table.updateComplete
      rowBoxes(table)[1].click()
      await settle(toolbar)
      expect(toolbar.count).toBe(3)
    })

    it('rebinds when for changes and unbinds when disconnected', async () => {
      const root = await fixture<HTMLDivElement>(html`
        <div>
          <moul-table id="one" is-selectable .columns=${COLUMNS} .data=${FILES} .selectedKeys=${['a']}></moul-table>
          <moul-table id="two" is-selectable .columns=${COLUMNS} .data=${FILES} .selectedKeys=${['a', 'b']}></moul-table>
          <moul-selection-toolbar for="one"></moul-selection-toolbar>
        </div>
      `)
      const [one, two] = root.querySelectorAll('moul-table')
      const toolbar = root.querySelector('moul-selection-toolbar')!
      await one.updateComplete
      await two.updateComplete
      await settle(toolbar)
      expect(toolbar.count).toBe(1)

      toolbar.htmlFor = 'two'
      await settle(toolbar)
      expect(toolbar.count).toBe(2)
      one.clearSelection()
      await settle(toolbar)
      expect(toolbar.count).toBe(2) // no longer listening to one

      toolbar.setAttribute('for', 'one')
      await settle(toolbar)
      expect(toolbar.count).toBe(0)

      toolbar.remove()
      two.clearSelection()
      one.selectedKeys = ['a', 'b', 'c']
      rowBoxes(one)[0].click()
      expect(toolbar.count).toBe(0)
    })
  })

  describe('clearing', () => {
    it('fires clear from the clear button, then clears the table and count', async () => {
      motion = mockReducedMotion(true)
      const { table, toolbar } = await mountBound(['a', 'b'])
      const clears = events(toolbar, 'clear')
      const selections = events(table, 'selectionchange')
      const button = clearButton(toolbar)
      expect(button.type).toBe('button')
      expect(button.getAttribute('aria-label')).toBe('Clear selection')

      button.click()
      await settle(toolbar)
      expect(clears).toHaveLength(1)
      expect(table.selectedKeys).toEqual([])
      expect(selections).toEqual([{ selectedKeys: [] }])
      expect(toolbar.count).toBe(0)
      expect(bar(toolbar).hidden).toBe(true)
    })

    it('does nothing when clear is cancelled', async () => {
      const { table, toolbar } = await mountBound(['a', 'b'])
      toolbar.addEventListener('clear', (event) => event.preventDefault())
      clearButton(toolbar).click()
      await settle(toolbar)
      expect(table.selectedKeys).toEqual(['a', 'b'])
      expect(toolbar.count).toBe(2)
    })

    it('sets count to 0 without a table', async () => {
      motion = mockReducedMotion(true)
      const toolbar = await mount()
      clearButton(toolbar).click()
      await settle(toolbar)
      expect(toolbar.count).toBe(0)
    })

    it('clears on Escape from anywhere in the bar, through the same cancelable event', async () => {
      motion = mockReducedMotion(true)
      const toolbar = await mount()
      let isCancelled = true
      toolbar.addEventListener('clear', (event) => {
        if (isCancelled) event.preventDefault()
      })
      const cancelled = key(inner(buttons(toolbar)[1]), 'Escape')
      expect(cancelled.defaultPrevented).toBe(false) // left for an enclosing dialog
      expect(toolbar.count).toBe(3)

      isCancelled = false
      expect(key(inner(buttons(toolbar)[1]), 'Escape').defaultPrevented).toBe(
        true,
      )
      await settle(toolbar)
      expect(toolbar.count).toBe(0)
    })

    it('leaves Escape alone when a control inside handled it', async () => {
      const toolbar = await mount()
      const target = inner(buttons(toolbar)[0])
      target.addEventListener('keydown', (event) => event.preventDefault())
      key(target, 'Escape')
      expect(toolbar.count).toBe(3)
    })
  })

  describe('keyboard and screen readers', () => {
    it('keeps one Tab stop: the first action, then whichever was focused last', async () => {
      const toolbar = await mount()
      const [archive, exportButton, remove] = buttons(toolbar)
      // A moul-button without tabindex is one stop (its inner button)
      expect(archive.hasAttribute('tabindex')).toBe(false)
      expect(exportButton.getAttribute('tabindex')).toBe('-1')
      expect(remove.getAttribute('tabindex')).toBe('-1')
      expect(clearButton(toolbar).getAttribute('tabindex')).toBe('-1')

      inner(remove).focus()
      expect(remove.hasAttribute('tabindex')).toBe(false)
      expect(archive.getAttribute('tabindex')).toBe('-1')
    })

    it('gives an action its own tabindex back when it leaves the toolbar', async () => {
      const toolbar = await mount()
      const [, exportButton] = buttons(toolbar)
      exportButton.setAttribute('tabindex', '-1')
      await toolbar.updateComplete
      const own = document.createElement('moul-button')
      own.setAttribute('tabindex', '3')
      toolbar.append(own)
      await new Promise((resolve) => setTimeout(resolve))
      expect(own.getAttribute('tabindex')).toBe('-1')

      document.body.append(own)
      await new Promise((resolve) => setTimeout(resolve))
      expect(own.getAttribute('tabindex')).toBe('3')

      toolbar.remove()
      expect(exportButton.hasAttribute('tabindex')).toBe(false)
      own.remove()
    })

    it('moves focus with the arrow keys, wrapping, and Home and End', async () => {
      const toolbar = await mount()
      const [archive, exportButton, remove] = buttons(toolbar)
      const clear = clearButton(toolbar)

      inner(archive).focus()
      key(inner(archive), 'ArrowRight')
      expect(deepActive()).toBe(inner(exportButton))
      key(inner(exportButton), 'ArrowRight')
      key(inner(remove), 'ArrowRight')
      expect(deepActive()).toBe(clear)
      expect(clear.getAttribute('tabindex')).toBe('0')
      key(clear, 'ArrowRight')
      expect(deepActive()).toBe(inner(archive)) // wraps
      key(inner(archive), 'ArrowLeft')
      expect(deepActive()).toBe(clear) // wraps back

      key(clear, 'Home')
      expect(deepActive()).toBe(inner(archive))
      const end = key(inner(archive), 'End')
      expect(end.defaultPrevented).toBe(true)
      expect(deepActive()).toBe(clear)
    })

    it('skips disabled and hidden buttons', async () => {
      const toolbar = await mount(html`
        <moul-selection-toolbar count="1">
          <moul-button size="sm" is-disabled>Archive</moul-button>
          <moul-button size="sm">Export</moul-button>
          <moul-button size="sm" hidden>Restore</moul-button>
          <moul-button size="sm">Delete</moul-button>
        </moul-selection-toolbar>
      `)
      const [archive, exportButton, , remove] = buttons(toolbar)
      // The first enabled action holds the Tab stop
      expect(archive.getAttribute('tabindex')).toBe('-1')
      expect(exportButton.hasAttribute('tabindex')).toBe(false)

      inner(exportButton).focus()
      key(inner(exportButton), 'ArrowRight')
      expect(deepActive()).toBe(inner(remove))
      key(inner(remove), 'ArrowLeft')
      key(inner(exportButton), 'ArrowLeft')
      expect(deepActive()).toBe(clearButton(toolbar))
    })

    it('moves the Tab stop off an action that turns disabled', async () => {
      const toolbar = await mount()
      const [archive, exportButton] = buttons(toolbar)
      expect(archive.hasAttribute('tabindex')).toBe(false)
      archive.isDisabled = true
      toolbar.count = 4
      await settle(toolbar)
      expect(archive.getAttribute('tabindex')).toBe('-1')
      expect(exportButton.hasAttribute('tabindex')).toBe(false)
    })

    it('swaps the arrows right to left', async () => {
      const toolbar = await mount()
      const [archive] = buttons(toolbar)
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        direction: 'rtl',
      } as CSSStyleDeclaration)
      inner(archive).focus()
      key(inner(archive), 'ArrowLeft')
      expect(deepActive()).toBe(inner(buttons(toolbar)[1]))
    })

    it('does not move focus when the bar appears', async () => {
      motion = mockReducedMotion(false)
      const root = await fixture<HTMLDivElement>(html`
        <div>
          <button id="outside">Outside</button>
          <moul-selection-toolbar>
            <moul-button size="sm">Archive</moul-button>
          </moul-selection-toolbar>
        </div>
      `)
      const outside = root.querySelector<HTMLButtonElement>('#outside')!
      const toolbar = root.querySelector('moul-selection-toolbar')!
      outside.focus()
      toolbar.count = 2
      await settle(toolbar)
      expect(document.activeElement).toBe(outside)
    })

    it('announces the count once it settles, so select all speaks once', async () => {
      motion = mockReducedMotion(true)
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      const toolbar = await mount(
        html`<moul-selection-toolbar></moul-selection-toolbar>`,
      )
      expect(part(toolbar, 'status').getAttribute('role')).toBe('status')

      for (const count of [1, 2, 3, 4]) {
        toolbar.count = count
        await settle(toolbar)
        vi.advanceTimersByTime(100)
      }
      expect(status(toolbar)).toBe('')
      vi.advanceTimersByTime(400)
      await settle(toolbar)
      expect(status(toolbar)).toBe('4 selected')

      // Cleared: the region empties, so the next count is spoken again
      toolbar.count = 0
      await settle(toolbar)
      vi.advanceTimersByTime(400)
      await settle(toolbar)
      expect(status(toolbar)).toBe('')
    })

    it('announces the label slot text when there is one', async () => {
      motion = mockReducedMotion(true)
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      const toolbar = await mount(html`
        <moul-selection-toolbar>
          <span slot="label">ជ្រើស ២</span>
        </moul-selection-toolbar>
      `)
      toolbar.count = 2
      await settle(toolbar)
      vi.advanceTimersByTime(400)
      await settle(toolbar)
      expect(status(toolbar)).toBe('ជ្រើស ២')
    })

    it('returns focus to where it was before the bar when it hides with focus inside', async () => {
      motion = mockReducedMotion(true)
      const { table, toolbar } = await mountBound()
      const box = rowBoxes(table)[1]
      box.focus()
      box.click()
      await settle(toolbar)
      expect(toolbar.count).toBe(1)

      const [archive] = buttons(toolbar)
      inner(archive).focus()
      key(inner(archive), 'Escape')
      await settle(toolbar)
      await table.updateComplete
      expect(toolbar.count).toBe(0)
      expect(deepActive()).toBe(box)
    })

    it('falls back to the bound table when the earlier element is gone', async () => {
      motion = mockReducedMotion(true)
      const { table, toolbar } = await mountBound(['a'])
      const outside = document.createElement('button')
      document.body.append(outside)
      outside.focus()
      outside.remove()

      clearButton(toolbar).focus()
      clearButton(toolbar).click()
      await settle(toolbar)
      expect(deepActive()).toBe(
        table.shadowRoot!.querySelector('thead input[type="checkbox"]'),
      )
    })

    it('leaves focus alone when the bar hides while focus is elsewhere', async () => {
      motion = mockReducedMotion(true)
      const { table, toolbar } = await mountBound(['a'])
      const box = rowBoxes(table)[2]
      box.focus()
      table.clearSelection()
      await settle(toolbar)
      expect(deepActive()).toBe(box)
    })
  })

  describe('reduced motion', () => {
    it('pops the count when it changes while the bar is open', async () => {
      motion = mockReducedMotion(false)
      const toolbar = await mount()
      toolbar.count = 4
      await settle(toolbar)
      await vi.waitFor(() =>
        expect(part(toolbar, 'count').style.transform).not.toBe(''),
      )
    })

    it('appears and disappears at once, with no pop', async () => {
      motion = mockReducedMotion(true)
      const toolbar = await mount(
        html`<moul-selection-toolbar></moul-selection-toolbar>`,
      )
      toolbar.count = 2
      await settle(toolbar)
      expect(bar(toolbar).hidden).toBe(false)
      expect(bar(toolbar).style.opacity).toBe('')
      expect(bar(toolbar).style.transform).toBe('')

      toolbar.count = 3
      await settle(toolbar)
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(part(toolbar, 'count').style.transform).toBe('')

      toolbar.count = 0
      await settle(toolbar)
      expect(bar(toolbar).hidden).toBe(true)
    })
  })
})
