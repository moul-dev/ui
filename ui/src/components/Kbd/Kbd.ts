import { html, LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { kbdStyles } from './Kbd.styles'

const SYMBOL_MAP: Record<string, string> = {
  '⌘': 'Command',
  '⌥': 'Option',
  '⇧': 'Shift',
  '⌃': 'Control',
  '↵': 'Enter',
  '⎋': 'Escape',
  '⌫': 'Backspace',
}

function getAriaLabelForKey(key: string): string {
  return SYMBOL_MAP[key] ?? key
}

export class MoulKbd extends LitElement {
  static override styles = kbdStyles

  static override properties = {
    keys: { type: String, reflect: true },
  }

  declare keys: string

  constructor() {
    super()
    this.keys = ''
  }

  protected override render() {
    if (!this.keys) {
      return html`<kbd part="key" class="kbd"><slot></slot></kbd>`
    }

    const parts = this.keys
      .split('+')
      .map((k) => k.trim())
      .filter(Boolean)

    if (parts.length === 0) {
      return html`<kbd part="key" class="kbd"><slot></slot></kbd>`
    }

    const accessibleLabel = parts.map(getAriaLabelForKey).join(' plus ')

    return html`
      <span role="group" aria-label=${accessibleLabel}>
        ${parts.map(
          (part, index) => html`
          ${index > 0 ? html`<span class="separator" aria-hidden="true">+</span>` : ''}
          <kbd part="key" class="kbd">${part}</kbd>
        `,
        )}
      </span>
    `
  }
}

defineElement('moul-kbd', MoulKbd)

declare global {
  interface HTMLElementTagNameMap {
    'moul-kbd': MoulKbd
  }
}
