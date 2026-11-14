import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './Globe'
import { LAND_MASK } from '../WorldMap/land-mask'
import type { MoulGlobe } from './Globe'
import { globeStyles } from './Globe.styles'
import {
  arcPath,
  arcPoint,
  easeInOut,
  fibonacciSphere,
  isLand,
  isOccluded,
  landPoints,
  landSamples,
  lngDelta,
  MAX_VIEW_LAT,
  parsePlace,
  projectPlace,
  toPlace,
  toVector,
  type Vector,
  viewFor,
  wrapLng,
} from './globe-geometry'

const phnomPenh = { lat: 11.56, lng: 104.92, label: 'Phnom Penh' }
const tokyo = { lat: 35.68, lng: 139.69, label: 'Tokyo' }
const lisbon = { lat: 38.72, lng: -9.14, label: 'Lisbon' }

/** The element's private drag and view state, for driving it without a canvas. */
interface Internals {
  measure(width: number, height: number): void
  radius: number
  velocityLng: number
  velocityLat: number
}

const internals = (el: MoulGlobe) => el as unknown as Internals

function pointer(
  el: HTMLElement,
  type: string,
  x: number,
  y: number,
  init: PointerEventInit = {},
): void {
  el.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      clientX: x,
      clientY: y,
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      ...init,
    }),
  )
}

const bytes = atob(LAND_MASK.bits)

let motion: ReducedMotionMock | null = null

afterEach(() => {
  motion?.restore()
  motion = null
  fixtureCleanup()
})

describe('<moul-globe>', () => {
  it('is registered with an open shadow root and a canvas hidden from screen readers', async () => {
    const el = await fixture<MoulGlobe>(html`<moul-globe></moul-globe>`)
    expect(customElements.get('moul-globe')).toBeDefined()
    const canvas = el.shadowRoot?.querySelector('canvas')
    expect(canvas?.getAttribute('aria-hidden')).toBe('true')
    expect(canvas?.getAttribute('part')).toBe('canvas')
  })

  it('has sensible defaults', async () => {
    const el = await fixture<MoulGlobe>(html`<moul-globe></moul-globe>`)
    expect(el.label).toBe('Globe')
    expect(el.speed).toBe(8)
    expect(el.markers).toEqual([])
    expect(el.arcs).toEqual([])
    expect(el.center).toBeNull()
    expect(el.showLabels).toBe(false)
    expect(el.isPaused).toBe(false)
  })

  it('reads markers and arcs from JSON attributes and skips anything invalid', async () => {
    const el = await fixture<MoulGlobe>(html`<moul-globe
      markers=${JSON.stringify([phnomPenh, { lat: 'north' }])}
      arcs=${JSON.stringify([{ from: phnomPenh, to: tokyo }, { from: phnomPenh }])}
    ></moul-globe>`)
    expect(el.markers).toHaveLength(2)
    const items = [...(el.shadowRoot?.querySelectorAll('li') ?? [])].map(
      (li) => li.textContent,
    )
    expect(items).toEqual(['Phnom Penh', 'Tokyo', 'Phnom Penh to Tokyo'])
    el.setAttribute('arcs', 'not json')
    await el.updateComplete
    expect(el.arcs).toEqual([])
  })

  it('reads center as "lat, lng" or as JSON, and faces it', async () => {
    const el = await fixture<MoulGlobe>(
      html`<moul-globe center="11.56, 104.92"></moul-globe>`,
    )
    expect(el.center).toEqual({ lat: 11.56, lng: 104.92 })
    expect(el.currentView).toEqual({ lat: 11.56, lng: 104.92 })
    el.setAttribute('center', '{ "lat": -33.87, "lng": 151.21 }')
    await el.updateComplete
    expect(el.currentView).toEqual({ lat: -33.87, lng: 151.21 })
  })

  it('faces the first pin when no center is set', async () => {
    const el = await fixture<MoulGlobe>(
      html`<moul-globe .arcs=${[{ from: lisbon, to: tokyo }]}></moul-globe>`,
    )
    expect(el.currentView).toEqual({ lat: lisbon.lat, lng: lisbon.lng })
  })

  it('turns to a place by label and holds there', async () => {
    const el = await fixture<MoulGlobe>(
      html`<moul-globe .markers=${[phnomPenh, tokyo]}></moul-globe>`,
    )
    // Off screen (and in this test the loop never runs), the turn is a jump.
    await el.turnTo('tokyo')
    expect(el.currentView).toEqual({ lat: tokyo.lat, lng: tokyo.lng })
    await el.turnTo({ lat: 80, lng: 190 })
    expect(el.currentView).toEqual({ lat: MAX_VIEW_LAT, lng: -170 })
    await el.turnTo('Atlantis')
    expect(el.currentView).toEqual({ lat: MAX_VIEW_LAT, lng: -170 })
  })

  it('turns with a drag: the surface follows the pointer', async () => {
    const el = await fixture<MoulGlobe>(
      html`<moul-globe center="0, 0"></moul-globe>`,
    )
    internals(el).measure(400, 400)
    const radius = internals(el).radius
    expect(radius).toBeCloseTo(168)
    pointer(el, 'pointerdown', 100, 100)
    pointer(el, 'pointermove', 200, 150)
    const degreesPerPixel = 180 / (Math.PI * radius)
    expect(el.currentView.lng).toBeCloseTo(-100 * degreesPerPixel)
    expect(el.currentView.lat).toBeCloseTo(50 * degreesPerPixel)
    pointer(el, 'pointerup', 200, 150)
  })

  it('drags a finger sideways only, leaving up and down to the page', async () => {
    const el = await fixture<MoulGlobe>(
      html`<moul-globe center="0, 0"></moul-globe>`,
    )
    internals(el).measure(400, 400)
    const touch = { pointerType: 'touch' }
    pointer(el, 'pointerdown', 100, 100, touch)
    pointer(el, 'pointermove', 160, 220, touch)
    expect(el.currentView.lat).toBe(0)
    expect(el.currentView.lng).toBeLessThan(0)
    pointer(el, 'pointerup', 160, 220, touch)
    expect(String(globeStyles.at(-1))).toMatch(/touch-action:\s*pan-y/)
  })

  describe('keyboard and screen readers', () => {
    it('is one image named by label, never focusable', async () => {
      const el = await fixture<MoulGlobe>(
        html`<moul-globe label="Our offices"></moul-globe>`,
      )
      const base = el.shadowRoot?.querySelector('[part="base"]')
      expect(base?.getAttribute('role')).toBe('img')
      expect(base?.getAttribute('aria-label')).toBe('Our offices')
      expect(el.tabIndex).toBe(-1)
      expect(
        el.shadowRoot?.querySelector('[tabindex], a, button, input'),
      ).toBeNull()
      el.label = ''
      await el.updateComplete
      expect(base?.getAttribute('aria-label')).toBe('Globe')
    })

    it('lists every labelled place and route for screen readers', async () => {
      const el = await fixture<MoulGlobe>(html`<moul-globe
        .markers=${[phnomPenh, { lat: 0, lng: 0 }]}
        .arcs=${[
          { from: phnomPenh, to: lisbon },
          { from: phnomPenh, to: tokyo, label: 'Night flight' },
        ]}
      ></moul-globe>`)
      const list = el.shadowRoot?.querySelector('ul.visually-hidden')
      expect(list).not.toBeNull()
      expect(
        [...(list?.querySelectorAll('li') ?? [])].map((li) => li.textContent),
      ).toEqual([
        'Phnom Penh',
        'Lisbon',
        'Tokyo',
        'Phnom Penh to Lisbon',
        'Night flight',
      ])
    })

    it('renders no list when nothing is labelled', async () => {
      const el = await fixture<MoulGlobe>(
        html`<moul-globe .markers=${[{ lat: 1, lng: 2 }]}></moul-globe>`,
      )
      expect(el.shadowRoot?.querySelector('ul')).toBeNull()
    })
  })

  describe('reduced motion', () => {
    it('holds still on center, and a drag stops dead when let go', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulGlobe>(
        html`<moul-globe center="11.56, 104.92"></moul-globe>`,
      )
      internals(el).measure(400, 400)
      pointer(el, 'pointerdown', 100, 100)
      pointer(el, 'pointermove', 140, 100)
      pointer(el, 'pointerup', 140, 100)
      expect(el.currentView.lng).not.toBe(104.92)
      expect(internals(el).velocityLng).toBe(0)
      expect(internals(el).velocityLat).toBe(0)
    })

    it('turns back to center when the setting is switched on', async () => {
      motion = mockReducedMotion(false)
      const el = await fixture<MoulGlobe>(
        html`<moul-globe center="11.56, 104.92" .markers=${[tokyo]}></moul-globe>`,
      )
      await el.turnTo('Tokyo')
      expect(el.currentView.lat).toBe(tokyo.lat)
      motion.set(true)
      expect(el.currentView).toEqual({ lat: 11.56, lng: 104.92 })
      // turnTo jumps rather than turns.
      await el.turnTo(tokyo)
      expect(el.currentView).toEqual({ lat: tokyo.lat, lng: tokyo.lng })
    })
  })
})

describe('globe geometry', () => {
  const close = (a: Vector, b: Vector) => {
    for (let i = 0; i < 3; i++) expect(a[i]).toBeCloseTo(b[i], 6)
  }

  it('turns places into vectors and back', () => {
    close(toVector(0, 0), [0, 0, 1])
    close(toVector(90, 0), [0, 1, 0])
    close(toVector(0, 90), [1, 0, 0])
    const place = toPlace(toVector(phnomPenh.lat, phnomPenh.lng))
    expect(place.lat).toBeCloseTo(phnomPenh.lat)
    expect(place.lng).toBeCloseTo(phnomPenh.lng)
  })

  it('puts the view at the front, east to the right and north up', () => {
    const view = { lat: 11.56, lng: 104.92 }
    close(projectPlace(view, view), [0, 0, 1])
    const east = projectPlace({ lat: 11.56, lng: 120 }, view)
    expect(east[0]).toBeGreaterThan(0)
    const north = projectPlace({ lat: 30, lng: 104.92 }, view)
    expect(north[1]).toBeGreaterThan(0)
    const antipode = projectPlace({ lat: -11.56, lng: -75.08 }, view)
    expect(antipode[2]).toBeCloseTo(-1)
  })

  it('reads land from the mask, smoothing the 2° cells', () => {
    expect(isLand(phnomPenh.lat, phnomPenh.lng, bytes)).toBe(true)
    expect(isLand(48.86, 2.35, bytes)).toBe(true) // Paris
    expect(isLand(0, -150, bytes)).toBe(false) // the Pacific
    expect(isLand(30, -40, bytes)).toBe(false) // the Atlantic
    expect(isLand(-80, 0, bytes)).toBe(false) // past the mask
  })

  it('spreads lattice points evenly over the whole sphere', () => {
    const points = fibonacciSphere(500)
    expect(points.length).toBe(1500)
    let north = 0
    for (let i = 0; i < points.length; i += 3) {
      expect(Math.hypot(points[i], points[i + 1], points[i + 2])).toBeCloseTo(1)
      if (points[i + 1] > 0) north++
    }
    expect(north).toBe(250)
  })

  it('keeps about the land share of the lattice, and caches it', () => {
    const land = landPoints(12000)
    const share = land.length / 3 / 12000
    // Land is about 29% of the earth; the mask leaves out Antarctica.
    expect(share).toBeGreaterThan(0.2)
    expect(share).toBeLessThan(0.3)
    expect(landPoints(12000)).toBe(land)
  })

  it('samples more dots for a bigger globe, within limits', () => {
    expect(landSamples(50)).toBe(6000)
    expect(landSamples(2000)).toBe(28000)
    expect(landSamples(160)).toBeGreaterThan(landSamples(120))
    expect(landSamples(160) % 2000).toBe(0)
  })

  it('lifts arcs off the surface, higher for longer routes', () => {
    const short = arcPath(phnomPenh, { lat: 13.36, lng: 103.86 })
    const long = arcPath(phnomPenh, lisbon)
    expect(long.height).toBeGreaterThan(short.height)
    const start: Vector = [0, 0, 0]
    const middle: Vector = [0, 0, 0]
    const end: Vector = [0, 0, 0]
    arcPoint(long, 0, start)
    arcPoint(long, 0.5, middle)
    arcPoint(long, 1, end)
    close(start, toVector(phnomPenh.lat, phnomPenh.lng))
    close(end, toVector(lisbon.lat, lisbon.lng))
    expect(Math.hypot(...middle)).toBeCloseTo(1 + long.height)
  })

  it('hides points behind the globe but not raised points past its outline', () => {
    expect(isOccluded(0, 0, -1)).toBe(true)
    expect(isOccluded(0.5, 0.5, -0.2)).toBe(true)
    expect(isOccluded(1.05, 0, -0.1)).toBe(false)
    expect(isOccluded(0, 0, 0.5)).toBe(false)
  })

  it('turns the short way round and wraps longitudes', () => {
    expect(lngDelta(170, -170)).toBe(20)
    expect(lngDelta(-170, 170)).toBe(-20)
    expect(wrapLng(190)).toBe(-170)
    expect(wrapLng(-540)).toBe(-180)
    expect(viewFor({ lat: -89, lng: 370 })).toEqual({
      lat: -MAX_VIEW_LAT,
      lng: 10,
    })
  })

  it('parses places and eases turns', () => {
    expect(parsePlace('11.5, 104.9')).toEqual({ lat: 11.5, lng: 104.9 })
    expect(parsePlace('11.5 104.9')).toEqual({ lat: 11.5, lng: 104.9 })
    expect(parsePlace('{"lat":1,"lng":2}')).toEqual({ lat: 1, lng: 2 })
    expect(parsePlace('north')).toBeNull()
    expect(parsePlace('{ broken')).toBeNull()
    expect(parsePlace(null)).toBeNull()
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(1)).toBe(1)
    expect(easeInOut(0.5)).toBeCloseTo(0.5)
  })
})
