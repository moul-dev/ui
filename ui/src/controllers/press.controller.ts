import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { type AnimationPlaybackControls, animate } from 'motion'
import {
  EASE_OUT,
  poseTransform,
  prefersReducedMotion,
  readPose,
} from '../utils/motion'

/** Press-in responds at once; the release eases back a touch slower. */
const PRESS_IN_DURATION = 0.1
const PRESS_OUT_DURATION = 0.16

export interface PressControllerOptions {
  /**
   * Scale factor on press. If true, defaults to 0.97. If number, uses that scale.
   * If false or undefined, press scaling is disabled. Keyboard presses update
   * `isPressed` but don't animate.
   */
  scaleOnPress?: boolean | number

  /**
   * Hover lift in pixels (negative y). If true, defaults to -2. If number, uses that value.
   * If false or undefined, hover lift is disabled. Only a mouse lifts the target: touch
   * fires `pointerenter` on tap, which would leave the element floating.
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
  private activeAnimation: AnimationPlaybackControls | null = null
  private isPointerPress: boolean = false
  private isMouseHover: boolean = false

  private readonly handlePointerDown = (e: PointerEvent): void => {
    this.isPointerFocus = true
    if (this.isDisabled() || e.button !== 0) return
    this.isPressed = true
    this.isPointerPress = true
    this.syncAriaPressed()
    this.animateTransform()
    this.host.requestUpdate()
  }

  private readonly handlePointerUp = (): void => {
    if (!this.isPressed) return
    this.isPressed = false
    this.isPointerPress = false
    this.syncAriaPressed()
    this.animateTransform()
    this.host.requestUpdate()
  }

  private readonly handlePointerCancel = (): void => {
    if (!this.isPressed) return
    this.isPressed = false
    this.isPointerPress = false
    this.syncAriaPressed()
    this.animateTransform()
    this.host.requestUpdate()
  }

  private readonly handlePointerEnter = (e: PointerEvent): void => {
    if (this.isDisabled()) return
    this.isHovered = true
    this.isMouseHover = e.pointerType === 'mouse'
    this.animateTransform()
    this.host.requestUpdate()
  }

  private readonly handlePointerLeave = (): void => {
    this.isHovered = false
    this.isMouseHover = false
    if (this.isPressed) {
      this.isPressed = false
      this.syncAriaPressed()
    }
    this.isPointerPress = false
    this.animateTransform()
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
        this.host.requestUpdate()
      }
    }
  }

  private readonly handleKeyUp = (e: KeyboardEvent): void => {
    if (e.key === ' ' || e.key === 'Enter') {
      if (this.isPressed) {
        this.isPressed = false
        this.syncAriaPressed()
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
    }
    if (this.isPointerPress) {
      this.isPointerPress = false
      this.animateTransform()
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

    this.activeAnimation?.stop()
    this.activeAnimation = null

    this.isPressed = false
    this.isPointerPress = false
    this.isHovered = false
    this.isMouseHover = false
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

  /**
   * Moves the target to the pose its pointer state implies (pressed scale, hover lift)
   * as one compositor-friendly transform, starting from wherever it is mid-flight.
   */
  private animateTransform(): void {
    const { scaleOnPress, hoverLift } = this.options
    if ((!scaleOnPress && !hoverLift) || prefersReducedMotion()) return
    const target = this.getAnimationTarget()
    if (!target) return

    const isPressedIn =
      Boolean(scaleOnPress) && this.isPressed && this.isPointerPress
    const next = {
      opacity: 1,
      scale: isPressedIn
        ? typeof scaleOnPress === 'number'
          ? scaleOnPress
          : 0.97
        : 1,
      y:
        hoverLift && this.isHovered && this.isMouseHover
          ? typeof hoverLift === 'number'
            ? hoverLift
            : -2
          : 0,
    }
    const from = readPose(target)
    if (
      !this.activeAnimation &&
      from.scale === next.scale &&
      from.y === next.y
    ) {
      return
    }

    this.activeAnimation?.stop()
    this.activeAnimation = animate(
      target,
      { transform: [poseTransform(from), poseTransform(next)] },
      {
        duration: isPressedIn ? PRESS_IN_DURATION : PRESS_OUT_DURATION,
        ease: EASE_OUT,
      },
    )
  }
}
