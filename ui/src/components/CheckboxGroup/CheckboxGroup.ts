import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import type { MoulCheckbox } from '../Checkbox/Checkbox.js'
import { checkboxGroupStyles } from './CheckboxGroup.styles.js'

@customElement('moul-checkbox-group')
export class MoulCheckboxGroup extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    checkboxGroupStyles,
  ]

  @property({ type: Array })
  accessor value: string[] = []

  @property({ type: String, reflect: true })
  accessor orientation: 'horizontal' | 'vertical' = 'vertical'

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  @property({ type: String, attribute: 'aria-label' })
  accessor ariaLabel: string | null = null

  private handleSlotChange = () => {
    this.syncChildren()
  }

  private syncChildren() {
    const checkboxes = Array.from(
      this.querySelectorAll<MoulCheckbox>('moul-checkbox'),
    )
    checkboxes.forEach((cb) => {
      if (this.isDisabled) cb.isDisabled = true
      if (cb.value && this.value.includes(cb.value)) {
        cb.isSelected = true
      }
    })
  }

  override firstUpdated() {
    this.addEventListener(
      'moul-change',
      this.handleCheckboxChange as EventListener,
    )
  }

  private handleCheckboxChange = (
    e: CustomEvent<{ isSelected: boolean; value: string }>,
  ) => {
    const { isSelected, value } = e.detail
    if (!value) return

    let next = [...this.value]
    if (isSelected && !next.includes(value)) {
      next.push(value)
    } else if (!isSelected) {
      next = next.filter((v) => v !== value)
    }
    this.value = next
    this.dispatchEvent(
      new CustomEvent('moul-group-change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  override render() {
    return html`
      <div class="checkbox-group" role="group" aria-label="${this.ariaLabel || ''}">
        <slot @slotchange="${this.handleSlotChange}"></slot>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-checkbox-group': MoulCheckboxGroup
  }
}
