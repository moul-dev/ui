import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { compareStyles } from './Compare.styles'

/** `horizontal`: the divider moves along the inline axis. `vertical`: it moves up and down. */
export type CompareOrientation = 'horizontal' | 'vertical'

/** `drag`: the divider moves when pressed and dragged. `hover`: it also follows a hovering mouse. */
export type CompareMode = 'drag' | 'hover'

export interface CompareChangeDetail {
  /** Where the divider is, 0 to 100, from the inline start (or the top when vertical). */
  position: number
}

const ORIENTATIONS: readonly CompareOrientation[] = ['horizontal', 'vertical']
const MODES: readonly CompareMode[] = ['drag', 'hover']
const DEFAULT_POSITION = 50
/** Pixels a touch must travel along the axis before it moves the divider rather than scrolls. */
const TOUCH_THRESHOLD = 6
const KEY_STEP = 1
const PAGE_STEP = 10

function clampPosition(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_POSITION
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10
}

/**
 * Two images stacked in one frame with a divider between them, so a reader
 * drags the divider to compare a before and an after: a photo edit, a
 * redesign, a sketch and its finished art. Put the images in
 * `slot="before"` and `slot="after"`; the before image sets the frame's
 * size unless `--compare-aspect-ratio` does. The before side is on the
 * inline start (the top when `orientation="vertical"`), and `position` is
 * where the divider sits, 0 to 100, 50 by default. Pressing anywhere on the
 * frame moves the divider there and keeps following the pointer while it is
 * held; `mode="hover"` also lets a mouse move it just by hovering. Optional
 * `before-label` and `after-label` chips name each side. It lives in the
 * effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: the divider's handle is the one tab stop, a
 * `role="slider"` from 0 to 100 named by `label`, with `aria-orientation`
 * and an `aria-valuetext` that says how much of each side shows, such as
 * "60% Before, 40% After". Left and Right move a horizontal divider one
 * step their way on screen, in either text direction, and Up and Down move
 * a vertical one; the other pair adds or takes away a step. Shift with an
 * arrow, and Page Up or Page Down, move ten; Home goes to 0 and End to 100.
 * The images keep their own
 * `alt` text and are read before the slider. A touch that sets off across
 * the divider's axis scrolls the page instead of moving it.
 *
 * Reduced motion: a click, a tap or a key moves the divider at once instead
 * of gliding there. A drag follows the pointer either way.
 *
 * @slot before - The image (or any element) on the start side, which also sets the frame's size.
 * @slot after - The image on the end side, cropped to fill the frame.
 *
 * @fires input - While the divider moves, by pointer or key. `detail.position` is its new place, 0 to 100.
 * @fires change - When a move ends: a drag lets go, a key is pressed, a hover leaves. `detail.position` as above.
 *
 * @csspart base - The frame that holds both layers.
 * @csspart before - The layer behind, holding the before slot and its label.
 * @csspart after - The layer in front, clipped to the end side of the divider.
 * @csspart divider - The line along the divider.
 * @csspart handle - The round grip on the divider, the `role="slider"` element.
 * @csspart before-label - The chip naming the before side.
 * @csspart after-label - The chip naming the after side.
 *
 * @cssprop --compare-aspect-ratio - The frame's aspect ratio, such as `16 / 9`. Defaults to `auto`: the before image sets the size.
 * @cssprop --compare-radius - The frame's corner radius. Defaults to `var(--radius-2xl)`.
 * @cssprop --compare-divider-color - The divider and the handle's fill. Defaults to `var(--color-white)`.
 * @cssprop --compare-divider-width - The thickness of the divider line. Defaults to `2px`.
 * @cssprop --compare-handle-size - The diameter of the handle. Defaults to `2.5rem`.
 */
export class MoulCompare extends LitElement {
  static override styles = compareStyles

  static override properties = {
    position: { type: Number },
    orientation: { type: String, reflect: true },
    mode: { type: String, reflect: true },
    label: { type: String },
    beforeLabel: { type: String, attribute: 'before-label' },
    afterLabel: { type: String, attribute: 'after-label' },
    isDragging: { state: true },
  }

  /** Where the divider sits, 0 to 100, from the inline start (the top when vertical). Defaults to 50. */
  declare position: number
  /** Which way the divider moves. Defaults to `horizontal`; an unknown value falls back to it. */
  declare orientation: CompareOrientation
  /** `drag` (default) or `hover`; touch always drags. */
  declare mode: CompareMode
  /** The slider's accessible name. Defaults to `Compare images`. */
  declare label: string
  /** Text on the chip over the before side, and its name in the slider's value. Empty hides the chip. */
  declare beforeLabel: string
  /** Text on the chip over the after side, and its name in the slider's value. Empty hides the chip. */
  declare afterLabel: string
  /** Whether a pointer is moving the divider right now; it glides only when this is false. */
  private declare isDragging: boolean

  private pointerId: number | null = null
  private pointerType = ''
  private startX = 0
  private startY = 0
  /** The position when the current press began, to tell whether it changed. */
  private pressStartPosition = DEFAULT_POSITION
  /** Whether a hovering mouse has moved the divider since it entered. */
  private hasHoverMoved = false

  constructor() {
    super()
    this.position = DEFAULT_POSITION
    this.orientation = 'horizontal'
    this.mode = 'drag'
    this.label = 'Compare images'
    this.beforeLabel = ''
    this.afterLabel = ''
    this.isDragging = false
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.endPress()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (
      changed.has('orientation') &&
      !ORIENTATIONS.includes(this.orientation)
    ) {
      this.orientation = 'horizontal'
    }
    if (changed.has('mode') && !MODES.includes(this.mode)) {
      this.mode = 'drag'
    }
    if (changed.has('position')) {
      const clamped = clampPosition(Number(this.position))
      if (clamped !== this.position) this.position = clamped
    }
  }

  private get isVertical(): boolean {
    return this.orientation === 'vertical'
  }

  private get isRtl(): boolean {
    try {
      if (this.matches(':dir(rtl)')) return true
      if (this.matches(':dir(ltr)')) return false
    } catch {
      // `:dir()` is not supported: fall through to the attribute.
    }
    return (this.closest('[dir]') as HTMLElement | null)?.dir === 'rtl'
  }

  private get frameEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector<HTMLElement>('[part="base"]') ?? null
  }

  private get handleEl(): HTMLElement | null {
    return (
      this.shadowRoot?.querySelector<HTMLElement>('[part="handle"]') ?? null
    )
  }

  /** The position under a pointer at (`clientX`, `clientY`), from the frame's box. */
  private positionAt(clientX: number, clientY: number): number {
    const frame = this.frameEl
    if (!frame) return this.position
    const rect = frame.getBoundingClientRect()
    if (this.isVertical) {
      return rect.height > 0
        ? ((clientY - rect.top) / rect.height) * 100
        : this.position
    }
    if (rect.width <= 0) return this.position
    const fromStart = this.isRtl ? rect.right - clientX : clientX - rect.left
    return (fromStart / rect.width) * 100
  }

  /** Moves the divider and fires `input` when it actually moved. */
  private moveTo(next: number): boolean {
    const position = clampPosition(next)
    if (position === this.position) return false
    this.position = position
    this.emit('input')
    return true
  }

  private emit(type: 'input' | 'change'): void {
    this.dispatchEvent(
      new CustomEvent<CompareChangeDetail>(type, {
        detail: { position: this.position },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.pointerId !== null || !event.isPrimary) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    this.pointerId = event.pointerId
    this.pointerType = event.pointerType
    this.startX = event.clientX
    this.startY = event.clientY
    this.pressStartPosition = this.position
    window.addEventListener('pointermove', this.handlePointerMove)
    window.addEventListener('pointerup', this.handlePointerUp)
    window.addEventListener('pointercancel', this.handlePointerUp)

    if (event.pointerType !== 'touch') {
      // A mouse or pen press jumps the divider here at once; it glides,
      // since it is not a drag until the pointer moves. No native image
      // drag or text selection either.
      event.preventDefault()
      this.handleEl?.focus({ preventScroll: true })
      this.moveTo(this.positionAt(event.clientX, event.clientY))
    }
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return
    if (!this.isDragging) {
      const dx = event.clientX - this.startX
      const dy = event.clientY - this.startY
      const along = Math.abs(this.isVertical ? dy : dx)
      const across = Math.abs(this.isVertical ? dx : dy)
      if (this.pointerType === 'touch') {
        if (Math.max(along, across) < TOUCH_THRESHOLD) return
        // The finger set off across the axis: that is a scroll, not a move.
        if (across > along) {
          this.endPress()
          return
        }
      } else if (along === 0 && across === 0) {
        return
      }
      this.isDragging = true
      try {
        this.frameEl?.setPointerCapture?.(event.pointerId)
      } catch {
        // The pointer is already gone; the window listeners see the rest.
      }
    }
    this.moveTo(this.positionAt(event.clientX, event.clientY))
  }

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return
    const wasDragging = this.isDragging
    if (
      !wasDragging &&
      this.pointerType === 'touch' &&
      event.type === 'pointerup'
    ) {
      // A tap moves the divider to where it landed.
      this.moveTo(this.positionAt(event.clientX, event.clientY))
    }
    const changed = this.position !== this.pressStartPosition
    this.endPress()
    if (changed) this.emit('change')
  }

  private readonly handleHoverMove = (event: PointerEvent): void => {
    if (this.mode !== 'hover' || event.pointerType !== 'mouse') return
    if (this.pointerId !== null) return
    if (this.moveTo(this.positionAt(event.clientX, event.clientY))) {
      this.hasHoverMoved = true
    }
  }

  private readonly handleHoverLeave = (): void => {
    if (!this.hasHoverMoved) return
    this.hasHoverMoved = false
    this.emit('change')
  }

  private endPress(): void {
    if (this.pointerId !== null) {
      try {
        this.frameEl?.releasePointerCapture?.(this.pointerId)
      } catch {
        // Capture already ended with the pointer.
      }
    }
    this.pointerId = null
    this.isDragging = false
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this.handlePointerMove)
      window.removeEventListener('pointerup', this.handlePointerUp)
      window.removeEventListener('pointercancel', this.handlePointerUp)
    }
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const step = event.shiftKey ? PAGE_STEP : KEY_STEP
    // Each arrow moves the divider its own way on screen. Horizontal
    // positions run from the inline start, so right-to-left mirrors them;
    // vertical positions run from the top, so Down adds.
    const inlineForward = this.isRtl ? -1 : 1
    const upSign = this.isVertical ? -1 : 1
    let next: number
    switch (event.key) {
      case 'ArrowRight':
        next = this.position + step * (this.isVertical ? 1 : inlineForward)
        break
      case 'ArrowLeft':
        next = this.position - step * (this.isVertical ? 1 : inlineForward)
        break
      case 'ArrowUp':
        next = this.position + step * upSign
        break
      case 'ArrowDown':
        next = this.position - step * upSign
        break
      case 'PageUp':
        next = this.position + PAGE_STEP * upSign
        break
      case 'PageDown':
        next = this.position - PAGE_STEP * upSign
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = 100
        break
      default:
        return
    }
    event.preventDefault()
    if (this.moveTo(next)) this.emit('change')
  }

  private valueText(rounded: number): string {
    const before = this.beforeLabel || 'Before'
    const after = this.afterLabel || 'After'
    return `${rounded}% ${before}, ${100 - rounded}% ${after}`
  }

  protected override render() {
    const rounded = Math.round(this.position)
    return html`
      <div
        part="base"
        class="frame"
        style="--_compare-position: ${this.position}%"
        ?data-dragging=${this.isDragging}
        @pointerdown=${this.handlePointerDown}
        @pointermove=${this.handleHoverMove}
        @pointerleave=${this.handleHoverLeave}
      >
        <div part="before" class="layer before">
          <slot name="before"></slot>
          ${
            this.beforeLabel
              ? html`<span part="before-label" class="chip" aria-hidden="true">${this.beforeLabel}</span>`
              : nothing
          }
        </div>
        <div part="after" class="layer after">
          <slot name="after"></slot>
          ${
            this.afterLabel
              ? html`<span part="after-label" class="chip" aria-hidden="true">${this.afterLabel}</span>`
              : nothing
          }
        </div>
        <div part="divider" class="divider" aria-hidden="true"></div>
        <div
          part="handle"
          class="handle"
          role="slider"
          tabindex="0"
          aria-label=${this.label || 'Compare images'}
          aria-orientation=${this.orientation}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow=${rounded}
          aria-valuetext=${this.valueText(rounded)}
          @keydown=${this.handleKeyDown}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M9 6 3 12l6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>
    `
  }
}

defineElement('moul-compare', MoulCompare)

declare global {
  interface HTMLElementTagNameMap {
    'moul-compare': MoulCompare
  }
}
