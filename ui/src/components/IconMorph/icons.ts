import { nothing, type SVGTemplateResult, svg } from 'lit'

/** The built-in icon names of `moul-icon-morph`. */
export type IconMorphName =
  | 'menu'
  | 'close'
  | 'plus'
  | 'minus'
  | 'check'
  | 'chevron-up'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'play'
  | 'pause'
  | 'more'
  | 'loader'
  | 'error'
  | 'sun'
  | 'moon'
  | 'system'

/** `[x1, y1, x2, y2, opacity = 1, weight = 1]`, or 0 for an unused segment. */
type Segment = readonly number[] | 0

/** An unused segment: collapsed to the centre and transparent, so its round caps leave no dot. */
const UNUSED = [12, 12, 12, 12, 0, 1]

/**
 * A line icon as 21 numbers: three segments of `[x1, y1, x2, y2, opacity,
 * weight]` (weight multiplies the stroke width), then a ring of radius 10 as
 * `[length 0–1, rotation in degrees, opacity]`, drawn clockwise from the top.
 * Every line icon has this shape, so any two morph by interpolating it.
 */
const line = (segments: Segment[], ring: [number, number] = [0, 0]) => [
  ...segments.flatMap((s) =>
    s ? [s[0], s[1], s[2], s[3], s[4] ?? 1, s[5] ?? 1] : UNUSED,
  ),
  ring[0],
  -90,
  ring[1],
]

/** Where the ring rotation sits in a line icon's numbers. */
export const RING_ROTATION = 19

const travel = (ax: number, ay: number, bx: number, by: number) =>
  (ax - bx) ** 2 + (ay - by) ** 2

/** Turns an angle difference into the short way round, in [-half, half]. */
const shortTurn = (turn: number, half: number) =>
  turn - 2 * half * Math.round(turn / (2 * half))

/**
 * Blends line icon `a` toward `b` by `t`. Each segment's ends pair with the
 * nearer ends of its target, then the segment moves its centre, changes its
 * length and turns the short way, so strokes rotate instead of shearing. A
 * zero-length segment (unused, or a dot) takes the other one's angle. The
 * ring also turns the short way; everything else blends linearly.
 */
export function mixLine(a: number[], b: number[], t: number): number[] {
  const out = a.map((v, i) => v + (b[i] - v) * t)
  for (let i = 0; i < 18; i += 6) {
    const [ax1, ay1, ax2, ay2] = a.slice(i, i + 4)
    let [bx1, by1, bx2, by2] = b.slice(i, i + 4)
    // On a tie the ends keep their order, so icon data decides the turn.
    if (
      travel(ax1, ay1, bx2, by2) + travel(ax2, ay2, bx1, by1) <
      travel(ax1, ay1, bx1, by1) + travel(ax2, ay2, bx2, by2) - 1e-6
    ) {
      ;[bx1, by1, bx2, by2] = [bx2, by2, bx1, by1]
    }
    const lengthA = Math.hypot(ax2 - ax1, ay2 - ay1)
    const lengthB = Math.hypot(bx2 - bx1, by2 - by1)
    let angleA = Math.atan2(ay2 - ay1, ax2 - ax1)
    let angleB = Math.atan2(by2 - by1, bx2 - bx1)
    if (lengthA < 0.05) angleA = angleB
    if (lengthB < 0.05) angleB = angleA
    const angle = angleA + shortTurn(angleB - angleA, Math.PI) * t
    const half = (lengthA + (lengthB - lengthA) * t) / 2
    const cx = (ax1 + ax2 + (bx1 + bx2 - ax1 - ax2) * t) / 2
    const cy = (ay1 + ay2 + (by1 + by2 - ay1 - ay2) * t) / 2
    out[i] = cx - Math.cos(angle) * half
    out[i + 1] = cy - Math.sin(angle) * half
    out[i + 2] = cx + Math.cos(angle) * half
    out[i + 3] = cy + Math.sin(angle) * half
  }
  out[RING_ROTATION] =
    a[RING_ROTATION] + shortTurn(b[RING_ROTATION] - a[RING_ROTATION], 180) * t
  return out
}

/*
 * Segment slots are chosen so the common pairs read well: menu's top and
 * bottom bars become the two strokes of close, check and the chevrons and the
 * two heads of an arrow; menu's middle bar becomes an arrow's shaft. The
 * order of a segment's ends does not matter (see `mixLine`).
 */
// biome-ignore format: one icon per line keeps the table readable
export const LINE_ICONS = new Map<string, number[]>([
  ['menu', line([[4, 6, 20, 6], [4, 12, 20, 12], [4, 18, 20, 18]])],
  ['close', line([[6, 6, 18, 18], 0, [6, 18, 18, 6]])],
  ['plus', line([[5, 12, 19, 12], 0, [12, 19, 12, 5]])],
  ['minus', line([[5, 12, 19, 12], 0, 0])],
  ['check', line([[4, 12, 9, 17], 0, [9, 17, 20, 6]])],
  ['chevron-up', line([[6, 15, 12, 9], 0, [18, 15, 12, 9]])],
  ['chevron-down', line([[6, 9, 12, 15], 0, [18, 9, 12, 15]])],
  ['chevron-left', line([[15, 6, 9, 12], 0, [15, 18, 9, 12]])],
  ['chevron-right', line([[9, 6, 15, 12], 0, [9, 18, 15, 12]])],
  // Shafts run tail to tip and heads tip outwards, so a quarter turn between
  // two arrows (an exact tie in travel) turns every stroke the same way.
  ['arrow-up', line([[12, 5, 5, 12], [12, 19, 12, 5], [12, 5, 19, 12]])],
  ['arrow-down', line([[12, 19, 5, 12], [12, 5, 12, 19], [12, 19, 19, 12]])],
  ['arrow-left', line([[5, 12, 12, 5], [19, 12, 5, 12], [5, 12, 12, 19]])],
  ['arrow-right', line([[19, 12, 12, 5], [5, 12, 19, 12], [19, 12, 12, 19]])],
  ['play', line([[6, 4, 20, 12], [6, 4, 6, 20], [6, 20, 20, 12]])],
  // The third bar hides on the second, so both slanted play edges fold into it.
  ['pause', line([[16, 5, 16, 19], [8, 5, 8, 19], [16, 5, 16, 19, 0]])],
  [
    'more',
    line([
      [5, 12, 5.01, 12, 1, 2],
      [12, 12, 12.01, 12, 1, 2],
      [19, 12, 19.01, 12, 1, 2],
    ]),
  ],
  ['loader', line([0, 0, 0], [0.75, 1])],
  ['error', line([[12, 16, 12.01, 16], 0, [12, 8, 12, 12]], [1, 1])],
])

/**
 * `sun`, `moon` and `system` as `[disc radius, cut x, cut y, cut radius, ray
 * inner radius, ray outer radius, ray opacity, ray rotation, half-fill
 * radius]`. The cut circle bites the crescent out of the disc; out at
 * (26, -2) it misses the disc entirely.
 */
export const THEME_ICONS = new Map<string, number[]>([
  ['sun', [4, 26, -2, 6.4, 8, 10, 1, 0, 0]],
  ['moon', [9, 16.5, 7.5, 6.4, 9, 9, 0, 45, 0]],
  ['system', [9, 26, -2, 6.4, 9, 9, 0, 45, 5]],
])

const RING = 2 * Math.PI * 10

/** Rounds to three decimals so attributes stay short. */
export const round = (value: number): number => Math.round(value * 1000) / 1000

/** Draws a line icon; `isSpinning` turns the ring with the `spin` class. */
export function lineSvg(g: number[], isSpinning: boolean): SVGTemplateResult {
  const n = g.map(round)
  return svg`
    <g class=${isSpinning ? 'spin' : nothing}>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke-dasharray="${round(g[18] * RING)} ${round(RING)}"
        transform="rotate(${n[19]} 12 12)"
        opacity=${n[20]}
      />
    </g>
    ${[0, 6, 12].map(
      (i) => svg`<line
        x1=${n[i]}
        y1=${n[i + 1]}
        x2=${n[i + 2]}
        y2=${n[i + 3]}
        opacity=${n[i + 4]}
        style=${
          n[i + 5] === 1
            ? nothing
            : `stroke-width: calc(var(--icon-morph-stroke-width, 2) * ${n[i + 5]})`
        }
      />`,
    )}
  `
}

/**
 * Draws `sun`, `moon` or `system`. Two masks keep the outline a single
 * stroke: the disc is drawn outside the cut circle, and the cut circle's edge
 * only inside the disc, which together outline the crescent.
 */
export function themeSvg(g: number[], id: string): SVGTemplateResult {
  const [disc, cx, cy, cut, rayIn, rayOut, rayOpacity, rayTurn, half] =
    g.map(round)
  const rays = Array.from({ length: 8 }, (_, i) => {
    const angle = ((i * 45 + rayTurn) * Math.PI) / 180
    const x = Math.sin(angle)
    const y = -Math.cos(angle)
    return svg`<line
      x1=${round(12 + x * rayIn)}
      y1=${round(12 + y * rayIn)}
      x2=${round(12 + x * rayOut)}
      y2=${round(12 + y * rayOut)}
    />`
  })
  return svg`
    <mask id="${id}-disc" maskUnits="userSpaceOnUse">
      <rect width="24" height="24" fill="white" />
      <circle cx=${cx} cy=${cy} r=${cut} fill="black" />
    </mask>
    <mask id="${id}-cut" maskUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r=${disc} fill="white" />
    </mask>
    <circle cx="12" cy="12" r=${disc} mask="url(#${id}-disc)" />
    <circle cx=${cx} cy=${cy} r=${cut} mask="url(#${id}-cut)" />
    ${
      half > 0
        ? svg`<path
            class="fill"
            d="M12 ${round(12 - half)}a${half} ${half} 0 0 1 0 ${round(2 * half)}z"
            mask="url(#${id}-disc)"
          />`
        : nothing
    }
    <g opacity=${rayOpacity}>${rays}</g>
  `
}
