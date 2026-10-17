import { html, LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { chevronDown } from '../../utils/icons'
import '../Skeleton/Skeleton'
import { tableStyles } from './Table.styles'

export interface TableColumn {
  key: string
  title: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
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

export class MoulTable extends LitElement {
  static override styles = tableStyles

  static override properties = {
    data: { type: Array, converter: safeJsonConverter },
    columns: { type: Array, converter: safeJsonConverter },
    isSortable: { type: Boolean, reflect: true, attribute: 'is-sortable' },
    isSelectable: { type: Boolean, reflect: true, attribute: 'is-selectable' },
    isLoading: { type: Boolean, reflect: true, attribute: 'is-loading' },
    selectedKeys: {
      type: Array,
      attribute: 'selected-keys',
      converter: safeJsonConverter,
    },
    sortColumn: { type: String, attribute: 'sort-column' },
    sortDirection: { type: String, attribute: 'sort-direction' },
  }

  declare data: Record<string, unknown>[]
  declare columns: TableColumn[]
  declare isSortable: boolean
  declare isSelectable: boolean
  declare isLoading: boolean
  declare selectedKeys: string[]
  declare sortColumn: string
  declare sortDirection: 'asc' | 'desc'

  constructor() {
    super()
    this.data = []
    this.columns = []
    this.isSortable = false
    this.isSelectable = false
    this.isLoading = false
    this.selectedKeys = []
    this.sortColumn = ''
    this.sortDirection = 'asc'
  }

  private getEffectiveColumns(): TableColumn[] {
    if (this.columns && this.columns.length > 0) {
      return this.columns
    }
    if (this.data && this.data.length > 0) {
      return Object.keys(this.data[0]).map((key) => ({
        key,
        title: key.charAt(0).toUpperCase() + key.slice(1),
        sortable: true,
      }))
    }
    return []
  }

  private handleSort(col: TableColumn): void {
    if (!this.isSortable || col.sortable === false) return

    if (this.sortColumn === col.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortColumn = col.key
      this.sortDirection = 'asc'
    }

    this.dispatchEvent(
      new CustomEvent('sortchange', {
        bubbles: true,
        composed: true,
        detail: { column: this.sortColumn, direction: this.sortDirection },
      }),
    )
    this.requestUpdate()
  }

  private handleSelectAll(e: Event): void {
    const checked = (e.target as HTMLInputElement).checked
    if (checked) {
      this.selectedKeys = this.data.map((item, index) =>
        String(item.key ?? item.id ?? index),
      )
    } else {
      this.selectedKeys = []
    }

    this.dispatchEvent(
      new CustomEvent('selectionchange', {
        bubbles: true,
        composed: true,
        detail: { selectedKeys: this.selectedKeys },
      }),
    )
    this.requestUpdate()
  }

  private handleRowSelect(key: string, e: Event): void {
    e.stopPropagation()
    const checked = (e.target as HTMLInputElement).checked

    if (checked) {
      if (!this.selectedKeys.includes(key)) {
        this.selectedKeys = [...this.selectedKeys, key]
      }
    } else {
      this.selectedKeys = this.selectedKeys.filter((k) => k !== key)
    }

    this.dispatchEvent(
      new CustomEvent('selectionchange', {
        bubbles: true,
        composed: true,
        detail: { selectedKeys: this.selectedKeys },
      }),
    )
    this.requestUpdate()
  }

  protected override render() {
    const cols = this.getEffectiveColumns()
    const totalCols = cols.length + (this.isSelectable ? 1 : 0)
    const isAllSelected =
      this.data.length > 0 &&
      this.data.every((item, idx) =>
        this.selectedKeys.includes(String(item.key ?? item.id ?? idx)),
      )

    return html`
      <table>
        <caption part="caption"><slot name="caption"></slot></caption>
        <thead>
          <tr>
            ${
              this.isSelectable
                ? html`
                  <th class="checkbox-cell" part="header-checkbox">
                    <input
                      type="checkbox"
                      aria-label="Select all rows"
                      .checked=${isAllSelected}
                      @change=${this.handleSelectAll}
                    />
                  </th>
                `
                : ''
            }
            ${cols.map((col) => {
              const isSorted = this.sortColumn === col.key
              const ariaSort = !this.isSortable
                ? undefined
                : isSorted
                  ? this.sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'

              return html`
                <th
                  part="th"
                  aria-sort=${ariaSort || undefined}
                  @click=${() => this.handleSort(col)}
                >
                  <span class="th-content">
                    <span>${col.title}</span>
                    ${
                      this.isSortable && col.sortable !== false
                        ? html`
                          <span class="sort-icon ${isSorted && this.sortDirection === 'desc' ? 'desc' : ''}">
                            ${chevronDown()}
                          </span>
                        `
                        : ''
                    }
                  </span>
                </th>
              `
            })}
          </tr>
        </thead>
        <tbody>
          ${
            this.isLoading
              ? html`
                ${[0, 1, 2].map(
                  () => html`
                    <tr part="loading-row">
                      ${
                        this.isSelectable
                          ? html`
                            <td class="checkbox-cell">
                              <moul-skeleton shape="rect" width="1rem" height="1rem"></moul-skeleton>
                            </td>
                          `
                          : ''
                      }
                      ${cols.map(
                        () => html`
                          <td>
                            <moul-skeleton shape="line" height="1.25rem"></moul-skeleton>
                          </td>
                        `,
                      )}
                    </tr>
                  `,
                )}
              `
              : this.data.length === 0
                ? html`
                  <tr>
                    <td class="empty-cell" colspan=${totalCols}>
                      <slot name="empty">No data available</slot>
                    </td>
                  </tr>
                `
                : this.data.map((item, index) => {
                    const rowKey = String(item.key ?? item.id ?? index)
                    const isSelected = this.selectedKeys.includes(rowKey)

                    return html`
                    <tr
                      part="row"
                      role="row"
                      aria-selected=${this.isSelectable ? (isSelected ? 'true' : 'false') : undefined}
                    >
                      ${
                        this.isSelectable
                          ? html`
                            <td class="checkbox-cell">
                              <input
                                type="checkbox"
                                aria-label="Select row ${index + 1}"
                                .checked=${isSelected}
                                @change=${(e: Event) => this.handleRowSelect(rowKey, e)}
                              />
                            </td>
                          `
                          : ''
                      }
                      ${cols.map((col) => html`<td>${String(item[col.key] ?? '')}</td>`)}
                    </tr>
                  `
                  })
          }
        </tbody>
        <tfoot part="footer">
          <slot name="footer"></slot>
        </tfoot>
      </table>
    `
  }
}

defineElement('moul-table', MoulTable)

declare global {
  interface HTMLElementTagNameMap {
    'moul-table': MoulTable
  }
}
