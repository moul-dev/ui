import { html, LitElement } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
  triggerResize,
} from '../test-setup'
import {
  CanvasLoopController,
  type CanvasLoopControllerOptions,
} from './canvas-loop.controller'

let hostCount = 0

class CanvasHost extends LitElement {
  loop!: CanvasLoopController
  get canvas(): HTMLCanvasElement | null {
    return this.renderRoot.querySelector('canvas')
  }
  protected override render() {
    return html`<canvas></canvas>`
  }
}

type Options = Omit<CanvasLoopControllerOptions, 'canvas'>

async function mount(options: Options): Promise<CanvasHost> {
  const tag = `canvas-host-${++hostCount}`
  customElements.define(
    tag,
    class extends CanvasHost {
      constructor() {
        super()
        this.loop = new CanvasLoopController(this, {
          canvas: () => this.canvas,
          ...options,
        })
      }
    },
  )
  const el = document.createElement(tag) as CanvasHost
  document.body.append(el)
  await el.updateComplete
  return el
}

class FakeIntersectionObserver {
  static latest: FakeIntersectionObserver | null = null
  readonly callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    FakeIntersectionObserver.latest = this
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
  report(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
}

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('CanvasLoopController', () => {
  let frames: ManualFrames
  let motion: ReducedMotionMock
  let context: { setTransform: ReturnType<typeof vi.fn> }
  let getContext: ReturnType<typeof vi.fn>

  beforeEach(() => {
    frames = manualAnimationFrames()
    motion = mockReducedMotion(false)
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    context = { setTransform: vi.fn() }
    getContext = vi.fn(() => context)
    ;(HTMLCanvasElement.prototype as any).getContext = getContext
    // A canvas laid out at 200 × 100 CSS pixels.
    HTMLCanvasElement.prototype.getBoundingClientRect = () =>
      ({ width: 200, height: 100, top: 0, left: 0 }) as DOMRect
  })

  afterEach(() => {
    frames.restore()
    motion.restore()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
    setVisibility('visible')
    delete (HTMLCanvasElement.prototype as any).getContext
    delete (HTMLCanvasElement.prototype as any).getBoundingClientRect
    vi.restoreAllMocks()
  })

  it('sizes the backing store to the pixel ratio, capped, and scales the 2D context', async () => {
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(3)
    const resize = vi.fn()
    const el = await mount({ draw: vi.fn(), resize, maxPixelRatio: 2 })
    const canvas = el.canvas!
    expect(getContext).toHaveBeenCalledWith('2d', undefined)
    expect(canvas.width).toBe(400)
    expect(canvas.height).toBe(200)
    expect(context.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0)
    expect(el.loop).toMatchObject({ width: 200, height: 100, pixelRatio: 2 })
    expect(resize).toHaveBeenCalledWith(
      expect.objectContaining({ width: 200, height: 100, pixelRatio: 2 }),
    )
  })

  it('draws every frame with running time and a capped delta', async () => {
    const draw = vi.fn()
    const el = await mount({ draw })
    draw.mockClear()
    expect(el.loop.isRunning).toBe(true)

    frames.step(1000)
    frames.step(1016)
    frames.step(1500)
    const calls = draw.mock.calls.map(([frame]) => ({
      time: frame.time,
      delta: frame.delta,
    }))
    expect(calls).toEqual([
      { time: 0, delta: 0 },
      { time: 16, delta: 16 },
      { time: 116, delta: 100 },
    ])
    expect(draw.mock.calls[0][0]).toMatchObject({
      context,
      width: 200,
      height: 100,
      canvas: el.canvas,
    })
  })

  it('skips frames to hold an fps cap', async () => {
    const draw = vi.fn()
    await mount({ draw, fps: 30 })
    draw.mockClear()
    for (const time of [0, 16, 33, 50, 67]) frames.step(time)
    expect(draw.mock.calls.map(([frame]) => frame.time)).toEqual([0, 33, 67])
  })

  it('pauses while the tab is hidden and resumes without a jump', async () => {
    const draw = vi.fn()
    const el = await mount({ draw })
    frames.step(0)
    frames.step(16)
    setVisibility('hidden')
    expect(el.loop.isRunning).toBe(false)
    expect(frames.pending).toBe(0)

    setVisibility('visible')
    draw.mockClear()
    frames.step(9000)
    frames.step(9016)
    expect(draw.mock.calls.map(([frame]) => frame.time)).toEqual([16, 32])
  })

  it('pauses while the canvas is scrolled off screen', async () => {
    const el = await mount({ draw: vi.fn() })
    FakeIntersectionObserver.latest!.report(false)
    expect(el.loop.isRunning).toBe(false)
    FakeIntersectionObserver.latest!.report(true)
    expect(el.loop.isRunning).toBe(true)
  })

  it('draws one still frame under reduced motion, and animates once it is turned off', async () => {
    motion.set(true)
    const draw = vi.fn()
    const el = await mount({ draw })
    expect(el.loop.isRunning).toBe(false)
    expect(draw).toHaveBeenCalledTimes(1)
    expect(draw.mock.calls[0][0].time).toBe(0)

    motion.set(false)
    expect(el.loop.isRunning).toBe(true)

    frames.step(0)
    frames.step(50)
    draw.mockClear()
    motion.set(true)
    expect(el.loop.isRunning).toBe(false)
    expect(draw).toHaveBeenCalledTimes(1)
    expect(draw.mock.calls[0][0].time).toBe(0)
  })

  it('keeps animating under reduced motion when asked to run', async () => {
    motion.set(true)
    const el = await mount({ draw: vi.fn(), reducedMotion: 'run' })
    expect(el.loop.isRunning).toBe(true)
  })

  it('resizes and repaints when the canvas changes size', async () => {
    const draw = vi.fn()
    const el = await mount({ draw, autoStart: false })
    expect(el.loop.isRunning).toBe(false)
    draw.mockClear()
    triggerResize(el.canvas!, { width: 320, height: 180 })
    expect(el.canvas!.width).toBe(320)
    expect(draw).toHaveBeenCalledTimes(1)
    expect(draw.mock.calls[0][0]).toMatchObject({ width: 320, height: 180 })
  })

  it('starts, stops and draws on demand', async () => {
    const draw = vi.fn()
    const el = await mount({ draw, autoStart: false })
    expect(el.loop.isRunning).toBe(false)
    el.loop.start()
    expect(el.loop.isRunning).toBe(true)
    el.loop.stop()
    expect(el.loop.isRunning).toBe(false)
    draw.mockClear()
    el.loop.drawOnce()
    expect(draw).toHaveBeenCalledTimes(1)
  })

  it('leaves the context to the caller with context none', async () => {
    const draw = vi.fn()
    // `none` changes the context type; the host helper is typed for `2d`.
    await mount({ draw, context: 'none' } as unknown as Options)
    expect(getContext).not.toHaveBeenCalled()
    expect(draw.mock.calls[0][0].context).toBeNull()
  })

  it('stops the loop and its listeners when the host is removed', async () => {
    const el = await mount({ draw: vi.fn() })
    expect(motion.listenerCount()).toBe(1)
    el.remove()
    expect(el.loop.isRunning).toBe(false)
    expect(frames.pending).toBe(0)
    expect(motion.listenerCount()).toBe(0)
    setVisibility('visible')
    expect(frames.pending).toBe(0)
  })
})
