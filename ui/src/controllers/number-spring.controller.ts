import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { type AnimationPlaybackControls, animate } from 'motion'
import { prefersReducedMotion } from '../utils/motion'

export const MIN_NUMBER_VALUE = -999_999_999
export const MAX_NUMBER_VALUE = 999_999_999

export function clampValue(val: number): number {
  if (!Number.isFinite(val)) return 0
  if (val < MIN_NUMBER_VALUE) return MIN_NUMBER_VALUE
  if (val > MAX_NUMBER_VALUE) return MAX_NUMBER_VALUE
  return val
}

export interface NumberSpringControllerOptions {
  initialValue?: number
  stiffness?: number // default: 260
  damping?: number // default: 28
  mass?: number // default: 1
  threshold?: number // default: 0.5
  onUpdate?: (value: number) => void
}

export class NumberSpringController implements ReactiveController {
  public targetValue: number = 0
  public displayValue: number = 0

  private host: ReactiveControllerHost & HTMLElement
  private options: NumberSpringControllerOptions
  private controls: AnimationPlaybackControls | null = null

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: NumberSpringControllerOptions = {},
  ) {
    this.host = host
    this.options = options
    this.targetValue = clampValue(options.initialValue ?? 0)
    this.displayValue = this.targetValue
    this.host.addController(this)
  }

  public hostConnected(): void {
    // Idle on connect
  }

  public hostDisconnected(): void {
    this.controls?.stop()
    this.controls = null
  }

  public setTarget(newTarget: number): void {
    const clamped = clampValue(newTarget)
    if (
      clamped === this.targetValue &&
      this.displayValue === this.targetValue
    ) {
      return
    }

    this.targetValue = clamped

    if (prefersReducedMotion()) {
      this.controls?.stop()
      this.controls = null
      this.displayValue = clamped
      this.host.requestUpdate()
      this.options.onUpdate?.(this.displayValue)
      return
    }

    this.controls?.stop()
    this.controls = null

    const threshold = this.options.threshold ?? 0.5
    if (Math.abs(this.displayValue - clamped) <= threshold) {
      this.displayValue = clamped
      this.host.requestUpdate()
      this.options.onUpdate?.(this.displayValue)
      return
    }

    this.controls = animate(this.displayValue, clamped, {
      type: 'spring',
      stiffness: this.options.stiffness ?? 260,
      damping: this.options.damping ?? 28,
      mass: this.options.mass ?? 1,
      onUpdate: (latest: number) => {
        if (Math.abs(latest - this.targetValue) <= threshold) {
          this.displayValue = this.targetValue
          this.controls?.stop()
          this.controls = null
        } else {
          this.displayValue = latest
        }
        this.host.requestUpdate()
        this.options.onUpdate?.(this.displayValue)
      },
    })
  }

  public reset(value: number): void {
    this.controls?.stop()
    this.controls = null
    this.targetValue = clampValue(value)
    this.displayValue = this.targetValue
    this.host.requestUpdate()
    this.options.onUpdate?.(this.displayValue)
  }
}
