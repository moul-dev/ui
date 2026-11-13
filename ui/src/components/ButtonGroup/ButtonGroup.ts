import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { buttonGroupStyles } from './ButtonGroup.styles'

export type ButtonGroupOrientation = 'horizontal' | 'vertical'
export type ButtonGroupSpacing = 'none' | 'sm' | 'md'

/**
 * Lays out related `moul-button`s in a row or a column, either attached into
 * one pill (`spacing="none"`) or with a small gap, and can disable them all at
 * once with `is-disabled`.
 *
 * Keyboard and screen readers: the group is not focusable and adds no keys;
 * each button stays its own Tab stop. The host gets `role="group"` (unless a
 * role is already set) and `aria-orientation`; give it a name with
 * `aria-label`.
 *
 * Reduced motion: the group itself does not animate; each button handles its
 * own press motion and reduced motion.
 */
export class MoulButtonGroup extends LitElement {
  static override styles = buttonGroupStyles

  static override properties = {
    orientation: { type: String, reflect: true },
    spacing: { type: String, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
  }

  declare orientation: ButtonGroupOrientation
  declare spacing: ButtonGroupSpacing
  declare isDisabled: boolean

  constructor() {
    super()
    this.orientation = 'horizontal'
    this.spacing = 'sm'
    this.isDisabled = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'group')
    }
    this.setAttribute('aria-orientation', this.orientation)
    this.syncDisabledState()
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    if (changedProperties.has('orientation')) {
      this.setAttribute('aria-orientation', this.orientation)
    }

    if (changedProperties.has('isDisabled')) {
      this.syncDisabledState()
    }
  }

  private readonly handleSlotChange = (): void => {
    this.syncDisabledState()
  }

  private syncDisabledState(): void {
    const slot = this.shadowRoot?.querySelector('slot')
    const elements = slot
      ? slot.assignedElements({ flatten: true })
      : Array.from(this.children)

    elements.forEach((child) => {
      if ('isDisabled' in child) {
        ;(child as { isDisabled: boolean }).isDisabled = this.isDisabled
      } else if (child instanceof HTMLElement) {
        if (this.isDisabled) {
          child.setAttribute('is-disabled', '')
        } else {
          child.removeAttribute('is-disabled')
        }
      }
    })
  }

  protected override render() {
    return html`
      <div part="base">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `
  }
}

defineElement('moul-button-group', MoulButtonGroup)

declare global {
  interface HTMLElementTagNameMap {
    'moul-button-group': MoulButtonGroup
  }
}
