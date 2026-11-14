import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './IconCloud'
import type { IconCloudPressDetail, MoulIconCloud } from './IconCloud'
import { iconCloudStyles } from './IconCloud.styles'
import {
  apply,
  axisAngle,
  depthStyle,
  dragRotation,
  easeOut,
  fibonacciSphere,
  identity,
  type Matrix3,
  multiply,
  orthonormalize,
  turnToFront,
  type Vector3,
} from './icon-cloud-geometry'

/** The element's private sphere state, for checking turns without a canvas. */
interface Internals {
  rotation: Matrix3
  points: Vector3[]
  turned: Float32Array
  order: number[]
  sphereRadius: number
  centerX: number
  centerY: number
  targetSpin(): [number, number]
  svgDataUrl(svg: SVGSVGElement, pixels: number): string
}

const internals = (el: MoulIconCloud) => el as unknown as Internals

/** The z of icon `index` after the sphere's current turn: 1 is straight at the viewer. */
const depthOf = (el: MoulIconCloud, index: number) => {
  const state = internals(el)
  return apply(state.rotation, state.points[index])[2]
}

let motion: ReducedMotionMock | null = null

afterEach(() => {
  motion?.restore()
  motion = null
  fixtureCleanup()
})

async function cloud(label = 'Integrations'): Promise<MoulIconCloud> {
  const el = await fixture<MoulIconCloud>(html`<moul-icon-cloud label=${label}>
    <a href="#one" aria-label="One"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor" /></svg></a>
    <a href="#two" aria-label="Two"><svg viewBox="0 0 24 24"><rect width="20" height="20" /></svg></a>
    <img src="/three.svg" alt="Three" />
    <button type="button">Four</button>
    <span>Go</span>
  </moul-icon-cloud>`)
  // happy-dom may not fire slotchange on first render; ask the slot directly.
  const slot = el.shadowRoot?.querySelector('slot')
  slot?.dispatchEvent(new Event('slotchange'))
  await el.updateComplete
  return el
}

describe('<moul-icon-cloud>', () => {
  it('is registered with an open shadow root and a canvas hidden from screen readers', async () => {
    const el = await fixture<MoulIconCloud>(
      html`<moul-icon-cloud></moul-icon-cloud>`,
    )
    expect(customElements.get('moul-icon-cloud')).toBeDefined()
    const canvas = el.shadowRoot?.querySelector('canvas')
    expect(canvas?.getAttribute('aria-hidden')).toBe('true')
  })

  it('has sensible defaults', async () => {
    const el = await fixture<MoulIconCloud>(
      html`<moul-icon-cloud></moul-icon-cloud>`,
    )
    expect(el.speed).toBe(14)
    expect(el.iconSize).toBe(40)
    expect(el.radius).toBeUndefined()
    expect(el.isPaused).toBe(false)
    expect(el.label).toBe('')
  })

  it('places every slotted icon on the sphere, in order', async () => {
    const el = await cloud()
    expect(el.icons.map((icon) => icon.localName)).toEqual([
      'a',
      'a',
      'img',
      'button',
      'span',
    ])
    const { points } = internals(el)
    expect(points).toHaveLength(5)
    for (const point of points) expect(Math.hypot(...point)).toBeCloseTo(1)
  })

  it('draws a monochrome SVG in the icon colour, at the sprite size', async () => {
    const el = await cloud()
    const svg = el.querySelector('svg') as SVGSVGElement
    const url = internals(el).svgDataUrl(svg, 80)
    const markup = decodeURIComponent(url.split(',')[1])
    expect(url.startsWith('data:image/svg+xml')).toBe(true)
    expect(markup).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(markup).toContain('width="80"')
    expect(markup).toMatch(/style="color:/)
    // The page's own SVG is left alone.
    expect(svg.getAttribute('width')).toBeNull()
  })

  it('fires a cancelable press for the icon under the pointer, then activates its link', async () => {
    const el = await cloud()
    const state = internals(el)
    // Put icon 0 at the front, in the middle of a 240px box.
    state.sphereRadius = 100
    state.centerX = 120
    state.centerY = 120
    state.turned.fill(0)
    state.turned.set([0, 0, 1], 0)
    for (let i = 1; i < 5; i++) state.turned.set([0.9, 0.9, -1], i * 3)
    state.order.splice(0, state.order.length, 1, 2, 3, 4, 0)
    const link = el.querySelector('a') as HTMLAnchorElement
    const click = vi.spyOn(link, 'click').mockImplementation(() => {})
    const presses: IconCloudPressDetail[] = []
    el.addEventListener('press', (event) =>
      presses.push((event as CustomEvent<IconCloudPressDetail>).detail),
    )
    const press = (x: number, y: number) => {
      const init = { bubbles: true, clientX: x, clientY: y, pointerId: 1 }
      el.dispatchEvent(new PointerEvent('pointerdown', init))
      el.dispatchEvent(new PointerEvent('pointerup', init))
    }
    press(120, 120)
    expect(presses).toEqual([{ item: link, index: 0 }])
    expect(click).toHaveBeenCalledOnce()

    el.addEventListener('press', (event) => event.preventDefault(), {
      once: true,
    })
    press(120, 120)
    expect(click).toHaveBeenCalledOnce()

    // Nothing there: no press.
    press(5, 5)
    expect(presses).toHaveLength(2)
  })

  it('turns with a drag and does not press', async () => {
    const el = await cloud()
    const state = internals(el)
    state.sphereRadius = 100
    const before = new Float64Array(state.rotation)
    const presses: unknown[] = []
    el.addEventListener('press', (event) => presses.push(event))
    const at = (type: string, x: number) =>
      el.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          clientX: x,
          clientY: 50,
          pointerId: 1,
        }),
      )
    at('pointerdown', 50)
    at('pointermove', 90)
    at('pointerup', 90)
    expect([...state.rotation]).not.toEqual([...before])
    expect(presses).toHaveLength(0)
    expect(String(iconCloudStyles.at(-1))).toMatch(/touch-action:\s*pan-y/)
  })

  describe('keyboard and screen readers', () => {
    it('keeps the icons in the page as a named group, links still in the tab order', async () => {
      const el = await cloud('Integrations')
      const group = el.shadowRoot?.querySelector('[part="items"]')
      expect(group?.getAttribute('role')).toBe('group')
      expect(group?.getAttribute('aria-label')).toBe('Integrations')
      expect(group?.querySelector('slot')).not.toBeNull()
      // Hidden from sight only: nothing takes the links out of the tab order or the accessibility tree.
      for (const link of el.querySelectorAll('a')) {
        expect(link.hasAttribute('tabindex')).toBe(false)
      }
      expect(group?.hasAttribute('inert')).toBe(false)
      expect(group?.hasAttribute('aria-hidden')).toBe(false)
      expect(String(iconCloudStyles.at(-1))).toMatch(
        /\.items\s*\{[^}]*clip-path:\s*inset\(50%\)/,
      )
      expect(el.querySelector('img')?.getAttribute('alt')).toBe('Three')
      expect(
        el.shadowRoot?.querySelector('canvas')?.getAttribute('aria-hidden'),
      ).toBe('true')
    })

    it('has no group role without a label', async () => {
      const el = await cloud('')
      const group = el.shadowRoot?.querySelector('[part="items"]')
      expect(group?.hasAttribute('role')).toBe(false)
      expect(group?.hasAttribute('aria-label')).toBe(false)
    })

    it('turns a focused icon to the front and holds the sphere still', async () => {
      const el = await cloud()
      expect(depthOf(el, 3)).toBeLessThan(0.99)
      el.querySelector('button')?.focus()
      expect(el.focusedIndex).toBe(3)
      // In a test the canvas loop never runs, so the turn happens at once.
      expect(depthOf(el, 3)).toBeCloseTo(1, 6)
      expect(internals(el).targetSpin()).toEqual([0, 0])

      ;(el.querySelectorAll('a')[1] as HTMLElement).focus()
      expect(el.focusedIndex).toBe(1)
      expect(depthOf(el, 1)).toBeCloseTo(1, 6)

      const outside = document.createElement('button')
      document.body.append(outside)
      outside.focus()
      expect(el.focusedIndex).toBe(-1)
      expect(internals(el).targetSpin()[1]).toBeCloseTo((14 * Math.PI) / 180)
      outside.remove()
    })
  })

  describe('reduced motion', () => {
    it('neither turns on its own nor leans toward the pointer', async () => {
      motion = mockReducedMotion(false)
      const el = await cloud()
      expect(internals(el).targetSpin()[1]).toBeGreaterThan(0)
      motion.set(true)
      expect(internals(el).targetSpin()).toEqual([0, 0])
    })

    it('still turns under the reader’s own drag, and stops dead when let go', async () => {
      motion = mockReducedMotion(true)
      const el = await cloud()
      const state = internals(el) as Internals & {
        spinX: number
        spinY: number
      }
      state.sphereRadius = 100
      const before = new Float64Array(state.rotation)
      const at = (type: string, x: number) =>
        el.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            clientX: x,
            clientY: 0,
            pointerId: 1,
          }),
        )
      at('pointerdown', 0)
      at('pointermove', 60)
      at('pointerup', 60)
      expect([...state.rotation]).not.toEqual([...before])
      expect(state.spinX).toBe(0)
      expect(state.spinY).toBe(0)
    })

    it('stops turning on its own with is-paused', async () => {
      const el = await cloud()
      el.isPaused = true
      await el.updateComplete
      expect(internals(el).targetSpin()).toEqual([0, 0])
    })
  })
})

describe('icon cloud geometry', () => {
  const close = (a: ArrayLike<number>, b: ArrayLike<number>) => {
    for (let i = 0; i < b.length; i++) expect(a[i]).toBeCloseTo(b[i], 6)
  }

  it('spreads points evenly: none crowd together', () => {
    const points = fibonacciSphere(30)
    expect(points).toHaveLength(30)
    let nearest = Number.POSITIVE_INFINITY
    for (let i = 0; i < points.length; i++) {
      expect(Math.hypot(...points[i])).toBeCloseTo(1)
      for (let j = i + 1; j < points.length; j++) {
        const [a, b] = [points[i], points[j]]
        nearest = Math.min(
          nearest,
          Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]),
        )
      }
    }
    // Thirty points on a unit sphere sit about 0.65 apart; none closer than half that.
    expect(nearest).toBeGreaterThan(0.33)
    expect(fibonacciSphere(0)).toEqual([])
  })

  it('builds rotations about an axis', () => {
    close(axisAngle(0, 0, 0, 1), identity())
    // A quarter turn about y carries the front to the right.
    close(apply(axisAngle(0, 1, 0, Math.PI / 2), [0, 0, 1]), [1, 0, 0])
    // About x, the front goes down.
    close(apply(axisAngle(1, 0, 0, Math.PI / 2), [0, 0, 1]), [0, -1, 0])
  })

  it('makes the front follow a drag', () => {
    const right = apply(dragRotation(30, 0, 100), [0, 0, 1])
    expect(right[0]).toBeGreaterThan(0)
    const down = apply(dragRotation(0, 30, 100), [0, 0, 1])
    expect(down[1]).toBeLessThan(0)
    close(dragRotation(0, 0, 100), identity())
  })

  it('finds the turn that brings any point to the front', () => {
    for (const point of [
      [1, 0, 0],
      [0.3, -0.5, -0.81],
      [0, 0, -1],
    ] as Vector3[]) {
      const length = Math.hypot(...point)
      const unit = point.map((n) => n / length) as Vector3
      const { axis, angle } = turnToFront(unit)
      close(apply(axisAngle(...axis, angle), unit), [0, 0, 1])
    }
  })

  it('multiplies rotations in order and pulls drift back out', () => {
    const a = axisAngle(0, 1, 0, 0.4)
    const b = axisAngle(1, 0, 0, 0.7)
    const v: Vector3 = [0.2, 0.3, 0.93]
    close(apply(multiply(a, b), v), apply(a, apply(b, v)))
    const drifted = new Float64Array(a)
    drifted[0] *= 1.01
    drifted[4] *= 0.99
    orthonormalize(drifted)
    expect(Math.hypot(drifted[0], drifted[1], drifted[2])).toBeCloseTo(1)
    expect(Math.hypot(drifted[3], drifted[4], drifted[5])).toBeCloseTo(1)
    expect(
      drifted[0] * drifted[3] +
        drifted[1] * drifted[4] +
        drifted[2] * drifted[5],
    ).toBeCloseTo(0)
  })

  it('makes the front big and opaque, the back small and faint', () => {
    expect(depthStyle(1)).toEqual({ scale: 1, alpha: 1 })
    expect(depthStyle(-1).scale).toBe(0.5)
    expect(depthStyle(-1).alpha).toBeLessThan(0.2)
    expect(easeOut(0)).toBe(0)
    expect(easeOut(1)).toBe(1)
  })
})
