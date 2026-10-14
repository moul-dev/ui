import { type CSSResultOrNative, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { FloatingUIController } from '../../controllers/floating-ui.controller.js'
import { KeyboardListController } from '../../controllers/keyboard-list.controller.js'
import { MoulBase } from '../../shared/base.js'
import {
  selectItemStyles,
  selectSectionStyles,
  selectStyles,
} from './Select.styles.js'

@customElement('moul-select-item')
export class MoulSelectItem extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    selectItemStyles,
  ]

  @property({ type: String })
  accessor value = ''

  @property({ type: Boolean, attribute: 'is-selected', reflect: true })
  accessor isSelected = false

  @property({ type: Boolean, attribute: 'is-active', reflect: true })
  accessor isActive = false

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  private handleClick = () => {
    if (this.isDisabled) return
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
        class="select-item ${this.isSelected ? 'selected' : ''} ${this.isActive ? 'active' : ''} ${this.isDisabled ? 'disabled' : ''}"
        role="option"
        aria-selected="${this.isSelected ? 'true' : 'false'}"
        @click="${this.handleClick}"
      >
        <slot></slot>
      </div>
    `
  }
}

@customElement('moul-select-section')
export class MoulSelectSection extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    selectSectionStyles,
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

@customElement('moul-select')
export class MoulSelect extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    selectStyles,
  ]

  private floating = new FloatingUIController(this, {
    placement: 'bottom-start',
    offset: 4,
    syncWidth: true,
  })
  private keyboardList = new KeyboardListController(this, {
    getItems: () =>
      Array.from(this.querySelectorAll<MoulSelectItem>('moul-select-item')),
    onActiveChange: (item) => {
      const items = Array.from(
        this.querySelectorAll<MoulSelectItem>('moul-select-item'),
      )
      items.forEach((i) => {
        i.isActive = i === item
      })
    },
    onSelect: (item) => {
      const selectItem = item as MoulSelectItem
      this.selectValue(
        selectItem.value,
        selectItem.textContent?.trim() || selectItem.value,
      )
    },
  })

  @property({ type: String, attribute: 'selected-key' })
  accessor selectedKey = ''

  @property({ type: String })
  accessor placeholder = 'Select an option...'

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  @property({ type: Boolean, attribute: 'is-open', reflect: true })
  accessor isOpen = false

  @state()
  private accessor selectedLabel = ''

  override firstUpdated() {
    this.addEventListener(
      'moul-item-select',
      this.handleItemSelect as EventListener,
    )
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('isOpen')) {
      if (this.isOpen) {
        const trigger =
          this.shadowRoot!.querySelector<HTMLElement>('.form-select')!
        const popover =
          this.shadowRoot!.querySelector<HTMLElement>('.popover-menu')!
        this.floating.start(trigger, popover)
        window.addEventListener('click', this.handleOutsideClick)
        window.addEventListener('keydown', this.handleKeyDown)
      } else {
        this.floating.stop()
        window.removeEventListener('click', this.handleOutsideClick)
        window.removeEventListener('keydown', this.handleKeyDown)
      }
    }
    if (changedProperties.has('selectedKey')) {
      this.syncSelected()
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.isOpen = false
      return
    }
    this.keyboardList.handleKeyDown(e)
  }

  private handleOutsideClick = (e: MouseEvent) => {
    const path = e.composedPath()
    if (!path.includes(this)) {
      this.isOpen = false
    }
  }

  private handleTriggerClick = () => {
    if (this.isDisabled) return
    this.isOpen = !this.isOpen
  }

  private handleItemSelect = (
    e: CustomEvent<{ value: string; label: string }>,
  ) => {
    this.selectValue(e.detail.value, e.detail.label)
  }

  private selectValue(val: string, label: string) {
    this.selectedKey = val
    this.selectedLabel = label
    this.isOpen = false
    this.syncSelected()
    this.dispatchEvent(
      new CustomEvent('moul-change', {
        detail: { value: val },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private syncSelected() {
    const items = Array.from(
      this.querySelectorAll<MoulSelectItem>('moul-select-item'),
    )
    items.forEach((item) => {
      item.isSelected = item.value === this.selectedKey
      if (item.isSelected && !this.selectedLabel) {
        this.selectedLabel = item.textContent?.trim() || item.value
      }
    })
  }

  override render() {
    return html`
      <button
        type="button"
        class="form-select"
        role="combobox"
        aria-expanded="${this.isOpen ? 'true' : 'false'}"
        aria-haspopup="listbox"
        ?disabled="${this.isDisabled}"
        @click="${this.handleTriggerClick}"
      >
        <span>${this.selectedLabel || this.placeholder}</span>
      </button>
      <div class="popover-menu ${this.isOpen ? 'show' : ''}" role="listbox">
        <slot></slot>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-select': MoulSelect
    'moul-select-item': MoulSelectItem
    'moul-select-section': MoulSelectSection
  }
}
