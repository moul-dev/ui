import { type CSSResultOrNative, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { avatarGroupStyles, avatarStyles } from './Avatar.styles.js'

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

@customElement('moul-avatar')
export class MoulAvatar extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    avatarStyles,
  ]

  @property({ type: String })
  accessor src: string | null = null

  @property({ type: String })
  accessor alt = ''

  @property({ type: String })
  accessor initials = ''

  @property({ type: String, reflect: true })
  accessor size: AvatarSize = 'md'

  @property({ type: Boolean, attribute: 'is-square', reflect: true })
  accessor isSquare = false

  @state()
  private accessor hasError = false

  private handleImageError = () => {
    this.hasError = true
  }

  override render() {
    const showImage = Boolean(this.src && !this.hasError)
    const classes = `avatar avatar-${this.size} ${this.isSquare ? 'avatar-square' : ''}`

    return html`
      <div class="${classes}" role="img" aria-label="${this.alt || this.initials}">
        ${
          showImage
            ? html`<img src="${this.src!}" alt="${this.alt}" @error="${this.handleImageError}" />`
            : this.initials
              ? html`<span>${this.initials}</span>`
              : html`<slot></slot>`
        }
      </div>
    `
  }
}

@customElement('moul-avatar-group')
export class MoulAvatarGroup extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    avatarGroupStyles,
  ]

  override render() {
    return html`<slot></slot>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-avatar': MoulAvatar
    'moul-avatar-group': MoulAvatarGroup
  }
}
