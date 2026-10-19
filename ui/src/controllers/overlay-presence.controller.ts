import type { ReactiveController, ReactiveControllerHost } from 'lit'
import {
  type AnimationOptions,
  type AnimationPlaybackControls,
  animate,
  type DOMKeyframesDefinition,
} from 'motion'
import { safeShowModal } from '../utils/focus-trap'
import {
  IOS_SHEET_CURVE,
  prefersReducedMotion,
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
  ): Promise<void> {
    if (nextOpen === this.isOpen && this.isMounted === nextOpen) return

    const transitionId = ++this.currentTransitionId
    const preset = this.options.preset ?? 'modal'

    if (nextOpen) {
      this.isOpen = true
      this.isMounted = true
      this.stopActiveAnimation()

      this.host.requestUpdate()
      this.options.onOpenChange?.(true)

      // Allow Lit template to render DOM if unmounted
      if (
        this.host.isConnected &&
        (this.host as unknown as { updateComplete?: Promise<boolean> })
          .updateComplete
      ) {
        await (this.host as unknown as { updateComplete: Promise<boolean> })
          .updateComplete
      }

      // Promote to top layer
      this.promoteTopLayer()
      this.startAnchoring()

      const target = (targetElement ??
        this.options.target?.() ??
        this.host) as HTMLElement | null

      if (this.host.isConnected && target) {
        const keyframes = this.getEnterKeyframes(preset)
        const opts = prefersReducedMotion()
          ? { duration: 0 }
          : this.getEnterOptions(preset)

        await this.runAnimation(target, keyframes, opts)
      }
    } else {
      this.isOpen = false
      this.host.requestUpdate()
      this.options.onOpenChange?.(false)

      this.stopActiveAnimation()

      const target = (targetElement ??
        this.options.target?.() ??
        this.host) as HTMLElement | null

      if (this.host.isConnected && target) {
        const keyframes = this.getExitKeyframes(preset)
        const opts = prefersReducedMotion()
          ? { duration: 0 }
          : this.getExitOptions(preset)

        await this.runAnimation(target, keyframes, opts)
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
    // Grow out of the anchor edge, like a macOS menu.
    style.transformOrigin = flip ? 'bottom center' : 'top center'
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

  private getEnterKeyframes(preset: OverlayPreset): DOMKeyframesDefinition {
    switch (preset) {
      case 'modal':
        return { opacity: [0, 1], scale: [0.95, 1], y: [8, 0] }
      case 'popover':
        return { opacity: [0, 1], scale: [0.96, 1], y: [-4, 0] }
      case 'tooltip':
        return { opacity: [0, 1], scale: [0.96, 1], y: [-2, 0] }
      case 'drawer-left':
        return { x: ['-100%', '0%'] }
      case 'drawer-right':
        return { x: ['100%', '0%'] }
      case 'drawer-top':
        return { y: ['-100%', '0%'] }
      case 'drawer-bottom':
        return { y: ['100%', '0%'] }
      case 'toast':
        return { opacity: [0, 1], y: [24, 0], scale: [0.92, 1] }
      case 'toast-top':
        return { opacity: [0, 1], y: [-24, 0], scale: [0.92, 1] }
      default:
        return { opacity: [0, 1], scale: [0.95, 1], y: [8, 0] }
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

  private getExitKeyframes(preset: OverlayPreset): DOMKeyframesDefinition {
    switch (preset) {
      case 'modal':
        return { opacity: [1, 0], scale: [1, 0.95], y: [0, 8] }
      case 'popover':
      case 'tooltip':
        return { opacity: [1, 0], scale: [1, 0.96] }
      case 'drawer-left':
        return { x: ['0%', '-100%'] }
      case 'drawer-right':
        return { x: ['0%', '100%'] }
      case 'drawer-top':
        return { y: ['0%', '-100%'] }
      case 'drawer-bottom':
        return { y: ['0%', '100%'] }
      case 'toast':
      case 'toast-top':
        return {
          opacity: [1, 0],
          scale: [1, 0.9],
          filter: ['blur(0px)', 'blur(4px)'],
        }
      default:
        return { opacity: [1, 0], scale: [1, 0.95], y: [0, 8] }
    }
  }

  private getExitOptions(preset: OverlayPreset): AnimationOptions {
    switch (preset) {
      case 'modal':
        return { duration: 0.15 }
      case 'popover':
        return { duration: 0.12 }
      case 'tooltip':
        return { duration: 0.1 }
      case 'drawer-left':
      case 'drawer-right':
      case 'drawer-top':
      case 'drawer-bottom':
        return { duration: 0.22, ease: IOS_SHEET_CURVE }
      case 'toast':
      case 'toast-top':
        return { duration: 0.2 }
      default:
        return { duration: 0.15 }
    }
  }
}
