import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { comboBoxItemStyles } from './ComboBox.styles'

export class MoulComboBoxItem extends LitElement {
  static override styles = comboBoxItemStyles

  static override properties = {
    key: { type: String, reflect: true },
    textValue: { type: String, reflect: true, attribute: 'text-value' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
  }

  declare key: string
  declare textValue: string
  declare isDisabled: boolean

  constructor() {
    super()
    this.key = ''
    this.textValue = ''
    this.isDisabled = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'option')
    this.setAttribute('tabindex', '-1')
    this.addEventListener('click', this.handleClick)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('click', this.handleClick)
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (changedProperties.has('isDisabled')) {
      if (this.isDisabled) {
        this.setAttribute('aria-disabled', 'true')
      } else {
        this.removeAttribute('aria-disabled')
      }
    }
  }

  public get text(): string {
    return this.textValue || this.textContent?.trim() || this.key
  }

  private handleClick = (event: MouseEvent): void => {
    if (this.isDisabled) return
    event.preventDefault()
    this.dispatchEvent(
      new CustomEvent('combobox-item-click', {
        detail: {
          key: this.key,
          text: this.text,
        },
        bubbles: true,
        composed: true,
      }),
    )
  }

  protected override render() {
    return html`
      <div part="item" ?data-disabled=${this.isDisabled}>
        <slot>${this.textValue || this.key}</slot>
      </div>
    `
  }
}

defineElement('moul-combobox-item', MoulComboBoxItem)

declare global {
  interface HTMLElementTagNameMap {
    'moul-combobox-item': MoulComboBoxItem
  }
}
