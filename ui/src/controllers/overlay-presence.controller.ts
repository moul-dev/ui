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

export interface OverlayPresenceControllerOptions {
  preset?: OverlayPreset
  target?: () => HTMLElement | null
  dialog?: () => HTMLDialogElement | null
  popover?: () => HTMLElement | null
  onOpenChange?: (open: boolean) => void
}

export class OverlayPresenceController implements ReactiveController {
  public isOpen: boolean = false
  public isMounted: boolean = false

  private host: ReactiveControllerHost & HTMLElement
  private options: OverlayPresenceControllerOptions
  private activeAnimation: AnimationPlaybackControls | null = null
  private cancelActiveAnimation: (() => void) | null = null
  private currentTransitionId: number = 0

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
        (this.host as unknown as { updateComplete?: Promise<boolean> })
          .updateComplete
      ) {
        await (this.host as unknown as { updateComplete: Promise<boolean> })
          .updateComplete
      }

      // Promote to top layer
      this.promoteTopLayer()

      const target = (targetElement ??
        this.options.target?.() ??
        this.host) as HTMLElement | null

      if (target) {
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

      if (target) {
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
        return { opacity: [0, 1], y: [14, 0], scale: [0.95, 1] }
      default:
        return { opacity: [0, 1], scale: [0.95, 1], y: [8, 0] }
    }
  }

  private getEnterOptions(preset: OverlayPreset): AnimationOptions {
    switch (preset) {
      case 'modal':
      case 'toast':
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
        return { opacity: [1, 0], y: [0, 14], scale: [1, 0.95] }
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
        return { duration: 0.18 }
      default:
        return { duration: 0.15 }
    }
  }
}
