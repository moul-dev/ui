import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import type { SpotSide } from './spotlight'
import { tourStepStyles } from './Tour.styles'

export type TourPlacement = SpotSide | 'auto'

/**
 * One step of a `<moul-tour>`: a `heading`, a body and the element it points
 * at. `target` is a CSS selector (looked up in the document, or the shadow
 * root the tour lives in) or, set as a property, an element. A step with no
 * target, or one that matches nothing, shows its card in the middle of the
 * screen, which suits an introduction or a closing note.
 *
 * Keyboard and screen readers: not focusable itself and hidden until it is
 * the tour's current step. Its body is then read as the description of the
 * tour's dialog, and any links or controls in it are in the card's Tab order.
 *
 * Reduced motion: does not animate; the tour moves its spotlight and card.
 *
 * @slot - The body of the step.
 */
export class MoulTourStep extends LitElement {
  static override styles = tourStepStyles

  static override properties = {
    target: { attribute: 'target' },
    heading: { type: String, reflect: true },
    placement: { type: String, reflect: true },
    isActive: { type: Boolean, reflect: true, attribute: 'is-active' },
  }

  /** A CSS selector for the element to point at, or (as a property) the element itself. */
  declare target: string | Element | null
  declare heading: string
  /** The side of the target the card prefers; `auto` picks the first side with room. */
  declare placement: TourPlacement
  /** Set by the tour on its current step. */
  declare isActive: boolean

  constructor() {
    super()
    this.target = null
    this.heading = ''
    this.placement = 'auto'
    this.isActive = false
  }

  /** The element this step points at, or null for a centred step. */
  public resolveTarget(): Element | null {
    const { target } = this
    if (!target) return null
    if (typeof target !== 'string') return target.isConnected ? target : null
    const tour = this.closest('moul-tour')
    const root = (tour ?? this).getRootNode() as Document | ShadowRoot
    try {
      return (
        root.querySelector?.(target) ??
        (root === document ? null : document.querySelector(target))
      )
    } catch {
      // Not a valid selector: show the step centred.
      return null
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    // The tour renders the heading and measures the target.
    if (
      changed.has('heading') ||
      changed.has('target') ||
      changed.has('placement')
    ) {
      ;(this.closest('moul-tour') as LitElement | null)?.requestUpdate()
    }
  }

  protected override render() {
    return html`<slot></slot>`
  }
}

defineElement('moul-tour-step', MoulTourStep)

declare global {
  interface HTMLElementTagNameMap {
    'moul-tour-step': MoulTourStep
  }
}
