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

export class MoulCard extends LitElement {
  static override styles = cardStyles

  static override properties = {
    tone: { type: String, reflect: true },
    // The default isn't reflected, so an unset variant renders the plain surface.
    variant: { type: String, reflect: true, useDefault: true },
    isInteractive: {
      type: Boolean,
      reflect: true,
      attribute: 'is-interactive',
    },
  }

  declare tone: SemanticTone
  declare variant: VisualVariant
  declare isInteractive: boolean

  public pressController: PressController
  private pressHandledInCycle = false

  constructor() {
    super()
    this.tone = 'primary'
    this.variant = 'flat'
    this.isInteractive = false

    this.pressController = new PressController(this, {
      scaleOnPress: 0.985,
      hoverLift: -2,
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

    if (changedProps.has('variant')) {
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
