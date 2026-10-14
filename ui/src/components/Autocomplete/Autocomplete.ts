import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { FloatingUIController } from '../../controllers/floating-ui.controller.js'
import { KeyboardListController } from '../../controllers/keyboard-list.controller.js'
import { MoulBase } from '../../shared/base.js'
import {
  autocompleteItemStyles,
  autocompleteSectionStyles,
  autocompleteStyles,
} from './Autocomplete.styles.js'

@customElement('moul-autocomplete-item')
export class MoulAutocompleteItem extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    autocompleteItemStyles,
  ]

  @property({ type: String })
  accessor value = ''

  @property({ type: Boolean, attribute: 'is-selected', reflect: true })
  accessor isSelected = false

  @property({ type: Boolean, attribute: 'is-active', reflect: true })
  accessor isActive = false

  private handleClick = () => {
    this.dispatchEvent(
      new CustomEvent('moul-item-select', {
        detail: {
          value: this.value,
          label: this.textContent?.trim() || this.value,
        },
        bubbles: true,
        composed: true,
      }),
    )
  }

  override render() {
    return html`
      <div
        class="combobox-item ${this.isSelected ? 'selected' : ''} ${this.isActive ? 'active' : ''}"
        role="option"
        aria-selected="${this.isSelected ? 'true' : 'false'}"
        @click="${this.handleClick}"
      >
        <slot></slot>
      </div>
    `
  }
}

@customElement('moul-autocomplete-section')
export class MoulAutocompleteSection extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    autocompleteSectionStyles,
  ]

  @property({ type: String })
  accessor title = ''

  override render() {
    return html`
      <div role="group">
        ${this.title ? html`<div class="section-title">${this.title}</div>` : ''}
        <slot></slot>
      </div>
    `
  }
}

@customElement('moul-autocomplete')
export class MoulAutocomplete extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    autocompleteStyles,
  ]

  private floating = new FloatingUIController(this, {
    placement: 'bottom-start',
    offset: 4,
    syncWidth: true,
  })
  private keyboardList = new KeyboardListController(this, {
    getItems: () =>
      Array.from(
        this.querySelectorAll<MoulAutocompleteItem>('moul-autocomplete-item'),
      ),
    onActiveChange: (item) => {
      const items = Array.from(
        this.querySelectorAll<MoulAutocompleteItem>('moul-autocomplete-item'),
      )
      items.forEach((i) => {
        i.isActive = i === item
      })
    },
    onSelect: (item) => {
      const autoItem = item as MoulAutocompleteItem
      this.selectValue(
        autoItem.value,
        autoItem.textContent?.trim() || autoItem.value,
      )
    },
  })

  @property({ type: String })
  accessor value = ''

  @property({ type: String, attribute: 'selected-key' })
  accessor selectedKey = ''

  @property({ type: String })
  accessor placeholder = 'Search...'

  @property({ type: Boolean, attribute: 'is-loading', reflect: true })
  accessor isLoading = false

  @property({ type: Boolean, attribute: 'is-open', reflect: true })
  accessor isOpen = false

  override firstUpdated() {
    this.addEventListener(
      'moul-item-select',
      this.handleItemSelect as EventListener,
    )
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('isOpen')) {
      if (this.isOpen) {
        const input =
          this.shadowRoot!.querySelector<HTMLElement>('.form-control')!
        const popover =
          this.shadowRoot!.querySelector<HTMLElement>('.popover-menu')!
        this.floating.start(input, popover)
        window.addEventListener('click', this.handleOutsideClick)
      } else {
        this.floating.stop()
        window.removeEventListener('click', this.handleOutsideClick)
      }
    }
  }

  private handleOutsideClick = (e: MouseEvent) => {
    const path = e.composedPath()
    if (!path.includes(this)) {
      this.isOpen = false
    }
  }

  private handleInput = (e: InputEvent) => {
    const input = e.target as HTMLInputElement
    this.value = input.value
    this.isOpen = true
    this.dispatchEvent(
      new CustomEvent('moul-filter', {
        detail: { filter: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.isOpen = false
      return
    }
    this.keyboardList.handleKeyDown(e)
  }

  private handleItemSelect = (
    e: CustomEvent<{ value: string; label: string }>,
  ) => {
    this.selectValue(e.detail.value, e.detail.label)
  }

  private selectValue(val: string, label: string) {
    this.selectedKey = val
    this.value = label
    this.isOpen = false
    this.dispatchEvent(
      new CustomEvent('moul-change', {
        detail: { value: val, label },
        bubbles: true,
        composed: true,
      }),
    )
  }

  override render() {
    return html`
      <div class="input-wrapper">
        <input
          type="text"
          class="form-control"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="${this.isOpen ? 'true' : 'false'}"
          .value="${this.value}"
          placeholder="${this.placeholder}"
          @input="${this.handleInput}"
          @keydown="${this.handleKeyDown}"
          @focus="${() => (this.isOpen = true)}"
        />
        ${
          this.isLoading
            ? html`<div class="spinner-wrapper"><span class="spinner" aria-hidden="true"></span></div>`
            : ''
        }
      </div>
      <div class="popover-menu ${this.isOpen ? 'show' : ''}" role="listbox">
        <slot></slot>
        <div class="empty-state"><slot name="empty-state">No results found</slot></div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-autocomplete': MoulAutocomplete
    'moul-autocomplete-item': MoulAutocompleteItem
    'moul-autocomplete-section': MoulAutocompleteSection
  }
}
