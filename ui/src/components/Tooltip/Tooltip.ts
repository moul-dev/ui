import { html, LitElement, type PropertyValues } from 'lit'
import type { AnimationOptions } from 'motion'
import {
  OverlayPresenceController,
  type OverlaySetOpenOptions,
} from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, SPRING_SNAPPY } from '../../utils/motion'
import { tooltipStyles } from './Tooltip.styles'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'
export type TooltipFollow = 'none' | 'pointer'

let tooltipCount = 0

/**
 * Once the pointer has read one tooltip, its siblings (tooltips sharing a parent, like a
 * toolbar's buttons) open instantly for a moment after it leaves: no delay, no entrance.
 */
const WARM_WINDOW_MS = 300
let warmTooltip: { tooltip: HTMLElement; leftAt: number } | null = null

/** How far, in px, the tip travels out of the trigger edge as it enters. */
const SLIDE_DISTANCE = 6
/** A lighter spring than the slide, so a followed tip trails the pointer a little. */
const FOLLOW_SPRING: AnimationOptions = { stiffness: 260, damping: 24, mass: 1 }
/** Degrees of lean per px/s of travel, and the most a followed tip leans. */
const TILT_PER_SPEED = 0.015
const MAX_TILT = 6

function isWarmFor(tooltip: HTMLElement): boolean {
  if (!warmTooltip?.tooltip.isConnected) return false
  return (
    warmTooltip.tooltip.parentElement === tooltip.parentElement &&
    performance.now() - warmTooltip.leftAt < WARM_WINDOW_MS
  )
}

function isKeyboardFocus(target: EventTarget | null): boolean {
  try {
    return target instanceof Element && target.matches(':focus-visible')
  } catch {
    return false
  }
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const round = (value: number): number => Math.round(value * 100) / 100

interface Spring {
  value: number
  velocity: number
  target: number
}

/** Advances a spring by `dt` seconds; true once it has come to rest on its target. */
function stepSpring(
  spring: Spring,
  dt: number,
  options: AnimationOptions,
): boolean {
  const stiffness = Number(options.stiffness ?? 500)
  const damping = Number(options.damping ?? 35)
  const mass = Number(options.mass ?? 1)
  // Small fixed steps keep a stiff spring stable at 30 fps.
  const steps = Math.max(1, Math.ceil(dt * 240))
  const h = dt / steps
  for (let i = 0; i < steps; i++) {
    const force = stiffness * (spring.target - spring.value)
    spring.velocity += ((force - damping * spring.velocity) / mass) * h
    spring.value += spring.velocity * h
  }
  if (
    Math.abs(spring.target - spring.value) < 0.05 &&
    Math.abs(spring.velocity) < 2
  ) {
    spring.value = spring.target
    spring.velocity = 0
    return true
  }
  return false
}

/**
 * A short label that appears beside its slotted trigger on hover or focus,
 * for naming icon buttons and explaining controls; the text comes from the
 * `content` attribute or a `slot="content"` element. It slides a few pixels
 * out of the trigger edge as it fades in. `follow="pointer"` makes it trail
 * the pointer along the trigger, leaning into the movement, and `is-rich`
 * turns it into a small card with room for a `slot="media"` image above the
 * text. A tooltip is never interactive: put links and buttons in a
 * `<moul-hover-card>` instead.
 *
 * Keyboard and screen readers: the host takes no focus; the slotted trigger
 * keeps its own. Hover opens the tip after `delay` (300ms by default, at once
 * right after a sibling's tip was read) and keyboard or pointer focus opens it
 * at once, centred on the trigger; leaving, blurring or `Escape` closes it,
 * and that `Escape` stops there, so it does not also close a surrounding
 * dialog. The panel has `role="tooltip"`, and each slotted element without
 * its own `aria-describedby` gets one pointing at the panel's id, but that id
 * lives in the shadow root, so the reference does not resolve and screen
 * readers do not read the tip as a description. Following is for mouse and
 * pen pointers only.
 *
 * Reduced motion: the tip appears and disappears at once, in place, instead of
 * sliding out of the trigger edge while fading and growing from 97%; it stays
 * centred instead of following the pointer and does not lean. Keyboard focus
 * and a warm sibling skip the entrance anyway.
 *
 * @slot - The trigger the tip describes.
 * @slot content - Rich tip content, in place of the `content` attribute.
 * @slot media - An image or video shown above the content, mostly with `is-rich`.
 * @csspart trigger - The wrapper around the trigger.
 * @csspart popover - The floating panel (also exposed as `tooltip`).
 * @csspart tooltip - The floating panel (also exposed as `popover`).
 * @fires openchange - When the tip opens or closes; `detail.isOpen` is the new state.
 */
export class MoulTooltip extends LitElement {
  static override styles = tooltipStyles

  static override properties = {
    content: { type: String, reflect: true },
    placement: { type: String, reflect: true },
    delay: { type: Number, reflect: true },
    follow: { type: String, reflect: true },
    isRich: { type: Boolean, reflect: true, attribute: 'is-rich' },
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
  }

  declare content: string
  declare placement: TooltipPlacement
  declare delay: number
  /** `pointer` makes the tip trail the pointer along the trigger; `none` (default) keeps it centred. */
  declare follow: TooltipFollow
  /** Presents the tip as a small card: more padding, a surface radius and room for `slot="media"`. */
  declare isRich: boolean
  declare isOpen: boolean

  public overlayPresence: OverlayPresenceController
  private tooltipId: string
  private hoverTimer: ReturnType<typeof setTimeout> | null = null
  /** Distance from the trigger edge, in px; springs to 0 on entry. */
  private readonly slide: Spring = { value: 0, velocity: 0, target: 0 }
  /** Offset from the trigger's centre along its edge, in px, while following. */
  private readonly track: Spring = { value: 0, velocity: 0, target: 0 }
  private frame = 0
  private lastFrameAt: number | null = null

  constructor() {
    super()
    this.content = ''
    this.placement = 'top'
    this.delay = 300
    this.follow = 'none'
    this.isRich = false
    this.isOpen = false
    this.tooltipId = `moul-tooltip-${++tooltipCount}`

    this.overlayPresence = new OverlayPresenceController(this, {
      preset: 'tooltip',
      popover: () => this.popoverEl,
      // Animate the floating panel, not the host, which also holds the trigger.
      target: () => this.popoverEl,
    })
  }

  public get popoverEl(): HTMLElement | null {
    return (
      this.shadowRoot?.querySelector<HTMLElement>('[role="tooltip"]') ?? null
    )
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('pointerenter', this.handlePointerEnter)
    this.addEventListener('pointermove', this.handlePointerMove)
    this.addEventListener('pointerleave', this.handlePointerLeave)
    this.addEventListener('focusin', this.handleFocusIn)
    this.addEventListener('focusout', this.handleFocusOut)
    this.addEventListener('keydown', this.handleKeyDown)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.clearHoverTimer()
    this.stopMotion()
    this.removeEventListener('pointerenter', this.handlePointerEnter)
    this.removeEventListener('pointermove', this.handlePointerMove)
    this.removeEventListener('pointerleave', this.handlePointerLeave)
    this.removeEventListener('focusin', this.handleFocusIn)
    this.removeEventListener('focusout', this.handleFocusOut)
    this.removeEventListener('keydown', this.handleKeyDown)
  }

  protected override firstUpdated(): void {
    this.syncAriaDescribedBy()
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('follow') && this.follow !== 'pointer') {
      this.centre()
    }

    if (changedProps.has('isOpen')) {
      if (this.isOpen !== this.overlayPresence.isOpen) {
        void this.present(this.isOpen, false)
      }
    }
  }

  private syncAriaDescribedBy(): void {
    const triggerSlot =
      this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])')
    const assigned = triggerSlot?.assignedElements({ flatten: true }) ?? []
    for (const el of assigned) {
      if (!el.hasAttribute('aria-describedby')) {
        el.setAttribute('aria-describedby', this.tooltipId)
      }
    }
  }

  private clearHoverTimer(): void {
    if (this.hoverTimer !== null) {
      clearTimeout(this.hoverTimer)
      this.hoverTimer = null
    }
  }

  public async setOpen(
    nextOpen: boolean,
    options: OverlaySetOpenOptions = {},
  ): Promise<void> {
    this.clearHoverTimer()
    if (this.isOpen === nextOpen && this.overlayPresence.isOpen === nextOpen)
      return

    this.isOpen = nextOpen
    await this.present(nextOpen, options.instant ?? false)
    this.dispatchEvent(
      new CustomEvent('openchange', {
        bubbles: true,
        composed: true,
        detail: { isOpen: this.isOpen },
      }),
    )
  }

  /**
   * Shows or hides the panel. The overlay controller fades and grows it; the
   * slide out of the trigger edge runs beside that on the `translate`
   * property, so the two never fight over one value.
   */
  private async present(open: boolean, instant: boolean): Promise<void> {
    const animated = !instant && !prefersReducedMotion()
    if (open) {
      // A tip still on screen (closing) turns back from where it is.
      if (!animated) this.slide.value = 0
      else if (!this.overlayPresence.isMounted)
        this.slide.value = SLIDE_DISTANCE
      this.slide.velocity = 0
      this.slide.target = 0
    } else {
      this.slide.target = animated ? SLIDE_DISTANCE : this.slide.value
    }
    this.paint()
    if (animated) this.run()

    await this.overlayPresence.setOpen(open, null, { instant })
    if (!this.isOpen && !this.overlayPresence.isMounted) this.stopMotion()
  }

  private run(): void {
    if (this.frame || typeof requestAnimationFrame !== 'function') return
    this.lastFrameAt = null
    this.frame = requestAnimationFrame(this.tick)
  }

  private readonly tick = (now: number): void => {
    this.frame = 0
    const dt =
      this.lastFrameAt === null
        ? 1 / 60
        : Math.min(0.064, Math.max(0, now - this.lastFrameAt) / 1000)
    this.lastFrameAt = now
    const slid = stepSpring(this.slide, dt, SPRING_SNAPPY)
    const tracked = stepSpring(this.track, dt, FOLLOW_SPRING)
    this.paint()
    if (!slid || !tracked) this.frame = requestAnimationFrame(this.tick)
  }

  /** Writes the springs to the panel as the variables its `translate` and `rotate` read. */
  private paint(): void {
    const panel = this.popoverEl
    if (!panel) return
    const tilt = clamp(
      this.track.velocity * TILT_PER_SPEED,
      -MAX_TILT,
      MAX_TILT,
    )
    panel.style.setProperty('--_slide', `${round(this.slide.value)}px`)
    panel.style.setProperty('--_follow', `${round(this.track.value)}px`)
    panel.style.setProperty('--_tilt', `${round(tilt)}deg`)
  }

  /** Stops the springs and hands the panel back to its stylesheet. */
  private stopMotion(): void {
    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = 0
    Object.assign(this.slide, { value: 0, velocity: 0, target: 0 })
    this.track.velocity = 0
    this.track.value = this.track.target
    const style = this.popoverEl?.style
    style?.removeProperty('--_slide')
    style?.removeProperty('--_tilt')
    if (this.follow !== 'pointer') style?.removeProperty('--_follow')
  }

  private centre(): void {
    Object.assign(this.track, { value: 0, velocity: 0, target: 0 })
    if (this.overlayPresence.isMounted) this.paint()
  }

  /**
   * Points the tip at the pointer along the trigger edge, clamped to the
   * trigger. A closed tip jumps there, so it opens under the pointer.
   */
  private followPointer(e: PointerEvent): void {
    if (this.follow !== 'pointer' || e.pointerType === 'touch') return
    if (prefersReducedMotion()) return
    const trigger = this.shadowRoot?.querySelector('[part~="trigger"]')
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const isVertical = this.placement === 'left' || this.placement === 'right'
    const half = (isVertical ? rect.height : rect.width) / 2
    if (!(half > 0)) return
    const along = isVertical
      ? e.clientY - (rect.top + half)
      : e.clientX - (rect.left + half)
    this.track.target = clamp(along, -half, half)
    if (!this.overlayPresence.isMounted) {
      this.track.value = this.track.target
      this.track.velocity = 0
      return
    }
    this.run()
  }

  private readonly handlePointerEnter = (e: PointerEvent): void => {
    this.clearHoverTimer()
    this.followPointer(e)
    if (isWarmFor(this)) {
      this.setOpen(true, { instant: true })
    } else if (this.delay <= 0) {
      this.setOpen(true)
    } else {
      this.hoverTimer = setTimeout(() => {
        this.setOpen(true)
      }, this.delay)
    }
  }

  private readonly handlePointerMove = (e: PointerEvent): void => {
    this.followPointer(e)
  }

  private readonly handlePointerLeave = (): void => {
    this.clearHoverTimer()
    // Only a tooltip the pointer actually read warms its neighbors.
    if (this.isOpen) warmTooltip = { tooltip: this, leftAt: performance.now() }
    this.setOpen(false)
  }

  private readonly handleFocusIn = (e: FocusEvent): void => {
    // Immediate display on focus per OV-TLP-02; keyboard focus skips the entrance too
    this.clearHoverTimer()
    const isKeyboard = isKeyboardFocus(e.target)
    // Focus points at no spot on the trigger, so the tip it opens sits centred.
    if (isKeyboard || !this.isOpen) this.centre()
    this.setOpen(true, { instant: isKeyboard })
  }

  private readonly handleFocusOut = (): void => {
    this.clearHoverTimer()
    this.setOpen(false)
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.isOpen) {
      e.stopPropagation()
      this.setOpen(false)
    }
  }

  protected override render() {
    return html`
      <div part="trigger" class="trigger">
        <slot @slotchange=${this.syncAriaDescribedBy}></slot>
      </div>

      <div
        id=${this.tooltipId}
        part="popover tooltip"
        role="tooltip"
        popover="manual"
        class="tooltip"
      >
        <slot name="media"></slot>
        <slot name="content">${this.content}</slot>
      </div>
    `
  }
}

defineElement('moul-tooltip', MoulTooltip)

declare global {
  interface HTMLElementTagNameMap {
    'moul-tooltip': MoulTooltip
  }
}
