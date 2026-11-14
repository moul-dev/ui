import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
} from '../../test-setup'
import { LAND_MASK } from './land-mask'
import './WorldMap'
import { arcPath, type MoulWorldMap, projectPoint } from './WorldMap'
import { worldMapStyles } from './WorldMap.styles'

const css = worldMapStyles.cssText

/** The body of the first `@media` block whose query starts with `query`. */
function mediaBlock(query: string): string {
  const start = css.indexOf(`@media ${query}`)
  expect(start, `no @media ${query}`).toBeGreaterThanOrEqual(0)
  let depth = 0
  const open = css.indexOf('{', start)
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i)
  }
  return ''
}

const shadow = (el: MoulWorldMap) => el.shadowRoot as ShadowRoot
const all = (el: MoulWorldMap, selector: string) => [
  ...shadow(el).querySelectorAll<HTMLElement>(selector),
]

const phnomPenh = { lat: 11.56, lng: 104.92, label: 'Phnom Penh' }
const singapore = { lat: 1.35, lng: 103.82, label: 'Singapore' }
const lisbon = { lat: 38.72, lng: -9.14, label: 'Lisbon' }

describe('<moul-world-map>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    fixtureCleanup()
    io.restore()
  })

  it('draws the land as one path of dots, one per land cell', async () => {
    const el = await fixture<MoulWorldMap>(
      html`<moul-world-map></moul-world-map>`,
    )
    const land = shadow(el).querySelector('[part="land"]')
    const d = land?.getAttribute('d') ?? ''
    const dots = d.match(/M[\d.]+ [\d.]+h0/g) ?? []
    // Count the set bits in the mask: every land cell becomes a dot.
    const bytes = atob(LAND_MASK.bits)
    let cells = 0
    for (let i = 0; i < LAND_MASK.columns * LAND_MASK.rows; i++) {
      if (bytes.charCodeAt(i >> 3) & (0x80 >> (i & 7))) cells++
    }
    expect(cells).toBeGreaterThan(3000)
    expect(dots).toHaveLength(cells)
  })

  it('projects places onto the map, one unit per degree', () => {
    expect(projectPoint({ lat: 0, lng: 0 })).toEqual({ x: 180, y: 86 })
    expect(projectPoint({ lat: 84, lng: -180 })).toEqual({ x: 0, y: 2 })
    // Beyond the drawn map, latitude is held at the edge and longitude wraps.
    expect(projectPoint({ lat: -80, lng: 190 }).y).toBe(144)
    expect(projectPoint({ lat: 0, lng: 190 }).x).toBeCloseTo(10)
  })

  it('bows each arc north, higher for longer routes', () => {
    const short = arcPath(phnomPenh, singapore)
    const long = arcPath(phnomPenh, lisbon)
    const controlY = (d: string) => Number(/Q[\d.]+ ([\d.-]+)/.exec(d)?.[1])
    const midY = (to: { lat: number; lng: number }) =>
      (projectPoint(phnomPenh).y + projectPoint(to).y) / 2
    const liftShort = midY(singapore) - controlY(short)
    const liftLong = midY(lisbon) - controlY(long)
    expect(liftShort).toBeGreaterThan(0)
    expect(liftLong).toBeGreaterThan(liftShort)
  })

  it('takes markers and arcs as JSON attributes, and pins both ends of every arc', async () => {
    const el = await fixture<MoulWorldMap>(html`<moul-world-map
      markers=${JSON.stringify([phnomPenh])}
      arcs=${JSON.stringify([{ from: phnomPenh, to: lisbon }])}
    ></moul-world-map>`)
    expect(el.markers).toHaveLength(1)
    expect(el.arcs).toHaveLength(1)
    expect(all(el, '[part="arc"]')).toHaveLength(1)
    expect(all(el, '[part="beam"]')).toHaveLength(1)
    // Phnom Penh is pinned once, not twice; Lisbon is pinned for the arc.
    expect(all(el, '[part="marker"]')).toHaveLength(2)
  })

  it('ignores places without finite coordinates and attributes that are not JSON arrays', async () => {
    const el = await fixture<MoulWorldMap>(html`<moul-world-map
      markers="not json"
    ></moul-world-map>`)
    expect(el.markers).toEqual([])
    el.markers = [{ lat: Number.NaN, lng: 10 }, phnomPenh] as typeof el.markers
    el.arcs = [{ from: phnomPenh }] as unknown as typeof el.arcs
    await el.updateComplete
    expect(all(el, '[part="marker"]')).toHaveLength(1)
    expect(all(el, '[part="arc"]')).toHaveLength(0)
  })

  it('places pins as a share of the map, so they keep their size at any width', async () => {
    const el = await fixture<MoulWorldMap>(
      html`<moul-world-map></moul-world-map>`,
    )
    el.markers = [{ lat: 0, lng: 0 }]
    await el.updateComplete
    const pin = all(el, '[part="marker"]')[0]
    expect(pin.style.left).toBe('50%')
    expect(Number.parseFloat(pin.style.top)).toBeCloseTo((86 / 146) * 100, 3)
  })

  it('writes labels beside pins only with show-labels, flipping one that would run off the east edge', async () => {
    const el = await fixture<MoulWorldMap>(
      html`<moul-world-map></moul-world-map>`,
    )
    el.markers = [phnomPenh, { lat: -36.85, lng: 174.76, label: 'Auckland' }]
    await el.updateComplete
    expect(all(el, '[part="label"]')).toHaveLength(0)

    // happy-dom has no layout: the map is 300px wide, Auckland's label ends past it.
    const base = shadow(el).querySelector('[part="base"]') as HTMLElement
    base.getBoundingClientRect = () => ({ right: 300 }) as DOMRect
    const rects: Record<string, number> = { 'Phnom Penh': 280, Auckland: 340 }
    const realCreate = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const right = rects[this.textContent?.trim() ?? '']
      return right === undefined
        ? realCreate.call(this)
        : ({ right } as DOMRect)
    }
    try {
      el.showLabels = true
      await el.updateComplete
    } finally {
      HTMLElement.prototype.getBoundingClientRect = realCreate
    }
    expect(el.hasAttribute('show-labels')).toBe(true)
    const labels = all(el, '[part="label"]')
    expect(labels.map((label) => label.textContent?.trim())).toEqual([
      'Phnom Penh',
      'Auckland',
    ])
    expect(labels[0].classList.contains('is-start')).toBe(false)
    expect(labels[1].classList.contains('is-start')).toBe(true)
  })

  it('is one image to screen readers, named by label, with a hidden list of places and routes', async () => {
    const el = await fixture<MoulWorldMap>(html`<moul-world-map
      label="Where our team works"
    ></moul-world-map>`)
    el.markers = [phnomPenh, { lat: 10, lng: 10 }]
    el.arcs = [
      { from: phnomPenh, to: lisbon },
      { from: singapore, to: lisbon, label: 'Backups to Lisbon' },
      { from: { lat: 1, lng: 1 }, to: lisbon },
    ]
    await el.updateComplete

    const map = shadow(el).querySelector('svg')
    expect(map?.getAttribute('role')).toBe('img')
    expect(map?.getAttribute('aria-label')).toBe('Where our team works')
    expect(
      shadow(el).querySelector('.markers')?.getAttribute('aria-hidden'),
    ).toBe('true')
    const items = all(el, '.visually-hidden li').map((li) =>
      li.textContent?.trim(),
    )
    expect(items).toEqual([
      'Phnom Penh',
      'Lisbon',
      'Singapore',
      'Phnom Penh to Lisbon',
      'Backups to Lisbon',
    ])
    // Nothing on the map takes focus.
    expect(shadow(el).querySelector('[tabindex], a, button')).toBeNull()
    expect(el.tabIndex).toBe(-1)
  })

  it('names the map "World map" when no label is given', async () => {
    const el = await fixture<MoulWorldMap>(
      html`<moul-world-map></moul-world-map>`,
    )
    expect(shadow(el).querySelector('svg')?.getAttribute('aria-label')).toBe(
      'World map',
    )
  })

  it('starts drawing the arcs when it scrolls into view, and can draw them again', async () => {
    const el = await fixture<MoulWorldMap>(
      html`<moul-world-map></moul-world-map>`,
    )
    el.arcs = [{ from: phnomPenh, to: lisbon }]
    await el.updateComplete
    const base = () => shadow(el).querySelector('[part="base"]')
    expect(base()?.classList.contains('is-drawing')).toBe(false)

    io.enter(el)
    await el.updateComplete
    expect(base()?.classList.contains('is-drawing')).toBe(true)

    io.leave(el)
    await el.updateComplete
    // Leaving the view pauses the animations; it does not undraw the arcs.
    expect(base()?.classList.contains('is-drawing')).toBe(true)

    await el.play()
    expect(base()?.classList.contains('is-drawing')).toBe(true)
  })

  it('staggers the arcs and runs the light along each one after it is drawn', async () => {
    const el = await fixture<MoulWorldMap>(
      html`<moul-world-map></moul-world-map>`,
    )
    el.arcs = [
      { from: phnomPenh, to: lisbon },
      { from: singapore, to: lisbon },
    ]
    await el.updateComplete
    const groups = all(el, 'svg g')
    expect(
      groups.map((g) => g.style.getPropertyValue('--_world-map-index')),
    ).toEqual(['0', '1'])
    for (const path of all(el, '[part="arc"], [part="beam"]')) {
      expect(path.getAttribute('pathLength')).toBe('1')
    }
    expect(css).toMatch(
      /\.is-drawing \.arc\s*\{[^}]*animation: moul-world-map-draw/,
    )
    expect(css).toMatch(/\.is-drawing \.beam\s*\{[^}]*infinite/)
  })

  it('keeps the arcs about 1.5px thick by writing map units per pixel from its width', async () => {
    const el = await fixture<MoulWorldMap>(
      html`<moul-world-map></moul-world-map>`,
    )
    el.getBoundingClientRect = () => ({ width: 720 }) as DOMRect
    ;(el as unknown as { measure(): void }).measure()
    expect(el.style.getPropertyValue('--_world-map-unit')).toBe('0.5')
    expect(css).toContain('stroke-width: calc(1.5 * var(--_world-map-unit))')
    expect(css).toContain(
      'stroke-width: max(1.1px, calc(1.4px * var(--_world-map-unit)))',
    )
  })

  it('shows a still map under reduced motion: arcs drawn, no light, no pulse', () => {
    const reduced = mediaBlock('(prefers-reduced-motion: reduce)')
    expect(reduced).toMatch(
      /\.arc\s*\{[^}]*stroke-dashoffset: 0px[^}]*animation: none/,
    )
    expect(reduced).toMatch(/\.beam\s*\{[^}]*display: none/)
    expect(reduced).toMatch(/\.marker::before\s*\{[^}]*animation: none/)
  })
})
