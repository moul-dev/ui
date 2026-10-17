import { html, LitElement, type PropertyValues } from 'lit'
import { FormInternalsController } from '../../controllers/form-internals.controller'
import { OverlayPresenceController } from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import { chevronDown } from '../../utils/icons'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import { selectStyles } from './Select.styles'
import type { MoulSelectItem } from './SelectItem'

export class MoulSelect extends LitElement {
  static override styles = selectStyles
  static readonly formAssociated = true

  static override properties = {
    name: { type: String, reflect: true },
    selectedKey: { type: String, reflect: true, attribute: 'selected-key' },
    placeholder: { type: String, reflect: true },
    label: { type: String, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isRequired: { type: Boolean, reflect: true, attribute: 'is-required' },
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
  }

  declare name: string
  declare selectedKey: string
  declare placeholder: string
  declare label: string
  declare isDisabled: boolean
  declare isRequired: boolean
  declare isOpen: boolean

  public internalsController: FormInternalsController
  public overlayController: OverlayPresenceController
  private activeItemIndex = -1

  constructor() {
    super()
    this.name = ''
    this.selectedKey = ''
    this.placeholder = 'Select an option'
    this.label = ''
    this.isDisabled = false
    this.isRequired = false
    this.isOpen = false

    this.internalsController = new FormInternalsController(this)
    this.overlayController = new OverlayPresenceController(this, {
      preset: 'popover',
      popover: () => this.popoverElement,
    })
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('select-item-click' as any, this.handleItemClick)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('select-item-click' as any, this.handleItemClick)
  }

  public get triggerButton(): HTMLButtonElement | null {
    return this.renderRoot?.querySelector('[part="trigger"]') ?? null
  }

  public get popoverElement(): HTMLElement | null {
    return this.renderRoot?.querySelector('[part="popover"]') ?? null
  }

  public get items(): MoulSelectItem[] {
    return Array.from(this.querySelectorAll<MoulSelectItem>('moul-select-item'))
  }

  public override focus(options?: FocusOptions): void {
    this.triggerButton?.focus(options)
  }

  public override blur(): void {
    this.triggerButton?.blur()
  }

  public checkValidity(): boolean {
    return this.internalsController.checkValidity()
  }

  public reportValidity(): boolean {
    return this.internalsController.reportValidity()
  }

  public get validity(): ValidityState | null {
    return this.internalsController.validity
  }

  public get validationMessage(): string {
    return this.internalsController.validationMessage
  }

  public open(): void {
    if (this.isDisabled || this.isOpen) return
    this.isOpen = true
    this.overlayController.setOpen(true)
    this.syncActiveItem()
  }

  public close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.overlayController.setOpen(false)
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('selectedKey') ||
      changedProperties.has('isRequired')
    ) {
      this.syncFormValueAndValidity()
      this.syncSelectedItems()
    }

    if (changedProperties.has('isOpen')) {
      if (this.isOpen) {
        this.overlayController.setOpen(true)
      } else {
        this.overlayController.setOpen(false)
      }
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    const hasLabel = Boolean(
      this.label ||
        this.getAttribute('aria-label') ||
        this.getAttribute('aria-labelledby') ||
        this.querySelector('[slot="label"]'),
    )
    warnMissingLabel(this, 'select', hasLabel)
  }

  private syncFormValueAndValidity(): void {
    this.internalsController.setValue(this.selectedKey || null)

    if (this.isRequired && !this.selectedKey) {
      this.internalsController.setValidity(
        { valueMissing: true },
        'Please select an option.',
      )
      this.setAttribute('is-invalid', '')
    } else {
      this.internalsController.setValidity({})
      this.removeAttribute('is-invalid')
    }
  }

  public syncSelectedItems(): void {
    for (const item of this.items) {
      const isSelected = item.key === this.selectedKey
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false')
    }
    this.requestUpdate()
  }

  private syncActiveItem(): void {
    const items = this.items.filter((i) => !i.isDisabled)
    const index = items.findIndex((i) => i.key === this.selectedKey)
    this.activeItemIndex = index >= 0 ? index : 0
  }

  public get selectedText(): string {
    const selectedItem = this.items.find((i) => i.key === this.selectedKey)
    if (selectedItem) {
      return (
        selectedItem.value ||
        selectedItem.textContent?.trim() ||
        selectedItem.key
      )
    }
    return ''
  }

  private handleTriggerClick = (event: MouseEvent): void => {
    event.preventDefault()
    this.toggle()
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.isDisabled) return

    if (!this.isOpen) {
      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === ' ' ||
        event.key === 'Enter'
      ) {
        event.preventDefault()
        this.open()
      }
      return
    }

    const available = this.items.filter((i) => !i.isDisabled)
    if (available.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.activeItemIndex = (this.activeItemIndex + 1) % available.length
      available[this.activeItemIndex]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.activeItemIndex =
        this.activeItemIndex <= 0
          ? available.length - 1
          : this.activeItemIndex - 1
      available[this.activeItemIndex]?.focus()
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const item = available[this.activeItemIndex]
      if (item) {
        this.selectItem(
          item.key,
          item.value || item.textContent?.trim() || item.key,
        )
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      this.close()
      this.focus()
    }
  }

  public selectItem(key: string, value: string): void {
    this.selectedKey = key
    this.syncFormValueAndValidity()
    this.syncSelectedItems()
    this.close()
    this.focus()

    this.dispatchEvent(
      new CustomEvent('selectionchange', {
        detail: { selectedKey: this.selectedKey },
        bubbles: true,
        composed: true,
      }),
    )
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: value || this.selectedKey },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleItemClick = (
    event: CustomEvent<{ key: string; value: string }>,
  ): void => {
    event.stopPropagation()
    this.selectItem(event.detail.key, event.detail.value)
  }

  protected override render() {
    const isInvalid = this.hasAttribute('is-invalid')
    const text = this.selectedText || this.placeholder
    const isPlaceholder = !this.selectedText

    return html`
      <div part="base" @keydown=${this.handleKeyDown}>
        ${
          this.label
            ? html`<label part="label"><slot name="label">${this.label}</slot></label>`
            : html`<slot name="label"></slot>`
        }

        <button
          type="button"
          part="trigger"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded=${this.isOpen ? 'true' : 'false'}
          aria-label=${this.label || this.placeholder}
          ?disabled=${this.isDisabled}
          ?data-invalid=${isInvalid}
          @click=${this.handleTriggerClick}
        >
          <span part="value" ?data-placeholder=${isPlaceholder}>${text}</span>
          <span part="chevron">${chevronDown()}</span>
        </button>

        <div
          part="popover"
          popover="auto"
          role="listbox"
          tabindex="-1"
          ?hidden=${!this.overlayController.isMounted}
          @select-item-click=${this.handleItemClick}
        >
          <slot @slotchange=${this.syncSelectedItems}></slot>
        </div>
      </div>
    `
  }
}

defineElement('moul-select', MoulSelect)

declare global {
  interface HTMLElementTagNameMap {
    'moul-select': MoulSelect
  }
}
