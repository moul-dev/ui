import { html, LitElement, type PropertyValues } from 'lit'
import { FormInternalsController } from '../../controllers/form-internals.controller'
import { OverlayPresenceController } from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import { chevronDown } from '../../utils/icons'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import { comboBoxStyles } from './ComboBox.styles'
import type { MoulComboBoxItem } from './ComboBoxItem'

export class MoulComboBox extends LitElement {
  static override styles = comboBoxStyles
  static readonly formAssociated = true

  static override properties = {
    name: { type: String, reflect: true },
    selectedKey: { type: String, reflect: true, attribute: 'selected-key' },
    inputValue: { type: String, reflect: true, attribute: 'input-value' },
    placeholder: { type: String, reflect: true },
    label: { type: String, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isRequired: { type: Boolean, reflect: true, attribute: 'is-required' },
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
  }

  declare name: string
  declare selectedKey: string
  declare inputValue: string
  declare placeholder: string
  declare label: string
  declare isDisabled: boolean
  declare isRequired: boolean
  declare isOpen: boolean

  public internalsController: FormInternalsController
  public overlayController: OverlayPresenceController
  private activeIndex = -1

  constructor() {
    super()
    this.name = ''
    this.selectedKey = ''
    this.inputValue = ''
    this.placeholder = ''
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
    this.addEventListener('combobox-item-click' as any, this.handleItemClick)
    this.addEventListener('keydown', this.handleKeyDown)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('combobox-item-click' as any, this.handleItemClick)
    this.removeEventListener('keydown', this.handleKeyDown)
  }

  public get inputElement(): HTMLInputElement | null {
    return this.renderRoot?.querySelector('input') ?? null
  }

  public get popoverElement(): HTMLElement | null {
    return this.renderRoot?.querySelector('[part="popover"]') ?? null
  }

  public get items(): MoulComboBoxItem[] {
    return Array.from(
      this.querySelectorAll<MoulComboBoxItem>('moul-combobox-item'),
    )
  }

  public get visibleItems(): MoulComboBoxItem[] {
    return this.items.filter((item) => !item.hidden && !item.isDisabled)
  }

  public override focus(options?: FocusOptions): void {
    this.inputElement?.focus(options)
  }

  public override blur(): void {
    this.inputElement?.blur()
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
    this.filterItems()
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
      this.focus()
    }
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('selectedKey') ||
      changedProperties.has('inputValue') ||
      changedProperties.has('isRequired')
    ) {
      this.syncFormValueAndValidity()
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
    warnMissingLabel(this, 'combobox', hasLabel)
  }

  private syncFormValueAndValidity(): void {
    const val = this.selectedKey || this.inputValue || null
    this.internalsController.setValue(val)

    if (this.isRequired && !val) {
      this.internalsController.setValidity(
        { valueMissing: true },
        'Please enter or select a value.',
      )
      this.setAttribute('is-invalid', '')
    } else {
      this.internalsController.setValidity({})
      this.removeAttribute('is-invalid')
    }
  }

  private filterItems(): void {
    const query = this.inputValue.toLowerCase().trim()
    for (const item of this.items) {
      const text = item.text.toLowerCase()
      const matches = !query || text.includes(query)
      item.hidden = !matches
    }
    this.requestUpdate()
  }

  public selectItem(key: string, text: string): void {
    this.selectedKey = key
    this.inputValue = text
    this.syncFormValueAndValidity()
    this.close()
    this.focus()

    for (const item of this.items) {
      item.setAttribute('aria-selected', item.key === key ? 'true' : 'false')
      item.hidden = false
    }

    this.dispatchEvent(
      new CustomEvent('selectionchange', {
        detail: { selectedKey: this.selectedKey },
        bubbles: true,
        composed: true,
      }),
    )
    this.dispatchEvent(
      new CustomEvent('inputchange', {
        detail: { inputValue: this.inputValue },
        bubbles: true,
        composed: true,
      }),
    )
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.inputValue },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleInput = (event: Event): void => {
    const input = event.target as HTMLInputElement
    this.inputValue = input.value
    this.selectedKey = ''
    this.syncFormValueAndValidity()
    this.open()
    this.filterItems()

    this.dispatchEvent(
      new CustomEvent('inputchange', {
        detail: { inputValue: this.inputValue },
        bubbles: true,
        composed: true,
      }),
    )
    this.dispatchEvent(
      new Event('input', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.isDisabled || event.defaultPrevented) return

    if (!this.isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        this.open()
      }
      return
    }

    const visible = this.visibleItems
    if (visible.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.activeIndex = (this.activeIndex + 1) % visible.length
      visible[this.activeIndex]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.activeIndex =
        this.activeIndex <= 0 ? visible.length - 1 : this.activeIndex - 1
      visible[this.activeIndex]?.focus()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = visible[this.activeIndex]
      if (item) {
        this.selectItem(item.key, item.text)
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      this.close()
    }
  }

  private handleItemClick = (
    event: CustomEvent<{ key: string; text: string }>,
  ): void => {
    event.stopPropagation()
    this.selectItem(event.detail.key, event.detail.text)
  }

  protected override render() {
    const isInvalid = this.hasAttribute('is-invalid')
    const hasVisible = this.visibleItems.length > 0

    return html`
      <div part="base" @keydown=${this.handleKeyDown}>
        ${
          this.label
            ? html`<label part="label" for="input"><slot name="label">${this.label}</slot></label>`
            : html`<slot name="label"></slot>`
        }

        <div
          part="input-container"
          ?data-invalid=${isInvalid}
          ?data-disabled=${this.isDisabled}
        >
          <input
            id="input"
            part="input"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded=${this.isOpen ? 'true' : 'false'}
            placeholder=${this.placeholder}
            .value=${this.inputValue}
            ?disabled=${this.isDisabled}
            ?required=${this.isRequired}
            aria-invalid=${isInvalid ? 'true' : 'false'}
            @input=${this.handleInput}
          />

          <button
            type="button"
            part="toggle-btn"
            aria-label="Toggle options"
            tabindex="-1"
            ?disabled=${this.isDisabled}
            @click=${this.toggle}
          >
            ${chevronDown()}
          </button>
        </div>

        <div
          part="popover"
          popover="auto"
          role="listbox"
          tabindex="-1"
          ?hidden=${!this.overlayController.isMounted}
          @combobox-item-click=${this.handleItemClick}
        >
          <slot @slotchange=${this.filterItems}></slot>
          ${
            !hasVisible
              ? html`<slot name="empty"><div part="empty">No results found</div></slot>`
              : ''
          }
        </div>
      </div>
    `
  }
}

defineElement('moul-combobox', MoulComboBox)

declare global {
  interface HTMLElementTagNameMap {
    'moul-combobox': MoulComboBox
  }
}
