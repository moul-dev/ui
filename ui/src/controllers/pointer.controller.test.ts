import { html, LitElement } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
} from '../test-setup'
import {
  closestEdge,
  PointerController,
  type PointerControllerOptions,
} from './pointer.controller'

let hostCount = 0

class PointerHost extends LitElement {
  pointer!: PointerController
  protected override render() {
    return html`<div part="surface"></div>`
  }
}

async function mount(
  options: PointerControllerOptions = {},
): Promise<PointerHost> {
  const tag = `pointer-host-${++hostCount}`
  customElements.define(
    tag,
    class extends PointerHost {
      constructor() {
        super()
        this.pointer = new PointerController(this, options)
      }
    },
  )
  const el = document.createElement(tag) as PointerHost
  document.body.append(el)
  await el.updateComplete
  return el
}

function placeAt(
  el: Element,
  rect: { left: number; top: number; width: number; height: number },
): void {
  el.getBoundingClientRect = () =>
    ({
      ...rect,
      x: rect.left,
      y: rect.top,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      toJSON: () => ({}),
    }) as DOMRect
}

function move(
  target: EventTarget,
  clientX: number,
  clientY: number,
  pointerType = 'mouse',
): void {
  target.dispatchEvent(
    new PointerEvent('pointermove', {
      clientX,
      clientY,
      pointerType,
      bubbles: true,
      composed: true,
    }),
  )
}

function leave(target: EventTarget, pointerType = 'mouse'): void {
  target.dispatchEvent(new PointerEvent('pointerleave', { pointerType }))
}

const RECT = { left: 100, top: 50, width: 200, height: 100 }

describe('PointerController', () => {
  let frames: ManualFrames

  beforeEach(() => {
    frames = manualAnimationFrames()
  })

  afterEach(() => {
    frames.restore()
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('writes the position as CSS variables once per frame, however many moves arrive', async () => {
    const onFrame = vi.fn()
    const el = await mount({ onFrame })
    placeAt(el, RECT)

    move(el, 120, 60)
    move(el, 150, 75)
    move(el, 250, 100)
    expect(el.style.getPropertyValue('--pointer-x')).toBe('')
    expect(frames.pending).toBe(1)

    frames.step(16)
    expect(onFrame).toHaveBeenCalledTimes(1)
    expect(el.style.getPropertyValue('--pointer-x')).toBe('150px')
    expect(el.style.getPropertyValue('--pointer-y')).toBe('50px')
    expect(el.style.getPropertyValue('--pointer-ratio-x')).toBe('0.75')
    expect(el.style.getPropertyValue('--pointer-ratio-y')).toBe('0.5')
    expect(el.pointer.state).toMatchObject({
      x: 150,
      y: 50,
      isInside: true,
      pointerType: 'mouse',
    })
  })

  it('reports the edge the pointer entered through', async () => {
    const el = await mount()
    placeAt(el, RECT)

    move(el, 104, 100)
    frames.step(16)
    expect(el.pointer.state.entryEdge).toBe('left')

    leave(el)
    frames.step(32)
    expect(el.pointer.state.isInside).toBe(false)

    move(el, 200, 148)
    frames.step(48)
    expect(el.pointer.state.entryEdge).toBe('bottom')
  })

  it('keeps the last position after the pointer leaves, so effects can fade out in place', async () => {
    const el = await mount()
    placeAt(el, RECT)
    move(el, 140, 70)
    frames.step(16)
    leave(el)
    frames.step(32)
    expect(el.style.getPropertyValue('--pointer-x')).toBe('40px')
    expect(el.pointer.state.isInside).toBe(false)
  })

  it('ignores pointer types it was not asked to follow', async () => {
    const el = await mount({ pointerTypes: ['mouse', 'pen'] })
    placeAt(el, RECT)
    move(el, 150, 75, 'touch')
    expect(frames.pending).toBe(0)
    move(el, 150, 75, 'pen')
    frames.step(16)
    expect(el.pointer.state.pointerType).toBe('pen')
  })

  it('measures one element and writes to another, under a custom prefix', async () => {
    let surface: HTMLElement | null = null
    const el = await mount({
      prefix: '--spot',
      target: () => surface,
      styleTarget: () => document.documentElement,
    })
    surface = el.shadowRoot!.querySelector<HTMLElement>('[part="surface"]')
    placeAt(surface!, { left: 0, top: 0, width: 100, height: 100 })
    move(el, 25, 75)
    frames.step(16)
    const root = document.documentElement.style
    expect(root.getPropertyValue('--spot-x')).toBe('25px')
    expect(root.getPropertyValue('--spot-ratio-y')).toBe('0.75')
    expect(el.style.getPropertyValue('--spot-x')).toBe('')
    expect(el.pointer.properties.ratioX).toBe('--spot-ratio-x')
    root.removeProperty('--spot-x')
    root.removeProperty('--spot-y')
    root.removeProperty('--spot-ratio-x')
    root.removeProperty('--spot-ratio-y')
  })

  it('re-renders the host on enter and leave only when asked', async () => {
    const el = await mount({ updateOnEnterLeave: true })
    placeAt(el, RECT)
    const requestUpdate = vi.spyOn(el, 'requestUpdate')

    move(el, 150, 75)
    frames.step(16)
    move(el, 160, 80)
    frames.step(32)
    expect(requestUpdate).toHaveBeenCalledTimes(1)

    leave(el)
    frames.step(48)
    expect(requestUpdate).toHaveBeenCalledTimes(2)
  })

  it('follows the pointer anywhere on the page in window scope', async () => {
    const el = await mount({ scope: 'window' })
    placeAt(el, RECT)
    move(window, 50, 25)
    frames.step(16)
    expect(el.style.getPropertyValue('--pointer-x')).toBe('-50px')
    expect(el.style.getPropertyValue('--pointer-ratio-x')).toBe('-0.25')
    expect(el.pointer.state.isInside).toBe(false)
  })

  it('rests at the centre and stops calling onFrame under reduced motion', async () => {
    const motion = mockReducedMotion(false)
    try {
      const onFrame = vi.fn()
      const el = await mount({ onFrame })
      placeAt(el, RECT)
      move(el, 120, 60)
      frames.step(16)
      expect(onFrame).toHaveBeenCalledTimes(1)

      motion.set(true)
      expect(el.style.getPropertyValue('--pointer-x')).toBe('100px')
      expect(el.style.getPropertyValue('--pointer-ratio-x')).toBe('0.5')
      move(el, 280, 140)
      frames.step(32)
      expect(onFrame).toHaveBeenCalledTimes(1)
      expect(el.style.getPropertyValue('--pointer-x')).toBe('100px')

      motion.set(false)
      move(el, 280, 140)
      frames.step(48)
      expect(el.style.getPropertyValue('--pointer-x')).toBe('180px')
    } finally {
      motion.restore()
    }
  })

  it('keeps following under reduced motion when trackWhenReducedMotion is set', async () => {
    const motion = mockReducedMotion(true)
    try {
      const el = await mount({ trackWhenReducedMotion: true })
      placeAt(el, RECT)
      move(el, 120, 60)
      frames.step(16)
      expect(el.style.getPropertyValue('--pointer-x')).toBe('20px')
    } finally {
      motion.restore()
    }
  })

  it('cancels its pending frame and stops listening when disconnected', async () => {
    const motion = mockReducedMotion(false)
    try {
      const onFrame = vi.fn()
      const el = await mount({ onFrame })
      placeAt(el, RECT)
      expect(motion.listenerCount()).toBe(1)
      move(el, 120, 60)
      el.remove()
      expect(frames.pending).toBe(0)
      expect(motion.listenerCount()).toBe(0)
      move(el, 130, 60)
      expect(frames.pending).toBe(0)
      expect(onFrame).not.toHaveBeenCalled()
    } finally {
      motion.restore()
    }
  })

  it('re-measures when the page scrolls under a still pointer', async () => {
    const el = await mount()
    placeAt(el, RECT)
    move(el, 150, 75)
    frames.step(16)
    placeAt(el, { ...RECT, top: 25 })
    window.dispatchEvent(new Event('scroll'))
    frames.step(32)
    expect(el.style.getPropertyValue('--pointer-y')).toBe('50px')
  })
})

describe('closestEdge', () => {
  it('picks the nearest side of the box', () => {
    expect(closestEdge(5, 50, 200, 100)).toBe('left')
    expect(closestEdge(195, 50, 200, 100)).toBe('right')
    expect(closestEdge(100, 2, 200, 100)).toBe('top')
    expect(closestEdge(100, 99, 200, 100)).toBe('bottom')
  })
})
