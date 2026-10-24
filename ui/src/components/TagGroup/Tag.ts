import { html, LitElement, type PropertyValues } from 'lit'
import { PressController } from '../../controllers/press.controller'
import {
  normalizeTone,
  normalizeVariant,
  type SemanticTone,
  type VisualVariant,
} from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { close } from '../../utils/icons'
import { EASE_OUT, subtleAnimate } from '../../utils/motion'
import { tagStyles } from './TagGroup.styles'

export type TagSize = 'sm' | 'md' | 'lg'

export class MoulTag extends LitElement {
  static override styles = tagStyles

  static override properties = {
    key: { type: String, reflect: true },
    tone: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    isSelected: { type: Boolean, reflect: true, attribute: 'is-selected' },
    isRemovable: { type: Boolean, reflect: true, attribute: 'is-removable' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
  }

  declare key: string
  declare tone: SemanticTone
  declare variant: VisualVariant
  declare size: TagSize
  declare isSelected: boolean
  declare isRemovable: boolean
  declare isDisabled: boolean

  public pressController: PressController

  constructor() {
    super()
    this.key = ''
    this.tone = 'primary'
    this.variant = 'flat'
    this.size = 'md'
    this.isSelected = false
    this.isRemovable = false
    this.isDisabled = false

    // Press feedback is the stylesheet's :active scale; this tracks state only.
    this.pressController = new PressController(this, {
      disabled: () => this.isDisabled,
    })
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'button')
    }
    this.addEventListener('click', this.handleClick)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('click', this.handleClick)
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('isSelected')) {
      this.setAttribute('aria-selected', String(this.isSelected))
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

  private readonly handleClick = (): void => {
    if (this.isDisabled) return
    this.dispatchEvent(
      new CustomEvent('press', {
        bubbles: true,
        composed: true,
        detail: { key: this.key, isSelected: !this.isSelected },
      }),
    )
  }

  private readonly handleRemove = async (e: MouseEvent): Promise<void> => {
    e.stopPropagation()
    e.preventDefault()

    const controls = subtleAnimate(
      this,
      { transform: ['scale(1)', 'scale(0.9)'], opacity: [1, 0] },
      { duration: 0.12, ease: EASE_OUT },
    )
    if (controls?.finished) {
      await controls.finished
    }

    this.dispatchEvent(
      new CustomEvent('remove', {
        bubbles: true,
        composed: true,
        detail: { key: this.key },
      }),
    )
  }

  protected override render() {
    return html`
      <span part="base">
        <slot></slot>
        ${
          this.isRemovable
            ? html`
              <button
                class="remove-button"
                part="remove-button"
                aria-label="Remove tag"
                @click=${this.handleRemove}
              >
                ${close()}
              </button>
            `
            : ''
        }
      </span>
    `
  }
}

defineElement('moul-tag', MoulTag)

declare global {
  interface HTMLElementTagNameMap {
    'moul-tag': MoulTag
  }
}
