import type { ReactiveController, ReactiveControllerHost } from 'lit'
import {
  type AnimationOptions,
  type AnimationPlaybackControls,
  animate,
  type DOMKeyframesDefinition,
} from 'motion'
import { safeShowModal } from '../utils/focus-trap'
import {
  EASE_OUT,
  IOS_SHEET_CURVE,
  type Pose,
  poseTransform,
  prefersReducedMotion,
  REST_POSE,
  readPose,
  SPRING_GENTLE,
  SPRING_SNAPPY,
} from '../utils/motion'

export type OverlayPreset =
  | 'modal'
  | 'popover'
  | 'tooltip'
  | 'drawer-left'
  | 'drawer-right'
  | 'drawer-top'
  | 'drawer-bottom'
  | 'toast'
  | 'toast-top'

export interface OverlayPresenceControllerOptions {
  preset?: OverlayPreset
  target?: () => HTMLElement | null
  /**
   * The `<dialog>` this overlay promotes to the top layer. Dialog overlays animate their
   * panel and backdrop in CSS (keyed to `[is-open]` and `dialog[open]`), so the controller
   * runs no JS motion for them: it opens at once and, on close, waits for those CSS exit
   * animations to finish before closing the dialog.
   */
  dialog?: () => HTMLDialogElement | null
  popover?: () => HTMLElement | null
  /**
   * Element the popover should hang from. Top-layer popovers are positioned against
   * the viewport, so `top: 100%` style CSS can't reach the trigger; when set, the
   * controller pins the popover below (or above, if there's no room) this anchor,
   * matches its width, and follows scroll/resize while open.
   */
  anchor?: () => HTMLElement | null
  /**
   * Called when the browser closes a `popover="auto"` element on its own
   * (outside click, Escape) so the host can sync its `isOpen` state.
   */
  onLightDismiss?: () => void
  onOpenChange?: (open: boolean) => void
}

const ANCHOR_GAP = 6
const VIEWPORT_MARGIN = 8
/** Upper bound on waiting for a dialog's CSS exit, in case an animation never settles. */
const CSS_EXIT_TIMEOUT = 600

/** Where a JS-animated overlay rests while hidden; the open pose is always `REST_POSE`. */
const HIDDEN_POSES: Partial<Record<OverlayPreset, Pose>> = {
  modal: { opacity: 0, y: 8, scale: 0.95 },
  // Trigger-anchored panels only scale and fade: `transform-origin` already points
  // at the trigger, and a fixed y-nudge would push the wrong way once they flip.
  popover: { opacity: 0, y: 0, scale: 0.96 },
  tooltip: { opacity: 0, y: 0, scale: 0.97 },
  toast: { opacity: 0, y: 24, scale: 0.95 },
  'toast-top': { opacity: 0, y: -24, scale: 0.95 },
}

/** Toasts shrink and blur away in place; the stack then closes ranks around them. */
const TOAST_EXIT_POSE: Pose = { opacity: 0, y: 0, scale: 0.95 }

/** Off-screen and resting transforms for drawers, which slide by their own size. */
const DRAWER_TRANSFORMS: Partial<
  Record<OverlayPreset, [hidden: string, shown: string]>
> = {
  'drawer-left': ['translateX(-100%)', 'translateX(0%)'],
  'drawer-right': ['translateX(100%)', 'translateX(0%)'],
  'drawer-top': ['translateY(-100%)', 'translateY(0%)'],
  'drawer-bottom': ['translateY(100%)', 'translateY(0%)'],
}

export interface OverlaySetOpenOptions {
  /** Skip the enter/exit motion, e.g. for a tooltip shown while its neighbor is still warm. */
  instant?: boolean
}

export class OverlayPresenceController implements ReactiveController {
  public isOpen: boolean = false
  public isMounted: boolean = false

  private host: ReactiveControllerHost & HTMLElement
  private options: OverlayPresenceControllerOptions

  /** Swap the motion preset, e.g. when a toast learns which edge its region docks to. */
  public set preset(next: OverlayPreset) {
    this.options.preset = next
  }
  private activeAnimation: AnimationPlaybackControls | null = null
  private cancelActiveAnimation: (() => void) | null = null
  private currentTransitionId: number = 0
  private anchorFrame = 0
  private watchedPopover: HTMLElement | null = null
  private lastLightDismissAt = -Infinity

  private readonly handleNativeToggle = (event: Event): void => {
    const { newState } = event as Event & { newState?: string }
    if (newState === 'closed' && this.isOpen) {
      this.lastLightDismissAt = performance.now()
      this.options.onLightDismiss?.()
    }
  }

  /**
   * True right after a light dismiss. The pointerdown that dismisses a popover is
   * usually followed by a click on its own trigger; hosts check this to avoid
   * immediately reopening what the user just closed.
   */
  public get wasJustDismissed(): boolean {
    return performance.now() - this.lastLightDismissAt < 350
  }

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: OverlayPresenceControllerOptions = {},
  ) {
    this.host = host
    this.options = options
    this.host.addController(this)
  }

  public hostConnected(): void {
    // Idle on connect
  }

  public hostDisconnected(): void {
    this.stopAnchoring()
    this.stopActiveAnimation()
    this.currentTransitionId++
  }

  public async setOpen(
    nextOpen: boolean,
    targetElement?: Element | null,
    { instant = false }: OverlaySetOpenOptions = {},
  ): Promise<void> {
    if (nextOpen === this.isOpen && this.isMounted === nextOpen) return

    const transitionId = ++this.currentTransitionId
    const preset = this.options.preset ?? 'modal'
    const skipMotion = instant || prefersReducedMotion()
    // Reversing mid-flight starts from where the panel is now, not from its first keyframe.
    const interruptedPose = this.activeAnimation
      ? this.readTargetPose(targetElement)
      : null

    if (nextOpen) {
      this.isOpen = true
      this.isMounted = true
      this.stopActiveAnimation()

      this.host.requestUpdate()
      this.options.onOpenChange?.(true)

      // Allow Lit template to render DOM if unmounted
      await this.hostUpdateComplete()

      // A close (or disconnect) arrived while rendering; don't resurrect the overlay.
      if (this.currentTransitionId !== transitionId) return

      // Promote to top layer
      this.promoteTopLayer()
      this.startAnchoring()

      // Dialog panels animate in CSS; focus can move into them right away.
      if (this.isCssDriven()) return

      const target = this.resolveTarget(targetElement)

      if (this.host.isConnected && target) {
        const keyframes = this.getEnterKeyframes(preset, interruptedPose)
        const opts = skipMotion ? { duration: 0 } : this.getEnterOptions(preset)

        await this.runAnimation(target, keyframes, opts)
        // Hand the settled panel back to its stylesheet.
        if (this.currentTransitionId === transitionId && this.isOpen) {
          for (const prop of ['opacity', 'transform', 'filter']) {
            target.style.removeProperty(prop)
          }
        }
      }
    } else {
      this.isOpen = false
      this.host.requestUpdate()
      this.options.onOpenChange?.(false)

      this.stopActiveAnimation()

      if (this.isCssDriven()) {
        if (!skipMotion) await this.waitForCssExit()
      } else {
        const target = this.resolveTarget(targetElement)

        if (this.host.isConnected && target) {
          const keyframes = this.getExitKeyframes(preset, interruptedPose)
          const opts = skipMotion
            ? { duration: 0 }
            : this.getExitOptions(preset)

          await this.runAnimation(target, keyframes, opts)
        }
      }

      // Guard against race conditions: if re-opened while exit animation played, bail out
      if (this.currentTransitionId !== transitionId || this.isOpen) {
        return
      }

      // Top layer cleanup AFTER animation completes
      this.stopAnchoring()
      this.demoteTopLayer()

      this.isMounted = false
      this.host.requestUpdate()
    }
  }

  public async toggle(force?: boolean): Promise<void> {
    const next = typeof force === 'boolean' ? force : !this.isOpen
    await this.setOpen(next)
  }

  /** Dialog overlays own their motion in CSS; see `OverlayPresenceControllerOptions.dialog`. */
  private isCssDriven(): boolean {
    return Boolean(this.options.dialog?.())
  }

  private resolveTarget(targetElement?: Element | null): HTMLElement | null {
    return (targetElement ??
      this.options.target?.() ??
      this.host) as HTMLElement | null
  }

  private readTargetPose(targetElement?: Element | null): Pose | null {
    const target = this.resolveTarget(targetElement)
    return target ? readPose(target) : null
  }

  private async hostUpdateComplete(): Promise<void> {
    const pending = (this.host as { updateComplete?: Promise<boolean> })
      .updateComplete
    if (this.host.isConnected && pending) await pending
  }

  /**
   * Waits for the dialog's CSS exit (panel and `::backdrop`) to play out. Infinite
   * animations inside the panel, like a spinner, are ignored so they can't hold it open.
   */
  private async waitForCssExit(): Promise<void> {
    // Background tabs pause the animation timeline, so there's nothing to wait for.
    if (!this.host.isConnected || document.visibilityState === 'hidden') return
    // Let `[is-open]` drop off the host so the exit keyframes apply.
    await this.hostUpdateComplete()
    const dialog = this.resolveDialog()
    if (!dialog?.open || typeof dialog.getAnimations !== 'function') return

    const exits = dialog
      .getAnimations({ subtree: true })
      .filter((animation) =>
        Number.isFinite(
          Number(animation.effect?.getComputedTiming().endTime ?? Infinity),
        ),
      )
    if (exits.length === 0) return

    let done = (): void => {}
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => done(), CSS_EXIT_TIMEOUT)
      done = () => {
        clearTimeout(timer)
        resolve()
      }
      this.cancelActiveAnimation = done
      Promise.allSettled(exits.map((animation) => animation.finished)).then(
        done,
      )
    })
    if (this.cancelActiveAnimation === done) this.cancelActiveAnimation = null
  }

  private resolveDialog(): HTMLDialogElement | null {
    return (
      this.options.dialog?.() ??
      (this.host.shadowRoot?.querySelector?.(
        'dialog',
      ) as HTMLDialogElement | null) ??
      (this.host.querySelector?.('dialog') as HTMLDialogElement | null)
    )
  }

  private stopActiveAnimation(): void {
    if (this.cancelActiveAnimation) {
      this.cancelActiveAnimation()
      this.cancelActiveAnimation = null
    }
    this.activeAnimation?.stop()
    this.activeAnimation = null
  }

  private async runAnimation(
    target: HTMLElement,
    keyframes: DOMKeyframesDefinition,
    options: AnimationOptions,
  ): Promise<void> {
    this.stopActiveAnimation()
    const controls = animate(target, keyframes, options)
    this.activeAnimation = controls

    await new Promise<void>((resolve) => {
      let settled = false
      const done = () => {
        if (!settled) {
          settled = true
          resolve()
        }
      }
      this.cancelActiveAnimation = done
      controls.then(done, done)
    })

    if (this.activeAnimation === controls) {
      this.activeAnimation = null
      this.cancelActiveAnimation = null
    }
  }

  private readonly reposition = (): void => {
    cancelAnimationFrame(this.anchorFrame)
    this.anchorFrame = requestAnimationFrame(() => this.placeAgainstAnchor())
  }

  private startAnchoring(): void {
    if (!this.options.anchor || typeof window === 'undefined') return
    this.placeAgainstAnchor()
    window.addEventListener('scroll', this.reposition, true)
    window.addEventListener('resize', this.reposition)
  }

  private stopAnchoring(): void {
    if (!this.options.anchor || typeof window === 'undefined') return
    cancelAnimationFrame(this.anchorFrame)
    window.removeEventListener('scroll', this.reposition, true)
    window.removeEventListener('resize', this.reposition)
  }

  private placeAgainstAnchor(): void {
    const anchor = this.options.anchor?.()
    const popover = this.options.popover?.()
    if (!anchor || !popover) return
    const rect = anchor.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return

    const style = popover.style
    style.position = 'fixed'
    style.margin = '0'
    style.right = 'auto'
    style.bottom = 'auto'
    style.minWidth = `${rect.width}px`

    const vw = window.innerWidth
    const vh = window.innerHeight
    const height = popover.offsetHeight
    const width = popover.offsetWidth
    const below = vh - rect.bottom - ANCHOR_GAP - VIEWPORT_MARGIN
    const above = rect.top - ANCHOR_GAP - VIEWPORT_MARGIN
    const flip = height > below && above > below
    const top = flip
      ? Math.max(VIEWPORT_MARGIN, rect.top - ANCHOR_GAP - height)
      : rect.bottom + ANCHOR_GAP
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, rect.left),
      Math.max(VIEWPORT_MARGIN, vw - width - VIEWPORT_MARGIN),
    )
    style.top = `${Math.round(top)}px`
    style.left = `${Math.round(left)}px`
    style.maxHeight = `${Math.max(120, Math.floor(flip ? above : below))}px`
    // Grow out of the anchor edge, under the anchor's center, like a macOS menu.
    const originX = Math.round(rect.left + rect.width / 2 - left)
    style.transformOrigin = `${originX}px ${flip ? '100%' : '0px'}`
    popover.toggleAttribute('data-flipped', flip)
  }

  private promoteTopLayer(): void {
    const dialog =
      this.options.dialog?.() ??
      (this.host.shadowRoot?.querySelector?.(
        'dialog',
      ) as HTMLDialogElement | null) ??
      (this.host.querySelector?.('dialog') as HTMLDialogElement | null)

    if (dialog && !dialog.open) {
      safeShowModal(dialog)
    }

    const popover =
      this.options.popover?.() ??
      (this.host.shadowRoot?.querySelector?.(
        '[popover]',
      ) as HTMLElement | null) ??
      (this.host.querySelector?.('[popover]') as HTMLElement | null)

    if (popover && popover !== this.watchedPopover) {
      this.watchedPopover?.removeEventListener(
        'toggle',
        this.handleNativeToggle,
      )
      popover.addEventListener('toggle', this.handleNativeToggle)
      this.watchedPopover = popover
    }

    if (
      popover &&
      typeof popover.showPopover === 'function' &&
      !popover.matches?.(':popover-open')
    ) {
      try {
        popover.showPopover()
      } catch {
        // Safe fallback in non-popover environments
      }
    }
  }

  private demoteTopLayer(): void {
    const dialog =
      this.options.dialog?.() ??
      (this.host.shadowRoot?.querySelector?.(
        'dialog',
      ) as HTMLDialogElement | null) ??
      (this.host.querySelector?.('dialog') as HTMLDialogElement | null)

    if (dialog?.open) {
      try {
        dialog.close()
      } catch {
        // Safe fallback
      }
    }

    const popover =
      this.options.popover?.() ??
      (this.host.shadowRoot?.querySelector?.(
        '[popover]',
      ) as HTMLElement | null) ??
      (this.host.querySelector?.('[popover]') as HTMLElement | null)

    if (
      popover &&
      typeof popover.hidePopover === 'function' &&
      popover.matches?.(':popover-open')
    ) {
      try {
        popover.hidePopover()
      } catch {
        // Safe fallback
      }
    }
  }

  private getEnterKeyframes(
    preset: OverlayPreset,
    from: Pose | null,
  ): DOMKeyframesDefinition {
    const drawer = DRAWER_TRANSFORMS[preset]
    if (drawer) return { transform: drawer }
    const start = from ?? HIDDEN_POSES[preset] ?? (HIDDEN_POSES.modal as Pose)
    return {
      opacity: [start.opacity, 1],
      transform: [poseTransform(start), poseTransform(REST_POSE)],
    }
  }

  private getEnterOptions(preset: OverlayPreset): AnimationOptions {
    switch (preset) {
      case 'modal':
      case 'toast':
      case 'toast-top':
        return SPRING_GENTLE
      case 'popover':
      case 'tooltip':
        return SPRING_SNAPPY
      case 'drawer-left':
      case 'drawer-right':
      case 'drawer-top':
      case 'drawer-bottom':
        return { duration: 0.28, ease: IOS_SHEET_CURVE }
      default:
        return SPRING_GENTLE
    }
  }

  private getExitKeyframes(
    preset: OverlayPreset,
    from: Pose | null,
  ): DOMKeyframesDefinition {
    const drawer = DRAWER_TRANSFORMS[preset]
    if (drawer) return { transform: [drawer[1], drawer[0]] }
    const start = from ?? REST_POSE
    const isToast = preset === 'toast' || preset === 'toast-top'
    const end = isToast
      ? TOAST_EXIT_POSE
      : (HIDDEN_POSES[preset] ?? (HIDDEN_POSES.modal as Pose))
    const keyframes: DOMKeyframesDefinition = {
      opacity: [start.opacity, 0],
      transform: [poseTransform(start), poseTransform(end)],
    }
    if (isToast) keyframes.filter = ['blur(0px)', 'blur(4px)']
    return keyframes
  }

  private getExitOptions(preset: OverlayPreset): AnimationOptions {
    switch (preset) {
      case 'modal':
        return { duration: 0.15, ease: EASE_OUT }
      case 'popover':
        return { duration: 0.12, ease: EASE_OUT }
      case 'tooltip':
        return { duration: 0.1, ease: EASE_OUT }
      case 'drawer-left':
      case 'drawer-right':
      case 'drawer-top':
      case 'drawer-bottom':
        return { duration: 0.22, ease: IOS_SHEET_CURVE }
      case 'toast':
      case 'toast-top':
        return { duration: 0.2, ease: EASE_OUT }
      default:
        return { duration: 0.15, ease: EASE_OUT }
    }
  }
}
