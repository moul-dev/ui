import { html, LitElement } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../test-setup'
import { DragController, type DragControllerOptions } from './drag.controller'

let hostCount = 0

class DragHost extends LitElement {
  drag!: DragController
  protected override render() {
    return html`<div part="grip"></div><button part="action">Go</button>`
  }
}

async function mount(
  options:
    | DragControllerOptions
    | ((host: DragHost) => DragControllerOptions) = {},
): Promise<DragHost> {
  const tag = `drag-host-${++hostCount}`
  customElements.define(
    tag,
    class extends DragHost {
      constructor() {
        super()
        this.drag = new DragController(
          this,
          typeof options === 'function' ? options(this) : options,
        )
      }
    },
  )
  const el = document.createElement(tag) as DragHost
  document.body.append(el)
  await el.updateComplete
  return el
}

let clock = 1000

function pointer(
  type: string,
  target: EventTarget,
  clientX: number,
  clientY: number,
  init: PointerEventInit & { timeStamp?: number } = {},
): PointerEvent {
  const { timeStamp, ...rest } = init
  const event = new PointerEvent(type, {
    pointerId: 1,
    isPrimary: true,
    button: 0,
    pointerType: 'mouse',
    clientX,
    clientY,
    bubbles: true,
    composed: true,
    ...rest,
  })
  Object.defineProperty(event, 'timeStamp', { value: timeStamp ?? clock })
  target.dispatchEvent(event)
  return event
}

/** Presses on `target`, moves through `points` 16 ms apart, and optionally releases. */
function drag(
  target: EventTarget,
  points: Array<[number, number]>,
  { release = true }: { release?: boolean } = {},
): void {
  const [startX, startY] = points[0]
  pointer('pointerdown', target, startX, startY)
  for (const [x, y] of points.slice(1)) {
    clock += 16
    pointer('pointermove', window, x, y)
  }
  if (release) {
    const [endX, endY] = points[points.length - 1]
    pointer('pointerup', window, endX, endY)
  }
}

describe('DragController', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('starts a drag past the threshold and writes the offset as CSS variables', async () => {
    const onStart = vi.fn()
    const onMove = vi.fn()
    const el = await mount({ onStart, onMove, release: () => null })

    drag(
      el,
      [
        [0, 0],
        [2, 1],
      ],
      { release: false },
    )
    expect(el.drag.state.isDragging).toBe(false)
    expect(onStart).not.toHaveBeenCalled()

    clock += 16
    pointer('pointermove', window, 30, 12)
    expect(el.drag.state.isDragging).toBe(true)
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(el.style.getPropertyValue('--drag-x')).toBe('30px')
    expect(el.style.getPropertyValue('--drag-y')).toBe('12px')
    expect(onMove).toHaveBeenLastCalledWith(
      expect.objectContaining({ x: 30, y: 12, deltaX: 30, deltaY: 12 }),
    )
    pointer('pointerup', window, 30, 12)
    expect(el.drag.state.isDragging).toBe(false)
  })

  it('asks canStart once per press and leaves a refused press to the browser', async () => {
    const onStart = vi.fn()
    // Only a downward pull starts, as on content scrolled to its top.
    const canStart = vi.fn(
      ({ deltaY }: { deltaX: number; deltaY: number }) => deltaY > 0,
    )
    const el = await mount({
      axis: 'y',
      canStart,
      onStart,
      release: () => null,
    })

    drag(el, [
      [0, 50],
      [0, 48],
      [0, 20],
    ])
    expect(canStart).toHaveBeenCalledTimes(1)
    expect(canStart).toHaveBeenLastCalledWith(
      expect.objectContaining({ deltaX: 0, deltaY: -30 }),
    )
    expect(onStart).not.toHaveBeenCalled()
    expect(el.drag.state.y).toBe(0)

    drag(el, [
      [0, 0],
      [0, 2],
      [0, 10],
      [0, 40],
    ])
    expect(canStart).toHaveBeenCalledTimes(2)
    expect(canStart).toHaveBeenLastCalledWith(
      expect.objectContaining({ deltaY: 10 }),
    )
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(el.drag.state.y).toBe(40)
  })

  it('moves along one axis and leaves a cross-axis gesture to scrolling', async () => {
    const el = await mount({ axis: 'x', release: () => null })
    expect(el.style.touchAction).toBe('pan-y')

    drag(el, [
      [0, 0],
      [1, 20],
      [40, 40],
    ])
    expect(el.drag.state.x).toBe(0)
    expect(el.style.getPropertyValue('--drag-x')).toBe('')

    drag(el, [
      [0, 0],
      [20, 3],
      [60, 30],
    ])
    expect(el.drag.state).toMatchObject({ x: 60, y: 0 })
  })

  it('stretches past its bounds by the elastic factor and settles inside them', async () => {
    motion = mockReducedMotion(true)
    const el = await mount({
      axis: 'x',
      bounds: () => ({ left: 0, right: 100 }),
      release: () => null,
    })
    drag(
      el,
      [
        [0, 0],
        [10, 0],
        [200, 0],
      ],
      { release: false },
    )
    expect(el.drag.state.x).toBeCloseTo(135)
    pointer('pointerup', window, 200, 0)
    expect(el.drag.state.x).toBe(100)

    const stiff = await mount({
      bounds: () => ({ top: -50 }),
      elastic: 0,
      release: () => null,
    })
    drag(
      stiff,
      [
        [0, 0],
        [0, -10],
        [0, -90],
      ],
      { release: false },
    )
    expect(stiff.drag.state.y).toBe(-50)
  })

  it('measures release velocity from the last 100 ms of movement', async () => {
    const onEnd = vi.fn()
    const el = await mount({ axis: 'x', onEnd, release: () => null })
    clock = 1000
    pointer('pointerdown', el, 0, 0)
    for (const x of [10, 20, 40, 60, 80, 100]) {
      clock += 10
      pointer('pointermove', window, x, 0)
    }
    pointer('pointerup', window, 100, 0, { timeStamp: clock })
    const [state] = onEnd.mock.lastCall!
    // 100 px between the press at 1000 ms and the last move at 1060 ms.
    expect(state.velocityX).toBeCloseTo(1666.67, 1)
  })

  it('reads as zero velocity when the pointer is held still before release', async () => {
    const onEnd = vi.fn()
    const el = await mount({ onEnd, release: () => null })
    drag(
      el,
      [
        [0, 0],
        [30, 0],
        [60, 0],
      ],
      { release: false },
    )
    clock += 400
    pointer('pointerup', window, 60, 0, { timeStamp: clock })
    expect(onEnd.mock.lastCall![0].velocityX).toBe(0)
  })

  it('springs back to the origin by default and resolves when it settles', async () => {
    const onSettle = vi.fn()
    const onEnd = vi.fn()
    const el = await mount({ onEnd, onSettle })
    drag(el, [
      [0, 0],
      [20, 0],
      [40, 10],
    ])
    expect(onEnd).toHaveBeenCalledWith(expect.anything(), { x: 0, y: 0 })
    await vi.waitFor(() => expect(onSettle).toHaveBeenCalled(), {
      timeout: 3000,
    })
    expect(el.drag.state).toMatchObject({ x: 0, y: 0 })
    expect(el.style.getPropertyValue('--drag-x')).toBe('0px')
  })

  it('rests where release says, jumping there under reduced motion', async () => {
    motion = mockReducedMotion(true)
    const onSettle = vi.fn()
    const el = await mount({
      axis: 'y',
      release: (state) => ({ x: 0, y: state.y > 50 ? 300 : 0 }),
      onSettle,
    })
    drag(el, [
      [0, 0],
      [0, 10],
      [0, 80],
    ])
    expect(el.drag.state.y).toBe(300)
    expect(el.style.getPropertyValue('--drag-y')).toBe('300px')
    expect(onSettle).toHaveBeenCalledTimes(1)
  })

  it('resolves an interrupted spring when a new animation takes over', async () => {
    const el = await mount()
    const first = el.drag.animateTo({ x: 200, y: 0 })
    el.drag.jumpTo({ x: 5, y: 5 })
    await expect(first).resolves.toBeUndefined()
    expect(el.drag.state).toMatchObject({ x: 5, y: 5 })
  })

  it('swallows the click that ends a drag but not a plain tap', async () => {
    motion = mockReducedMotion(true)
    const onClick = vi.fn()
    const el = await mount()
    el.addEventListener('click', onClick)

    drag(el, [
      [0, 0],
      [30, 0],
    ])
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onClick).not.toHaveBeenCalled()

    pointer('pointerdown', el, 0, 0)
    pointer('pointerup', window, 1, 0)
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('starts only from the handle, even inside the shadow root', async () => {
    const el = await mount((host) => ({
      handle: () =>
        host.shadowRoot?.querySelector<HTMLElement>('[part="grip"]') ?? null,
      release: () => null,
    }))
    const grip = el.shadowRoot!.querySelector('[part="grip"]')!
    const action = el.shadowRoot!.querySelector('[part="action"]')!
    expect((grip as HTMLElement).style.touchAction).toBe('none')

    drag(action, [
      [0, 0],
      [40, 0],
    ])
    expect(el.drag.state.x).toBe(0)

    drag(grip, [
      [0, 0],
      [40, 0],
    ])
    expect(el.drag.state.x).toBe(40)
  })

  it('ignores presses while disabled and secondary mouse buttons', async () => {
    let isDisabled = true
    const el = await mount({ disabled: () => isDisabled, release: () => null })
    drag(el, [
      [0, 0],
      [40, 0],
    ])
    expect(el.drag.state.x).toBe(0)

    isDisabled = false
    pointer('pointerdown', el, 0, 0, { button: 2 })
    pointer('pointermove', window, 40, 0)
    expect(el.drag.state.isDragging).toBe(false)
  })

  it('captures the pointer on the handle once dragging starts', async () => {
    const el = await mount({ release: () => null })
    const capture = vi.fn()
    const release = vi.fn()
    ;(el as any).setPointerCapture = capture
    ;(el as any).releasePointerCapture = release
    drag(
      el,
      [
        [0, 0],
        [2, 0],
      ],
      { release: false },
    )
    expect(capture).not.toHaveBeenCalled()
    pointer('pointermove', window, 30, 0)
    expect(capture).toHaveBeenCalledWith(1)
    pointer('pointerup', window, 30, 0)
    expect(release).toHaveBeenCalledWith(1)
  })

  it('ends the press and stops listening when the host is removed mid-drag', async () => {
    const el = await mount({ release: () => null })
    drag(
      el,
      [
        [0, 0],
        [30, 0],
      ],
      { release: false },
    )
    el.remove()
    expect(el.drag.state.isDragging).toBe(false)
    pointer('pointermove', window, 90, 0)
    expect(el.drag.state.x).toBe(30)
  })
})
