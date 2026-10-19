import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { radioStyles } from './RadioGroup.styles'

export class MoulRadio extends LitElement {
  static override styles = radioStyles

  static override properties = {
    value: { type: String, reflect: true },
    isChecked: { type: Boolean, reflect: true, attribute: 'is-checked' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
  }

  declare value: string
  declare isChecked: boolean
  declare isDisabled: boolean

  constructor() {
    super()
    this.value = ''
    this.isChecked = false
    this.isDisabled = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'radio')
    this.setAttribute('tabindex', this.isChecked ? '0' : '-1')
    this.addEventListener('click', this.handleClick)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('click', this.handleClick)
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('isChecked') ||
      changedProperties.has('isDisabled')
    ) {
      this.setAttribute(
        'tabindex',
        this.isChecked && !this.isDisabled ? '0' : '-1',
      )
      this.setAttribute('aria-checked', this.isChecked ? 'true' : 'false')
      if (this.isDisabled) {
        this.setAttribute('aria-disabled', 'true')
      } else {
        this.removeAttribute('aria-disabled')
      }
    }
  }

  private handleClick = (event: MouseEvent): void => {
    if (this.isDisabled) return
    event.preventDefault()
    this.dispatchEvent(
      new CustomEvent('radio-select', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  protected override render() {
    return html`
      <div part="base" ?data-disabled=${this.isDisabled}>
        <span part="indicator">
          <span part="dot"></span>
        </span>
        <span part="label">
          <slot></slot>
        </span>
      </div>
    `
  }
}

defineElement('moul-radio', MoulRadio)

declare global {
  interface HTMLElementTagNameMap {
    'moul-radio': MoulRadio
  }
}
