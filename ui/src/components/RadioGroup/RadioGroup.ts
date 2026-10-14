import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { RovingTabindexController } from '../../controllers/roving-tabindex.controller.js'
import { MoulBase } from '../../shared/base.js'
import { radioGroupStyles, radioStyles } from './RadioGroup.styles.js'

@customElement('moul-radio')
export class MoulRadio extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    radioStyles,
  ]

  @property({ type: Boolean, attribute: 'is-selected', reflect: true })
  accessor isSelected = false

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  @property({ type: String })
  accessor value = ''

  @property({ type: String })
  accessor name = ''

  private handleClick = () => {
    if (this.isDisabled) return
    this.isSelected = true
    this.dispatchEvent(
      new CustomEvent('moul-radio-select', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  override render() {
    return html`
      <label class="form-check" @click="${this.handleClick}">
        <input
          type="radio"
          class="form-check-input"
          name="${this.name}"
          .checked="${this.isSelected}"
          ?disabled="${this.isDisabled}"
          aria-checked="${this.isSelected ? 'true' : 'false'}"
        />
        <span class="form-check-label">
          <slot></slot>
        </span>
      </label>
    `
  }
}

@customElement('moul-radio-group')
export class MoulRadioGroup extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    radioGroupStyles,
  ]

  private roving = new RovingTabindexController(this, {
    orientation: 'vertical',
    getItems: () => Array.from(this.querySelectorAll<MoulRadio>('moul-radio')),
    onSelect: (el) => {
      const radio = el as MoulRadio
      radio.isSelected = true
      this.value = radio.value
      this.syncRadios()
      this.dispatchEvent(
        new CustomEvent('moul-change', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      )
    },
  })

  @property({ type: String })
  accessor value = ''

  @property({ type: String, reflect: true })
  accessor orientation: 'horizontal' | 'vertical' = 'vertical'

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  @property({ type: String, attribute: 'aria-label' })
  accessor ariaLabel: string | null = null

  private handleSlotChange = () => {
    this.syncRadios()
    this.roving.updateTabIndices()
  }

  private syncRadios() {
    const radios = Array.from(this.querySelectorAll<MoulRadio>('moul-radio'))
    radios.forEach((r, idx) => {
      if (this.isDisabled) r.isDisabled = true
      r.isSelected = r.value === this.value
      if (r.isSelected) {
        this.roving.activeIndex = idx
      }
    })
  }

  override firstUpdated() {
    this.addEventListener(
      'moul-radio-select',
      this.handleRadioSelect as EventListener,
    )
  }

  private handleRadioSelect = (e: CustomEvent<{ value: string }>) => {
    this.value = e.detail.value
    this.syncRadios()
    this.dispatchEvent(
      new CustomEvent('moul-change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  override render() {
    return html`
      <div class="radio-group" role="radiogroup" aria-label="${this.ariaLabel || ''}">
        <slot @slotchange="${this.handleSlotChange}"></slot>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-radio-group': MoulRadioGroup
    'moul-radio': MoulRadio
  }
}
