import { html, LitElement, type PropertyValues } from 'lit'
import {
  normalizeTone,
  normalizeVariant,
  type SemanticTone,
  type VisualVariant,
} from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { progressBarStyles } from './ProgressBar.styles'

export type ProgressBarSize = 'sm' | 'md' | 'lg'
export type ProgressBarShape = 'square' | 'rounded' | 'pill'

/**
 * A horizontal track that fills from `min` to `max` to show how far a task has
 * got, or (`is-indeterminate`) a looping bar when the amount is unknown, with
 * an optional label slotted above it.
 *
 * Keyboard and screen readers: not focusable. The host has
 * `role="progressbar"` with `aria-valuemin`, `aria-valuemax` and
 * `aria-valuenow` (the value clamped to the range, removed while
 * indeterminate). Text in the `label` slot does not name it, so give the host
 * an `aria-label` or `aria-labelledby`.
 *
 * Reduced motion: the fill jumps to each new value instead of sliding, and the
 * indeterminate bar stops sweeping across the track; it fills the track and
 * slowly pulses in opacity instead.
 */
export class MoulProgressBar extends LitElement {
  static override styles = progressBarStyles

  static override properties = {
    value: { type: Number, reflect: true },
    min: { type: Number, reflect: true },
    max: { type: Number, reflect: true },
    tone: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    shape: { type: String, reflect: true },
    isIndeterminate: {
      type: Boolean,
      reflect: true,
      attribute: 'is-indeterminate',
    },
  }

  declare value: number
  declare min: number
  declare max: number
  declare tone: SemanticTone
  declare variant: VisualVariant
  declare size: ProgressBarSize
  declare shape: ProgressBarShape
  declare isIndeterminate: boolean

  constructor() {
    super()
    this.value = 0
    this.min = 0
    this.max = 100
    this.tone = 'primary'
    this.variant = 'solid'
    this.size = 'md'
    this.shape = 'pill'
    this.isIndeterminate = false
  }

  public get clampedValue(): number {
    return Math.min(this.max, Math.max(this.min, this.value))
  }

  public get percentage(): number {
    const range = this.max - this.min
    if (range <= 0) return 0
    return Math.min(100, Math.max(0, ((this.value - this.min) / range) * 100))
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'progressbar')
    this.setAttribute('aria-valuemin', String(this.min))
    this.setAttribute('aria-valuemax', String(this.max))
    if (!this.isIndeterminate) {
      this.setAttribute('aria-valuenow', String(this.clampedValue))
    }
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (
      changedProps.has('value') ||
      changedProps.has('min') ||
      changedProps.has('max') ||
      changedProps.has('isIndeterminate')
    ) {
      this.setAttribute('aria-valuemin', String(this.min))
      this.setAttribute('aria-valuemax', String(this.max))
      if (this.isIndeterminate) {
        this.removeAttribute('aria-valuenow')
      } else {
        this.setAttribute('aria-valuenow', String(this.clampedValue))
      }
    }

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
    return html`
      <div part="header">
        <slot name="label"></slot>
      </div>
      <div part="track">
        <div
          part="fill"
          style=${!this.isIndeterminate ? `width: ${this.percentage}%;` : ''}
        ></div>
      </div>
    `
  }
}

defineElement('moul-progress-bar', MoulProgressBar)

declare global {
  interface HTMLElementTagNameMap {
    'moul-progress-bar': MoulProgressBar
  }
}
