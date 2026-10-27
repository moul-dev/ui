import type { ReactiveController, ReactiveControllerHost } from 'lit'

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface LayoutIndicatorControllerOptions {
  /**
   * If true, calls host.requestUpdate() on every dimension change (width or height),
   * not only when breakpoint changes. Default false.
   */
  observeDimensions?: boolean

  /**
   * Initial breakpoint before first measurement. Defaults to 'md'.
   */
  initialBreakpoint?: Breakpoint
}

export function computeBreakpoint(width: number): Breakpoint {
  if (!Number.isFinite(width) || width < 480) return 'xs'
  if (width < 768) return 'sm'
  if (width < 1024) return 'md'
  if (width < 1280) return 'lg'
  return 'xl'
}

export class LayoutIndicatorController implements ReactiveController {
  public breakpoint: Breakpoint = 'md'
  public width: number = 0
  public height: number = 0

  private host: ReactiveControllerHost & HTMLElement
  private options: LayoutIndicatorControllerOptions
  private observer: ResizeObserver | null = null

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: LayoutIndicatorControllerOptions = {},
  ) {
    this.host = host
    this.options = options
    this.breakpoint = options.initialBreakpoint ?? 'md'
    this.host.addController(this)
  }

  public hostConnected(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (!entry) return
        let w = 0
        let h = 0
        if (entry.contentRect) {
          w = entry.contentRect.width
          h = entry.contentRect.height
        } else if (entry.borderBoxSize?.[0]) {
          w = entry.borderBoxSize[0].inlineSize
          h = entry.borderBoxSize[0].blockSize
        }
        this.updateDimensions(w, h)
      })
      this.observer.observe(this.host)
    }

    const rect = this.host.getBoundingClientRect?.()
    if (rect && (rect.width > 0 || rect.height > 0)) {
      this.updateDimensions(rect.width, rect.height)
    }
  }

  public hostDisconnected(): void {
    this.observer?.disconnect()
    this.observer = null
  }

  private updateDimensions(w: number, h: number): void {
    const nextBp = computeBreakpoint(w)
    const bpChanged = nextBp !== this.breakpoint
    const dimChanged = w !== this.width || h !== this.height

    this.width = w
    this.height = h
    this.breakpoint = nextBp

    if (bpChanged || (this.options.observeDimensions && dimChanged)) {
      this.host.requestUpdate()
    }
  }
}
