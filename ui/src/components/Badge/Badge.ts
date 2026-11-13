import { html, LitElement, nothing, type PropertyValues } from 'lit'
import {
  normalizeTone,
  normalizeVariant,
  type SemanticTone,
  type VisualVariant,
} from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import '../NumberTicker/NumberTicker'
import { badgeStyles } from './Badge.styles'

export type BadgeSize = 'sm' | 'md' | 'lg'

/**
 * A compact chip that labels a status, count or category, coloured by `tone`
 * and `variant`, with optional `prefix` and `suffix` content. Set `count` for
 * a number that rolls to each new value (`99+` past `max`), `is-dot` for a
 * small coloured dot with no text, and `is-live` for a pulsing live dot.
 *
 * Keyboard and screen readers: not focusable and has no role; its text is read
 * inline with the surrounding content. A count is read as its final value,
 * never the digits in between, followed by "+" past `max`; it is not
 * announced when it changes. A dot badge hides its slotted text, so it shows
 * status by colour alone, and the live dot and its pulse are hidden from
 * screen readers: say the status in nearby text as well.
 *
 * Reduced motion: a count jumps to its new value instead of rolling, and the
 * live dot stays lit without pulsing.
 *
 * @slot - The label. Not shown while `count` is set or on a dot badge.
 * @slot prefix - Content before the label, such as an icon.
 * @slot suffix - Content after the label.
 * @csspart base - The wrapper around the content.
 * @csspart prefix - The prefix slot.
 * @csspart content - The label slot, or the count.
 * @csspart suffix - The suffix slot.
 * @csspart count - The `<moul-number-ticker>` that shows `count`.
 * @csspart live-dot - The pulsing dot of a live text badge.
 * @csspart pulse - The ring that pulses out of a live dot badge.
 */
export class MoulBadge extends LitElement {
  static override styles = badgeStyles

  static override properties = {
    tone: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    isDot: { type: Boolean, reflect: true, attribute: 'is-dot' },
    count: { type: Number, reflect: true },
    max: { type: Number, reflect: true },
    isLive: { type: Boolean, reflect: true, attribute: 'is-live' },
  }

  declare tone: SemanticTone
  declare variant: VisualVariant
  declare size: BadgeSize
  declare isDot: boolean
  /** A number shown in place of the label, rolling to each new value. Unset to show the label. */
  declare count: number | undefined
  /** The largest count shown in full; above it the badge reads `99+`. Defaults to 99. */
  declare max: number
  /** Adds a pulsing live dot: a ring around a dot badge, a leading dot on a text badge. */
  declare isLive: boolean

  constructor() {
    super()
    this.tone = 'primary'
    this.variant = 'flat'
    this.size = 'md'
    this.isDot = false
    this.count = undefined
    this.max = 99
    this.isLive = false
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

  protected override render() {
    const count = Number(this.count)
    const hasCount = this.count != null && Number.isFinite(count)
    const max = Number.isFinite(this.max) && this.max > 0 ? this.max : 99
    const isOver = hasCount && count > max
    return html`
      ${
        this.isLive && this.isDot
          ? html`<span part="pulse" class="pulse" aria-hidden="true"></span>`
          : nothing
      }
      <span part="base">
        ${
          this.isLive && !this.isDot
            ? html`<span part="live-dot" class="live-dot" aria-hidden="true"></span>`
            : nothing
        }
        <slot name="prefix" part="prefix"></slot>
        ${
          hasCount
            ? html`<span part="content" class="count"
                ><moul-number-ticker
                  part="count"
                  .value=${isOver ? max : count}
                ></moul-number-ticker
                >${isOver ? '+' : nothing}</span
              >`
            : html`<slot part="content"></slot>`
        }
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
