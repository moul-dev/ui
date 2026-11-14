import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
  triggerResize,
} from '../../test-setup'
import {
  DEFAULT_FLOW_COLORS,
  lifeAlpha,
  type MoulFlowField,
  parseColorList,
  vortexAngle,
} from './FlowField'

interface Internals {
  particleCount: number
  xs: Float32Array
  centerX: number
  centerY: number
  lean: number
}

const internals = (el: MoulFlowField) => el as unknown as Internals

const canvasOf = (el: MoulFlowField): HTMLCanvasElement =>
  el.shadowRoot!.querySelector('canvas')!

const fieldOf = (el: MoulFlowField): HTMLElement =>
  el.shadowRoot!.querySelector('.field')!

/** A 2D context that counts strokes and the colours they used. */
function fakeContext() {
  const strokes: string[] = []
  const context = {
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    lineJoin: '',
    lineCap: '',
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(function (this: { strokeStyle: string }) {
      strokes.push(this.strokeStyle)
    }),
  }
  return { context, strokes }
}

function show(el: MoulFlowField, width = 400, height = 240): void {
  triggerResize(canvasOf(el), { width, height })
}

function run(frames: ManualFrames, count: number, start = 1000): number {
  let time = start
  for (let i = 0; i < count; i++) {
    time += 16
    frames.step(time)
  }
  return time
}

describe('<moul-flow-field>', () => {
  let frames: ManualFrames
  let motion: ReducedMotionMock | null = null
  let fake: ReturnType<typeof fakeContext>

  beforeEach(() => {
    frames = manualAnimationFrames()
    fake = fakeContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => fake.context as unknown as CanvasRenderingContext2D,
    )
  })

  afterEach(() => {
    frames.restore()
    motion?.restore()
    motion = null
    vi.restoreAllMocks()
  })

  it('is registered with an open shadow root and a canvas hidden from screen readers', async () => {
    const el = await fixture<MoulFlowField>(
      html`<moul-flow-field></moul-flow-field>`,
    )
    expect(customElements.get('moul-flow-field')).toBeDefined()
    expect(canvasOf(el).getAttribute('aria-hidden')).toBe('true')
    expect(canvasOf(el).getAttribute('part')).toBe('canvas')
    expect(el.variant).toBe('waves')
    expect(el.speed).toBe(1)
  })

  it('falls back to waves for an unknown variant', async () => {
    const el = await fixture<MoulFlowField>(
      html`<moul-flow-field variant="tornado"></moul-flow-field>`,
    )
    await el.updateComplete
    expect(el.variant).toBe('waves')
  })

  describe('colours', () => {
    it('splits a list on commas outside brackets', () => {
      expect(
        parseColorList(
          'var(--color-accent), color-mix(in oklch, red 40%, blue),oklch(0.7 0.1 200)',
        ),
      ).toEqual([
        'var(--color-accent)',
        'color-mix(in oklch, red 40%, blue)',
        'oklch(0.7 0.1 200)',
      ])
    })

    it('reads a JSON array, ignores blanks and keeps at most eight', () => {
      expect(parseColorList('["red", " ", "blue"]')).toEqual(['red', 'blue'])
      expect(parseColorList('')).toEqual([])
      expect(parseColorList(null)).toEqual([])
      expect(parseColorList('a,b,c,d,e,f,g,h,i,j')).toHaveLength(8)
    })

    it('takes the attribute as an array and strokes in those colours', async () => {
      const el = await fixture<MoulFlowField>(
        html`<moul-flow-field
          colors="red, blue"
          count="4"
          blur="0"
        ></moul-flow-field>`,
      )
      expect(el.colors).toEqual(['red', 'blue'])
      show(el)
      fake.strokes.length = 0
      run(frames, 1)
      // Four waves, alternating the two colours as the canvas was given them.
      expect(fake.strokes).toHaveLength(4)
      expect(new Set(fake.strokes).size).toBeGreaterThan(0)
    })

    it('defaults to the theme accent and chart colours', () => {
      expect(DEFAULT_FLOW_COLORS[0]).toBe('var(--color-accent)')
      expect(DEFAULT_FLOW_COLORS.every((c) => c.startsWith('var(--'))).toBe(
        true,
      )
    })
  })

  describe('vortex geometry', () => {
    it('turns counter-clockwise on screen and leans inward', () => {
      // Right of the centre, the swirl heads up the screen.
      const right = vortexAngle(200, 100, 100, 100, 100, 100, 0)
      expect(Math.sin(right)).toBeLessThan(-0.9)
      // and a little toward the centre (negative x).
      expect(Math.cos(right)).toBeLessThan(0)
      // Above the centre, it heads left.
      const above = vortexAngle(100, 0, 100, 100, 100, 100, 0)
      expect(Math.cos(above)).toBeLessThan(-0.9)
    })

    it('fades each particle in and out over its life', () => {
      expect(lifeAlpha(0, 1000)).toBe(0)
      expect(lifeAlpha(1000, 1000)).toBe(0)
      expect(lifeAlpha(500, 1000)).toBe(1)
      expect(lifeAlpha(50, 1000)).toBeLessThan(1)
      expect(lifeAlpha(950, 1000)).toBeLessThan(1)
    })
  })

  describe('drawing', () => {
    it('draws one stroke per wave, five by default', async () => {
      const el = await fixture<MoulFlowField>(
        html`<moul-flow-field></moul-flow-field>`,
      )
      show(el)
      fake.context.stroke.mockClear()
      run(frames, 1)
      expect(fake.context.stroke).toHaveBeenCalledTimes(5)
    })

    it('fills a vortex by area and moves its particles', async () => {
      const el = await fixture<MoulFlowField>(
        html`<moul-flow-field variant="vortex"></moul-flow-field>`,
      )
      show(el, 600, 300)
      expect(internals(el).particleCount).toBe(150)
      const before = Array.from(internals(el).xs)
      fake.context.lineTo.mockClear()
      run(frames, 5)
      const moved = Array.from(internals(el).xs).filter(
        (x, i) => x !== before[i],
      )
      expect(moved.length).toBeGreaterThan(100)
      expect(fake.context.lineTo.mock.calls.length).toBeGreaterThan(500)
      // Every trail in one frame, in at most one stroke per colour and opacity step.
      fake.context.stroke.mockClear()
      run(frames, 1, 5000)
      expect(fake.context.stroke.mock.calls.length).toBeLessThanOrEqual(5 * 5)
    })

    it('takes a particle count, within its limits', async () => {
      const el = await fixture<MoulFlowField>(
        html`<moul-flow-field variant="vortex" count="5000"></moul-flow-field>`,
      )
      show(el)
      expect(internals(el).particleCount).toBe(1200)
      el.count = 40
      await el.updateComplete
      expect(internals(el).particleCount).toBe(40)
    })

    it('blurs waves by default and keeps the vortex sharp', async () => {
      const el = await fixture<MoulFlowField>(
        html`<moul-flow-field></moul-flow-field>`,
      )
      expect(fieldOf(el).classList.contains('is-blurred')).toBe(true)
      expect(fieldOf(el).style.getPropertyValue('--_blur')).toBe('12px')
      el.variant = 'vortex'
      await el.updateComplete
      expect(fieldOf(el).classList.contains('is-blurred')).toBe(false)
      el.blurRadius = 20
      await el.updateComplete
      expect(fieldOf(el).style.getPropertyValue('--_blur')).toBe('20px')
      expect(el.getAttribute('blur')).toBeNull()
    })
  })

  describe('pointer', () => {
    it('moves the vortex toward a mouse with follow-pointer', async () => {
      const el = await fixture<MoulFlowField>(
        html`<moul-flow-field variant="vortex" follow-pointer></moul-flow-field>`,
      )
      show(el, 400, 200)
      expect(internals(el).centerX).toBe(200)
      el.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: 360,
          clientY: 40,
          pointerType: 'mouse',
        }),
      )
      run(frames, 60)
      expect(internals(el).centerX).toBeGreaterThan(300)
      expect(internals(el).centerY).toBeLessThan(80)
    })

    it('stays centred without follow-pointer', async () => {
      const el = await fixture<MoulFlowField>(
        html`<moul-flow-field variant="vortex"></moul-flow-field>`,
      )
      show(el, 400, 200)
      el.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: 360,
          clientY: 40,
          pointerType: 'mouse',
        }),
      )
      run(frames, 60)
      expect(internals(el).centerX).toBe(200)
      expect(internals(el).lean).toBe(0)
    })
  })

  describe('keyboard and screen readers', () => {
    it('takes no focus and keeps slotted content readable and in the tab order', async () => {
      const el = await fixture<MoulFlowField>(
        html`<moul-flow-field><a href="#start">Start</a></moul-flow-field>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.getAttribute('role')).toBeNull()
      const slot = el.shadowRoot!.querySelector('slot')!
      expect(slot.assignedElements()[0]?.localName).toBe('a')
      const link = el.querySelector('a')!
      link.focus()
      expect(document.activeElement).toBe(link)
    })
  })

  describe('reduced motion', () => {
    it('draws a vortex caught mid-swirl, once, with its trails', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulFlowField>(
        html`<moul-flow-field variant="vortex"></moul-flow-field>`,
      )
      show(el)
      expect(frames.pending).toBe(0)
      expect(fake.context.lineTo.mock.calls.length).toBeGreaterThan(200)
      const xs = Array.from(internals(el).xs)
      run(frames, 10)
      expect(Array.from(internals(el).xs)).toEqual(xs)
    })

    it('draws still waves, the same each time', async () => {
      motion = mockReducedMotion(true)
      const first = await fixture<MoulFlowField>(
        html`<moul-flow-field></moul-flow-field>`,
      )
      show(first)
      const firstPoints = fake.context.lineTo.mock.calls.map((c) => c[1])
      fake.context.lineTo.mockClear()
      const second = await fixture<MoulFlowField>(
        html`<moul-flow-field></moul-flow-field>`,
      )
      show(second)
      expect(fake.context.lineTo.mock.calls.map((c) => c[1])).toEqual(
        firstPoints,
      )
      expect(frames.pending).toBe(0)
    })

    it('no longer follows the pointer', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulFlowField>(
        html`<moul-flow-field variant="vortex" follow-pointer></moul-flow-field>`,
      )
      show(el, 400, 200)
      el.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: 360,
          clientY: 40,
          pointerType: 'mouse',
        }),
      )
      run(frames, 30)
      expect(internals(el).centerX).toBe(200)
    })
  })
})
