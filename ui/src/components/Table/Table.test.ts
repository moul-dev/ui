import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import type { MoulSearchField } from '../SearchField/SearchField'
import type { MoulSelect } from '../Select/Select'
import './Table'
import type { MoulTable, TableColumn } from './Table'

interface Service {
  id: string
  name: string
  region: string
  status: string
  latency: number
}

const SERVICES: Service[] = [
  {
    id: 's1',
    name: 'api-gateway',
    region: 'us-east',
    status: 'Healthy',
    latency: 42,
  },
  {
    id: 's2',
    name: 'auth-worker',
    region: 'ap-southeast',
    status: 'Degraded',
    latency: 188,
  },
  {
    id: 's3',
    name: 'billing',
    region: 'eu-west',
    status: 'Healthy',
    latency: 7,
  },
  { id: 's4', name: 'search', region: 'us-west', status: 'Down', latency: 95 },
]

const STATUS: TableColumn<Service> = {
  key: 'status',
  title: 'Status',
  filterOptions: [
    { value: 'Healthy', label: 'Healthy' },
    { value: 'Degraded', label: 'Degraded' },
    { value: 'Down', label: 'Down' },
  ],
}

const COLUMNS: TableColumn<Service>[] = [
  { key: 'name', title: 'Service', sortable: true },
  { key: 'region', title: 'Region' },
  STATUS,
  { key: 'latency', title: 'p95', align: 'right', sortable: true },
]

const $ = <T extends Element = HTMLElement>(
  table: MoulTable,
  selector: string,
): T | null => table.shadowRoot!.querySelector<T>(selector)

const $$ = <T extends Element = HTMLElement>(
  table: MoulTable,
  selector: string,
): T[] => [...table.shadowRoot!.querySelectorAll<T>(selector)]

/** Service names of the rows on screen, top to bottom. */
const names = (table: MoulTable): string[] =>
  $$(table, 'tr[part="row"] td[data-label="Service"]').map(
    (td) => td.textContent ?? '',
  )

const status = (table: MoulTable): string =>
  $(table, '[role="status"]')?.textContent?.trim() ?? ''

async function mount(
  template = html`<moul-table .columns=${COLUMNS} .data=${SERVICES}></moul-table>`,
): Promise<MoulTable> {
  const table = await fixture<MoulTable>(template)
  await settle(table)
  return table
}

/** Waits for the table and the Moul elements in its shadow root. */
async function settle(table: MoulTable): Promise<void> {
  await table.updateComplete
  await Promise.all(
    $$(table, 'moul-search-field, moul-select').map(
      (el) => (el as MoulSelect).updateComplete,
    ),
  )
  await table.updateComplete
}

/** Types into the search field the way a user does: through its inner `<input>`. */
async function type(table: MoulTable, value: string): Promise<void> {
  const field = $<MoulSearchField>(table, 'moul-search-field')!
  const input = field.shadowRoot!.querySelector('input')!
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
  await settle(table)
}

/** Picks an option in a filter select by clicking its item. */
async function pick(table: MoulTable, filter: number, option: number) {
  const select = $$<MoulSelect>(table, 'moul-select[part="filter"]')[filter]
  select.querySelectorAll('moul-select-item')[option].click()
  await settle(table)
}

function headerButton(table: MoulTable, title: string): HTMLButtonElement {
  return $$<HTMLButtonElement>(table, 'th button[part="sort-button"]').find(
    (button) => button.textContent?.trim() === title,
  )!
}

/** Every stylesheet of the table, as one string. */
const tableCss = (): string =>
  [(customElements.get('moul-table') as typeof MoulTable).styles]
    .flat(Number.POSITIVE_INFINITY)
    .map((style) => String((style as { cssText?: string }).cssText))
    .join('\n')

function events(target: EventTarget, type: string): unknown[] {
  const details: unknown[] = []
  target.addEventListener(type, (event) =>
    details.push((event as CustomEvent).detail),
  )
  return details
}

describe('<moul-table> upgrades', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    vi.restoreAllMocks()
  })

  describe('search', () => {
    it('shows a labelled search field and matches every column case-insensitively', async () => {
      const table = await mount(html`
        <moul-table
          is-searchable
          aria-label="Services"
          .columns=${COLUMNS}
          .data=${SERVICES}
        ></moul-table>
      `)
      const toolbar = $(table, '[part="toolbar"]')!
      expect(toolbar.hidden).toBe(false)
      const field = $<MoulSearchField>(table, 'moul-search-field')!
      expect(field.getAttribute('part')).toBe('search')
      expect(field.label).toBe('Search Services')
      expect(field.placeholder).toBe('Search...')

      const searches = events(table, 'searchchange')
      await type(table, 'BILL')
      expect(names(table)).toEqual(['billing'])
      expect(searches).toEqual([{ query: 'BILL' }])
      expect(table.searchQuery).toBe('BILL')

      // Region text is searched too
      await type(table, 'us-')
      expect(names(table)).toEqual(['api-gateway', 'search'])

      // Escape-style clearing brings every row back
      await type(table, '')
      expect(names(table)).toHaveLength(4)
    })

    it('takes search-query and search-placeholder attributes, honours searchable and searchValue', async () => {
      const columns: TableColumn<Service>[] = [
        { key: 'name', title: 'Service' },
        { key: 'region', title: 'Region', searchable: false },
        {
          key: 'status',
          title: 'Status',
          searchValue: (row) =>
            row.status === 'Down' ? 'Down outage' : row.status,
        },
      ]
      const table = await mount(html`
        <moul-table
          is-searchable
          search-query="outage"
          search-placeholder="Find a service"
          .columns=${columns}
          .data=${SERVICES}
        ></moul-table>
      `)
      expect(names(table)).toEqual(['search'])
      expect($<MoulSearchField>(table, 'moul-search-field')!.placeholder).toBe(
        'Find a service',
      )
      expect($<MoulSearchField>(table, 'moul-search-field')!.label).toBe(
        'Search table',
      )

      // Region is not searchable, so nothing matches
      table.searchQuery = 'west'
      await settle(table)
      expect(names(table)).toEqual([])
      expect($(table, '[part="empty"]')?.textContent?.trim()).toBe('No results')
    })

    it('keeps the search field events inside the table', async () => {
      const table = await mount(html`
        <moul-table is-searchable .columns=${COLUMNS} .data=${SERVICES}></moul-table>
      `)
      const leaked = vi.fn()
      for (const type of ['input', 'change', 'clear', 'submit']) {
        table.addEventListener(type, leaked)
      }
      await type(table, 'auth')
      const input = $<MoulSearchField>(
        table,
        'moul-search-field',
      )!.shadowRoot!.querySelector('input')!
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          composed: true,
        }),
      )
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          composed: true,
        }),
      )
      await settle(table)
      expect(leaked).not.toHaveBeenCalled()
      expect(table.searchQuery).toBe('')
    })
  })

  describe('toolbar', () => {
    it('renders only when it has something in it', async () => {
      const table = await mount(html`
        <moul-table .columns=${[{ key: 'name', title: 'Service' }]} .data=${SERVICES}></moul-table>
      `)
      expect($(table, '[part="toolbar"]')!.hidden).toBe(true)

      const withSlot = await mount(html`
        <moul-table .columns=${[{ key: 'name', title: 'Service' }]} .data=${SERVICES}>
          <button slot="toolbar">Export</button>
        </moul-table>
      `)
      await new Promise((resolve) => setTimeout(resolve))
      await withSlot.updateComplete
      expect($(withSlot, '[part="toolbar"]')!.hidden).toBe(false)
    })
  })

  describe('filters', () => {
    it('adds a labelled select per filterable column and filters by exact value', async () => {
      const table = await mount()
      const selects = $$<MoulSelect>(table, 'moul-select[part="filter"]')
      expect(selects).toHaveLength(1)
      expect(selects[0].label).toBe('Status')
      const items = [...selects[0].querySelectorAll('moul-select-item')]
      expect(items.map((item) => item.textContent?.trim())).toEqual([
        'All Status',
        'Healthy',
        'Degraded',
        'Down',
      ])
      expect(selects[0].selectedKey).toBe('')

      const changes = events(table, 'filterchange')
      const rowSelections = events(table, 'selectionchange')
      await pick(table, 0, 1)
      expect(table.filters).toEqual({ status: 'Healthy' })
      expect(changes).toEqual([{ filters: { status: 'Healthy' } }])
      expect(names(table)).toEqual(['api-gateway', 'billing'])
      // The select's own selectionchange stays inside the table
      expect(rowSelections).toEqual([])

      // "All Status" clears the filter
      await pick(table, 0, 0)
      expect(table.filters).toEqual({})
      expect(changes[1]).toEqual({ filters: {} })
      expect(names(table)).toHaveLength(4)
    })

    it('takes a settable filters record, ANDs filters and honours filterValue', async () => {
      const columns: TableColumn<Service>[] = [
        ...COLUMNS.slice(0, 3),
        {
          key: 'latency',
          label: 'Speed',
          title: html`<em>p95</em>`,
          filterValue: (row) => (row.latency > 50 ? 'slow' : 'fast'),
          filterOptions: [
            { value: 'fast', label: 'Fast' },
            { value: 'slow', label: 'Slow' },
          ],
        },
      ]
      const table = await mount(html`
        <moul-table .columns=${columns} .data=${SERVICES}></moul-table>
      `)
      const selects = $$<MoulSelect>(table, 'moul-select[part="filter"]')
      expect(selects.map((select) => select.label)).toEqual(['Status', 'Speed'])

      table.filters = { latency: 'slow' }
      await settle(table)
      expect(names(table)).toEqual(['auth-worker', 'search'])
      expect(selects[1].selectedKey).toBe('slow')

      table.filters = { latency: 'slow', status: 'Down' }
      await settle(table)
      expect(names(table)).toEqual(['search'])
    })
  })

  describe('client-side sorting', () => {
    it('sorts numbers numerically and strings in locale order, both ways', async () => {
      const table = await mount(html`
        <moul-table is-sortable .columns=${COLUMNS} .data=${SERVICES}></moul-table>
      `)
      const sorts = events(table, 'sortchange')
      headerButton(table, 'p95').click()
      await settle(table)
      expect(names(table)).toEqual([
        'billing',
        'api-gateway',
        'search',
        'auth-worker',
      ])
      headerButton(table, 'p95').click()
      await settle(table)
      expect(names(table)).toEqual([
        'auth-worker',
        'search',
        'api-gateway',
        'billing',
      ])
      expect(sorts).toEqual([
        { column: 'latency', direction: 'asc' },
        { column: 'latency', direction: 'desc' },
      ])

      table.data = [{ name: 'item-10' }, { name: 'item-2' }, { name: 'Item-1' }]
      table.columns = [{ key: 'name', title: 'Service', sortable: true }]
      table.sortColumn = 'name'
      table.sortDirection = 'asc'
      await settle(table)
      expect(names(table)).toEqual(['Item-1', 'item-2', 'item-10'])
    })

    it('sorts by sortValue and from the sort-column attribute on first render', async () => {
      const severity: Record<string, number> = {
        Down: 0,
        Degraded: 1,
        Healthy: 2,
      }
      const columns: TableColumn<Service>[] = [
        { key: 'name', title: 'Service' },
        { ...STATUS, sortable: true, sortValue: (row) => severity[row.status] },
      ]
      const table = await mount(html`
        <moul-table
          is-sortable
          sort-column="status"
          sort-direction="asc"
          .columns=${columns}
          .data=${SERVICES}
        ></moul-table>
      `)
      expect(names(table)).toEqual([
        'search',
        'auth-worker',
        'api-gateway',
        'billing',
      ])
      // `data` itself is never reordered
      expect(table.data.map((row) => row.name)).toEqual(
        SERVICES.map((row) => row.name),
      )
    })
  })

  describe('manual mode', () => {
    it('only reports search, filter and sort, and renders data as given', async () => {
      const table = await mount(html`
        <moul-table
          is-manual
          is-searchable
          is-sortable
          .columns=${COLUMNS}
          .data=${SERVICES}
        ></moul-table>
      `)
      const fired = {
        search: events(table, 'searchchange'),
        filter: events(table, 'filterchange'),
        sort: events(table, 'sortchange'),
      }
      await type(table, 'billing')
      await pick(table, 0, 3)
      headerButton(table, 'p95').click()
      await settle(table)

      expect(fired.search).toEqual([{ query: 'billing' }])
      expect(fired.filter).toEqual([{ filters: { status: 'Down' } }])
      expect(fired.sort).toEqual([{ column: 'latency', direction: 'asc' }])
      expect(names(table)).toEqual(SERVICES.map((row) => row.name))
      // The count waits for the app's new data
      expect(status(table)).toBe('')
      table.data = [SERVICES[2]]
      await settle(table)
      expect(status(table)).toBe('1 result')
    })
  })

  describe('rowKey', () => {
    it('keys selection, expansion and rendering by rowKey', async () => {
      const table = await mount(html`
        <moul-table
          is-sortable
          is-selectable
          .rowKey=${(row: Service) => row.name}
          .renderExpanded=${(row: Service) => `Owner of ${row.name}`}
          .columns=${COLUMNS}
          .data=${SERVICES}
        ></moul-table>
      `)
      const billingRow = () =>
        $$(table, 'tr[part="row"]').find((tr) =>
          tr.textContent?.includes('billing'),
        )!
      const before = billingRow()
      billingRow()
        .querySelector<HTMLInputElement>('input[type="checkbox"]')!
        .click()
      await settle(table)
      expect(table.selectedKeys).toEqual(['billing'])

      billingRow()
        .querySelector<HTMLButtonElement>('[part="expand-button"]')!
        .click()
      await settle(table)
      expect(table.expandedKeys).toEqual(['billing'])

      // Sorting moves the same <tr>, it does not re-create it
      headerButton(table, 'p95').click()
      await settle(table)
      expect(names(table)[0]).toBe('billing')
      expect(billingRow()).toBe(before)
    })

    it('defaults to key, then id, then the index in data', async () => {
      const table = await mount(html`
        <moul-table
          is-selectable
          .data=${[{ key: 'k', id: 'i', n: 'a' }, { id: 'i2', n: 'b' }, { n: 'c' }]}
        ></moul-table>
      `)
      $(table, 'thead input[type="checkbox"]')!.click()
      await settle(table)
      expect(table.selectedKeys).toEqual(['k', 'i2', '2'])
    })
  })

  describe('density, loading and columns', () => {
    it('reflects is-dense and tightens rows in CSS', async () => {
      const table = await mount(html`
        <moul-table is-dense .columns=${COLUMNS} .data=${SERVICES}></moul-table>
      `)
      expect(table.isDense).toBe(true)
      table.isDense = false
      await settle(table)
      expect(table.hasAttribute('is-dense')).toBe(false)
      expect(tableCss()).toContain(':host([is-dense])')
    })

    it('shows skeleton-rows placeholder rows and aria-busy while loading', async () => {
      const table = await mount(html`
        <moul-table is-loading skeleton-rows="5" .columns=${COLUMNS}></moul-table>
      `)
      expect($$(table, '[part="loading-row"]')).toHaveLength(5)
      expect($(table, 'table')!.getAttribute('aria-busy')).toBe('true')
      expect($(table, '[part="empty"]')).toBeNull()

      table.skeletonRows = 2
      await settle(table)
      expect($$(table, '[part="loading-row"]')).toHaveLength(2)

      table.isLoading = false
      table.data = SERVICES
      await settle(table)
      expect($(table, 'table')!.hasAttribute('aria-busy')).toBe(false)
      expect($$(table, '[part="loading-row"]')).toHaveLength(0)
    })

    it('renders template titles, labels, widths and alignment', async () => {
      const columns: TableColumn<Service>[] = [
        {
          key: '__pick',
          title: html`<input type="checkbox" aria-label="Custom select all" />`,
          width: '44px',
          render: () => html`<input type="checkbox" />`,
        },
        {
          key: 'name',
          title: html`<strong>Service</strong>`,
          label: 'Service',
        },
        { key: 'latency', title: 'p95', align: 'right', width: '6rem' },
      ]
      const table = await mount(html`
        <moul-table aria-label="Services" .columns=${columns} .data=${SERVICES}></moul-table>
      `)
      const ths = $$(table, 'th[part="th"]')
      expect(
        ths[0].querySelector('input[aria-label="Custom select all"]'),
      ).not.toBeNull()
      expect(ths[0].getAttribute('style')).toBe('width: 44px')
      expect(ths[1].querySelector('strong')?.textContent).toBe('Service')
      expect(ths[2].classList.contains('right')).toBe(true)
      expect(ths[2].getAttribute('style')).toBe('width: 6rem')

      const cells = $$(table, 'tr[part="row"]')[0].querySelectorAll('td')
      expect(cells[0].hasAttribute('data-label')).toBe(false)
      expect(cells[1].getAttribute('data-label')).toBe('Service')
      expect(cells[2].getAttribute('data-label')).toBe('p95')
      expect(cells[2].classList.contains('right')).toBe(true)
      // aria-label on the host names the table
      expect($(table, 'table')!.getAttribute('aria-label')).toBe('Services')
    })
  })

  describe('expandable rows', () => {
    async function mountExpandable(): Promise<MoulTable> {
      return mount(html`
        <moul-table
          is-selectable
          .renderExpanded=${(row: Service) => html`<p class="owner">Owner of ${row.name}</p>`}
          .columns=${COLUMNS}
          .data=${SERVICES}
        ></moul-table>
      `)
    }
    const expandButtons = (table: MoulTable) =>
      $$<HTMLButtonElement>(table, '[part="expand-button"]')

    it('leads each row with a named toggle button', async () => {
      const table = await mountExpandable()
      const buttons = expandButtons(table)
      expect(buttons).toHaveLength(4)
      expect(buttons[0].type).toBe('button')
      expect(buttons[0].getAttribute('aria-label')).toBe(
        'Show details for api-gateway',
      )
      expect(buttons[0].getAttribute('aria-expanded')).toBe('false')
      expect(buttons[0].hasAttribute('aria-controls')).toBe(false)
      // The expand cell comes first, then the checkbox, then the columns
      const firstRow = $$(table, 'tr[part="row"]')[0]
      expect(
        firstRow.querySelector('td')?.classList.contains('expand-cell'),
      ).toBe(true)
      expect($$(table, 'thead th').length).toBe(COLUMNS.length + 2)
    })

    it('opens a details row spanning every column and fires expandedchange', async () => {
      const table = await mountExpandable()
      const changes = events(table, 'expandedchange')
      expandButtons(table)[1].click()
      await settle(table)

      const button = expandButtons(table)[1]
      expect(button.getAttribute('aria-expanded')).toBe('true')
      const details = $(
        table,
        `[id="${button.getAttribute('aria-controls')}"]`,
      )!
      expect(details.tagName).toBe('TR')
      expect(details.querySelector('.owner')?.textContent).toBe(
        'Owner of auth-worker',
      )
      expect(details.querySelector('td')?.getAttribute('colspan')).toBe(
        String(COLUMNS.length + 2),
      )
      // It sits right under its row
      expect($$(table, 'tr[part="row"]')[1].nextElementSibling).toBe(details)
      expect(changes).toEqual([{ expandedKeys: ['s2'] }])
      expect(table.expandedKeys).toEqual(['s2'])

      button.click()
      await settle(table)
      expect(button.getAttribute('aria-expanded')).toBe('false')
      expect(button.hasAttribute('aria-controls')).toBe(false)
      expect(changes[1]).toEqual({ expandedKeys: [] })
    })

    it('takes a settable expandedKeys without firing an event', async () => {
      const table = await mountExpandable()
      const changes = events(table, 'expandedchange')
      table.expandedKeys = ['s3', 's4']
      await settle(table)
      expect($$(table, '.details-row')).toHaveLength(2)
      expect(
        expandButtons(table).map((button) =>
          button.getAttribute('aria-expanded'),
        ),
      ).toEqual(['false', 'false', 'true', 'true'])
      expect(changes).toEqual([])
    })

    it('falls back to the row position when no cell holds text', async () => {
      const table = await mount(html`
        <moul-table
          is-selectable
          .renderExpanded=${() => 'More'}
          .data=${[{ id: 1, n: 1 }, { id: 2, n: 2 }]}
        ></moul-table>
      `)
      expect(expandButtons(table)[1].getAttribute('aria-label')).toBe(
        'Show details for row 2',
      )
      expect(
        $$(table, 'tbody input[type="checkbox"]')[1].getAttribute('aria-label'),
      ).toBe('Select row 2')
    })
  })

  describe('cards layout', () => {
    it('reflects layout and labels every cell for the card view', async () => {
      const table = await mount(html`
        <moul-table is-selectable .columns=${COLUMNS} .data=${SERVICES}></moul-table>
      `)
      expect(table.getAttribute('layout')).toBe('auto')
      table.layout = 'cards'
      await settle(table)
      expect(table.getAttribute('layout')).toBe('cards')

      const cells = $$(table, 'tr[part="row"]')[0].querySelectorAll(
        'td[data-label]',
      )
      expect([...cells].map((td) => td.getAttribute('data-label'))).toEqual([
        'Service',
        'Region',
        'Status',
        'p95',
      ])
      // Checkboxes stay in place: cards are CSS over the same markup
      expect($$(table, 'tbody input[type="checkbox"]')).toHaveLength(4)

      const css = tableCss()
      expect(css).toContain('container-type: inline-size')
      expect(css).toMatch(
        /@container \(width < 30rem\)\s*{\s*:host\(\[layout="auto"\]\)/,
      )
      expect(css).toContain(':host([layout="cards"]) td[data-label]::before')
    })
  })

  describe('selection', () => {
    it('selects all over the searched and filtered rows only', async () => {
      const table = await mount(html`
        <moul-table
          is-selectable
          .selectedKeys=${['s4']}
          .columns=${COLUMNS}
          .data=${SERVICES}
        ></moul-table>
      `)
      const selections = events(table, 'selectionchange')
      const all = $<HTMLInputElement>(table, 'thead input[type="checkbox"]')!
      expect(all.getAttribute('aria-label')).toBe('Select all rows')

      await pick(table, 0, 1) // Healthy: s1, s3
      expect(all.checked).toBe(false)
      expect(all.indeterminate).toBe(false)
      all.click()
      await settle(table)
      expect(table.selectedKeys).toEqual(['s4', 's1', 's3'])
      expect(selections).toEqual([{ selectedKeys: ['s4', 's1', 's3'] }])
      expect(all.checked).toBe(true)

      // Unchecking clears the shown rows and keeps the hidden selection
      all.click()
      await settle(table)
      expect(table.selectedKeys).toEqual(['s4'])

      all.click()
      await pick(table, 0, 0)
      // Three of four rows selected: mixed
      expect(all.checked).toBe(false)
      expect(all.indeterminate).toBe(true)
    })

    it('names row checkboxes after the row and disables select all with no rows', async () => {
      const table = await mount(html`
        <moul-table is-selectable is-searchable .columns=${COLUMNS} .data=${SERVICES}></moul-table>
      `)
      const boxes = $$<HTMLInputElement>(table, 'tbody input[type="checkbox"]')
      expect(boxes.map((box) => box.getAttribute('aria-label'))).toEqual([
        'Select api-gateway',
        'Select auth-worker',
        'Select billing',
        'Select search',
      ])
      boxes[0].click()
      await settle(table)
      const all = $<HTMLInputElement>(table, 'thead input[type="checkbox"]')!
      expect(all.indeterminate).toBe(true)

      table.selectedKeys = SERVICES.map((row) => row.id)
      await settle(table)
      expect(all.indeterminate).toBe(false)
      expect(all.checked).toBe(true)

      await type(table, 'nothing matches this')
      expect(all.disabled).toBe(true)
      expect(all.checked).toBe(false)
    })

    it('clearSelection() empties every selected key and fires selectionchange once', async () => {
      const table = await mount(html`
        <moul-table
          is-selectable
          is-searchable
          .selectedKeys=${['s1', 's4']}
          .columns=${COLUMNS}
          .data=${SERVICES}
        ></moul-table>
      `)
      const selections = events(table, 'selectionchange')
      // Keys hidden by the search are cleared too, unlike unchecking select all
      await type(table, 'billing')
      table.clearSelection()
      await settle(table)
      expect(table.selectedKeys).toEqual([])
      expect(selections).toEqual([{ selectedKeys: [] }])

      // Nothing selected: no event
      table.clearSelection()
      expect(selections).toHaveLength(1)

      await type(table, '')
      const boxes = $$<HTMLInputElement>(table, 'tbody input[type="checkbox"]')
      expect(boxes.some((box) => box.checked)).toBe(false)
    })
  })

  describe('keyboard and screen readers', () => {
    it('puts a focusable button in each sortable header and aria-sort on the th', async () => {
      // Columns sort by default under is-sortable; `sortable: false` opts out
      const columns = COLUMNS.map((col) =>
        col.key === 'region' || col.key === 'status'
          ? { ...col, sortable: false }
          : col,
      )
      const table = await mount(html`
        <moul-table is-sortable .columns=${columns} .data=${SERVICES}></moul-table>
      `)
      const ths = $$(table, 'th[part="th"]')
      expect(ths.map((th) => th.getAttribute('aria-sort'))).toEqual([
        'none',
        null,
        null,
        'none',
      ])
      expect(ths[1].querySelector('button')).toBeNull()

      const button = headerButton(table, 'Service')
      // A native button: in the tab order, Enter and Space press it
      expect(button.tagName).toBe('BUTTON')
      expect(button.type).toBe('button')
      expect(button.hasAttribute('tabindex')).toBe(false)
      button.focus()
      button.click()
      await settle(table)
      expect(ths[0].getAttribute('aria-sort')).toBe('ascending')
      expect(table.shadowRoot!.activeElement).toBe(button)
      button.click()
      await settle(table)
      expect(ths[0].getAttribute('aria-sort')).toBe('descending')
      expect(
        button.querySelector('.sort-icon')?.classList.contains('desc'),
      ).toBe(true)

      table.isSortable = false
      await settle(table)
      expect($$(table, 'th button')).toHaveLength(0)
      expect(ths.every((th) => !th.hasAttribute('aria-sort'))).toBe(true)
    })

    it('announces the result count politely after search and filter changes', async () => {
      const table = await mount(html`
        <moul-table
          is-searchable
          search-query="a"
          .columns=${COLUMNS}
          .data=${SERVICES}
        ></moul-table>
      `)
      const region = $(table, '[role="status"]')!
      expect(region.classList.contains('sr-only')).toBe(true)
      // Not on first render
      expect(status(table)).toBe('')

      await type(table, 'bill')
      expect(status(table)).toBe('1 result')
      await type(table, '')
      await pick(table, 0, 1)
      expect(status(table)).toBe('2 results')
      await type(table, 'zzz')
      expect(status(table)).toBe('No results')

      // A filter set from code counts too
      table.filters = {}
      await type(table, '')
      expect(status(table)).toBe('4 results')
    })
  })

  describe('reduced motion', () => {
    const rect = (height: number) =>
      ({
        top: 0,
        left: 0,
        right: 300,
        bottom: height,
        width: 300,
        height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect

    async function openFirst(): Promise<MoulTable> {
      const table = await mount(html`
        <moul-table
          .renderExpanded=${(row: Service) => `Owner of ${row.name}`}
          .columns=${COLUMNS}
          .data=${SERVICES}
        ></moul-table>
      `)
      $(table, '[part="expand-button"]')!.click()
      await settle(table)
      return table
    }

    it('springs the details height and keeps the row while it closes', async () => {
      motion = mockReducedMotion(false)
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
        rect(80),
      )
      const table = await openFirst()
      expect($(table, '.details')!.style.height).not.toBe('')

      $(table, '[part="expand-button"]')!.click()
      await settle(table)
      expect(table.expandedKeys).toEqual([])
      // Still on screen while the spring runs
      expect($$(table, '.details-row')).toHaveLength(1)
    })

    it('opens and closes at once under reduced motion', async () => {
      motion = mockReducedMotion(true)
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
        rect(80),
      )
      const table = await openFirst()
      expect($$(table, '.details-row')).toHaveLength(1)
      expect($(table, '.details')!.style.height).toBe('')

      $(table, '[part="expand-button"]')!.click()
      await table.updateComplete
      expect($$(table, '.details-row')).toHaveLength(0)
    })

    it('has a reduced-motion branch for the sort arrow and chevron', () => {
      expect(tableCss()).toMatch(
        /@media \(prefers-reduced-motion: reduce\)\s*{\s*th,\s*\.sort-icon,\s*\[part~="expand-button"\] svg\s*{\s*transition: none;/,
      )
    })
  })
})
