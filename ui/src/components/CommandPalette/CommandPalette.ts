import { virtualize } from '@lit-labs/virtualizer/virtualize.js'
import { html, LitElement, type PropertyValues } from 'lit'
import { OverlayPresenceController } from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import { restoreFocus, trapFocus } from '../../utils/focus-trap'
import { search } from '../../utils/icons'
import { commandPaletteStyles } from './CommandPalette.styles'

export interface CommandPaletteItemData {
  id: string
  title: string
  description?: string
  icon?: string
  shortcut?: string
  group?: string
  disabled?: boolean
}

export class MoulCommandPalette extends LitElement {
  static override styles = commandPaletteStyles

  static override properties = {
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    items: { type: Array, attribute: false },
    placeholder: { type: String, reflect: true },
    shortcut: { type: String, reflect: true },
    virtualized: { type: Boolean, reflect: true },
    query: { state: true },
    activeIndex: { state: true },
  }

  declare isOpen: boolean
  declare items: CommandPaletteItemData[]
  declare placeholder: string
  declare shortcut: string
  declare virtualized: boolean
  declare query: string
  declare activeIndex: number

  public overlayPresence: OverlayPresenceController
  private previousActiveElement: HTMLElement | null = null

  constructor() {
    super()
    this.isOpen = false
    this.items = []
    this.placeholder = 'Type a command or search...'
    this.shortcut = 'k'
    this.virtualized = false
    this.query = ''
    this.activeIndex = 0

    this.overlayPresence = new OverlayPresenceController(this, {
      preset: 'modal',
      dialog: () => this.dialogEl,
    })
  }

  public get dialogEl(): HTMLDialogElement | null {
    return this.shadowRoot?.querySelector<HTMLDialogElement>('dialog') ?? null
  }

  public get inputEl(): HTMLInputElement | null {
    return (
      this.shadowRoot?.querySelector<HTMLInputElement>('[part="input"]') ?? null
    )
  }

  public get isMounted(): boolean {
    return this.overlayPresence.isMounted
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    window.addEventListener('keydown', this.handleGlobalKeyDown)
    this.addEventListener('keydown', this.handleKeyDown)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    window.removeEventListener('keydown', this.handleGlobalKeyDown)
    this.removeEventListener('keydown', this.handleKeyDown)
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('isOpen')) {
      if (this.isOpen !== this.overlayPresence.isOpen) {
        if (this.isOpen) {
          this.openPalette()
        } else {
          this.closePalette()
        }
      }
    }
  }

  public async setOpen(nextOpen: boolean): Promise<void> {
    if (this.isOpen === nextOpen && this.overlayPresence.isOpen === nextOpen)
      return
    this.isOpen = nextOpen
    this.dispatchEvent(
      new CustomEvent('openchange', {
        bubbles: true,
        composed: true,
        detail: { isOpen: this.isOpen },
      }),
    )
    if (nextOpen) {
      await this.openPalette()
    } else {
      await this.closePalette()
    }
  }

  public async toggle(force?: boolean): Promise<void> {
    const next = typeof force === 'boolean' ? force : !this.isOpen
    await this.setOpen(next)
  }

  private async openPalette(): Promise<void> {
    this.previousActiveElement = document.activeElement as HTMLElement | null
    this.query = ''
    this.activeIndex = 0

    await this.overlayPresence.setOpen(true)
    const input = this.inputEl
    if (input) {
      input.focus()
    }
  }

  private async closePalette(): Promise<void> {
    await this.overlayPresence.setOpen(false)
    restoreFocus(this.previousActiveElement)
  }

  private readonly handleGlobalKeyDown = (e: KeyboardEvent): void => {
    if (
      (e.metaKey || e.ctrlKey) &&
      e.key.toLowerCase() === this.shortcut.toLowerCase()
    ) {
      e.preventDefault()
      this.toggle()
    }
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isOpen) return

    const filtered = this.getFilteredItems()

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        this.setOpen(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (filtered.length > 0) {
          this.activeIndex = Math.min(filtered.length - 1, this.activeIndex + 1)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (filtered.length > 0) {
          this.activeIndex = Math.max(0, this.activeIndex - 1)
        }
        break
      case 'Enter':
        e.preventDefault()
        if (filtered.length > 0 && filtered[this.activeIndex]) {
          this.selectItem(filtered[this.activeIndex])
        }
        break
      case 'Tab': {
        const dialog = this.dialogEl
        if (dialog) {
          trapFocus(dialog, e)
        }
        break
      }
    }
  }

  private handleInput(e: Event): void {
    const input = e.target as HTMLInputElement
    this.query = input.value
    this.activeIndex = 0
  }

  public getFilteredItems(): CommandPaletteItemData[] {
    const q = this.query.trim().toLowerCase()
    if (!q) return this.items || []

    return (this.items || []).filter((item) => {
      const matchTitle = item.title?.toLowerCase().includes(q)
      const matchDesc = item.description?.toLowerCase().includes(q)
      return matchTitle || matchDesc
    })
  }

  private selectItem(item: CommandPaletteItemData): void {
    if (item.disabled) return

    this.dispatchEvent(
      new CustomEvent('select', {
        bubbles: true,
        composed: true,
        detail: { item },
      }),
    )
    this.setOpen(false)
  }

  private renderItem(item: CommandPaletteItemData, index: number) {
    const isActive = index === this.activeIndex
    return html`
      <div
        id="item-${item.id || index}"
        part="item ${isActive ? 'item-active' : ''}"
        role="option"
        aria-selected=${isActive ? 'true' : 'false'}
        aria-disabled=${item.disabled ? 'true' : 'false'}
        tabindex="-1"
        @click=${() => this.selectItem(item)}
      >
        <div class="item-content">
          <span class="item-title">${item.title}</span>
          ${item.description ? html`<span class="item-description">${item.description}</span>` : ''}
        </div>
        ${item.shortcut ? html`<span class="item-shortcut">${item.shortcut}</span>` : ''}
      </div>
    `
  }

  protected override render() {
    const filtered = this.getFilteredItems()
    const activeItem = filtered[this.activeIndex]

    return html`
      <dialog
        part="dialog"
        class="dialog"
        @click=${(e: MouseEvent) => {
          if (e.target === this.dialogEl) {
            this.setOpen(false)
          }
        }}
      >
        <div part="base" class="command-palette-card">
          <slot name="header"></slot>

          <div part="input-wrapper" class="input-wrapper">
            <span class="search-icon">${search()}</span>
            <input
              part="input"
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-autocomplete="list"
              aria-controls="palette-list"
              aria-activedescendant=${activeItem ? `item-${activeItem.id || this.activeIndex}` : ''}
              placeholder=${this.placeholder}
              .value=${this.query}
              @input=${this.handleInput}
            />
          </div>

          <div id="palette-list" part="list" role="listbox" class="list">
            ${
              filtered.length === 0
                ? html`
                  <div part="empty" class="empty">
                    <slot name="empty">No results found.</slot>
                  </div>
                `
                : this.virtualized && filtered.length > 50
                  ? virtualize({
                      items: filtered,
                      renderItem: (item, idx) => this.renderItem(item, idx),
                    })
                  : filtered.map((item, idx) => this.renderItem(item, idx))
            }
          </div>

          <div part="footer">
            <slot name="footer">
              <span>Navigation: ↑↓, Select: ↵, Dismiss: Esc</span>
            </slot>
          </div>
        </div>
      </dialog>
    `
  }
}

defineElement('moul-command-palette', MoulCommandPalette)

declare global {
  interface HTMLElementTagNameMap {
    'moul-command-palette': MoulCommandPalette
  }
}
