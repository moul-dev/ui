import { html, LitElement, type PropertyValues, svg } from 'lit'
import { defineElement } from '../../utils/define-element'
import { selectItemStyles } from './Select.styles'

export class MoulSelectItem extends LitElement {
  static override styles = selectItemStyles

  static override properties = {
    key: { type: String, reflect: true },
    value: { type: String, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
  }

  declare key: string
  declare value: string
  declare isDisabled: boolean

  constructor() {
    super()
    this.key = ''
    this.value = ''
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

  private handleClick = (event: MouseEvent): void => {
    if (this.isDisabled) return
    event.preventDefault()
    this.dispatchEvent(
      new CustomEvent('select-item-click', {
        detail: {
          key: this.key,
          value: this.value || this.textContent?.trim() || this.key,
        },
        bubbles: true,
        composed: true,
      }),
    )
  }

  protected override render() {
    const isSelected = this.getAttribute('aria-selected') === 'true'

    return html`
      <div part="item" ?data-disabled=${this.isDisabled}>
        <slot>${this.value || this.key}</slot>
        ${
          isSelected
            ? svg`
              <span part="check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="width: 100%; height: 100%;">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
            `
            : ''
        }
      </div>
    `
  }
}

defineElement('moul-select-item', MoulSelectItem)

declare global {
  interface HTMLElementTagNameMap {
    'moul-select-item': MoulSelectItem
  }
}
