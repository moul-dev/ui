import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { KeyboardListController } from '../../controllers/keyboard-list.controller.js'
import { MoulBase } from '../../shared/base.js'
import {
  listboxItemStyles,
  listboxSectionStyles,
  listboxStyles,
} from './ListBox.styles.js'

@customElement('moul-listbox-item')
export class MoulListBoxItem extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    listboxItemStyles,
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
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  override render() {
    return html`
      <div
        class="listbox-item ${this.isSelected ? 'selected' : ''} ${this.isActive ? 'active' : ''} ${this.isDisabled ? 'disabled' : ''}"
        role="option"
        aria-selected="${this.isSelected ? 'true' : 'false'}"
        aria-disabled="${this.isDisabled ? 'true' : 'false'}"
        @click="${this.handleClick}"
      >
        <span><slot></slot></span>
        ${this.isSelected ? html`<span class="check-icon" aria-hidden="true">✓</span>` : ''}
      </div>
    `
  }
}

@customElement('moul-listbox-section')
export class MoulListBoxSection extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    listboxSectionStyles,
  ]

  @property({ type: String })
  accessor title = ''

  override render() {
    return html`
      <div role="group">
        ${this.title ? html`<div class="section-header">${this.title}</div>` : ''}
        <slot></slot>
      </div>
    `
  }
}

@customElement('moul-listbox')
export class MoulListBox extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    listboxStyles,
  ]

  private keyboardList = new KeyboardListController(this, {
    getItems: () =>
      Array.from(this.querySelectorAll<MoulListBoxItem>('moul-listbox-item')),
    onActiveChange: (item) => {
      const items = Array.from(
        this.querySelectorAll<MoulListBoxItem>('moul-listbox-item'),
      )
      items.forEach((i) => {
        i.isActive = i === item
      })
      if (item) {
        this.setAttribute(
          'aria-activedescendant',
          item.id || (item as MoulListBoxItem).value,
        )
      } else {
        this.removeAttribute('aria-activedescendant')
      }
    },
    onSelect: (item) => {
      this.selectValue((item as MoulListBoxItem).value)
    },
  })

  @property({ type: String, attribute: 'selection-mode' })
  accessor selectionMode: 'single' | 'multiple' = 'single'

  @property({ type: Array })
  accessor selectedKeys: string[] = []

  @property({ type: String, attribute: 'selected-key' })
  accessor selectedKey = ''

  override firstUpdated() {
    this.addEventListener(
      'moul-item-select',
      this.handleItemSelect as EventListener,
    )
    this.addEventListener('keydown', (e: KeyboardEvent) =>
      this.keyboardList.handleKeyDown(e),
    )
    this.tabIndex = 0
  }

  private handleSlotChange = () => {
    this.syncSelection()
  }

  private handleItemSelect = (e: CustomEvent<{ value: string }>) => {
    this.selectValue(e.detail.value)
  }

  private selectValue(val: string) {
    if (this.selectionMode === 'single') {
      this.selectedKey = val
      this.selectedKeys = [val]
    } else {
      let next = [...this.selectedKeys]
      if (next.includes(val)) {
        next = next.filter((v) => v !== val)
      } else {
        next.push(val)
      }
      this.selectedKeys = next
    }
    this.syncSelection()
    this.dispatchEvent(
      new CustomEvent('moul-selection-change', {
        detail: {
          selectedKey: this.selectedKey,
          selectedKeys: this.selectedKeys,
        },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private syncSelection() {
    const items = Array.from(
      this.querySelectorAll<MoulListBoxItem>('moul-listbox-item'),
    )
    items.forEach((item) => {
      item.isSelected =
        this.selectionMode === 'single'
          ? item.value === this.selectedKey
          : this.selectedKeys.includes(item.value)
    })
  }

  override render() {
    return html`
      <div class="listbox" role="listbox" aria-multiselectable="${this.selectionMode === 'multiple' ? 'true' : 'false'}">
        <slot @slotchange="${this.handleSlotChange}"></slot>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-listbox': MoulListBox
    'moul-listbox-item': MoulListBoxItem
    'moul-listbox-section': MoulListBoxSection
  }
}
