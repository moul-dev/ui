import { html, LitElement, nothing, type PropertyValues, svg } from 'lit'
import { keyed } from 'lit/directives/keyed.js'
import { defineElement } from '../../utils/define-element'
import { resultCardStyles } from './ResultCard.styles'

export type ResultCardStatus = 'success' | 'error' | 'pending'

const STATUSES: readonly ResultCardStatus[] = ['success', 'error', 'pending']

/**
 * A card that reports how a task ended, such as a payment, an import or a
 * deploy: a status icon whose ring and check (or cross) draw themselves, a
 * heading, a description, optional details such as a receipt, and actions.
 * While `status` is `pending` the ring turns as an open arc; set it to
 * `success` or `error` when the task finishes and the result draws in.
 *
 * Keyboard and screen readers: the card takes no focus; slotted actions keep
 * their own. The heading has `role="heading"` at `heading-level` (2 by
 * default) and the icon is hidden. When `status`, `heading` or `description`
 * changes after the card first renders, the heading and description are
 * announced: politely for `success` and `pending`, and assertively
 * (`role="alert"`) for `error`. The card's first render is not announced, so
 * change `status` on a card that is already on the page, or announce the
 * outcome yourself.
 *
 * Reduced motion: the icon appears fully drawn at once, without the pop, and
 * the pending arc stays still at the top instead of turning.
 *
 * @slot - Details under the description, such as a receipt or a summary.
 * @slot actions - Buttons for what to do next, laid out in a row.
 * @slot icon - Replaces the status icon.
 * @csspart base - The card surface.
 * @csspart icon - The status icon's circle.
 * @csspart heading - The heading.
 * @csspart description - The description.
 * @csspart details - The wrapper around the default slot.
 * @csspart actions - The row around the actions slot.
 * @cssprop --result-card-icon-size - Diameter of the status icon. Defaults to `3.5rem`.
 */
export class MoulResultCard extends LitElement {
  static override styles = resultCardStyles

  static override properties = {
    status: { type: String, reflect: true },
    heading: { type: String, reflect: true },
    description: { type: String, reflect: true },
    headingLevel: { type: Number, reflect: true, attribute: 'heading-level' },
    hasActions: { state: true },
    hasDetails: { state: true },
    politeText: { state: true },
    alertText: { state: true },
  }

  /** How the task ended, or `pending` while it runs. Unknown values fall back to `success`. */
  declare status: ResultCardStatus
  declare heading: string
  declare description: string
  /** `aria-level` of the heading, 1 to 6. */
  declare headingLevel: number
  private declare hasActions: boolean
  private declare hasDetails: boolean
  private declare politeText: string
  private declare alertText: string

  constructor() {
    super()
    this.status = 'success'
    this.heading = ''
    this.description = ''
    this.headingLevel = 2
    this.hasActions = false
    this.hasDetails = false
    this.politeText = ''
    this.alertText = ''
  }

  protected override willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps)
    if (changedProps.has('status') && !STATUSES.includes(this.status)) {
      this.status = 'success'
    }
    const isAnnounced =
      changedProps.has('status') ||
      changedProps.has('heading') ||
      changedProps.has('description')
    if (this.hasUpdated && isAnnounced) {
      const text = [this.heading, this.description].filter(Boolean).join('. ')
      // One region speaks; the other is cleared so stale text never lingers.
      this.alertText = this.status === 'error' ? text : ''
      this.politeText = this.status === 'error' ? '' : text
    }
  }

  private get level(): number {
    const level = Math.round(Number(this.headingLevel))
    return Number.isFinite(level) ? Math.min(6, Math.max(1, level)) : 2
  }

  private renderIcon() {
    const glyph =
      this.status === 'success'
        ? svg`<path class="glyph" pathLength="1" d="M16 26.5l7 7 13-14" />`
        : this.status === 'error'
          ? svg`<path class="glyph" pathLength="1" d="M19 19l14 14" />
              <path class="glyph" pathLength="1" d="M33 19 19 33" />`
          : nothing
    return svg`
      <svg
        class="status-icon"
        viewBox="0 0 52 52"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <circle class="disc" cx="26" cy="26" r="25" />
        <circle class="ring" cx="26" cy="26" r="24" pathLength="1" />
        ${glyph}
      </svg>
    `
  }

  protected override firstUpdated(): void {
    this.syncSlots()
  }

  /** Hides the details and actions wrappers while nothing fills them. */
  private readonly syncSlots = (): void => {
    const filled = (selector: string) =>
      this.shadowRoot
        ?.querySelector<HTMLSlotElement>(selector)
        ?.assignedNodes()
        .some((node) => node.nodeType === 1 || node.textContent?.trim()) ??
      false
    this.hasDetails = filled('slot:not([name])')
    this.hasActions = filled('slot[name="actions"]')
  }

  protected override render() {
    return html`
      <div part="base">
        <div part="icon" class="icon" aria-hidden="true">
          <slot name="icon">${keyed(this.status, this.renderIcon())}</slot>
        </div>
        ${
          this.heading
            ? html`<div part="heading" role="heading" aria-level=${this.level}>
                ${this.heading}
              </div>`
            : nothing
        }
        ${
          this.description
            ? html`<p part="description">${this.description}</p>`
            : nothing
        }
        <div part="details" ?hidden=${!this.hasDetails}>
          <slot @slotchange=${this.syncSlots}></slot>
        </div>
        <div part="actions" ?hidden=${!this.hasActions}>
          <slot name="actions" @slotchange=${this.syncSlots}></slot>
        </div>
        <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
          ${this.politeText}
        </div>
        <div class="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
          ${this.alertText}
        </div>
      </div>
    `
  }
}

defineElement('moul-result-card', MoulResultCard)

declare global {
  interface HTMLElementTagNameMap {
    'moul-result-card': MoulResultCard
  }
}
