import { css, html, LitElement, nothing, type PropertyValues } from 'lit'
import { cardEffectStyles } from '../../styles/card-effects.styles'
import {
  CardEffectsController,
  cardGlareLayer,
  cardGlowLayer,
  cardSpotlightLayer,
  parseCardEffects,
} from '../../utils/card-effects'
import { defineElement } from '../../utils/define-element'
import {
  bentoCardEffectStyles,
  bentoCardStyles,
  bentoGridStyles,
} from './BentoGrid.styles'

const DEFAULT_COLUMNS = 3

/**
 * Feature cards in an uneven grid, as on a landing page's features section.
 * Put `moul-bento-card` elements in it and give some of them a `col-span` or
 * `row-span` so they take more room. `columns` sets the number of columns.
 * Below 36rem of its own width (not the viewport's) the grid becomes one
 * column and the cards drop their spans, so it fits a sidebar as well as a
 * phone. The grid takes its width from its container, so in a flex row give
 * it a width. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role; the cards
 * are read in source order, which is also the order they appear in, since the
 * grid never reorders them to fill gaps.
 *
 * Reduced motion: the grid itself never moves; see `moul-bento-card` for the
 * cards.
 *
 * @slot - The `moul-bento-card` elements.
 *
 * @csspart base - The CSS grid.
 *
 * @cssprop --bento-gap - Space between the cards. Defaults to `var(--spacing-4)`.
 * @cssprop --bento-row-height - The height of one row, as `grid-auto-rows`. Defaults to `minmax(12rem, auto)`.
 */
export class MoulBentoGrid extends LitElement {
  static override styles = bentoGridStyles

  static override properties = {
    columns: { type: Number, reflect: true },
  }

  /** Columns on a wide grid; a narrow grid always has one. Defaults to 3. */
  declare columns: number

  constructor() {
    super()
    this.columns = DEFAULT_COLUMNS
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('columns')) {
      this.columns = validCount(this.columns, DEFAULT_COLUMNS)
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('columns')) {
      // Each card clamps its span to the columns, so tell them.
      for (const child of this.children) {
        if (child instanceof MoulBentoCard) child.requestUpdate()
      }
    }
  }

  protected override render() {
    return html`<div part="base" style="--_bento-columns: ${this.columns}">
      <slot></slot>
    </div>`
  }
}

/**
 * One card in a `moul-bento-grid`: a surface like `moul-card` with optional
 * art, an icon, a heading, a description and an action. A screenshot, code
 * sample or device frame goes in `visual`, which fills the top of the card
 * edge to edge above the text; a soft wash or pattern goes in `background`,
 * behind the whole card. Put
 * your own heading element (an `<h3>`, say) in the `heading` slot and a link
 * or button such as `moul-link` or `moul-button` in `action`. `col-span` and
 * `row-span` make it wider or taller; the span is clamped to the grid's
 * columns. Where there is a mouse, the action waits out of sight below the
 * text: hovering the card, or moving focus into it, lifts the text and slides
 * the action up into view, and the art grows slightly. On touch screens the
 * action is always shown. `effect` takes the same light effects as
 * `moul-card`, as a space-separated list: `spotlight` (a soft light that
 * follows a mouse or pen, above the `background` art and under the rest),
 * `glare` (a band of light that sweeps across once on hover) and `glow` (a
 * turning gradient ring with a coloured glow outside the card). It lives in
 * the effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role; the heading,
 * description and action keep their own semantics and are read in that
 * order. The action is in the accessibility tree and can take focus even
 * while it is out of sight, and focus moving into the card shows it at once.
 * The effect layers are empty and hidden from screen readers; focus moving
 * into the card shows the spotlight at the centre and sweeps the glare, as
 * hover does.
 *
 * Reduced motion: nothing lifts, slides or grows, and the action is always
 * shown. The spotlight shows and hides at once and rests at the centre, the
 * glare is a still sheen across the middle while hovered or focused, and the
 * glow holds still.
 *
 * @slot visual - Art, a screenshot or a device frame, shown edge to edge above the text and taking the card's spare height.
 * @slot background - Decoration behind the whole card, such as a gradient wash or a pattern; keep it quiet so the text stays readable.
 * @slot icon - An icon above the heading.
 * @slot heading - The card's heading; bring your own heading element.
 * @slot - The description.
 * @slot action - A link or button, such as `moul-link` or `moul-button`.
 *
 * @csspart base - The card's inner layout, which holds every other part.
 * @csspart visual - The area above the text that holds the `visual` slot.
 * @csspart background - The layer behind the card that holds the `background` slot.
 * @csspart content - The icon, heading and description.
 * @csspart icon - The wrapper around the icon.
 * @csspart action - The wrapper around the action.
 *
 * @cssprop --card-spotlight-color - The light at the centre of the `spotlight`. Defaults to the accent at 16% in the light theme and 28% in the dark.
 * @cssprop --card-spotlight-size - How far the `spotlight` reaches from the pointer, as a radius. Defaults to `20rem`.
 * @cssprop --card-glare-color - The band of the `glare`. Defaults to the accent at 14% in the light theme and white at 14% in the dark.
 * @cssprop --card-glare-duration - How long the `glare` takes to cross. Defaults to `700ms`.
 * @cssprop --card-glow-color-1 - The first `glow` colour. Defaults to `var(--color-accent)`.
 * @cssprop --card-glow-color-2 - The second `glow` colour. Defaults to `var(--color-chart-4)`.
 * @cssprop --card-glow-size - The blur of the `glow` outside the card. Defaults to `1.5rem`.
 * @cssprop --card-glow-width - The width of the `glow` ring on the edge. Defaults to `1.5px`.
 * @cssprop --card-glow-duration - One turn of the `glow`. Defaults to `6s`.
 */
export class MoulBentoCard extends LitElement {
  static override styles = [
    bentoCardStyles,
    // A bento card is never focusable itself, so focus inside it counts.
    cardEffectStyles(css`:focus-within`),
    bentoCardEffectStyles,
  ]

  static override properties = {
    colSpan: { type: Number, attribute: 'col-span' },
    rowSpan: { type: Number, attribute: 'row-span' },
    effect: { type: String, reflect: true },
  }

  /** Columns the card spans, at most the grid's `columns`. Defaults to 1. */
  declare colSpan: number
  /** Rows the card spans. Defaults to 1. */
  declare rowSpan: number
  /**
   * Light effects, as a space-separated list of `spotlight`, `glare` and
   * `glow`, as on `moul-card`. Unknown names are ignored. Unset (the
   * default) draws none.
   */
  declare effect: string | undefined

  private resizeObserver: ResizeObserver | null = null
  private writtenSpans = ''

  constructor() {
    super()
    this.colSpan = 1
    this.rowSpan = 1
    // Pointer tracking for the spotlight and off-screen pausing for the glow.
    new CardEffectsController(this)
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    // A card moved into another grid clamps to that grid's columns.
    this.requestUpdate()
    if (this.hasUpdated) this.observeAction()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed)
    this.observeAction()
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    const columns = Math.min(
      validCount(this.colSpan, 1),
      this.gridColumns() ?? Number.POSITIVE_INFINITY,
    )
    const rows = validCount(this.rowSpan, 1)
    const spans = `${columns} ${rows}`
    if (spans !== this.writtenSpans) {
      this.writtenSpans = spans
      this.style.setProperty('--_bento-col-span', String(columns))
      this.style.setProperty('--_bento-row-span', String(rows))
    }
  }

  /** The columns of the grid this card sits in, or null outside a grid. */
  private gridColumns(): number | null {
    const parent = this.parentElement
    if (parent instanceof MoulBentoGrid) {
      return validCount(parent.columns, DEFAULT_COLUMNS)
    }
    if (parent?.localName === 'moul-bento-grid') {
      return validCount(Number(parent.getAttribute('columns')), DEFAULT_COLUMNS)
    }
    return null
  }

  /** The text lifts by exactly the action's height, so the action has room to slide in below it. */
  private observeAction(): void {
    const action = this.renderRoot.querySelector<HTMLElement>('[part="action"]')
    const base = this.renderRoot.querySelector<HTMLElement>('[part="base"]')
    if (!action || !base || this.resizeObserver) return
    if (typeof ResizeObserver !== 'function') return
    this.resizeObserver = new ResizeObserver(() => {
      const size = action.getBoundingClientRect().height
      base.style.setProperty('--_bento-action-size', `${Math.max(0, size)}px`)
    })
    this.resizeObserver.observe(action)
  }

  private hasSlotted(name: string): boolean {
    return [...this.children].some((child) => child.slot === name)
  }

  private readonly handleSlotChange = (): void => {
    this.requestUpdate()
  }

  protected override render() {
    const effects = parseCardEffects(this.effect)
    return html`<div part="base">
        <div part="background">
          <slot name="background"></slot>
        </div>
        ${effects.has('spotlight') ? cardSpotlightLayer : nothing}
        <div part="visual" ?hidden=${!this.hasSlotted('visual')}>
          <slot name="visual" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div part="content">
          <div part="icon" ?hidden=${!this.hasSlotted('icon')}>
            <slot name="icon" @slotchange=${this.handleSlotChange}></slot>
          </div>
          <slot name="heading"></slot>
          <div class="description"><slot></slot></div>
        </div>
        <div part="action" ?hidden=${!this.hasSlotted('action')}>
          <slot name="action" @slotchange=${this.handleSlotChange}></slot>
        </div>
      </div>
      ${effects.has('glow') ? cardGlowLayer : nothing}
      ${effects.has('glare') ? cardGlareLayer : nothing}`
  }
}

/** A whole number of at least 1, or the fallback. */
function validCount(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback
}

defineElement('moul-bento-grid', MoulBentoGrid)
defineElement('moul-bento-card', MoulBentoCard)

declare global {
  interface HTMLElementTagNameMap {
    'moul-bento-grid': MoulBentoGrid
    'moul-bento-card': MoulBentoCard
  }
}
