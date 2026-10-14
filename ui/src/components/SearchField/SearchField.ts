import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { searchFieldStyles } from './SearchField.styles.js'

@customElement('moul-search-field')
export class MoulSearchField extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    searchFieldStyles,
  ]

  @property({ type: String })
  accessor value = ''

  @property({ type: String })
  accessor placeholder = 'Search...'

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  @property({ type: String, attribute: 'aria-label' })
  accessor ariaLabel = 'Search'

  private handleInput = (e: InputEvent) => {
    const input = e.target as HTMLInputElement
    this.value = input.value
    this.dispatchEvent(
      new CustomEvent('moul-input', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    this.value = input.value
    this.dispatchEvent(
      new CustomEvent('moul-change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleClear = () => {
    this.value = ''
    this.dispatchEvent(
      new CustomEvent('moul-clear', { bubbles: true, composed: true }),
    )
    this.dispatchEvent(
      new CustomEvent('moul-input', {
        detail: { value: '' },
        bubbles: true,
        composed: true,
      }),
    )
    this.dispatchEvent(
      new CustomEvent('moul-change', {
        detail: { value: '' },
        bubbles: true,
        composed: true,
      }),
    )
  }

  override render() {
    return html`
      <div class="search-wrapper">
        <span class="search-icon" aria-hidden="true">
          <slot name="icon">🔍</slot>
        </span>
        <input
          type="search"
          role="searchbox"
          class="form-control"
          .value="${this.value}"
          placeholder="${this.placeholder}"
          ?disabled="${this.isDisabled}"
          aria-label="${this.ariaLabel}"
          @input="${this.handleInput}"
          @change="${this.handleChange}"
        />
        ${
          this.value
            ? html`
              <button
                type="button"
                class="clear-btn"
                aria-label="Clear search"
                @click="${this.handleClear}"
              >
                ✕
              </button>
            `
            : ''
        }
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-search-field': MoulSearchField
  }
}
