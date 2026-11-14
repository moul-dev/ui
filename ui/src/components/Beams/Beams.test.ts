import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
  triggerResize,
} from '../../test-setup'
import './Beams'
import { type BeamsVariant, beamTracks, type MoulBeams } from './Beams'
import { beamsStyles } from './Beams.styles'

/** The stylesheet without its comments. */
const css = beamsStyles.cssText.replace(/\/\*[\s\S]*?\*\//g, '')

/** The body of the first block (`@media`, `@keyframes`) whose prelude starts with `prelude`. */
function block(prelude: string): string | undefined {
  const start = css.indexOf(prelude)
  if (start < 0) return undefined
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) {
      return css.slice(css.indexOf('{', start) + 1, i)
    }
  }
  return undefined
}

/** The declarations of the first rule whose whole selector list is `selector`. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(css)
  return match?.[1] ?? ''
}

const shadow = (el: MoulBeams) => el.shadowRoot as ShadowRoot
const background = (el: MoulBeams) =>
  shadow(el).querySelector('[part="background"]') as HTMLElement
const trackPaths = (el: MoulBeams) => [
  ...shadow(el).querySelectorAll('.tracks path'),
]
const lights = (el: MoulBeams) => [...shadow(el).querySelectorAll('.light')]
const flashes = (el: MoulBeams) => [...shadow(el).querySelectorAll('.flash')]

/** The numbers in a path's data, in order. */
const numbers = (d: string) =>
  [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]))

describe('<moul-beams>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
    vi.restoreAllMocks()
  })

  it('renders a hidden background of paths, then its content', async () => {
    const el = await fixture<MoulBeams>(
      html`<moul-beams><h2>Ship faster</h2></moul-beams>`,
    )
    const layer = background(el)
    expect(layer.getAttribute('aria-hidden')).toBe('true')
    const slot = shadow(el).querySelector('slot')
    expect(slot?.assignedElements().map((node) => node.textContent)).toEqual([
      'Ship faster',
    ])
    expect(layer.compareDocumentPosition(slot as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(el.variant).toBe('beams')
    expect(el.getAttribute('variant')).toBe('beams')
    expect(el.count).toBeUndefined()
    expect(trackPaths(el)).toHaveLength(24)
    expect(lights(el)).toHaveLength(24)
    expect(flashes(el)).toHaveLength(0)
  })

  it('gives every path a pulse of three dashes along the same, normalised path', async () => {
    const el = await fixture<MoulBeams>(
      html`<moul-beams count="4"></moul-beams>`,
    )
    const paths = trackPaths(el)
    lights(el).forEach((light, index) => {
      const pulses = [...light.querySelectorAll('.pulse')]
      expect(pulses.map((pulse) => pulse.getAttribute('class'))).toEqual([
        'pulse tail',
        'pulse body',
        'pulse head',
      ])
      for (const pulse of pulses) {
        expect(pulse.getAttribute('pathLength')).toBe('1')
        expect(pulse.getAttribute('d')).toBe(paths[index].getAttribute('d'))
      }
      const style = light.getAttribute('style') ?? ''
      expect(style).toMatch(/--_beams-speed: [\d.]+;/)
      expect(style).toMatch(/--_beams-phase: [\d.]+;/)
      expect(style).toMatch(/--_beams-tail: [\d.]+;/)
      expect(style).toMatch(/--_beams-rest: -?[\d.]+/)
    })
  })

  describe('variants', () => {
    it('takes lines and rain, and falls back to beams for anything else', async () => {
      const el = await fixture<MoulBeams>(
        html`<moul-beams variant="lines"></moul-beams>`,
      )
      expect(el.variant).toBe('lines')
      expect(trackPaths(el)).toHaveLength(12)
      el.variant = 'rain'
      await el.updateComplete
      expect(el.getAttribute('variant')).toBe('rain')
      expect(trackPaths(el)).toHaveLength(12)
      el.setAttribute('variant', 'confetti')
      await el.updateComplete
      expect(el.variant).toBe('beams')
      expect(el.getAttribute('variant')).toBe('beams')
      expect(trackPaths(el)).toHaveLength(24)
    })

    it('sweeps beams in from beyond the top-left and out past the bottom or right edge', () => {
      for (const track of beamTracks('beams', 24, 1000, 600)) {
        const values = numbers(track.d)
        const [x0, y0] = values
        const [x1, y1] = values.slice(-2)
        expect(x0 <= 0 || y0 <= 0).toBe(true)
        expect(x1 >= 1000 || y1 >= 600).toBe(true)
        expect(x1).toBeGreaterThan(x0)
        expect(y1).toBeGreaterThan(y0)
      }
    })

    it('runs lines across the whole width, each at its own height', () => {
      const tracks = beamTracks('lines', 6, 800, 400)
      for (const track of tracks) {
        const values = numbers(track.d)
        expect(values[0]).toBeLessThan(0)
        expect(values[values.length - 2]).toBeGreaterThan(800)
      }
      const heights = tracks.map((track) => numbers(track.d)[1])
      expect(new Set(heights).size).toBe(6)
    })

    it('drops rain from above the top to the bottom edge, with a flash where each lands', async () => {
      const el = await fixture<MoulBeams>(
        html`<moul-beams variant="rain" count="5"></moul-beams>`,
      )
      triggerResize(background(el), { width: 500, height: 300 })
      await el.updateComplete
      const paths = trackPaths(el)
      const bursts = flashes(el)
      expect(bursts).toHaveLength(5)
      paths.forEach((path, index) => {
        const match = /^M([\d.]+) -2V300$/.exec(path.getAttribute('d') ?? '')
        expect(match).not.toBeNull()
        const left = Number(match?.[1]) / 5
        const style = bursts[index].getAttribute('style') ?? ''
        expect(Number(/left: ([\d.]+)%/.exec(style)?.[1])).toBeCloseTo(left, 0)
        expect(style).toContain('--_beams-speed')
      })
    })
  })

  describe('count', () => {
    it('keeps the number of paths from 1 to 48, rounded', async () => {
      const el = await fixture<MoulBeams>(
        html`<moul-beams count="0"></moul-beams>`,
      )
      expect(trackPaths(el)).toHaveLength(1)
      el.count = 100
      await el.updateComplete
      expect(trackPaths(el)).toHaveLength(48)
      el.count = 7.6
      await el.updateComplete
      expect(trackPaths(el)).toHaveLength(8)
      el.count = -3
      await el.updateComplete
      expect(trackPaths(el)).toHaveLength(1)
    })

    it('uses the variant default when count is unset or not a number', async () => {
      const el = await fixture<MoulBeams>(
        html`<moul-beams variant="lines" count="many"></moul-beams>`,
      )
      expect(trackPaths(el)).toHaveLength(12)
      el.count = 5
      await el.updateComplete
      expect(trackPaths(el)).toHaveLength(5)
      el.count = undefined
      await el.updateComplete
      expect(trackPaths(el)).toHaveLength(12)
    })
  })

  describe('deterministic paths', () => {
    it('draws the same paths for the same variant, count and size, without Math.random', async () => {
      const random = vi.spyOn(Math, 'random')
      const first = await fixture<MoulBeams>(
        html`<moul-beams count="9"></moul-beams>`,
      )
      const second = await fixture<MoulBeams>(
        html`<moul-beams count="9"></moul-beams>`,
      )
      const markup = (el: MoulBeams) =>
        shadow(el)
          .querySelector('.lights')
          ?.innerHTML.replace(/<!--.*?-->/g, '')
      expect(markup(first)).toBe(markup(second))
      expect(random).not.toHaveBeenCalled()

      for (const variant of ['beams', 'lines', 'rain'] as BeamsVariant[]) {
        expect(beamTracks(variant, 12, 640, 360)).toEqual(
          beamTracks(variant, 12, 640, 360),
        )
      }
    })

    it('draws different paths for a different count or variant', () => {
      const beams = beamTracks('beams', 12, 640, 360).map((track) => track.d)
      expect(
        beamTracks('beams', 13, 640, 360).map((track) => track.d),
      ).not.toEqual(beams)
      expect(
        beamTracks('lines', 12, 640, 360).map((track) => track.d),
      ).not.toEqual(beams)
    })

    it('varies speed, starting point and tail from path to path, within bounds', () => {
      const tracks = beamTracks('beams', 24, 1000, 600)
      expect(new Set(tracks.map((track) => track.speed)).size).toBeGreaterThan(
        10,
      )
      expect(new Set(tracks.map((track) => track.phase)).size).toBeGreaterThan(
        10,
      )
      for (const track of tracks) {
        expect(track.speed).toBeGreaterThanOrEqual(0.8)
        expect(track.speed).toBeLessThanOrEqual(1.6)
        expect(track.phase).toBeGreaterThanOrEqual(0)
        expect(track.phase).toBeLessThanOrEqual(1)
        expect(track.tail).toBeGreaterThanOrEqual(0.14)
        expect(track.tail).toBeLessThanOrEqual(0.24)
      }
    })
  })

  describe('size', () => {
    it('draws in a default frame, then redraws at the measured size so strokes stay one pixel', async () => {
      const el = await fixture<MoulBeams>(
        html`<moul-beams count="3"></moul-beams>`,
      )
      const svgs = [...shadow(el).querySelectorAll('svg')]
      expect(svgs).toHaveLength(2)
      for (const svg of svgs) {
        expect(svg.getAttribute('viewBox')).toBe('0 0 1000 600')
        expect(svg.getAttribute('preserveAspectRatio')).toBe('none')
      }
      const before = trackPaths(el).map((path) => path.getAttribute('d'))

      triggerResize(background(el), { width: 800.4, height: 400 })
      await el.updateComplete
      for (const svg of svgs) {
        expect(svg.getAttribute('viewBox')).toBe('0 0 800 400')
      }
      expect(trackPaths(el).map((path) => path.getAttribute('d'))).toEqual(
        beamTracks('beams', 3, 800, 400).map((track) => track.d),
      )
      expect(trackPaths(el).map((path) => path.getAttribute('d'))).not.toEqual(
        before,
      )
    })

    it('keeps the last size while the element has none', async () => {
      const el = await fixture<MoulBeams>(
        html`<moul-beams count="3"></moul-beams>`,
      )
      triggerResize(background(el), { width: 640, height: 320 })
      await el.updateComplete
      triggerResize(background(el), { width: 0, height: 0 })
      await el.updateComplete
      expect(shadow(el).querySelector('svg')?.getAttribute('viewBox')).toBe(
        '0 0 640 320',
      )
    })
  })

  describe('the surface model', () => {
    it('is a positioned, isolated block with no padding or background', () => {
      const host = rule(':host')
      expect(host).toContain('display: block')
      expect(host).toContain('position: relative')
      expect(host).toContain('isolation: isolate')
      expect(host).not.toMatch(/\b(padding|background(-color)?):/)
      expect(css).toMatch(/:host\(\[hidden\]\) \{\s*display: none;/)
    })

    it('puts the paths in a clipped layer behind the content that ignores the pointer', () => {
      const layer = rule('[part="background"]')
      expect(layer).toContain('position: absolute')
      expect(layer).toContain('inset: 0')
      expect(layer).toContain('z-index: -1')
      expect(layer).toContain('overflow: hidden')
      expect(layer).toContain('border-radius: inherit')
      expect(layer).toContain('pointer-events: none')
      expect(css).toMatch(/:host\(:empty\) \{\s*pointer-events: none;/)
    })

    it('mirrors the paths in right-to-left text', () => {
      expect(rule(':host(:dir(rtl)) [part="background"]')).toContain(
        'scale: -1 1',
      )
    })

    it('takes its colours and timing from custom properties with token defaults', () => {
      const host = rule(':host')
      expect(host).toMatch(
        /--_beams-color: var\(\s*--beams-color,\s*light-dark\(\s*color-mix\(in oklab, var\(--color-fg\) 9%, transparent\),\s*color-mix\(in oklab, var\(--color-fg\) 12%, transparent\)/,
      )
      expect(host).toContain(
        '--_beams-light: var(--beams-light, var(--color-accent))',
      )
      expect(host).toContain(
        '--_beams-light-tail: var(--beams-light-tail, var(--color-chart-4))',
      )
      expect(host).toContain('--_beams-duration: var(--beams-duration, 10s)')
      expect(
        rule(':host([variant="lines"]),\n  :host([variant="rain"])'),
      ).toContain('--_beams-duration: var(--beams-duration, 8s)')
    })

    it('moves light with stroke-dashoffset on per-path durations and delays', () => {
      const pulse = rule('.pulse')
      expect(pulse).toContain(
        'stroke-dasharray: calc(var(--_beams-len) * 1px) 4px',
      )
      expect(pulse).toContain(
        'stroke-dashoffset: calc((var(--_beams-len) - var(--_beams-rest)) * 1px)',
      )
      expect(pulse).toContain(
        'animation-duration: calc(var(--_beams-duration) * var(--_beams-speed))',
      )
      expect(pulse).toMatch(
        /animation-delay: calc\(\s*var\(--_beams-duration\) \* var\(--_beams-speed\) \* var\(--_beams-phase\) \* -1\s*\)/,
      )
      for (const name of ['travel', 'flow', 'fall']) {
        expect(block(`@keyframes moul-beams-${name}`)).toContain(
          'stroke-dashoffset: calc((var(--_beams-len) - 1.02 - var(--_beams-tail)) * 1px)',
        )
      }
    })

    it('gives every dash value a px unit, so Chrome interpolates it rather than jumping', () => {
      for (const name of ['travel', 'flow', 'fall']) {
        for (const line of block(`@keyframes moul-beams-${name}`)
          .split('\n')
          .filter((l) => l.includes('stroke-dashoffset'))) {
          expect(line).toMatch(/\* 1px\);$/)
        }
      }
      expect(rule(':host([variant="lines"]) .pulse')).toContain(
        'animation-name: moul-beams-flow',
      )
      expect(rule(':host([variant="rain"]) .pulse')).toContain(
        'animation-name: moul-beams-fall',
      )
      expect(rule('.lights')).toMatch(
        /filter: drop-shadow\(0 0 3px var\(--_beams-glow\)\)/,
      )
    })
  })

  describe('off screen', () => {
    it('pauses every pulse until it is on screen, and again when it leaves', async () => {
      const el = await fixture<MoulBeams>(
        html`<moul-beams count="3"></moul-beams>`,
      )
      expect(background(el).classList.contains('is-offscreen')).toBe(true)
      io.enter(el)
      await el.updateComplete
      expect(background(el).classList.contains('is-offscreen')).toBe(false)
      io.leave(el)
      await el.updateComplete
      expect(background(el).classList.contains('is-offscreen')).toBe(true)
      expect(css).toMatch(
        /\.is-offscreen \.pulse,\s*\.is-offscreen \.flash \{\s*animation-play-state: paused;/,
      )
    })

    it('stops watching for size and the viewport when removed', async () => {
      const el = await fixture<MoulBeams>(
        html`<moul-beams count="3"></moul-beams>`,
      )
      el.remove()
      expect(io.targets).not.toContain(el)
      triggerResize(background(el), { width: 300, height: 200 })
      await el.updateComplete
      expect(shadow(el).querySelector('svg')?.getAttribute('viewBox')).toBe(
        '0 0 1000 600',
      )
    })
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role; the paths are hidden', async () => {
      const el = await fixture<MoulBeams>(
        html`<moul-beams><h2>Ship faster</h2></moul-beams>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      expect(background(el).getAttribute('aria-hidden')).toBe('true')
      expect(shadow(el).querySelector('[tabindex]')).toBeNull()
    })

    it('leaves the content reachable with Tab', async () => {
      const el = await fixture<MoulBeams>(
        html`<moul-beams><button>Start a project</button></moul-beams>`,
      )
      const button = el.querySelector('button') as HTMLButtonElement
      button.focus()
      expect(document.activeElement).toBe(button)
    })

    it('draws no paths where the system forces its colours, or on paper', () => {
      const forced = block('@media (forced-colors: active), print')
      expect(forced).toMatch(/\[part="background"\] \{\s*display: none;/)
    })
  })

  describe('reduced motion', () => {
    it('stops every pulse and flash, leaving the faint paths', () => {
      const reduced = block('@media (prefers-reduced-motion: reduce)')
      expect(reduced).toBeDefined()
      expect(reduced).toMatch(
        /\.pulse,\s*\.flash \{\s*animation: none !important;/,
      )
      expect(reduced).not.toContain('.tracks')
      expect(rule('.flash')).toContain('opacity: 0')
    })

    it('rests every third pulse partway along its path, and hides the rest', () => {
      for (const variant of ['beams', 'lines', 'rain'] as BeamsVariant[]) {
        const tracks = beamTracks(variant, 9, 900, 500)
        tracks.forEach((track, index) => {
          if (index % 3 === 0) {
            // The whole tail is on the path, and the head short of its end.
            expect(track.rest).toBeGreaterThan(track.tail)
            expect(track.rest).toBeLessThan(1)
          } else {
            expect(track.rest).toBeLessThan(0)
          }
        })
      }
    })
  })
})
