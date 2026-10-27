import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import type { AvatarSize, MoulAvatar } from './Avatar'
import { avatarGroupStyles } from './Avatar.styles'

export class MoulAvatarGroup extends LitElement {
  static override styles = avatarGroupStyles

  static override properties = {
    max: { type: Number, reflect: true },
    size: { type: String, reflect: true },
    totalAvatars: { state: true },
  }

  declare max: number
  declare size: AvatarSize
  declare totalAvatars: number

  private groupAssignedAvatars = new WeakSet<MoulAvatar>()

  constructor() {
    super()
    this.max = 5
    this.size = 'md'
    this.totalAvatars = 0
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'group')
    this.setAttribute('aria-label', 'Avatar group')
  }

  protected override firstUpdated(): void {
    this.handleSlotChange()
  }

  private handleSlotChange = (): void => {
    const slot = this.shadowRoot?.querySelector('slot')
    const assigned = (slot?.assignedElements() ?? []).filter(
      (el) => el.tagName.toLowerCase() === 'moul-avatar',
    ) as MoulAvatar[]

    this.totalAvatars = assigned.length

    assigned.forEach((avatar, index) => {
      if (this.size) {
        if (
          !avatar.hasAttribute('size') ||
          this.groupAssignedAvatars.has(avatar)
        ) {
          this.groupAssignedAvatars.add(avatar)
          avatar.size = this.size
        }
      }
      if (index >= this.max) {
        avatar.style.display = 'none'
      } else {
        avatar.style.display = ''
      }
    })
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)
    if (changedProps.has('max') || changedProps.has('size')) {
      this.handleSlotChange()
    }
  }

  protected override render() {
    const overflow = Math.max(0, this.totalAvatars - this.max)

    return html`
      <slot @slotchange=${this.handleSlotChange}></slot>
      ${
        overflow > 0
          ? html`<span class="overflow-badge" part="overflow">+${overflow}</span>`
          : ''
      }
    `
  }
}

defineElement('moul-avatar-group', MoulAvatarGroup)

declare global {
  interface HTMLElementTagNameMap {
    'moul-avatar-group': MoulAvatarGroup
  }
}
