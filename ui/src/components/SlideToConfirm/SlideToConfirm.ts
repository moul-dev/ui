import { html, LitElement, type PropertyValues } from 'lit'
import { DragController } from '../../controllers/drag.controller'
import { normalizeTone, type SemanticTone } from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import '../Spinner/Spinner'
import { slideArrow, slideCheck } from './icons'
import { slideToConfirmStyles } from './SlideToConfirm.styles'

/** Share of the track a released handle must pass to confirm. */
const CONFIRM_FRACTION = 0.9
/** A flick this fast (px/s) past the middle confirms too. */
const FLICK_VELOCITY = 800
/** How far one arrow key moves the handle, in percent of the track. */
const KEY_STEP = 25

/**
 * A pill-shaped track with a round handle that must be dragged to the far
 * end to confirm a risky action, such as deleting a project or sending a
 * payment. Let go short of the end and the handle springs back. On
 * confirming, the label changes to `confirmed-label`, `is-confirmed` is set
 * and `confirm` fires; set `is-pending` while the work runs to show a spinner
 * in the handle, and call `reset()` to start over.
 *
 * Keyboard and screen readers: the handle is a `role="slider"` from 0 to 100,
 * named by `label`, and is in the tab order unless `is-disabled`. `Arrow
 * Right` and `Arrow Up` move it a quarter of the way, `Arrow Left` and `Arrow
 * Down` back, `Home` to the start and `End` to the end; reaching the end
 * confirms. `Escape` and moving focus away before confirming send it back to
 * the start. Its `aria-valuetext` is the position in percent, then
 * `confirmed-label` once confirmed, and it is `aria-busy` while pending. The
 * visible label is hidden from screen readers, since the slider carries it.
 *
 * Reduced motion: the handle jumps back or to the end instead of springing,
 * the label fades at once, and the light sweeping across the label stops. A
 * drag still follows the pointer.
 *
 * @fires confirm - When the handle reaches the end by drag or keyboard. `detail` is empty. Setting `isConfirmed` directly does not fire it.
 *
 * @csspart track - The pill the handle travels along.
 * @csspart fill - The tinted trail behind the handle.
 * @csspart label - The centred label.
 * @csspart handle - The draggable handle, the `role="slider"` element.
 *
 * @cssprop --slide-to-confirm-handle-size - Diameter of the handle. Defaults to `2.75rem`; the track is that plus `0.5rem` tall.
 */
export class MoulSlideToConfirm extends LitElement {
  static override styles = slideToConfirmStyles

  static override properties = {
    label: { type: String, reflect: true },
    confirmedLabel: {
      type: String,
      reflect: true,
      attribute: 'confirmed-label',
    },
    tone: { type: String, reflect: true },
    isConfirmed: { type: Boolean, reflect: true, attribute: 'is-confirmed' },
    isPending: { type: Boolean, reflect: true, attribute: 'is-pending' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    percent: { state: true },
  }

  /** The instruction on the track and the slider's accessible name. */
  declare label: string
  /** Shown on the track, and read as the slider's value, once confirmed. */
  declare confirmedLabel: string
  /** `primary` by default; `error` for destructive actions. */
  declare tone: SemanticTone
  declare isConfirmed: boolean
  /** Set by the app while the confirmed work runs; shows a spinner in the handle. */
  declare isPending: boolean
  declare isDisabled: boolean
  /** Where the handle is, or is heading, from 0 to 100. */
  declare percent: number

  private readonly drag: DragController
  private resizeObserver: ResizeObserver | null = null

  constructor() {
    super()
    this.label = 'Slide to confirm'
    this.confirmedLabel = 'Confirmed'
    this.tone = 'primary'
    this.isConfirmed = false
    this.isPending = false
    this.isDisabled = false
    this.percent = 0

    this.drag = new DragController(this, {
      axis: 'x',
      handle: () => this.handleEl,
      styleTarget: () => this.trackEl,
      prefix: '--_drag',
      elastic: 0.15,
      bounds: () => ({ left: 0, right: this.travel() }),
      disabled: () => this.isDisabled || this.isConfirmed || this.isPending,
      onMove: (state) => {
        const travel = this.travel()
        this.setPercent(travel > 0 ? (state.x / travel) * 100 : 0)
      },
      release: (state) => {
        const travel = this.travel()
        const reached =
          travel > 0 &&
          (state.x >= travel * CONFIRM_FRACTION ||
            (state.velocityX > FLICK_VELOCITY && state.x >= travel / 2))
        return { x: reached ? travel : 0, y: 0 }
      },
      onEnd: (_state, target) => {
        const reached = target.x > 0
        this.setPercent(reached ? 100 : 0)
        if (reached) this.confirm()
      },
    })
  }

  private get trackEl(): HTMLElement | null {
    return (
      this.shadowRoot?.querySelector<HTMLElement>('[part~="track"]') ?? null
    )
  }

  private get handleEl(): HTMLElement | null {
    return (
      this.shadowRoot?.querySelector<HTMLElement>('[part~="handle"]') ?? null
    )
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('tone')) {
      const normalized = normalizeTone(this.tone)
      if (this.tone !== normalized) this.tone = normalized
    }
  }

  protected override firstUpdated(): void {
    if (typeof ResizeObserver === 'function' && this.trackEl) {
      // Keep the handle at its share of the track when the track resizes.
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.drag.state.isDragging) this.moveTo(this.percent, false)
      })
      this.resizeObserver.observe(this.trackEl)
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('isConfirmed')) {
      const previous = changed.get('isConfirmed') as boolean | undefined
      if (this.isConfirmed && this.percent !== 100) {
        // Confirmed from outside (an attribute or the property), not by the
        // user; on first render it starts at the end without moving there.
        this.moveTo(100, previous !== undefined)
      } else if (!this.isConfirmed && previous) {
        this.moveTo(0)
      }
    }
  }

  /** Sends the handle back to the start and clears `is-confirmed` and `is-pending`. */
  public reset(): void {
    this.isConfirmed = false
    this.isPending = false
    this.moveTo(0)
  }

  private confirm(): void {
    if (this.isConfirmed) return
    this.isConfirmed = true
    this.dispatchEvent(
      new CustomEvent('confirm', { bubbles: true, composed: true }),
    )
  }

  /** How far the handle can travel, in px. */
  private travel(): number {
    const track = this.trackEl
    const handle = this.handleEl
    if (!track || !handle) return 0
    return Math.max(
      0,
      track.clientWidth - handle.offsetWidth - 2 * handle.offsetLeft,
    )
  }

  private setPercent(percent: number): void {
    this.percent = Math.round(Math.min(100, Math.max(0, percent)))
    this.trackEl?.style.setProperty('--_progress', String(this.percent / 100))
  }

  /** Moves the handle to `percent` of the track, springing unless `animate` is false. */
  private moveTo(percent: number, animate = true): void {
    this.setPercent(percent)
    const point = { x: (this.travel() * this.percent) / 100, y: 0 }
    if (animate) void this.drag.animateTo(point)
    else this.drag.jumpTo(point)
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (this.isDisabled || this.isConfirmed || this.isPending) return
    let next: number
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = this.percent + KEY_STEP
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        next = this.percent - KEY_STEP
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = 100
        break
      case 'Escape':
        if (this.percent === 0) return
        // Handled here, so a surrounding dialog stays open.
        e.stopPropagation()
        next = 0
        break
      default:
        return
    }
    e.preventDefault()
    this.moveTo(next)
    if (this.percent >= 100) this.confirm()
  }

  private readonly handleFocusOut = (): void => {
    if (this.isConfirmed || this.drag.state.isDragging) return
    if (this.percent > 0) this.moveTo(0)
  }

  protected override render() {
    const label = this.isConfirmed ? this.confirmedLabel : this.label
    return html`
      <div
        part="track"
        class="track"
        ?data-dragging=${this.drag.state.isDragging}
      >
        <div part="fill" class="fill"></div>
        <span part="label" class="label" aria-hidden="true">
          <span class="label-text">${label}</span>
        </span>
        <div
          part="handle"
          class="handle"
          role="slider"
          tabindex=${this.isDisabled ? '-1' : '0'}
          aria-label=${this.label}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow=${this.percent}
          aria-valuetext=${
            this.isConfirmed ? this.confirmedLabel : `${this.percent}%`
          }
          aria-disabled=${this.isDisabled ? 'true' : 'false'}
          aria-busy=${this.isPending ? 'true' : 'false'}
          @keydown=${this.handleKeyDown}
          @focusout=${this.handleFocusOut}
        >
          ${
            this.isPending
              ? html`<moul-spinner size="sm" aria-hidden="true"></moul-spinner>`
              : this.isConfirmed
                ? slideCheck()
                : slideArrow()
          }
        </div>
      </div>
    `
  }
}

defineElement('moul-slide-to-confirm', MoulSlideToConfirm)

declare global {
  interface HTMLElementTagNameMap {
    'moul-slide-to-confirm': MoulSlideToConfirm
  }
}
