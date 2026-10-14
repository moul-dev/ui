import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { MoulBase } from '../../shared/base.js'
import { buttonStyles } from './Button.styles.js'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark'
  | 'link'
  | 'ghost'
  | 'text'
  | 'outline'
  | 'outline-primary'
  | 'outline-secondary'
  | 'outline-success'
  | 'outline-danger'
  | 'outline-warning'
  | 'outline-info'
  | 'outline-light'
  | 'outline-dark'
  | 'tertiary'
  | 'danger-soft'
  | 'subtle'

export type ButtonSize = 'sm' | 'md' | 'lg'

@customElement('moul-button')
export class MoulButton extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    buttonStyles,
  ]

  @property({ type: String, reflect: true })
  accessor variant: ButtonVariant = 'primary'

  @property({ type: String, reflect: true })
  accessor size: ButtonSize = 'md'

  @property({ type: Boolean, attribute: 'is-pending', reflect: true })
  accessor isPending = false

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  @property({ type: Boolean, attribute: 'is-icon', reflect: true })
  accessor isIcon = false

  @property({ type: String, attribute: 'type' })
  accessor type: 'button' | 'submit' | 'reset' = 'button'

  @property({ type: String, attribute: 'aria-label' })
  accessor ariaLabel: string | null = null

  private handleClick = (event: MouseEvent) => {
    if (this.isDisabled || this.isPending) {
      event.preventDefault()
      event.stopImmediatePropagation()
      return
    }

    const pressEvent = new CustomEvent('moul-press', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { originalEvent: event },
    })
    this.dispatchEvent(pressEvent)
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (this.isDisabled || this.isPending) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const pressEvent = new CustomEvent('moul-press', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { originalEvent: event },
      })
      this.dispatchEvent(pressEvent)
    }
  }

  override render() {
    const v = String(this.variant || 'primary')
    const isOutline = v === 'outline' || v.startsWith('outline-')
    const isGhost = v === 'ghost' || v === 'text'
    const isLink = v === 'link'
    const isSubtle = v === 'subtle' || v === 'danger-soft'
    const isSolid = !isOutline && !isGhost && !isLink && !isSubtle

    let color = 'primary'
    if (v === 'tertiary') {
      color = 'secondary'
    } else if (v === 'danger-soft') {
      color = 'danger'
    } else if (v === 'outline') {
      color = 'primary'
    } else if (v.startsWith('outline-')) {
      color = v.replace('outline-', '')
    } else if (
      v !== 'ghost' &&
      v !== 'text' &&
      v !== 'link' &&
      v !== 'subtle'
    ) {
      color = v
    }

    const themeName = color === 'dark' ? 'inverse' : color
    const themeClass = `theme-${themeName}`

    const classes: Record<string, boolean> = {
      btn: true,
      'btn-solid': isSolid,
      'btn-outline': isOutline,
      'btn-subtle': isSubtle,
      'btn-text': isGhost,
      'btn-ghost': isGhost,
      'btn-link': isLink,
      [themeClass]: true,
      [`btn-${v}`]: true,
      'btn-sm': this.size === 'sm',
      'btn-lg': this.size === 'lg',
      disabled: this.isDisabled || this.isPending,
    }

    return html`
      <button
        type="${this.type}"
        class="${classMap(classes)}"
        ?disabled="${this.isDisabled || this.isPending}"
        aria-disabled="${this.isDisabled || this.isPending ? 'true' : 'false'}"
        aria-busy="${this.isPending ? 'true' : 'false'}"
        aria-label="${this.ariaLabel || ''}"
        @click="${this.handleClick}"
        @keydown="${this.handleKeyDown}"
      >
        ${
          this.isPending
            ? html`<span class="spinner" aria-hidden="true"></span>`
            : html`<slot name="icon-start"></slot>`
        }
        <slot></slot>
        <slot name="icon-end"></slot>
      </button>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-button': MoulButton
  }
}
