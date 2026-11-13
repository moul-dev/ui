import { html, LitElement, nothing } from 'lit'
import { PressController } from '../../controllers/press.controller'
import { defineElement } from '../../utils/define-element'
import { externalLink } from '../../utils/icons'
import { linkStyles } from './Link.styles'

export type LinkVariant = 'default' | 'subtle' | 'underline'

/**
 * A styled anchor for navigation, in default, subtle and underline variants;
 * `is-external` opens it in a new tab with `rel="noopener noreferrer"` and an
 * icon. Without an `href` it acts as an inline button that fires `press`.
 *
 * Keyboard and screen readers: focus goes to a native `<a>` in the shadow
 * root. With an `href` it is a link and Enter follows it; without one it gets
 * `role="button"` and `tabindex="0"`, and Enter or Space fire `press`.
 * `is-disabled` drops the `href`, sets `tabindex="-1"` and
 * `aria-disabled="true"`. The name is the slotted text, plus hidden text
 * "(opens in new window)" when `is-external`.
 *
 * Reduced motion: nothing moves; the colour, underline, focus-ring and
 * external-icon fades are switched off under reduced motion.
 */
export class MoulLink extends LitElement {
  static override styles = linkStyles

  static override properties = {
    href: { type: String, reflect: true },
    target: { type: String, reflect: true },
    rel: { type: String, reflect: true },
    isExternal: { type: Boolean, reflect: true, attribute: 'is-external' },
    variant: { type: String, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
  }

  declare href: string
  declare target: string
  declare rel: string
  declare isExternal: boolean
  declare variant: LinkVariant
  declare isDisabled: boolean

  public pressController: PressController

  constructor() {
    super()
    this.href = ''
    this.target = ''
    this.rel = ''
    this.isExternal = false
    this.variant = 'default'
    this.isDisabled = false

    this.pressController = new PressController(this, {
      disabled: () => this.isDisabled,
    })
  }

  private getEffectiveRel(): string {
    const parts = new Set(this.rel ? this.rel.split(/\s+/).filter(Boolean) : [])
    if (this.isExternal) {
      parts.add('noopener')
      parts.add('noreferrer')
    }
    return Array.from(parts).join(' ')
  }

  private handleClick(e: MouseEvent): void {
    if (this.isDisabled) {
      e.preventDefault()
      e.stopPropagation()
      return
    }

    this.dispatchEvent(
      new CustomEvent('press', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      }),
    )
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.isDisabled) return

    if (!this.href && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      this.dispatchEvent(
        new CustomEvent('press', {
          bubbles: true,
          composed: true,
          detail: { originalEvent: e },
        }),
      )
    }
  }

  protected override render() {
    const effectiveRel = this.getEffectiveRel()
    const target = this.target || (this.isExternal ? '_blank' : '')

    return html`
      <a
        part="base"
        href=${this.isDisabled ? nothing : this.href || nothing}
        target=${target || nothing}
        rel=${effectiveRel || nothing}
        role=${!this.href ? 'button' : nothing}
        tabindex=${this.isDisabled ? '-1' : '0'}
        aria-disabled=${this.isDisabled ? 'true' : nothing}
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
      >
        <slot></slot>
        ${
          this.isExternal
            ? html`
              <span part="external-icon">${externalLink()}</span>
              <span class="sr-only">(opens in new window)</span>
            `
            : ''
        }
      </a>
    `
  }
}

defineElement('moul-link', MoulLink)

declare global {
  interface HTMLElementTagNameMap {
    'moul-link': MoulLink
  }
}
