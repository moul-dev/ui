import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { comboBoxItemStyles } from './ComboBox.styles'

/**
 * One option inside a `<moul-combobox>` list. Its `key` is what the
 * combobox submits, and its `text-value` (falling back to its text, then its
 * `key`) is what filtering matches and what fills the input when it is
 * picked; the picked item shows a trailing check.
 *
 * Keyboard and screen readers: it has `role="option"` with `aria-selected`
 * (set by the parent combobox) and `aria-disabled`, and is named by its
 * slotted text (or `text-value`, else `key`, when nothing is slotted). It is
 * not in the tab order (`tabindex="-1"`): the parent `<moul-combobox>` moves
 * focus onto it with `Arrow Down`/`Arrow Up` and picks it with `Enter`, and
 * clicking it picks it too. Items that do not match the typed text are
 * hidden.
 *
 * Reduced motion: the row does not press in when clicked, and hover and
 * focus colours change without fading.
 */
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
