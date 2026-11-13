import { html, LitElement, type PropertyValues } from 'lit'
import {
  type Breakpoint,
  LayoutIndicatorController,
} from '../../controllers/layout-indicator.controller'
import { defineElement } from '../../utils/define-element'
import { chartContainerStyles } from './ChartContainer.styles'

export interface ViewportResizeDetail {
  width: number
  height: number
  breakpoint: Breakpoint
}

/**
 * A card that frames one chart: a header with `title`, `description` and a
 * `header` slot for actions, the chart in the default slot, and a `legend` row
 * below; set `is-empty` to show the `empty` slot instead of the chart. The
 * content sizes to its chart unless `height` is set, and the card fires
 * `viewport-resize` when its size or breakpoint changes.
 *
 * Keyboard and screen readers: the card takes no focus and handles no keys;
 * slotted actions and charts keep their own. The `title` renders as an `h3`
 * heading and the `description` as a paragraph, but neither is wired to the
 * chart as its accessible name. Because `title` is also the host's native
 * `title` attribute, browsers show it as a hover tooltip over the whole card.
 *
 * Reduced motion: the card does not animate; slotted charts handle their own
 * motion.
 *
 * @slot - The chart.
 * @slot header - Actions at the end of the header, such as a range select.
 * @slot legend - Legend entries, in a wrapping row below the chart.
 * @slot empty - Shown instead of the chart while `is-empty` is set.
 * @fires viewport-resize - The card's size or breakpoint changed.
 */
export class MoulChartContainer extends LitElement {
  static override styles = chartContainerStyles

  static override properties = {
    title: { type: String, reflect: true },
    description: { type: String, reflect: true },
    height: { type: Number, reflect: true },
    isEmpty: { type: Boolean, reflect: true, attribute: 'is-empty' },
    hasHeaderContent: { state: true },
    hasLegend: { state: true },
  }

  declare title: string
  declare description: string
  /** Fixed content height in px; unset, the content sizes to the chart inside. */
  declare height: number | undefined
  declare isEmpty: boolean
  declare hasHeaderContent: boolean
  declare hasLegend: boolean

  public layout: LayoutIndicatorController

  private prevWidth = 0
  private prevHeight = 0
  private prevBreakpoint: Breakpoint | '' = ''

  constructor() {
    super()
    this.title = ''
    this.description = ''
    this.height = undefined
    this.isEmpty = false
    this.hasHeaderContent = false
    this.hasLegend = false
    this.layout = new LayoutIndicatorController(this, {
      observeDimensions: true,
    })
  }

  public get containerWidth(): number {
    return this.layout.width
  }

  public get containerHeight(): number {
    return this.layout.height
  }

  public get breakpoint(): Breakpoint {
    return this.layout.breakpoint
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    const currentW = this.layout.width
    const currentH = this.layout.height
    const currentBp = this.layout.breakpoint

    const widthChanged = currentW !== this.prevWidth
    const heightChanged = currentH !== this.prevHeight
    const bpChanged = currentBp !== this.prevBreakpoint

    if (widthChanged || heightChanged || bpChanged) {
      const isInitialZero =
        this.prevWidth === 0 &&
        this.prevHeight === 0 &&
        currentW === 0 &&
        currentH === 0

      this.prevWidth = currentW
      this.prevHeight = currentH
      this.prevBreakpoint = currentBp

      if (!isInitialZero) {
        this.dispatchEvent(
          new CustomEvent<ViewportResizeDetail>('viewport-resize', {
            bubbles: true,
            composed: true,
            detail: {
              width: currentW,
              height: currentH,
              breakpoint: currentBp,
            },
          }),
        )
      }
    }
  }

  protected override firstUpdated(changedProps: PropertyValues): void {
    super.firstUpdated(changedProps)
    // slotchange covers later changes; read what's already slotted now.
    this.syncSlots()
  }

  private syncSlots(): void {
    const filled = (name: string) =>
      (
        this.renderRoot
          .querySelector<HTMLSlotElement>(`slot[name="${name}"]`)
          ?.assignedNodes({ flatten: true }) ?? []
      ).length > 0 || !!this.querySelector(`:scope > [slot="${name}"]`)
    this.hasHeaderContent = filled('header')
    this.hasLegend = filled('legend')
  }

  private handleSlotChange = (): void => {
    this.syncSlots()
  }

  protected override render() {
    // Empty header and legend rows collapse so they don't pad the card.
    const hasHeader =
      !!this.title || !!this.description || this.hasHeaderContent
    return html`
      <header part="header" class="header" ?data-empty=${!hasHeader}>
        <div part="header-text" class="header-text">
          <h3 part="title" class="title" ?hidden=${!this.title}>${this.title}</h3>
          <p part="description" class="description" ?hidden=${!this.description}>
            ${this.description}
          </p>
        </div>
        <div part="header-actions" class="header-actions">
          <slot name="header" @slotchange=${this.handleSlotChange}></slot>
        </div>
      </header>

      <div
        part="content"
        class="content"
        style=${this.height && this.height > 0 ? `height: ${this.height}px;` : ''}
      >
        ${
          this.isEmpty
            ? html`
              <slot name="empty">
                <div part="empty" class="empty-container">
                  <p class="empty-message">No data available</p>
                </div>
              </slot>
            `
            : html`<slot></slot>`
        }
      </div>

      <footer part="legend" class="legend" ?data-empty=${!this.hasLegend}>
        <slot name="legend" @slotchange=${this.handleSlotChange}></slot>
      </footer>
    `
  }
}

defineElement('moul-chart-container', MoulChartContainer)

export { MoulChartContainer as ChartContainer }

declare global {
  interface HTMLElementTagNameMap {
    'moul-chart-container': MoulChartContainer
  }
}
