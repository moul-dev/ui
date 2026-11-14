import { html, LitElement, type PropertyValues } from 'lit'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { revealStyles } from './Reveal.styles'

/** Where the content comes from: `up` rises into place, `start` slides in from the inline start. */
export type RevealDirection = 'up' | 'down' | 'start' | 'end' | 'none'

const DIRECTIONS: readonly RevealDirection[] = [
  'up',
  'down',
  'start',
  'end',
  'none',
]

/** The reveal waits until the content is this far inside the bottom of the viewport. */
const ROOT_MARGIN = '0px 0px -40px 0px'

/**
 * Content that fades in and sharpens from a soft blur as it scrolls into
 * view, rising or sliding a short way into place. Wrap any block, such as a
 * section heading, a card or a whole feature grid; with `stagger`, each child
 * element reveals in turn instead of the block as one. It plays once, the
 * first time the content enters the viewport, unless `is-repeating` hides it
 * again whenever it leaves. Content already on screen when the page loads
 * reveals straight away. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role; the wrapped
 * content keeps its own semantics and is in the accessibility tree the whole
 * time, hidden or not. Focus moving into hidden content reveals it at once, so
 * a keyboard user never lands on something invisible.
 *
 * Reduced motion: the content is shown from the start, with no fade, blur or
 * movement. It is also shown when printing and where the browser cannot tell
 * whether it is on screen.
 *
 * @slot - The content to reveal.
 *
 * @csspart base - The wrapper that fades, blurs and moves when `stagger` is 0.
 *
 * @cssprop --reveal-easing - The timing function. Defaults to `var(--ease-out)`.
 */
export class MoulReveal extends LitElement {
  static override styles = revealStyles

  static override properties = {
    direction: { type: String, reflect: true },
    distance: { type: Number },
    blurRadius: { type: Number, attribute: 'blur-radius' },
    duration: { type: Number },
    delay: { type: Number },
    stagger: { type: Number, reflect: true },
    isRepeating: { type: Boolean, reflect: true, attribute: 'is-repeating' },
    isRevealed: { type: Boolean, reflect: true, attribute: 'is-revealed' },
  }

  /** Where the content comes from. Defaults to `up`. */
  declare direction: RevealDirection
  /** How far the content travels, in pixels. Defaults to 16. */
  declare distance: number
  /** Blur at the start, in pixels; 0 fades without blurring. Defaults to 8. (Not `blur`, which would hide `HTMLElement.blur()`.) */
  declare blurRadius: number
  /** Milliseconds each piece takes to settle. Defaults to 600. */
  declare duration: number
  /** Milliseconds to wait after entering the viewport. Defaults to 0. */
  declare delay: number
  /** Milliseconds between child elements; 0 reveals the content as one block. Defaults to 0. */
  declare stagger: number
  /** Hide again on leaving the viewport, so it plays on every entry. */
  declare isRepeating: boolean
  /** Whether the content is shown. Set by the element as the content enters (and, with `is-repeating`, leaves) the viewport. */
  declare isRevealed: boolean

  private readonly inView: InViewController

  constructor() {
    super()
    this.direction = 'up'
    this.distance = 16
    this.blurRadius = 8
    this.duration = 600
    this.delay = 0
    this.stagger = 0
    this.isRepeating = false
    this.isRevealed = false
    this.inView = new InViewController(this, {
      rootMargin: ROOT_MARGIN,
      // The transitions here end on their own; pausing them would freeze a half-revealed block.
      pauseOffscreen: false,
      onChange: (isInView) => {
        if (isInView) this.isRevealed = true
        else if (this.isRepeating) this.isRevealed = false
      },
    })
  }

  /**
   * Hides the content and reveals it again, as for a replay button. Resolves
   * once the reveal has started.
   */
  public async play(): Promise<void> {
    // Hide without a transition: a fading hide would only be reversed by the reveal, not replayed.
    this.setAttribute('data-resetting', '')
    this.isRevealed = false
    await this.updateComplete
    // Reading layout makes the browser apply the hidden state, so the reveal transition starts from it.
    void this.getBoundingClientRect()
    this.removeAttribute('data-resetting')
    this.isRevealed = true
    await this.updateComplete
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('direction') && !DIRECTIONS.includes(this.direction)) {
      this.direction = 'up'
    }
    // Turning repeat off after the first entry keeps the content shown.
    if (
      changed.has('isRepeating') &&
      !this.isRepeating &&
      this.inView.hasEntered
    ) {
      this.isRevealed = true
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    const style = this.style
    if (changed.has('distance')) {
      style.setProperty('--_reveal-distance', `${finite(this.distance, 16)}px`)
    }
    if (changed.has('blurRadius')) {
      style.setProperty(
        '--_reveal-blur',
        `${Math.max(0, finite(this.blurRadius, 8))}px`,
      )
    }
    if (changed.has('duration')) {
      style.setProperty(
        '--_reveal-duration',
        `${Math.max(0, finite(this.duration, 600))}ms`,
      )
    }
    if (changed.has('delay')) {
      style.setProperty(
        '--_reveal-delay',
        `${Math.max(0, finite(this.delay, 0))}ms`,
      )
    }
    if (changed.has('stagger')) {
      style.setProperty(
        '--_reveal-stagger',
        `${Math.max(0, finite(this.stagger, 0))}ms`,
      )
    }
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed)
    this.numberChildren()
  }

  /** Numbers each slotted element, so a stagger delays them in order. */
  private numberChildren(): void {
    const slot = this.renderRoot.querySelector('slot')
    slot?.assignedElements().forEach((child, index) => {
      ;(child as HTMLElement).style?.setProperty(
        '--moul-reveal-index',
        String(index),
      )
    })
  }

  protected override render() {
    return html`<div part="base">
      <slot @slotchange=${this.numberChildren}></slot>
    </div>`
  }
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback
}

defineElement('moul-reveal', MoulReveal)

declare global {
  interface HTMLElementTagNameMap {
    'moul-reveal': MoulReveal
  }
}
