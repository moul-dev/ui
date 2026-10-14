import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import type { MoulToggleButton } from '../ToggleButton/ToggleButton.js'
import { toggleButtonGroupStyles } from './ToggleButtonGroup.styles.js'

@customElement('moul-toggle-button-group')
export class MoulToggleButtonGroup extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    toggleButtonGroupStyles,
  ]

  @property({
    converter: {
      fromAttribute(val: string | null) {
        if (!val) return []
        try {
          const parsed = JSON.parse(val)
          return Array.isArray(parsed) ? parsed : [String(parsed)]
        } catch {
          return val.split(',').map((s) => s.trim())
        }
      },
      toAttribute(val: string[]) {
        return JSON.stringify(val)
      },
    },
  })
  accessor value: string[] = []

  @property({ type: String, attribute: 'selection-mode' })
  accessor selectionMode: 'single' | 'multiple' = 'single'

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  override firstUpdated() {
    this.addEventListener(
      'moul-change',
      this.handleButtonChange as EventListener,
    )
  }

  private handleSlotChange = () => {
    this.syncChildren()
  }

  private syncChildren() {
    const valList = Array.isArray(this.value)
      ? this.value
      : this.value
        ? [String(this.value)]
        : []
    const buttons = Array.from(
      this.querySelectorAll<MoulToggleButton>('moul-toggle-button'),
    )
    buttons.forEach((btn) => {
      if (this.isDisabled) btn.isDisabled = true
      if (btn.value && valList.includes(btn.value)) {
        btn.isSelected = true
      }
    })
  }

  private handleButtonChange = (
    e: CustomEvent<{ isSelected: boolean; value: string }>,
  ) => {
    const { isSelected, value } = e.detail
    if (!value) return

    if (this.selectionMode === 'single') {
      this.value = isSelected ? [value] : []
      const buttons = Array.from(
        this.querySelectorAll<MoulToggleButton>('moul-toggle-button'),
      )
      buttons.forEach((b) => {
        if (b.value !== value) b.isSelected = false
      })
    } else {
      let next = [...this.value]
      if (isSelected && !next.includes(value)) {
        next.push(value)
      } else if (!isSelected) {
        next = next.filter((v) => v !== value)
      }
      this.value = next
    }

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
      <div class="btn-group" role="group">
        <slot @slotchange="${this.handleSlotChange}"></slot>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-toggle-button-group': MoulToggleButtonGroup
  }
}
