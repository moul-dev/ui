import { html, LitElement, type PropertyValues } from 'lit'
import {
  normalizeTone,
  normalizeVariant,
  type SemanticTone,
  type VisualVariant,
} from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { SPRING_SNAPPY, subtleAnimate } from '../../utils/motion'
import { badgeStyles } from './Badge.styles'

export type BadgeSize = 'sm' | 'md' | 'lg'

export class MoulBadge extends LitElement {
  static override styles = badgeStyles

  static override properties = {
    tone: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    isDot: { type: Boolean, reflect: true, attribute: 'is-dot' },
  }

  declare tone: SemanticTone
  declare variant: VisualVariant
  declare size: BadgeSize
  declare isDot: boolean

  constructor() {
    super()
    this.tone = 'primary'
    this.variant = 'flat'
    this.size = 'md'
    this.isDot = false
  }

  protected override willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps)
    if (changedProps.has('tone')) {
      const normalized = normalizeTone(this.tone)
      if (this.tone !== normalized) {
        this.tone = normalized
      }
    }
    if (changedProps.has('variant')) {
      const normalized = normalizeVariant(this.variant)
      if (this.variant !== normalized) {
        this.variant = normalized
      }
    }
  }

  protected override firstUpdated(): void {
    subtleAnimate(this, { scale: [0.9, 1], opacity: [0, 1] }, SPRING_SNAPPY)
  }

  protected override render() {
    return html`
      <span part="base">
        <slot name="prefix" part="prefix"></slot>
        <slot part="content"></slot>
        <slot name="suffix" part="suffix"></slot>
      </span>
    `
  }
}

defineElement('moul-badge', MoulBadge)

declare global {
  interface HTMLElementTagNameMap {
    'moul-badge': MoulBadge
  }
}
