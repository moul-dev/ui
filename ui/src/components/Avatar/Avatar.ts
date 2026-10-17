import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { subtleAnimate } from '../../utils/motion'
import { avatarStyles } from './Avatar.styles'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type AvatarShape = 'circle' | 'square'
export type AvatarStatus = 'online' | 'offline' | 'away' | 'busy'

function getInitials(name: string): string {
  const trimmed = name?.trim() ?? ''
  if (!trimmed) return ''
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return (parts[0][0] ?? '').toUpperCase()
  }
  return ((parts[0][0] ?? '') + (parts[1][0] ?? '')).toUpperCase()
}

export class MoulAvatar extends LitElement {
  static override styles = avatarStyles

  static override properties = {
    src: { type: String, reflect: true },
    name: { type: String, reflect: true },
    size: { type: String },
    shape: { type: String, reflect: true },
    status: { type: String, reflect: true },
    hasImageError: { state: true },
  }

  declare src: string
  declare name: string
  declare shape: AvatarShape
  declare status?: AvatarStatus
  declare hasImageError: boolean

  private _size?: AvatarSize

  get size(): AvatarSize {
    return this._size ?? (this.getAttribute('size') as AvatarSize) ?? 'md'
  }

  set size(value: AvatarSize) {
    const oldValue = this.size
    this._size = value
    if (value) {
      if (this.getAttribute('size') !== value) {
        this.setAttribute('size', value)
      }
    } else {
      this.removeAttribute('size')
    }
    this.requestUpdate('size', oldValue)
  }

  constructor() {
    super()
    this.src = ''
    this.name = ''
    this.shape = 'circle'
    this.hasImageError = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'img')
    this.updateAriaLabel()
  }

  protected override willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps)
    if (changedProps.has('src')) {
      this.hasImageError = false
    }
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)
    if (changedProps.has('src')) {
      this.hasImageError = false
    }
    if (changedProps.has('name')) {
      this.updateAriaLabel()
    }
  }

  private updateAriaLabel(): void {
    this.setAttribute('aria-label', this.name?.trim() || 'Avatar')
  }

  private handleImageError = (e: Event): void => {
    this.hasImageError = true
    this.dispatchEvent(
      new CustomEvent('error', {
        bubbles: true,
        composed: true,
        detail: { originalError: e },
      }),
    )
    this.requestUpdate()
  }

  private handleImageLoad = (e: Event): void => {
    const img = e.currentTarget as HTMLElement
    subtleAnimate(img, { opacity: [0, 1] }, { duration: 0.18 })
  }

  protected override render() {
    const shouldShowImage = Boolean(this.src) && !this.hasImageError
    const initials = getInitials(this.name)

    return html`
      ${
        shouldShowImage
          ? html`
            <img
              part="image"
              src=${this.src}
              alt=${this.name || 'Avatar'}
              @error=${this.handleImageError}
              @load=${this.handleImageLoad}
            />
          `
          : initials
            ? html`<span part="initials">${initials}</span>`
            : html`
              <slot name="fallback">
                <span part="fallback">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </span>
              </slot>
            `
      }
      ${
        this.status
          ? html`
            <span
              part="status"
              class="status-dot status-${this.status}"
              aria-label="Status: ${this.status}"
            ></span>
          `
          : ''
      }
    `
  }
}

defineElement('moul-avatar', MoulAvatar)

declare global {
  interface HTMLElementTagNameMap {
    'moul-avatar': MoulAvatar
  }
}
