import { type CSSResultOrNative, html } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { FocusTrapController } from '../../controllers/focus-trap.controller.js'
import { ScrollLockController } from '../../controllers/scroll-lock.controller.js'
import { MoulBase } from '../../shared/base.js'
import {
  commandPaletteItemStyles,
  commandPaletteSectionStyles,
  commandPaletteStyles,
} from './CommandPalette.styles.js'

@customElement('moul-command-palette-item')
export class MoulCommandPaletteItem extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    commandPaletteItemStyles,
  ]

  @property({ type: String })
  accessor value = ''

  @property({ type: String })
  accessor keywords = ''

  @property({ type: Boolean, attribute: 'is-active', reflect: true })
  accessor isActive = false

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  private handleClick() {
    if (this.isDisabled) return
    this.dispatchEvent(
      new CustomEvent('moul-action', {
        detail: { value: this.value || this.textContent?.trim() },
        bubbles: true,
        composed: true,
      }),
    )
  }

  override render() {
    return html`
      <div class="palette-item" role="option" aria-selected="${this.isActive ? 'true' : 'false'}" @click=${this.handleClick}>
        <slot></slot>
      </div>
    `
  }
}

@customElement('moul-command-palette-section')
export class MoulCommandPaletteSection extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    commandPaletteSectionStyles,
  ]

  @property({ type: String })
  accessor heading = ''

  override render() {
    return html`
      <div>
        ${this.heading ? html`<div class="section-heading">${this.heading}</div>` : ''}
        <slot></slot>
      </div>
    `
  }
}

@customElement('moul-command-palette')
export class MoulCommandPalette extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    commandPaletteStyles,
  ]

  @property({ type: Boolean, attribute: 'is-open', reflect: true })
  accessor isOpen = false

  @property({ type: String })
  accessor placeholder = 'Type a command or search...'

  @property({ type: String })
  accessor shortcut = 'Meta+k,Ctrl+k'

  @state()
  private accessor query = ''

  @state()
  private accessor activeIndex = 0

  @query('.palette-input')
  private accessor searchInput: HTMLInputElement | null = null

  private focusTrap = new FocusTrapController(this)
  private scrollLock = new ScrollLockController(this)

  private handleGlobalKeyDown = (e: KeyboardEvent) => {
    if (!this.shortcut) return
    const shortcuts = this.shortcut
      .split(',')
      .map((s) => s.trim().toLowerCase())
    for (const sc of shortcuts) {
      const parts = sc.split('+')
      const key = parts[parts.length - 1]
      const needsMeta = parts.includes('meta') || parts.includes('cmd')
      const needsCtrl = parts.includes('ctrl')
      const keyMatch = e.key.toLowerCase() === key
      if ((needsMeta || needsCtrl) && (e.metaKey || e.ctrlKey) && keyMatch) {
        e.preventDefault()
        this.isOpen = !this.isOpen
        if (this.isOpen) {
          this.dispatchEvent(
            new CustomEvent('moul-open', { bubbles: true, composed: true }),
          )
        } else {
          this.dispatchEvent(
            new CustomEvent('moul-close', { bubbles: true, composed: true }),
          )
        }
        return
      }
    }
  }

  override connectedCallback() {
    super.connectedCallback()
    window.addEventListener('keydown', this.handleGlobalKeyDown)
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('keydown', this.handleGlobalKeyDown)
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('isOpen')) {
      if (this.isOpen) {
        this.scrollLock.lock()
        this.query = ''
        this.activeIndex = 0
        this.updateFilter()
        setTimeout(() => {
          this.focusTrap.activate()
          this.searchInput?.focus()
        }, 50)
      } else {
        this.scrollLock.unlock()
        this.focusTrap.deactivate()
      }
    }
  }

  private close() {
    this.isOpen = false
    this.dispatchEvent(
      new CustomEvent('moul-close', { bubbles: true, composed: true }),
    )
  }

  private handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      this.close()
    }
  }

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement
    this.query = input.value
    this.activeIndex = 0
    this.updateFilter()
  }

  private getVisibleItems(): MoulCommandPaletteItem[] {
    const items = Array.from(
      this.querySelectorAll('moul-command-palette-item'),
    ) as MoulCommandPaletteItem[]
    return items.filter(
      (item) => !item.hasAttribute('hidden') && !item.isDisabled,
    )
  }

  private updateFilter() {
    const q = this.query.trim().toLowerCase()
    const items = Array.from(
      this.querySelectorAll('moul-command-palette-item'),
    ) as MoulCommandPaletteItem[]
    items.forEach((item) => {
      const text = item.textContent?.toLowerCase() || ''
      const keywords = (item.keywords || '').toLowerCase()
      const val = item.value.toLowerCase()
      const match =
        !q || text.includes(q) || keywords.includes(q) || val.includes(q)
      if (match) {
        item.removeAttribute('hidden')
      } else {
        item.setAttribute('hidden', '')
      }
    })
    this.updateActiveItem()
  }

  private updateActiveItem() {
    const visible = this.getVisibleItems()
    visible.forEach((item, index) => {
      item.isActive = index === this.activeIndex
    })
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      this.close()
      return
    }

    const visible = this.getVisibleItems()
    if (visible.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      this.activeIndex = (this.activeIndex + 1) % visible.length
      this.updateActiveItem()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      this.activeIndex =
        (this.activeIndex - 1 + visible.length) % visible.length
      this.updateActiveItem()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const active = visible[this.activeIndex]
      if (active) {
        active.click()
        this.close()
      }
    }
  }

  override render() {
    return html`
      <div class="backdrop" @click=${this.handleBackdropClick} @keydown=${this.handleKeyDown}>
        <div class="palette-dialog" role="dialog" aria-modal="true" aria-label="Command palette">
          <div class="palette-header">
            <span class="palette-search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              class="palette-input"
              placeholder="${this.placeholder}"
              .value=${this.query}
              @input=${this.handleInput}
            />
          </div>
          <div class="palette-body" role="listbox">
            <slot></slot>
          </div>
          <div class="palette-footer">
            <span>Navigation: &uarr; &darr; | Select: Enter | Close: Esc</span>
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `
  }
}
