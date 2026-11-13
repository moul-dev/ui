import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './IconMorph'
import type { MoulIconMorph } from './IconMorph'
import { iconMorphStyles } from './IconMorph.styles'
import { LINE_ICONS, mixLine, RING_ROTATION, THEME_ICONS } from './icons'

const root = (el: MoulIconMorph) => el.shadowRoot as ShadowRoot
const layers = (el: MoulIconMorph) => [...root(el).querySelectorAll('.layer')]
const builtIns = (el: MoulIconMorph) => [
  ...root(el).querySelectorAll('svg[part="svg"]'),
]

/** Sorts a segment's ends so their order does not matter. */
const sortEnds = ([x1, y1, x2, y2, ...rest]: number[]) =>
  x1 < x2 || (x1 === x2 && y1 <= y2)
    ? [x1, y1, x2, y2, ...rest]
    : [x2, y2, x1, y1, ...rest]

/** The three segments of the line icon on screen, with their opacity. */
function segments(el: MoulIconMorph): number[][] {
  return [...root(el).querySelectorAll('svg > line')].map((line) =>
    sortEnds(
      ['x1', 'y1', 'x2', 'y2', 'opacity'].map((a) =>
        Number(line.getAttribute(a)),
      ),
    ),
  )
}

/** A built-in line icon's segments, in the same form. */
function expected(name: string): number[][] {
  const g = LINE_ICONS.get(name) as number[]
  return [0, 6, 12].map((i) => sortEnds(g.slice(i, i + 5)))
}

function expectClose(actual: number[][], wanted: number[][], within = 0.001) {
  expect(actual).toHaveLength(wanted.length)
  actual.flat().forEach((value, i) => {
    expect(Math.abs(value - wanted.flat()[i])).toBeLessThanOrEqual(within)
  })
}

const discRadius = (el: MoulIconMorph) =>
  Number(root(el).querySelector('svg > circle')?.getAttribute('r'))

/** Waits for a morph or cross-fade to land on `name`. */
async function settled(el: MoulIconMorph, name: string) {
  await vi.waitFor(
    () => {
      expect(layers(el)).toHaveLength(1)
      expect(layers(el)[0].hasAttribute('style')).toBe(false)
      if (LINE_ICONS.has(name)) expectClose(segments(el), expected(name))
      if (THEME_ICONS.has(name)) {
        expect(discRadius(el)).toBe(THEME_ICONS.get(name)?.[0])
      }
    },
    { timeout: 2000, interval: 10 },
  )
}

describe('<moul-icon-morph>', () => {
  let motion: ReducedMotionMock | undefined

  afterEach(() => {
    motion?.restore()
    motion = undefined
    vi.restoreAllMocks()
  })

  it('renders the named icon at rest on first render and reflects name', async () => {
    const el = await fixture<MoulIconMorph>(
      html`<moul-icon-morph name="menu"></moul-icon-morph>`,
    )
    expect(customElements.get('moul-icon-morph')).toBeDefined()
    expect(root(el).querySelector('[part="base"]')).not.toBeNull()
    expect(layers(el)).toHaveLength(1)
    expect(layers(el)[0].hasAttribute('style')).toBe(false)
    expectClose(segments(el), expected('menu'))

    el.name = 'close'
    await el.updateComplete
    expect(el.getAttribute('name')).toBe('close')
  })

  it('renders every built-in name as a built-in svg', async () => {
    const el = await fixture<MoulIconMorph>(
      html`<moul-icon-morph></moul-icon-morph>`,
    )
    expect(layers(el)).toHaveLength(0)
    motion = mockReducedMotion(true)
    for (const name of [...LINE_ICONS.keys(), ...THEME_ICONS.keys()]) {
      el.name = name
      await el.updateComplete
      expect(builtIns(el), name).toHaveLength(1)
    }
  })

  it('morphs line icons in one layer and lands on the target geometry', async () => {
    const el = await fixture<MoulIconMorph>(
      html`<moul-icon-morph name="menu"></moul-icon-morph>`,
    )
    el.name = 'close'
    await el.updateComplete
    expect(layers(el)).toHaveLength(1)
    await settled(el, 'close')
    expect(
      root(el).querySelectorAll('svg > line')[1].getAttribute('opacity'),
    ).toBe('0')
  })

  // Real frames under a loaded test runner can skip the mid-morph window, so retry.
  it('continues an interrupted morph from the current geometry', {
    retry: 3,
  }, async () => {
    const el = await fixture<MoulIconMorph>(
      html`<moul-icon-morph name="menu"></moul-icon-morph>`,
    )
    el.name = 'close'
    await el.updateComplete

    // The top bar's right end travels from (20, 6) to (18, 18): wait until it is part way.
    const progress = () => (segments(el)[0][3] - 6) / 12
    expect(progress()).toBeLessThan(0.1)
    await vi.waitFor(
      () => {
        expect(progress()).toBeGreaterThan(0.02)
        expect(progress()).toBeLessThan(0.98)
      },
      { timeout: 2000, interval: 1 },
    )
    const midway = segments(el)

    el.name = 'plus'
    await el.updateComplete
    // It starts from where it was, not from menu and not from close.
    expectClose(segments(el), midway, 0.05)
    expect(layers(el)).toHaveLength(1)

    await settled(el, 'plus')
  })

  it('morphs sun into moon in one layer: the disc grows and the cut slides in', async () => {
    const el = await fixture<MoulIconMorph>(
      html`<moul-icon-morph name="sun"></moul-icon-morph>`,
    )
    expect(discRadius(el)).toBe(4)
    el.name = 'moon'
    await el.updateComplete
    await vi.waitFor(() => expect(discRadius(el)).toBeGreaterThan(4), {
      interval: 5,
    })
    expect(layers(el)).toHaveLength(1)
    await settled(el, 'moon')
    expect(discRadius(el)).toBe(9)
    expect(root(el).querySelectorAll('mask')).toHaveLength(2)
  })

  it('cross-fades between icons that cannot morph', async () => {
    const el = await fixture<MoulIconMorph>(
      html`<moul-icon-morph name="menu"></moul-icon-morph>`,
    )
    el.name = 'sun'
    await el.updateComplete
    expect(layers(el)).toHaveLength(2)
    const [leaving, entering] = layers(el)
    expect(leaving.querySelector('svg > line')).not.toBeNull()
    expect(entering.getAttribute('style')).toContain('opacity: 0')
    await settled(el, 'sun')
    expect(discRadius(el)).toBe(4)
  })

  it('brings a leaving icon back from where it is when the name returns', async () => {
    const el = await fixture<MoulIconMorph>(
      html`<moul-icon-morph name="menu"></moul-icon-morph>`,
    )
    el.name = 'sun'
    await el.updateComplete
    el.name = 'close'
    await el.updateComplete
    // The leaving line layer turns around and morphs to close; no third layer.
    expect(layers(el)).toHaveLength(2)
    await settled(el, 'close')
  })

  describe('custom icons', () => {
    it('shows a slotted icon and lets it override a built-in of the same name', async () => {
      const el = await fixture<MoulIconMorph>(html`
        <moul-icon-morph name="check">
          <svg slot="check" id="custom" viewBox="0 0 256 256"></svg>
          <svg slot="heart" viewBox="0 0 256 256"></svg>
        </moul-icon-morph>
      `)
      expect(builtIns(el)).toHaveLength(0)
      const slots = root(el).querySelectorAll('slot')
      expect(slots).toHaveLength(1)
      expect(slots[0].getAttribute('name')).toBe('check')
    })

    it('cross-fades to and from a custom icon', async () => {
      const el = await fixture<MoulIconMorph>(html`
        <moul-icon-morph name="heart">
          <svg slot="heart" viewBox="0 0 256 256"></svg>
        </moul-icon-morph>
      `)
      el.name = 'menu'
      await el.updateComplete
      expect(layers(el)).toHaveLength(2)
      expect(layers(el)[0].querySelector('slot')).not.toBeNull()
      await settled(el, 'menu')

      el.name = 'heart'
      await el.updateComplete
      expect(layers(el)).toHaveLength(2)
      await settled(el, 'heart')
      expect(root(el).querySelector('slot')?.getAttribute('name')).toBe('heart')
    })

    it('picks up a custom icon added after the name was set', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const el = await fixture<MoulIconMorph>(
        html`<moul-icon-morph name="later-icon"></moul-icon-morph>`,
      )
      expect(layers(el)).toHaveLength(0)
      motion = mockReducedMotion(true)
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      icon.setAttribute('slot', 'later-icon')
      el.append(icon)
      await vi.waitFor(() =>
        expect(root(el).querySelector('slot')?.getAttribute('name')).toBe(
          'later-icon',
        ),
      )
      icon.remove()
      await vi.waitFor(() => expect(layers(el)).toHaveLength(0))
    })
  })

  it('renders nothing for an unknown name and warns once per name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const first = await fixture<MoulIconMorph>(
      html`<moul-icon-morph name="no-such-icon"></moul-icon-morph>`,
    )
    const second = await fixture<MoulIconMorph>(
      html`<moul-icon-morph name="no-such-icon"></moul-icon-morph>`,
    )
    expect(layers(first)).toHaveLength(0)
    expect(layers(second)).toHaveLength(0)
    expect(
      warn.mock.calls.filter(([message]) =>
        String(message).includes('"no-such-icon"'),
      ),
    ).toHaveLength(1)

    // A built-in name that is also an Object.prototype key is still unknown.
    first.name = 'toString'
    await first.updateComplete
    expect(layers(first)).toHaveLength(0)
  })

  describe('loader', () => {
    it('spins while shown and stops spinning once it morphs away', async () => {
      const el = await fixture<MoulIconMorph>(
        html`<moul-icon-morph name="loader"></moul-icon-morph>`,
      )
      expect(root(el).querySelector('.spin')).not.toBeNull()
      el.name = 'check'
      await el.updateComplete
      expect(root(el).querySelector('.spin')).toBeNull()
      expect(layers(el)).toHaveLength(1)
      await settled(el, 'check')
    })

    it('keeps the arc where the spin left it when it stops spinning', async () => {
      const el = await fixture<MoulIconMorph>(
        html`<moul-icon-morph name="loader"></moul-icon-morph>`,
      )
      const spin = root(el).querySelector('.spin') as SVGGElement
      // Halfway through a 750ms turn: the arc is half a turn past its start.
      spin.getAnimations = () => [
        {
          currentTime: 1125,
          effect: { getComputedTiming: () => ({ duration: 750 }) },
        } as unknown as Animation,
      ]
      el.name = 'error'
      await el.updateComplete
      const ring = root(el).querySelector('svg > g > circle') as SVGElement
      expect(ring.getAttribute('transform')).toBe('rotate(90 12 12)')
      await settled(el, 'error')
    })

    it('pulses instead of spinning under reduced motion', () => {
      const css = iconMorphStyles.map((sheet) => String(sheet)).join('\n')
      expect(css).toMatch(
        /@media \(prefers-reduced-motion: reduce\)\s*{\s*\.spin\s*{\s*animation: icon-morph-pulse/,
      )
    })
  })

  describe('reduced motion', () => {
    it('swaps line icons at once', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulIconMorph>(
        html`<moul-icon-morph name="menu"></moul-icon-morph>`,
      )
      el.name = 'close'
      await el.updateComplete
      expect(layers(el)).toHaveLength(1)
      expect(layers(el)[0].hasAttribute('style')).toBe(false)
      expectClose(segments(el), expected('close'))
    })

    it('swaps across families at once, with no cross-fade', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulIconMorph>(
        html`<moul-icon-morph name="menu"></moul-icon-morph>`,
      )
      el.name = 'moon'
      await el.updateComplete
      expect(layers(el)).toHaveLength(1)
      expect(layers(el)[0].hasAttribute('style')).toBe(false)
      expect(discRadius(el)).toBe(9)
    })
  })

  describe('keyboard and screen readers', () => {
    it('is decorative without a label and an image named by it with one', async () => {
      const el = await fixture<MoulIconMorph>(
        html`<moul-icon-morph name="menu"></moul-icon-morph>`,
      )
      expect(el.getAttribute('aria-hidden')).toBe('true')
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-label')).toBe(false)

      el.label = 'Open menu'
      await el.updateComplete
      expect(el.getAttribute('role')).toBe('img')
      expect(el.getAttribute('aria-label')).toBe('Open menu')
      expect(el.hasAttribute('aria-hidden')).toBe(false)

      el.label = ''
      await el.updateComplete
      expect(el.getAttribute('aria-hidden')).toBe('true')
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-label')).toBe(false)
    })

    it('reads label from the attribute', async () => {
      const el = await fixture<MoulIconMorph>(
        html`<moul-icon-morph name="sun" label="Light theme"></moul-icon-morph>`,
      )
      expect(el.getAttribute('role')).toBe('img')
      expect(el.getAttribute('aria-label')).toBe('Light theme')
    })

    it('takes no focus and keeps its svg out of the tab order and the tree', async () => {
      const el = await fixture<MoulIconMorph>(html`
        <div>
          <button id="before">Before</button>
          <moul-icon-morph name="menu"></moul-icon-morph>
        </div>
      `)
      const icon = el.querySelector('moul-icon-morph') as MoulIconMorph
      expect(icon.hasAttribute('tabindex')).toBe(false)
      expect(
        root(icon).querySelector('a, button, input, [tabindex]'),
      ).toBeNull()
      const svg = builtIns(icon)[0]
      expect(svg.getAttribute('aria-hidden')).toBe('true')
      expect(svg.getAttribute('focusable')).toBe('false')
    })
  })

  it('stops a running morph on disconnect and comes back at rest', async () => {
    const el = await fixture<MoulIconMorph>(
      html`<moul-icon-morph name="menu"></moul-icon-morph>`,
    )
    el.name = 'sun'
    await el.updateComplete
    expect(layers(el)).toHaveLength(2)
    const parent = el.parentElement as HTMLElement
    el.remove()
    await el.updateComplete
    expect(layers(el)).toHaveLength(1)
    expect(layers(el)[0].hasAttribute('style')).toBe(false)
    parent.append(el)
    await el.updateComplete
    expect(discRadius(el)).toBe(4)
  })

  it('reflects size and leaves it unset by default so it follows the font size', async () => {
    const el = await fixture<MoulIconMorph>(
      html`<moul-icon-morph name="plus"></moul-icon-morph>`,
    )
    expect(el.hasAttribute('size')).toBe(false)
    el.size = 'lg'
    await el.updateComplete
    expect(el.getAttribute('size')).toBe('lg')
  })

  describe('mixLine', () => {
    const length = (g: number[], i: number) =>
      Math.hypot(g[i + 2] - g[i], g[i + 3] - g[i + 1])
    const angle = (g: number[], i: number) =>
      (Math.atan2(g[i + 3] - g[i + 1], g[i + 2] - g[i]) * 180) / Math.PI

    it('turns strokes about their centres instead of shearing them', () => {
      const close = LINE_ICONS.get('close') as number[]
      const plus = LINE_ICONS.get('plus') as number[]
      const half = mixLine(close, plus, 0.5)
      // close's strokes are 16.97 long and plus's 14: halfway is halfway between.
      expect(length(half, 0)).toBeCloseTo((Math.hypot(12, 12) + 14) / 2, 3)
      expect(length(half, 12)).toBeCloseTo((Math.hypot(12, 12) + 14) / 2, 3)
      expect(Math.abs(angle(half, 0) % 180)).toBeCloseTo(22.5, 3)
    })

    it('starts exactly where it is and ends on the target', () => {
      const menu = LINE_ICONS.get('menu') as number[]
      const check = LINE_ICONS.get('check') as number[]
      expectClose([mixLine(menu, check, 0)], [menu])
      const end = mixLine(menu, check, 1)
      expectClose(
        [0, 6, 12].map((i) => sortEnds(end.slice(i, i + 5))),
        expected('check'),
      )
    })

    it('turns every stroke of an arrow the same way on a quarter turn', () => {
      const right = LINE_ICONS.get('arrow-right') as number[]
      const up = LINE_ICONS.get('arrow-up') as number[]
      const early = mixLine(right, up, 0.1)
      for (const i of [0, 6, 12]) {
        const turn = angle(early, i) - angle(right, i)
        expect(((turn + 540) % 360) - 180, `segment ${i / 6}`).toBeLessThan(0)
      }
    })

    it('flips a chevron through a flat line', () => {
      const down = LINE_ICONS.get('chevron-down') as number[]
      const up = LINE_ICONS.get('chevron-up') as number[]
      const half = mixLine(down, up, 0.5)
      expect(half[1]).toBeCloseTo(12, 3)
      expect(half[3]).toBeCloseTo(12, 3)
      expect(half[13]).toBeCloseTo(12, 3)
      expect(half[15]).toBeCloseTo(12, 3)
    })

    it('turns the ring the short way round', () => {
      const loader = [...(LINE_ICONS.get('loader') as number[])]
      loader[RING_ROTATION] = 250
      const check = LINE_ICONS.get('check') as number[]
      expect(mixLine(loader, check, 1)[RING_ROTATION]).toBeCloseTo(270, 3)
    })
  })
})
