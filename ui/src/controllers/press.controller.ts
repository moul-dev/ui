import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { type AnimationPlaybackControls, animate } from 'motion'
import {
  prefersReducedMotion,
  SPRING_GENTLE,
  SPRING_SNAPPY,
} from '../utils/motion'

export interface PressControllerOptions {
  /**
   * Scale factor on press. If true, defaults to 0.97. If number, uses that scale.
   * If false or undefined, press scaling is disabled.
   */
  scaleOnPress?: boolean | number

  /**
   * Hover lift in pixels (negative y). If true, defaults to -2. If number, uses that value.
   * If false or undefined, hover lift is disabled.
   */
  hoverLift?: boolean | number

  /**
   * Target element to animate. If provided, called to resolve target; if returns null, animation is skipped.
   * Defaults to host element.
   */
  target?: () => HTMLElement | null

  /**
   * Custom disabled predicate. If omitted, checks host `disabled` / `is-disabled` attributes/properties.
   */
  disabled?: () => boolean
}

export class PressController implements ReactiveController {
  public isPressed: boolean = false
  public isHovered: boolean = false
  public isFocusVisible: boolean = false

  private host: ReactiveControllerHost & HTMLElement
  private options: PressControllerOptions
  private shouldSyncAriaPressed: boolean = false
  private isPointerFocus: boolean = false
  private activePressAnimation: AnimationPlaybackControls | null = null
  private activeHoverAnimation: AnimationPlaybackControls | null = null

  private readonly handlePointerDown = (e: PointerEvent): void => {
    this.isPointerFocus = true
    if (this.isDisabled() || e.button !== 0) return
    this.isPressed = true
    this.syncAriaPressed()
    this.animatePress(true)
    this.host.requestUpdate()
  }

  private readonly handlePointerUp = (): void => {
    if (!this.isPressed) return
    this.isPressed = false
    this.syncAriaPressed()
    this.animatePress(false)
    this.host.requestUpdate()
  }

  private readonly handlePointerCancel = (): void => {
    if (!this.isPressed) return
    this.isPressed = false
    this.syncAriaPressed()
    this.animatePress(false)
    this.host.requestUpdate()
  }

  private readonly handlePointerEnter = (): void => {
    if (this.isDisabled()) return
    this.isHovered = true
    this.animateHover(true)
    this.host.requestUpdate()
  }

  private readonly handlePointerLeave = (): void => {
    this.isHovered = false
    if (this.isPressed) {
      this.isPressed = false
      this.syncAriaPressed()
      this.animatePress(false)
    }
    this.animateHover(false)
    this.host.requestUpdate()
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    this.isPointerFocus = false
    if (this.isDisabled() || e.repeat) return
    if (e.key === ' ' || e.key === 'Enter') {
      if (!this.isPressed) {
        this.isPressed = true
        this.isFocusVisible = true
        this.syncAriaPressed()
        this.animatePress(true)
        this.host.requestUpdate()
      }
    }
  }

  private readonly handleKeyUp = (e: KeyboardEvent): void => {
    if (e.key === ' ' || e.key === 'Enter') {
      if (this.isPressed) {
        this.isPressed = false
        this.syncAriaPressed()
        this.animatePress(false)
        this.host.requestUpdate()
      }
    }
  }

  private readonly handleFocusIn = (): void => {
    if (this.isDisabled()) return
    try {
      this.isFocusVisible =
        !this.isPointerFocus || (this.host.matches?.(':focus-visible') ?? false)
    } catch {
      this.isFocusVisible = !this.isPointerFocus
    }
    this.host.requestUpdate()
  }

  private readonly handleFocusOut = (): void => {
    this.isFocusVisible = false
    this.isPointerFocus = false
    if (this.isPressed) {
      this.isPressed = false
      this.syncAriaPressed()
      this.animatePress(false)
    }
    this.host.requestUpdate()
  }

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: PressControllerOptions = {},
  ) {
    this.host = host
    this.options = options
    this.host.addController(this)
  }

  public hostConnected(): void {
    const type = this.host.getAttribute?.('type')
    const hasAriaPressed = this.host.hasAttribute?.('aria-pressed') ?? false
    this.shouldSyncAriaPressed =
      type === 'button' || type === 'checkbox' || hasAriaPressed

    if (this.shouldSyncAriaPressed) {
      this.host.setAttribute('aria-pressed', String(this.isPressed))
    }

    const h = this.host
    h.addEventListener?.('pointerdown', this.handlePointerDown)
    h.addEventListener?.('pointerup', this.handlePointerUp)
    h.addEventListener?.('pointercancel', this.handlePointerCancel)
    h.addEventListener?.('pointerenter', this.handlePointerEnter)
    h.addEventListener?.('pointerleave', this.handlePointerLeave)
    h.addEventListener?.('keydown', this.handleKeyDown)
    h.addEventListener?.('keyup', this.handleKeyUp)
    h.addEventListener?.('focusin', this.handleFocusIn)
    h.addEventListener?.('focusout', this.handleFocusOut)
  }

  public hostDisconnected(): void {
    const h = this.host
    h.removeEventListener?.('pointerdown', this.handlePointerDown)
    h.removeEventListener?.('pointerup', this.handlePointerUp)
    h.removeEventListener?.('pointercancel', this.handlePointerCancel)
    h.removeEventListener?.('pointerenter', this.handlePointerEnter)
    h.removeEventListener?.('pointerleave', this.handlePointerLeave)
    h.removeEventListener?.('keydown', this.handleKeyDown)
    h.removeEventListener?.('keyup', this.handleKeyUp)
    h.removeEventListener?.('focusin', this.handleFocusIn)
    h.removeEventListener?.('focusout', this.handleFocusOut)

    this.activePressAnimation?.stop()
    this.activePressAnimation = null
    this.activeHoverAnimation?.stop()
    this.activeHoverAnimation = null

    this.isPressed = false
    this.isHovered = false
    this.isFocusVisible = false
    this.isPointerFocus = false
  }

  public isDisabled(): boolean {
    if (this.options.disabled?.()) return true
    const h = this.host
    return (
      (h.hasAttribute?.('disabled') ?? false) ||
      (h.hasAttribute?.('is-disabled') ?? false) ||
      Boolean((h as unknown as { disabled?: boolean }).disabled) ||
      Boolean((h as unknown as { isDisabled?: boolean }).isDisabled)
    )
  }

  private syncAriaPressed(): void {
    if (this.shouldSyncAriaPressed) {
      this.host.setAttribute('aria-pressed', String(this.isPressed))
    }
  }

  private getAnimationTarget(): HTMLElement | null {
    if (this.options.target) {
      return this.options.target()
    }
    return this.host
  }

  private animatePress(pressed: boolean): void {
    if (!this.options.scaleOnPress || prefersReducedMotion()) return
    const target = this.getAnimationTarget()
    if (!target) return

    this.activePressAnimation?.stop()
    const targetScale = pressed
      ? typeof this.options.scaleOnPress === 'number'
        ? this.options.scaleOnPress
        : 0.97
      : 1

    this.activePressAnimation = animate(
      target,
      { scale: targetScale },
      SPRING_SNAPPY,
    )
  }

  private animateHover(hovered: boolean): void {
    if (!this.options.hoverLift || prefersReducedMotion()) return
    const target = this.getAnimationTarget()
    if (!target) return

    this.activeHoverAnimation?.stop()
    const targetY = hovered
      ? typeof this.options.hoverLift === 'number'
        ? this.options.hoverLift
        : -2
      : 0

    this.activeHoverAnimation = animate(target, { y: targetY }, SPRING_GENTLE)
  }
}
