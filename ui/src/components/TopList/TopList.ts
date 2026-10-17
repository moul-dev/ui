import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import {
  CHART_EASE,
  prefersReducedMotion,
  stagger,
  subtleAnimate,
} from '../../utils/motion'
import { getChartColor, type TopListItem } from '../ChartCommon'
import { topListStyles } from './TopList.styles'

export type { TopListItem }

export interface TopListProps {
  data?: TopListItem[]
  max?: number
  maxValue?: number
  maxItems?: number
  valueFormatter?: (value: number) => string
  showRank?: boolean
  multiColor?: boolean
  barColor?: string
  interactive?: boolean
}

export class MoulTopList extends LitElement {
  static override styles = topListStyles

  static override properties = {
    data: { attribute: false },
    max: { type: Number },
    maxValue: { type: Number, attribute: 'max-value' },
    maxItems: { type: Number, attribute: 'max-items' },
    valueFormatter: { attribute: false },
    showRank: {
      type: Boolean,
      attribute: 'show-rank',
      reflect: true,
      converter: {
        fromAttribute: (val: string | null) => val !== 'false' && val !== null,
        toAttribute: (val: boolean) => (val ? '' : null),
      },
    },
    multiColor: { type: Boolean, attribute: 'multi-color' },
    barColor: { type: String, attribute: 'bar-color' },
    interactive: { type: Boolean, reflect: true },
  }

  declare data: TopListItem[]
  declare max?: number
  declare maxValue?: number
  declare maxItems: number
  declare valueFormatter?: (value: number) => string
  declare showRank: boolean
  declare multiColor: boolean
  declare barColor: string
  declare interactive: boolean

  constructor() {
    super()
    this.data = []
    this.max = undefined
    this.maxValue = undefined
    this.maxItems = 10
    this.valueFormatter = undefined
    this.showRank = true
    this.multiColor = false
    this.barColor = 'var(--color-chart-1)'
    this.interactive = false
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('data')) {
      this.animateEntrance()
    }
  }

  private animateEntrance(): void {
    if (prefersReducedMotion()) return

    const items = this.renderRoot?.querySelectorAll<HTMLElement>('.item')
    if (items && items.length > 0) {
      subtleAnimate(
        items,
        { transform: ['translateY(6px)', 'translateY(0px)'], opacity: [0, 1] },
        { duration: 0.35, delay: stagger(0.03), ease: CHART_EASE },
      )
    }
  }

  private handleItemPress(item: TopListItem, index: number): void {
    const event = new CustomEvent('item-press', {
      detail: { item, index },
      bubbles: true,
      composed: true,
      cancelable: true,
    })
    this.dispatchEvent(event)
  }

  private handleKeyDown(
    e: KeyboardEvent,
    item: TopListItem,
    index: number,
  ): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      this.handleItemPress(item, index)
    }
  }

  override render() {
    if (!this.data || !Array.isArray(this.data) || this.data.length === 0) {
      return html`
        <div class="empty-state" part="empty">
          <slot name="empty">
            <p class="empty-message">No data available</p>
          </slot>
        </div>
      `
    }

    const items =
      this.maxItems > 0 ? this.data.slice(0, this.maxItems) : this.data

    if (items.length === 0) {
      return html`
        <div class="empty-state" part="empty">
          <slot name="empty">
            <p class="empty-message">No data available</p>
          </slot>
        </div>
      `
    }

    // Determine effective max
    const userMax = this.max ?? this.maxValue
    let computedMax = 1
    if (
      typeof userMax === 'number' &&
      Number.isFinite(userMax) &&
      userMax > 0
    ) {
      computedMax = userMax
    } else {
      const positiveValues = items
        .map((d) =>
          typeof d.value === 'number' && Number.isFinite(d.value) ? d.value : 0,
        )
        .filter((v) => v > 0)
      computedMax = positiveValues.length > 0 ? Math.max(...positiveValues) : 1
    }

    return html`
      <div class="container" part="container">
        <ul class="list" role="list" part="list">
          ${items.map((item, idx) => {
            const rawValue =
              typeof item.value === 'number' && Number.isFinite(item.value)
                ? item.value
                : 0
            const clampedValue = Math.max(0, rawValue)
            const percentage = Math.min(
              100,
              Math.max(0, (clampedValue / computedMax) * 100),
            )

            const fill = item.color
              ? item.color
              : this.multiColor
                ? getChartColor(idx)
                : this.barColor || 'var(--color-chart-1)'

            const formattedValue = this.valueFormatter
              ? this.valueFormatter(rawValue)
              : rawValue.toLocaleString()

            const labelText =
              item.label || (item as any).name || `Item ${idx + 1}`

            return html`
              <li
                class="item ${this.showRank ? 'has-rank' : ''} ${this.interactive ? 'item--interactive' : ''}"
                role="listitem"
                part="item"
                data-index="${idx}"
                tabindex="0"
                @click="${() => this.handleItemPress(item, idx)}"
                @keydown="${(e: KeyboardEvent) =>
                  this.handleKeyDown(e, item, idx)}"
              >
                ${
                  this.showRank
                    ? html`<span class="rank" part="rank">${idx + 1}</span>`
                    : ''
                }

                <span class="label" part="label" title="${labelText}">
                  ${labelText}
                </span>

                <div
                  class="track"
                  part="track"
                  role="progressbar"
                  aria-valuenow="${clampedValue}"
                  aria-valuemin="0"
                  aria-valuemax="${computedMax}"
                  aria-label="${labelText}"
                  aria-valuetext="${formattedValue}"
                >
                  <div
                    class="bar"
                    part="bar"
                    style="width: ${percentage}%; background-color: ${fill};"
                  ></div>
                </div>

                <span class="value" part="value">${formattedValue}</span>
              </li>
            `
          })}
        </ul>
      </div>
    `
  }
}

defineElement('moul-top-list', MoulTopList)

export { MoulTopList as TopList }

declare global {
  interface HTMLElementTagNameMap {
    'moul-top-list': MoulTopList
  }
}
