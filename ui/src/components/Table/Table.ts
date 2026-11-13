import {
  html,
  LitElement,
  nothing,
  type PropertyValues,
  type TemplateResult,
} from 'lit'
import { live } from 'lit/directives/live.js'
import { repeat } from 'lit/directives/repeat.js'
import type { AnimationPlaybackControls } from 'motion'
import { defineElement } from '../../utils/define-element'
import { chevronDown } from '../../utils/icons'
import {
  prefersReducedMotion,
  SPRING_SNAPPY,
  subtleAnimate,
} from '../../utils/motion'
import '../SearchField/SearchField'
import '../Select/Select'
import '../Select/SelectItem'
import '../Skeleton/Skeleton'
import { tableStyles } from './Table.styles'

export interface TableFilterOption {
  value: string
  label: string
}

// `Row` defaults to `any` so `TableColumn<Member>[]` assigns to `columns` even
// when `Member` is an interface without an index signature.
export interface TableColumn<Row = any> {
  key: string
  /** Header content: text, a DOM node, or a Lit template such as a select-all checkbox. */
  title?: unknown
  /**
   * Plain-text name of the column, for card labels, filter names and
   * accessible names. Defaults to `title` when that is a string.
   */
  label?: string
  sortable?: boolean
  /** `false` leaves the column out of search. */
  searchable?: boolean
  /** Applied to the header cell. */
  width?: string
  /** `right` aligns to the end with tabular numerals, for numbers. */
  align?: 'left' | 'center' | 'right'
  /**
   * Cell content in place of `String(row[key])`: a string, a DOM node, or a
   * Lit template, so cells can hold badges, links, or buttons. It renders in
   * the table's shadow root, where page stylesheets do not reach; style it
   * with `<moul-*>` elements, the table's `.mono`, `.muted`, `.small`,
   * `.nowrap` and `.truncate` classes, inline styles, or `::part`.
   */
  render?(row: Row, index: number): unknown
  /** Text that search matches, in place of `String(row[key])`. */
  searchValue?(row: Row): string
  /** Value that sorting compares, in place of `row[key]`. */
  sortValue?(row: Row): string | number
  /** Adds a filter select for this column to the toolbar. */
  filterOptions?: TableFilterOption[]
  /** Value that filters compare, in place of `String(row[key])`. */
  filterValue?(row: Row): string
}

type Row = Record<string, unknown>
interface Entry {
  row: Row
  index: number
  key: string
}

const safeJsonConverter = {
  fromAttribute(value: string | null) {
    if (!value) return []
    try {
      return JSON.parse(value)
    } catch {
      return []
    }
  },
  toAttribute(value: unknown) {
    return JSON.stringify(value)
  },
}

/** Recomputing the visible rows only when one of these changes keeps selection clicks cheap. */
const ROW_INPUTS = [
  'data',
  'columns',
  'searchQuery',
  'filters',
  'sortColumn',
  'sortDirection',
  'isManual',
  'rowKey',
] as const

const collator = new Intl.Collator(undefined, { numeric: true })
const compare = (a: unknown, b: unknown): number =>
  typeof a === 'number' && typeof b === 'number'
    ? a - b
    : collator.compare(String(a ?? ''), String(b ?? ''))
const text = (value: unknown): string => String(value ?? '')
const labelOf = (col: TableColumn): string =>
  col.label ?? (typeof col.title === 'string' ? col.title : '')
const detailsId = (key: string): string => `details-${encodeURIComponent(key)}`
const stop = (event: Event): void => event.stopPropagation()

/**
 * A data table that renders `data` rows under `columns`, for lists of records
 * in apps and admin screens. It can search (`is-searchable`), filter by any
 * column that has `filterOptions`, sort (`is-sortable`), select rows
 * (`is-selectable`) and open a details row under a row (`renderExpanded`).
 * Below about 480px wide it shows each row as a card of label and value
 * pairs (`layout`). Search, filters and sorting run on `data` in the browser;
 * with `is-manual` they only fire `searchchange`, `filterchange` and
 * `sortchange`, so a server can do the work and set `data`. Cells take
 * templates through a column's `render()`, and `rowKey` keys rows for
 * rendering, selection and expansion.
 *
 * Keyboard and screen readers: a native `<table>` with explicit table roles,
 * so cards keep them, named by the `caption` slot or the host's `aria-label`,
 * with `aria-busy` while `is-loading` (skeleton rows are hidden from screen
 * readers). Each sortable header holds a native button: `Tab` reaches it and
 * `Enter` or `Space` sorts, again to reverse; its `th` carries `aria-sort`.
 * The search box is a `<moul-search-field>` named "Search" plus the table's
 * `aria-label` ("Search table" without one), each filter a `<moul-select>`
 * named by its column label, and after a search or filter change a polite
 * status region announces the result count ("12 results"). With
 * `is-selectable`, `Tab` reaches a "Select all rows" checkbox, which acts on
 * the rows currently shown and reports a mixed state when only some of them
 * are selected, then one native checkbox per row named
 * after the row's first text cell ("Select api-gateway", else "Select row
 * 3"); `Space` toggles, and rows carry `aria-selected`, which screen readers
 * may ignore outside a grid. With `renderExpanded`, each row starts with a
 * button named "Show details for" the same text, with `aria-expanded` and,
 * while open, `aria-controls` pointing at the details row. There is no arrow
 * key navigation between cells.
 *
 * Reduced motion: details rows open and close at once instead of springing
 * in height, the sort arrow and the expand chevron flip without turning,
 * header colours change at once, and loading skeletons pulse instead of
 * shimmering. The card layout has no motion.
 *
 * @slot caption - Visible name of the table.
 * @slot empty - Shown when there are no rows to show; defaults to "No data available", or "No results" when search or filters hide every row.
 * @slot footer - Below the table, for totals or pagination.
 * @slot toolbar - The app's own controls, at the end of the toolbar.
 * @fires sortchange - A header sorted the table; `detail: { column, direction }`.
 * @fires selectionchange - Row selection changed; `detail: { selectedKeys }`.
 * @fires searchchange - The search text changed; `detail: { query }`.
 * @fires filterchange - A filter changed; `detail: { filters }`.
 * @fires expandedchange - A row opened or closed; `detail: { expandedKeys }`.
 * @csspart toolbar - The bar above the table with search, filters and the `toolbar` slot.
 * @csspart search - The `<moul-search-field>`.
 * @csspart filter - Each filter `<moul-select>`.
 * @csspart caption - The table caption.
 * @csspart th - Each column header cell.
 * @csspart sort-button - The button inside a sortable header.
 * @csspart header-checkbox - The header cell holding "Select all rows".
 * @csspart row - Each data row.
 * @csspart expand-button - The button that opens a row's details.
 * @csspart details - The padded box inside a details row.
 * @csspart loading-row - Each skeleton row.
 * @csspart empty - The empty state.
 * @csspart footer - The wrapper around the `footer` slot.
 * @cssprop --table-truncate-width - Widest a `.truncate` cell value gets (default `16rem`).
 */
export class MoulTable extends LitElement {
  static override styles = tableStyles

  static override properties = {
    data: { type: Array, converter: safeJsonConverter },
    columns: { type: Array, converter: safeJsonConverter },
    isSortable: { type: Boolean, reflect: true, attribute: 'is-sortable' },
    isSelectable: { type: Boolean, reflect: true, attribute: 'is-selectable' },
    isSearchable: { type: Boolean, reflect: true, attribute: 'is-searchable' },
    isManual: { type: Boolean, reflect: true, attribute: 'is-manual' },
    isLoading: { type: Boolean, reflect: true, attribute: 'is-loading' },
    isDense: { type: Boolean, reflect: true, attribute: 'is-dense' },
    selectedKeys: {
      type: Array,
      attribute: 'selected-keys',
      converter: safeJsonConverter,
    },
    expandedKeys: { attribute: false },
    sortColumn: { type: String, attribute: 'sort-column' },
    sortDirection: { type: String, attribute: 'sort-direction' },
    searchQuery: { type: String, attribute: 'search-query' },
    searchPlaceholder: { type: String, attribute: 'search-placeholder' },
    filters: { attribute: false },
    skeletonRows: { type: Number, attribute: 'skeleton-rows' },
    layout: { type: String, reflect: true },
    rowKey: { attribute: false },
    renderExpanded: { attribute: false },
    ariaLabel: { type: String, reflect: true, attribute: 'aria-label' },
    hasToolbarSlot: { state: true },
  }

  /** Row objects; any object type, `interface`s included. */
  declare data: readonly object[]
  declare columns: TableColumn[]
  declare isSortable: boolean
  declare isSelectable: boolean
  declare isSearchable: boolean
  declare isManual: boolean
  declare isLoading: boolean
  declare isDense: boolean
  declare selectedKeys: string[]
  declare expandedKeys: string[]
  declare sortColumn: string
  declare sortDirection: 'asc' | 'desc'
  declare searchQuery: string
  declare searchPlaceholder: string
  declare filters: Record<string, string>
  declare skeletonRows: number
  declare layout: 'auto' | 'table' | 'cards'
  declare rowKey: (row: any, index: number) => string
  declare renderExpanded: ((row: any, index: number) => unknown) | undefined
  declare ariaLabel: string | null
  declare hasToolbarSlot: boolean

  private cols: TableColumn[] = []
  private rows: Entry[] = []
  /** Text of the polite status region. */
  private status = ''
  private isStatusPending = false
  /** Keys whose details rows stay rendered while they collapse. */
  private closing = new Set<string>()
  private toAnimate: [key: string, isOpening: boolean][] = []
  private animations = new Map<string, AnimationPlaybackControls>()

  constructor() {
    super()
    this.data = []
    this.columns = []
    this.isSortable = false
    this.isSelectable = false
    this.isSearchable = false
    this.isManual = false
    this.isLoading = false
    this.isDense = false
    this.selectedKeys = []
    this.expandedKeys = []
    this.sortColumn = ''
    this.sortDirection = 'asc'
    this.searchQuery = ''
    this.searchPlaceholder = 'Search...'
    this.filters = {}
    this.skeletonRows = 3
    this.layout = 'auto'
    this.rowKey = (row, index) => String(row.key ?? row.id ?? index)
    this.renderExpanded = undefined
    this.hasToolbarSlot = false
  }

  private getEffectiveColumns(): TableColumn[] {
    if (this.columns?.length) return this.columns
    if (this.data?.length) {
      return Object.keys(this.data[0]).map((key) => ({
        key,
        title: key.charAt(0).toUpperCase() + key.slice(1),
        sortable: true,
      }))
    }
    return []
  }

  /** The rows to show: `data` searched, filtered and sorted, unless `is-manual`. */
  private computeRows(cols: TableColumn[]): Entry[] {
    let rows = ((this.data ?? []) as Row[]).map((row, index) => ({
      row,
      index,
      key: String(this.rowKey(row, index)),
    }))
    if (this.isManual) return rows
    const query = (this.searchQuery ?? '').trim().toLowerCase()
    const byKey = (key: string) => cols.find((col) => col.key === key)
    const filters = Object.entries(this.filters ?? {}).filter(([, v]) => v)
    rows = rows.filter(
      ({ row }) =>
        filters.every(([key, value]) => {
          const col = byKey(key)
          return (col?.filterValue?.(row) ?? text(row[key])) === value
        }) &&
        (!query ||
          cols.some(
            (col) =>
              col.searchable !== false &&
              (col.searchValue?.(row) ?? text(row[col.key]))
                .toLowerCase()
                .includes(query),
          )),
    )
    const key = this.sortColumn
    if (key) {
      const col = byKey(key)
      const value = (row: Row) =>
        col?.sortValue ? col.sortValue(row) : row[key]
      const direction = this.sortDirection === 'desc' ? -1 : 1
      rows.sort((a, b) => direction * compare(value(a.row), value(b.row)))
    }
    return rows
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    // slotchange covers later changes; this covers children present at upgrade.
    if (!this.hasUpdated) {
      this.hasToolbarSlot = [...this.children].some(
        (el) => el.getAttribute('slot') === 'toolbar',
      )
    }
    this.cols = this.getEffectiveColumns()
    if (ROW_INPUTS.some((name) => changed.has(name))) {
      this.rows = this.computeRows(this.cols)
    }

    // Announce the count after a search or filter change; with `is-manual`,
    // once the app has set the new `data`.
    if (
      this.hasUpdated &&
      (changed.has('searchQuery') || changed.has('filters'))
    ) {
      this.isStatusPending = true
    }
    if (
      this.isStatusPending &&
      !this.isLoading &&
      (!this.isManual || changed.has('data'))
    ) {
      this.isStatusPending = false
      const count = this.rows.length
      this.status = count
        ? `${count} result${count === 1 ? '' : 's'}`
        : 'No results'
    }

    if (
      changed.has('expandedKeys') &&
      this.hasUpdated &&
      !prefersReducedMotion()
    ) {
      const before = (changed.get('expandedKeys') as string[]) ?? []
      const after = this.expandedKeys
      for (const key of before) {
        // A details row with no height has nothing to collapse: drop it now.
        if (
          !after.includes(key) &&
          this.detailsBox(key)?.getBoundingClientRect().height
        ) {
          this.closing.add(key)
          this.toAnimate.push([key, false])
        }
      }
      for (const key of after) {
        if (!before.includes(key)) {
          this.closing.delete(key)
          this.toAnimate.push([key, true])
        }
      }
    }
  }

  protected override updated(): void {
    for (const [key, isOpening] of this.toAnimate.splice(0)) {
      const box = this.detailsBox(key)
      if (!box) {
        this.closing.delete(key)
        continue
      }
      // Start from the current height when interrupting a running spring.
      const from =
        this.animations.has(key) || !isOpening
          ? box.getBoundingClientRect().height
          : 0
      const to = isOpening
        ? (box.firstElementChild?.getBoundingClientRect().height ?? 0)
        : 0
      this.animations.get(key)?.stop()
      this.animations.delete(key)
      const settle = () => {
        box.style.removeProperty('height')
        if (!isOpening && this.closing.delete(key)) this.requestUpdate()
      }
      if (from === to) {
        settle()
        continue
      }
      box.style.height = `${from}px`
      const controls = subtleAnimate(
        box,
        { height: [`${from}px`, `${to}px`] },
        SPRING_SNAPPY,
      )
      this.animations.set(key, controls)
      controls.finished.then(() => {
        if (this.animations.get(key) !== controls) return
        this.animations.delete(key)
        settle()
      })
    }
  }

  private detailsBox(key: string): HTMLElement | null {
    return this.renderRoot.querySelector(`[id="${detailsId(key)}"] .details`)
  }

  private emit(type: string, detail: unknown): void {
    this.dispatchEvent(
      new CustomEvent(type, { bubbles: true, composed: true, detail }),
    )
  }

  private handleSort(col: TableColumn): void {
    if (!this.isSortable || col.sortable === false) return
    this.sortDirection =
      this.sortColumn === col.key && this.sortDirection === 'asc'
        ? 'desc'
        : 'asc'
    this.sortColumn = col.key
    this.emit('sortchange', {
      column: this.sortColumn,
      direction: this.sortDirection,
    })
  }

  /**
   * Empties `selectedKeys` and fires `selectionchange`, as if the user had
   * unchecked every row, so listeners such as a bound
   * `<moul-selection-toolbar>` hear about it. Does nothing when no row is
   * selected. Setting `selectedKeys` directly fires no event.
   */
  public clearSelection(): void {
    if (this.selectedKeys?.length) this.setSelected([])
  }

  private setSelected(selectedKeys: string[]): void {
    this.selectedKeys = selectedKeys
    this.emit('selectionchange', { selectedKeys })
  }

  private handleSelectAll(event: Event): void {
    const shown = new Set(this.rows.map((entry) => entry.key))
    const rest = this.selectedKeys.filter((key) => !shown.has(key))
    this.setSelected(
      (event.target as HTMLInputElement).checked ? [...rest, ...shown] : rest,
    )
  }

  private handleRowSelect(key: string, event: Event): void {
    const rest = this.selectedKeys.filter((k) => k !== key)
    this.setSelected(
      (event.target as HTMLInputElement).checked ? [...rest, key] : rest,
    )
  }

  private toggleExpanded(key: string): void {
    const keys = this.expandedKeys
    this.expandedKeys = keys.includes(key)
      ? keys.filter((k) => k !== key)
      : [...keys, key]
    this.emit('expandedchange', { expandedKeys: this.expandedKeys })
  }

  private handleSearch(event: Event): void {
    event.stopPropagation()
    const query = (event.currentTarget as HTMLInputElement).value
    if (query === this.searchQuery) return
    this.searchQuery = query
    this.emit('searchchange', { query })
  }

  private handleFilter(
    key: string,
    event: CustomEvent<{ selectedKey: string }>,
  ): void {
    event.stopPropagation()
    this.filters = Object.fromEntries(
      Object.entries({
        ...this.filters,
        [key]: event.detail.selectedKey,
      }).filter(([, value]) => value),
    )
    this.emit('filterchange', { filters: this.filters })
  }

  private handleToolbarSlot(event: Event): void {
    this.hasToolbarSlot =
      (event.target as HTMLSlotElement).assignedElements().length > 0
  }

  /** The row's first non-empty text value, else its position, for accessible names. */
  private rowName(row: Row, position: number): string {
    for (const col of this.cols) {
      const value = row[col.key]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
    return `row ${position}`
  }

  private renderHeader(col: TableColumn): TemplateResult {
    const isSortable = this.isSortable && col.sortable !== false
    const isSorted = this.sortColumn === col.key
    const isDesc = isSorted && this.sortDirection === 'desc'
    const title = col.title ?? col.label
    return html`
      <th
        part="th"
        role="columnheader"
        class=${col.align ?? ''}
        style=${col.width ? `width: ${col.width}` : nothing}
        aria-sort=${
          isSortable
            ? isSorted
              ? isDesc
                ? 'descending'
                : 'ascending'
              : 'none'
            : nothing
        }
        @click=${() => this.handleSort(col)}
      >
        ${
          isSortable
            ? html`
              <button type="button" part="sort-button" class="th-content">
                ${title}
                <span class="sort-icon${isSorted ? ' on' : ''}${isDesc ? ' desc' : ''}">
                  ${chevronDown()}
                </span>
              </button>
            `
            : html`<span class="th-content">${title}</span>`
        }
      </th>
    `
  }

  private renderRow(
    { row, index, key }: Entry,
    position: number,
    span: number,
    selected: Set<string>,
  ): TemplateResult {
    const isSelected = selected.has(key)
    const isOpen = this.expandedKeys.includes(key)
    const name = this.rowName(row, position)
    const id = detailsId(key)
    return html`
      <tr
        part="row"
        role="row"
        class=${isOpen ? 'open' : ''}
        aria-selected=${this.isSelectable ? String(isSelected) : nothing}
      >
        ${
          this.renderExpanded
            ? html`
              <td class="expand-cell" role="cell">
                <button
                  type="button"
                  part="expand-button"
                  aria-expanded=${String(isOpen)}
                  aria-controls=${isOpen ? id : nothing}
                  aria-label="Show details for ${name}"
                  @click=${() => this.toggleExpanded(key)}
                >
                  ${chevronDown()}
                </button>
              </td>
            `
            : nothing
        }
        ${
          this.isSelectable
            ? html`
              <td class="checkbox-cell" role="cell">
                <input
                  type="checkbox"
                  aria-label="Select ${name}"
                  .checked=${live(isSelected)}
                  @change=${(event: Event) => this.handleRowSelect(key, event)}
                />
              </td>
            `
            : nothing
        }
        ${this.cols.map(
          (col) =>
            // No whitespace around the value: cards and textContent read it as is.
            html`<td role="cell" class=${col.align ?? ''} data-label=${labelOf(col) || nothing}>${
              col.render ? col.render(row, index) : text(row[col.key])
            }</td>`,
        )}
      </tr>
      ${
        this.renderExpanded && (isOpen || this.closing.has(key))
          ? html`
            <tr class="details-row" role="row" id=${id}>
              <td role="cell" colspan=${span}>
                <div class="details">
                  <div part="details">${this.renderExpanded(row, index)}</div>
                </div>
              </td>
            </tr>
          `
          : nothing
      }
    `
  }

  private renderSkeletonRow(): TemplateResult {
    return html`
      <tr part="loading-row" role="row">
        ${this.renderExpanded ? html`<td class="expand-cell" role="cell"></td>` : nothing}
        ${
          this.isSelectable
            ? html`
              <td class="checkbox-cell" role="cell">
                <moul-skeleton shape="rect" width="1rem" height="1rem"></moul-skeleton>
              </td>
            `
            : nothing
        }
        ${this.cols.map(
          () => html`
            <td role="cell">
              <moul-skeleton shape="line" height="1.25rem"></moul-skeleton>
            </td>
          `,
        )}
      </tr>
    `
  }

  protected override render() {
    const { cols, rows } = this
    const filterCols = cols.filter((col) => col.filterOptions?.length)
    const span =
      cols.length + (this.renderExpanded ? 1 : 0) + (this.isSelectable ? 1 : 0)
    const selected = new Set(this.selectedKeys)
    const selectedCount = rows.filter((entry) => selected.has(entry.key)).length
    const isAllSelected = rows.length > 0 && selectedCount === rows.length

    return html`
      <div
        part="toolbar"
        class="toolbar"
        ?hidden=${!(this.isSearchable || filterCols.length || this.hasToolbarSlot)}
      >
        ${
          this.isSearchable
            ? html`
              <moul-search-field
                part="search"
                label="Search ${this.ariaLabel || 'table'}"
                placeholder=${this.searchPlaceholder}
                .value=${this.searchQuery}
                @input=${this.handleSearch}
                @change=${stop}
                @clear=${stop}
                @submit=${stop}
              ></moul-search-field>
            `
            : nothing
        }
        ${filterCols.map((col) => {
          const label = labelOf(col)
          return html`
            <moul-select
              part="filter"
              label=${label}
              .selectedKey=${this.filters?.[col.key] ?? ''}
              @selectionchange=${(event: CustomEvent) =>
                this.handleFilter(col.key, event)}
              @change=${stop}
            >
              <moul-select-item key="">All ${label}</moul-select-item>
              ${col.filterOptions!.map(
                (option) => html`
                  <moul-select-item key=${option.value}>${option.label}</moul-select-item>
                `,
              )}
            </moul-select>
          `
        })}
        <div class="toolbar-end">
          <slot name="toolbar" @slotchange=${this.handleToolbarSlot}></slot>
        </div>
      </div>

      <div class="scroller">
        <table
          role="table"
          aria-label=${this.ariaLabel || nothing}
          aria-busy=${this.isLoading ? 'true' : nothing}
        >
          <caption part="caption"><slot name="caption"></slot></caption>
          <thead role="rowgroup">
            <tr role="row">
              ${
                this.renderExpanded
                  ? html`
                    <th class="expand-cell" role="columnheader">
                      <span class="sr-only">Details</span>
                    </th>
                  `
                  : nothing
              }
              ${
                this.isSelectable
                  ? html`
                    <th class="checkbox-cell" part="header-checkbox" role="columnheader">
                      <input
                        type="checkbox"
                        aria-label="Select all rows"
                        .checked=${live(isAllSelected)}
                        .indeterminate=${live(selectedCount > 0 && !isAllSelected)}
                        ?disabled=${rows.length === 0}
                        @change=${this.handleSelectAll}
                      />
                    </th>
                  `
                  : nothing
              }
              ${cols.map((col) => this.renderHeader(col))}
            </tr>
          </thead>
          <tbody role="rowgroup">
            ${
              this.isLoading
                ? Array.from({ length: this.skeletonRows || 0 }, () =>
                    this.renderSkeletonRow(),
                  )
                : repeat(
                    rows,
                    (entry) => entry.key,
                    (entry, i) => this.renderRow(entry, i + 1, span, selected),
                  )
            }
          </tbody>
        </table>
        ${
          !this.isLoading && rows.length === 0
            ? html`
              <div part="empty" class="empty-cell">
                <slot name="empty">${this.data?.length ? 'No results' : 'No data available'}</slot>
              </div>
            `
            : nothing
        }
      </div>

      <div part="footer"><slot name="footer"></slot></div>
      <div class="sr-only" role="status">${this.status}</div>
    `
  }
}

defineElement('moul-table', MoulTable)

declare global {
  interface HTMLElementTagNameMap {
    'moul-table': MoulTable
  }
}
