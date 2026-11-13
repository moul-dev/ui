import { html, LitElement, type PropertyValues } from 'lit'
import { PressController } from '../../controllers/press.controller'
import {
  normalizeTone,
  normalizeVariant,
  type SemanticTone,
  type VisualVariant,
} from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { cardSectionStyles, cardStyles } from './Card.styles'

/**
 * A surface that groups related content, with optional `moul-card-header`,
 * `moul-card-body` and `moul-card-footer` regions, coloured by `tone` and
 * `variant`. Set `is-interactive` to make the whole card one pressable target
 * that fires `press`.
 *
 * Keyboard and screen readers: a plain card is not focusable and has no role.
 * With `is-interactive` the host gets `role="button"` and `tabindex="0"`
 * (unless you set your own), its text content becomes the button's name, and
 * `Enter` or `Space` fires `press` when the key is released, as a click does.
 * Clicks and `Enter`/`Space` from controls inside an interactive card bubble
 * up and press the card too.
 *
 * Reduced motion: an interactive card no longer lifts on hover or shrinks
 * when pressed, and its shadow and background change without fading.
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
  }

  declare tone: SemanticTone
  /**
   * Paints the card in `tone`: `solid` and `shadow` fill it, `flat` tints it,
   * `bordered` and `glass` frame it. Leave it unset for the neutral
   * `--color-surface` card.
   */
  declare variant: VisualVariant | undefined
  declare isInteractive: boolean

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
    return html`
      <slot name="header" part="header"></slot>
      <slot name="body" part="body"></slot>
      <slot part="content"></slot>
      <slot name="footer" part="footer"></slot>
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
