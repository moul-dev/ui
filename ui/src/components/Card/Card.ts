import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { PressController } from '../../controllers/press.controller'
import {
  normalizeTone,
  normalizeVariant,
  type SemanticTone,
  type VisualVariant,
} from '../../styles/semantic-tones'
import {
  CardEffectsController,
  cardGlareLayer,
  cardGlowLayer,
  cardSpotlightLayer,
  parseCardEffects,
} from '../../utils/card-effects'
import { defineElement } from '../../utils/define-element'
import { cardSectionStyles, cardStyles } from './Card.styles'

export type { CardEffect } from '../../utils/card-effects'

/**
 * A surface that groups related content, with optional `moul-card-header`,
 * `moul-card-body` and `moul-card-footer` regions, coloured by `tone` and
 * `variant`. Set `is-interactive` to make the whole card one pressable target
 * that fires `press`. For landing pages, `effect` takes a space-separated
 * list of light effects: `spotlight`, a soft light that follows a mouse or
 * pen across the card under its content; `glare`, a band of light that
 * sweeps across once on hover; and `glow`, a gradient ring on the edge with
 * a coloured glow outside the card, both slowly turning. Unknown names are
 * ignored, and the glow pauses while the card is off screen.
 *
 * Keyboard and screen readers: a plain card is not focusable and has no role.
 * With `is-interactive` the host gets `role="button"` and `tabindex="0"`
 * (unless you set your own), its text content becomes the button's name, and
 * `Enter` or `Space` fires `press` when the key is released, as a click does.
 * Clicks and `Enter`/`Space` from controls inside an interactive card bubble
 * up and press the card too. The effect layers are empty and hidden from
 * screen readers, so the name and role do not change; keyboard focus
 * (`:focus-visible`) on an interactive card shows the spotlight at the
 * centre and sweeps the glare, as hover does.
 *
 * Reduced motion: an interactive card no longer lifts on hover or shrinks
 * when pressed, and its shadow and background change without fading. The
 * spotlight shows and hides at once and rests at the centre instead of
 * following the pointer, the glare is a still sheen across the middle while
 * hovered or focused, and the glow holds still.
 *
 * @slot - The card's content, usually `moul-card-header`, `moul-card-body` and `moul-card-footer`; it sits after the `body` slot and before the `footer` slot.
 * @slot header - A title row, when you do not use `moul-card-header`.
 * @slot body - The main content, when you do not use `moul-card-body`.
 * @slot footer - A row of actions, when you do not use `moul-card-footer`.
 *
 * @csspart header - The `header` slot.
 * @csspart body - The `body` slot.
 * @csspart content - The default slot.
 * @csspart footer - The `footer` slot.
 *
 * @cssprop --card-spotlight-color - The light at the centre of the `spotlight`. Defaults to the accent at 16% in the light theme and 28% in the dark.
 * @cssprop --card-spotlight-size - How far the `spotlight` reaches from the pointer, as a radius. Defaults to `20rem`.
 * @cssprop --card-glare-color - The band of the `glare`. Defaults to the accent at 14% in the light theme and white at 14% in the dark; white at 30% on `solid` and `shadow` cards.
 * @cssprop --card-glare-duration - How long the `glare` takes to cross. Defaults to `700ms`.
 * @cssprop --card-glow-color-1 - The first `glow` colour. Defaults to `var(--color-accent)`.
 * @cssprop --card-glow-color-2 - The second `glow` colour. Defaults to `var(--color-chart-4)`.
 * @cssprop --card-glow-size - The blur of the `glow` outside the card. Defaults to `1.5rem`.
 * @cssprop --card-glow-width - The width of the `glow` ring on the edge. Defaults to `1.5px`.
 * @cssprop --card-glow-duration - One turn of the `glow`. Defaults to `6s`.
 */
export class MoulCard extends LitElement {
  static override styles = cardStyles

  static override properties = {
    tone: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    isInteractive: {
      type: Boolean,
      reflect: true,
      attribute: 'is-interactive',
    },
    effect: { type: String, reflect: true },
  }

  declare tone: SemanticTone
  /**
   * Paints the card in `tone`: `solid` and `shadow` fill it, `flat` tints it,
   * `bordered` and `glass` frame it. Leave it unset for the neutral
   * `--color-surface` card.
   */
  declare variant: VisualVariant | undefined
  declare isInteractive: boolean
  /**
   * Light effects, as a space-separated list of `spotlight`, `glare` and
   * `glow` (a `CardEffect` each), such as `"spotlight glow"`. Unknown names
   * are ignored. Unset (the default) draws none.
   */
  declare effect: string | undefined

  public pressController: PressController
  private pressHandledInCycle = false

  constructor() {
    super()
    this.tone = 'primary'
    this.isInteractive = false

    // Hover lift and press feedback live in the stylesheet, gated to fine pointers.
    this.pressController = new PressController(this, {
      disabled: () => !this.isInteractive,
    })
    // Pointer tracking for the spotlight and off-screen pausing for the glow.
    new CardEffectsController(this)
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('click', this.handleClick)
    this.addEventListener('keydown', this.handleKeyDown)
    this.addEventListener('keyup', this.handleKeyUp)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('click', this.handleClick)
    this.removeEventListener('keydown', this.handleKeyDown)
    this.removeEventListener('keyup', this.handleKeyUp)
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('isInteractive')) {
      if (this.isInteractive) {
        if (!this.hasAttribute('role')) {
          this.setAttribute('role', 'button')
        }
        if (!this.hasAttribute('tabindex')) {
          this.setAttribute('tabindex', '0')
        }
      } else {
        if (this.getAttribute('role') === 'button') {
          this.removeAttribute('role')
        }
        if (this.getAttribute('tabindex') === '0') {
          this.removeAttribute('tabindex')
        }
      }
    }

    if (changedProps.has('tone')) {
      const normalized = normalizeTone(this.tone)
      if (this.tone !== normalized) {
        this.tone = normalized
      }
    }

    if (changedProps.has('variant') && this.variant != null) {
      const normalized = normalizeVariant(this.variant)
      if (this.variant !== normalized) {
        this.variant = normalized
      }
    }
  }

  private readonly handleClick = (e: MouseEvent): void => {
    if (!this.isInteractive) return
    if (!this.pressHandledInCycle) {
      this.dispatchPressEvent(e)
    }
    this.pressHandledInCycle = false
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isInteractive || e.repeat) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      this.pressHandledInCycle = false
    }
  }

  private readonly handleKeyUp = (e: KeyboardEvent): void => {
    if (!this.isInteractive) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      this.dispatchPressEvent(e)
      this.pressHandledInCycle = true
      queueMicrotask(() => {
        this.pressHandledInCycle = false
      })
    }
  }

  private dispatchPressEvent(originalEvent?: Event): void {
    this.dispatchEvent(
      new CustomEvent('press', {
        bubbles: true,
        composed: true,
        detail: { originalEvent },
      }),
    )
  }

  protected override render() {
    const effects = parseCardEffects(this.effect)
    return html`
      ${effects.has('spotlight') ? cardSpotlightLayer : nothing}
      <slot name="header" part="header"></slot>
      <slot name="body" part="body"></slot>
      <slot part="content"></slot>
      <slot name="footer" part="footer"></slot>
      ${effects.has('glow') ? cardGlowLayer : nothing}
      ${effects.has('glare') ? cardGlareLayer : nothing}
    `
  }
}

/**
 * The title row of a `moul-card`, in medium-weight text; place it first
 * inside the card.
 *
 * Keyboard and screen readers: not focusable and adds no role; its content is
 * read as ordinary text, so put a heading element inside it when the card
 * needs a place in the page outline.
 *
 * Reduced motion: does not animate.
 */
export class MoulCardHeader extends LitElement {
  static override styles = cardSectionStyles
  public override connectedCallback(): void {
    super.connectedCallback()
    this.dataset.section = 'header'
  }
  protected override render() {
    return html`<slot></slot>`
  }
}

/**
 * The main content of a `moul-card`, in muted text, that grows to fill the
 * card's spare height; place it between the header and the footer.
 *
 * Keyboard and screen readers: not focusable and adds no role; its content
 * keeps its own semantics and focusable children take focus as usual.
 *
 * Reduced motion: does not animate.
 */
export class MoulCardBody extends LitElement {
  static override styles = cardSectionStyles
  public override connectedCallback(): void {
    super.connectedCallback()
    this.dataset.section = 'body'
  }
  protected override render() {
    return html`<slot></slot>`
  }
}

/**
 * The bottom row of a `moul-card`, laying out actions such as buttons and
 * links side by side; place it last inside the card.
 *
 * Keyboard and screen readers: not focusable and adds no role; the buttons
 * and links inside it take focus in document order.
 *
 * Reduced motion: does not animate.
 */
export class MoulCardFooter extends LitElement {
  static override styles = cardSectionStyles
  public override connectedCallback(): void {
    super.connectedCallback()
    this.dataset.section = 'footer'
  }
  protected override render() {
    return html`<slot></slot>`
  }
}

defineElement('moul-card', MoulCard)
defineElement('moul-card-header', MoulCardHeader)
defineElement('moul-card-body', MoulCardBody)
defineElement('moul-card-footer', MoulCardFooter)

declare global {
  interface HTMLElementTagNameMap {
    'moul-card': MoulCard
    'moul-card-header': MoulCardHeader
    'moul-card-body': MoulCardBody
    'moul-card-footer': MoulCardFooter
  }
}
