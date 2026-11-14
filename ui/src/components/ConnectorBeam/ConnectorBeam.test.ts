import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  type ManualFrames,
  manualAnimationFrames,
  mockIntersectionObserver,
  mockReducedMotion,
  triggerResize,
} from '../../test-setup'
import './index'
import { connectorBeamPath, type MoulConnectorBeam } from './ConnectorBeam'
import { connectorBeamStyles } from './ConnectorBeam.styles'

const css = connectorBeamStyles.cssText

/** The body of the first `@media` block whose query contains `query`. */
function mediaBlock(query: string): string {
  const start = css.indexOf(`@media (${query})`)
  if (start < 0) return ''
  let depth = 0
  for (let index = css.indexOf('{', start); index < css.length; index++) {
    if (css[index] === '{') depth++
    else if (css[index] === '}' && --depth === 0) {
      return css.slice(css.indexOf('{', start) + 1, index)
    }
  }
  return ''
}

const part = (el: MoulConnectorBeam, name: string) =>
  el.shadowRoot?.querySelector<SVGElement>(`[part="${name}"]`) ?? null

/** A box with two 40px squares: `a` at (20, 30) and `b` at (220, 130), and the beam over the box at (100, 100). */
async function scene(attributes = '') {
  const box = document.createElement('div')
  box.style.cssText = 'position: relative; isolation: isolate'
  document.body.append(box)
  box.innerHTML = `<moul-connector-beam from="a" to="b" ${attributes}></moul-connector-beam>
    <div id="a"></div><div id="b"></div>`
  const beam = box.querySelector('moul-connector-beam') as MoulConnectorBeam
  await beam.updateComplete
  const a = box.querySelector('#a') as HTMLElement
  const b = box.querySelector('#b') as HTMLElement
  return { box, beam, a, b }
}

/** Lays the scene out and runs the frame the resize asked for. */
async function layOut(
  frames: ManualFrames,
  parts: { beam: MoulConnectorBeam; a: HTMLElement; b: HTMLElement },
) {
  triggerResize(parts.a, { width: 40, height: 40, left: 120, top: 130 })
  triggerResize(parts.b, { width: 40, height: 40, left: 320, top: 230 })
  triggerResize(parts.beam, { width: 400, height: 300, left: 100, top: 100 })
  frames.step(16)
  await parts.beam.updateComplete
}

describe('connectorBeamPath', () => {
  it('draws a straight line without curvature', () => {
    expect(connectorBeamPath({ x: 0, y: 10 }, { x: 100, y: 10 })).toBe(
      'M 0,10 L 100,10',
    )
  })

  it('lifts the middle of the line by the curvature', () => {
    expect(connectorBeamPath({ x: 0, y: 50 }, { x: 100, y: 50 }, 40)).toBe(
      'M 0,50 Q 50,10 100,50',
    )
    expect(connectorBeamPath({ x: 0, y: 50 }, { x: 100, y: 50 }, -40)).toBe(
      'M 0,50 Q 50,90 100,50',
    )
  })

  it('rounds to hundredths of a pixel', () => {
    expect(
      connectorBeamPath({ x: 1 / 3, y: 2 / 3 }, { x: 10.005, y: 0.1234 }),
    ).toBe('M 0.33,0.67 L 10.01,0.12')
  })
})

describe('<moul-connector-beam>', () => {
  let frames: ManualFrames
  let io: IntersectionMock

  beforeEach(() => {
    frames = manualAnimationFrames()
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    io.restore()
    frames.restore()
  })

  it('draws a line from the centre of one element to the centre of the other', async () => {
    const parts = await scene()
    await layOut(frames, parts)
    const track = part(parts.beam, 'track')
    // a's centre is (140, 150) on screen, (40, 50) in the beam; b's is (240, 150).
    expect(track?.getAttribute('d')).toBe('M 40,50 L 240,150')
    const gradient = parts.beam.shadowRoot?.querySelector('linearGradient')
    expect(gradient?.getAttribute('gradientUnits')).toBe('userSpaceOnUse')
    expect(gradient?.getAttribute('x1')).toBe('40')
    expect(gradient?.getAttribute('y2')).toBe('150')
  })

  it('runs the light along the same path, measured in thousandths of it', async () => {
    const parts = await scene()
    await layOut(frames, parts)
    const lights = parts.beam.shadowRoot?.querySelectorAll('.light path') ?? []
    expect(lights.length).toBe(2)
    for (const light of lights) {
      expect(light.getAttribute('d')).toBe('M 40,50 L 240,150')
      expect(light.getAttribute('pathLength')).toBe('1000')
    }
  })

  it('curves the line and moves its ends by the offsets', async () => {
    const parts = await scene(
      'curvature="50" start-x-offset="10" end-y-offset="-20"',
    )
    await layOut(frames, parts)
    // Start (50, 50), end (240, 130): control point midway, lifted by 50.
    expect(part(parts.beam, 'track')?.getAttribute('d')).toBe(
      'M 50,50 Q 145,40 240,130',
    )
  })

  it('redraws when an end changes size or moves, at most once per frame', async () => {
    const parts = await scene()
    await layOut(frames, parts)
    triggerResize(parts.b, { width: 40, height: 40, left: 420, top: 230 })
    triggerResize(parts.beam, { width: 400, height: 300, left: 100, top: 100 })
    expect(frames.pending).toBe(1)
    frames.step(32)
    await parts.beam.updateComplete
    expect(part(parts.beam, 'track')?.getAttribute('d')).toBe(
      'M 40,50 L 340,150',
    )
  })

  it('draws nothing until both ends exist, then finds an end added later', async () => {
    const box = document.createElement('div')
    box.innerHTML = `<moul-connector-beam from="a" to="late"></moul-connector-beam>
      <div id="a"></div>`
    document.body.append(box)
    const beam = box.querySelector('moul-connector-beam') as MoulConnectorBeam
    await beam.updateComplete
    expect(part(beam, 'track')).toBeNull()

    const late = document.createElement('div')
    late.id = 'late'
    box.append(late)
    // The mutation observer runs as a microtask.
    await new Promise((resolve) => setTimeout(resolve))
    const a = box.querySelector('#a') as HTMLElement
    await layOut(frames, { beam, a, b: late })
    expect(part(beam, 'track')?.getAttribute('d')).toBe('M 40,50 L 240,150')
  })

  it('follows a change of `to` to another element', async () => {
    const parts = await scene()
    await layOut(frames, parts)
    const c = document.createElement('div')
    c.id = 'c'
    parts.box.append(c)
    parts.beam.to = 'c'
    await parts.beam.updateComplete
    triggerResize(c, { width: 20, height: 20, left: 90, top: 290 })
    triggerResize(parts.beam, { width: 400, height: 300, left: 100, top: 100 })
    frames.step(48)
    await parts.beam.updateComplete
    expect(part(parts.beam, 'track')?.getAttribute('d')).toBe('M 40,50 L 0,200')
  })

  it('writes duration and delay in milliseconds, falling back on nonsense', async () => {
    const parts = await scene('duration="1800" delay="600"')
    expect(
      parts.beam.style.getPropertyValue('--_connector-beam-duration'),
    ).toBe('1800ms')
    expect(parts.beam.style.getPropertyValue('--_connector-beam-delay')).toBe(
      '600ms',
    )
    parts.beam.duration = Number.NaN
    parts.beam.delay = -5
    await parts.beam.updateComplete
    expect(
      parts.beam.style.getPropertyValue('--_connector-beam-duration'),
    ).toBe('3000ms')
    expect(parts.beam.style.getPropertyValue('--_connector-beam-delay')).toBe(
      '0ms',
    )
  })

  it('sends the light the other way with is-reversed', async () => {
    const parts = await scene('is-reversed')
    expect(parts.beam.isReversed).toBe(true)
    expect(css).toMatch(
      /:host\(\[is-reversed\]\) \.halo,\s*:host\(\[is-reversed\]\) \.core\s*\{\s*animation-direction: reverse/,
    )
  })

  it('pauses the light while off screen', async () => {
    const parts = await scene()
    await layOut(frames, parts)
    const svgEl = part(parts.beam, 'svg')
    io.leave(parts.beam)
    await parts.beam.updateComplete
    expect(svgEl?.classList.contains('is-offscreen')).toBe(true)
    io.enter(parts.beam)
    await parts.beam.updateComplete
    expect(svgEl?.classList.contains('is-offscreen')).toBe(false)
    expect(css).toMatch(
      /\.is-offscreen \.halo,\s*\.is-offscreen \.core\s*\{\s*animation-play-state: paused/,
    )
  })

  it('covers its box as a layer that lets the pointer through', () => {
    expect(css).toMatch(/:host\s*\{[^}]*position: absolute/)
    expect(css).toMatch(/:host\s*\{[^}]*inset: 0/)
    expect(css).toMatch(/:host\s*\{[^}]*pointer-events: none/)
    expect(css).toMatch(/:host\s*\{[^}]*z-index: -1/)
  })

  it('only moves the dash, so nothing is laid out while it runs', () => {
    const keyframes = css.slice(css.indexOf('@keyframes'))
    expect(keyframes).toContain('stroke-dashoffset')
    expect(keyframes).not.toMatch(/\b(width|height|d|top|left):/)
  })

  describe('keyboard and screen readers', () => {
    it('is hidden from assistive technology and never takes focus', async () => {
      const parts = await scene()
      await layOut(frames, parts)
      expect(parts.beam.getAttribute('aria-hidden')).toBe('true')
      expect(part(parts.beam, 'svg')?.getAttribute('aria-hidden')).toBe('true')
      expect(parts.beam.hasAttribute('tabindex')).toBe(false)
      expect(parts.beam.shadowRoot?.querySelector('[tabindex]')).toBeNull()
    })

    it('draws a plain line in the system colour when colours are forced', () => {
      const forced = mediaBlock('forced-colors: active')
      expect(forced).toContain('stroke: CanvasText')
      expect(forced).toMatch(/\.light\s*\{\s*display: none/)
    })
  })

  describe('reduced motion', () => {
    it('stops the light and keeps the line, in the light colours', () => {
      const block = mediaBlock('prefers-reduced-motion: reduce')
      expect(block).toMatch(/\.light\s*\{\s*display: none/)
      expect(block).toContain('animation: none')
      expect(block).toMatch(/\.track\s*\{\s*stroke: url\(#gradient\)/)
    })

    it('re-renders when the setting changes, without losing the line', async () => {
      const motion = mockReducedMotion(false)
      try {
        const parts = await scene()
        await layOut(frames, parts)
        motion.set(true)
        await parts.beam.updateComplete
        expect(part(parts.beam, 'track')?.getAttribute('d')).toBe(
          'M 40,50 L 240,150',
        )
      } finally {
        motion.restore()
      }
    })
  })
})
