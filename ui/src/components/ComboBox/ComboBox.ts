import { type CSSResultOrNative, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { FloatingUIController } from '../../controllers/floating-ui.controller.js'
import { KeyboardListController } from '../../controllers/keyboard-list.controller.js'
import { MoulBase } from '../../shared/base.js'
import {
  comboboxItemStyles,
  comboboxSectionStyles,
  comboboxStyles,
} from './ComboBox.styles.js'

@customElement('moul-combobox-item')
export class MoulComboBoxItem extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    comboboxItemStyles,
  ]

  @property({ type: String })
  accessor value = ''

  @property({ type: Boolean, attribute: 'is-selected', reflect: true })
  accessor isSelected = false

  @property({ type: Boolean, attribute: 'is-active', reflect: true })
  accessor isActive = false

  @property({ type: Boolean, attribute: 'is-hidden', reflect: true })
  accessor isHidden = false

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
        class="combobox-item ${this.isSelected ? 'selected' : ''} ${this.isActive ? 'active' : ''} ${this.isHidden ? 'hidden' : ''}"
        role="option"
        aria-selected="${this.isSelected ? 'true' : 'false'}"
        @click="${this.handleClick}"
      >
        <slot></slot>
      </div>
    `
  }
}

@customElement('moul-combobox-section')
export class MoulComboBoxSection extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    comboboxSectionStyles,
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

@customElement('moul-combobox')
export class MoulComboBox extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    comboboxStyles,
  ]

  private floating = new FloatingUIController(this, {
    placement: 'bottom-start',
    offset: 4,
    syncWidth: true,
  })
  private keyboardList = new KeyboardListController(this, {
    getItems: () =>
      Array.from(
        this.querySelectorAll<MoulComboBoxItem>(
          'moul-combobox-item:not([is-hidden])',
        ),
      ),
    onActiveChange: (item) => {
      const items = Array.from(
        this.querySelectorAll<MoulComboBoxItem>('moul-combobox-item'),
      )
      items.forEach((i) => {
        i.isActive = i === item
      })
      if (item) {
        this.setAttribute(
          'aria-activedescendant',
          item.id || (item as MoulComboBoxItem).value,
        )
      } else {
        this.removeAttribute('aria-activedescendant')
      }
    },
    onSelect: (item) => {
      const cbItem = item as MoulComboBoxItem
      this.selectValue(cbItem.value, cbItem.textContent?.trim() || cbItem.value)
    },
  })

  @property({ type: String })
  accessor value = ''

  @property({ type: String, attribute: 'selected-key' })
  accessor selectedKey = ''

  @property({ type: String })
  accessor placeholder = 'Search...'

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  @property({ type: Boolean, attribute: 'is-open', reflect: true })
  accessor isOpen = false

  @state()
  private accessor matchCount = 1

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
    this.filterItems()
    this.dispatchEvent(
      new CustomEvent('moul-input', {
        detail: { value: this.value },
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
    if (e.key === 'ArrowDown' && !this.isOpen) {
      this.isOpen = true
      return
    }
    this.keyboardList.handleKeyDown(e)
  }

  private filterItems() {
    const items = Array.from(
      this.querySelectorAll<MoulComboBoxItem>('moul-combobox-item'),
    )
    const q = this.value.toLowerCase().trim()
    let count = 0
    items.forEach((item) => {
      const text = item.textContent?.toLowerCase() || ''
      const matches = !q || text.includes(q)
      item.isHidden = !matches
      if (matches) count++
    })
    this.matchCount = count
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
    this.filterItems()
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
          ?disabled="${this.isDisabled}"
          @input="${this.handleInput}"
          @keydown="${this.handleKeyDown}"
          @focus="${() => {
            this.isOpen = true
            this.filterItems()
          }}"
        />
        <button
          type="button"
          class="toggle-btn"
          aria-label="Toggle menu"
          tabindex="-1"
          @click="${() => (this.isOpen = !this.isOpen)}"
        >
          ▼
        </button>
      </div>
      <div class="popover-menu ${this.isOpen ? 'show' : ''}" role="listbox">
        <slot></slot>
        ${
          this.matchCount === 0
            ? html`<div class="empty-state"><slot name="empty-state">No matching options</slot></div>`
            : ''
        }
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-combobox': MoulComboBox
    'moul-combobox-item': MoulComboBoxItem
    'moul-combobox-section': MoulComboBoxSection
  }
}
