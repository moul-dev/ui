import { type AnimationPlaybackControls, animate } from 'motion'
import { EASE_OUT } from '../../utils/motion'

/** Room around the menu for blobs to overshoot and blur without being cut off. */
const BLEED = 16
/** A soft spring that overshoots a little, so each drop wobbles into place. */
const DROP_SPRING = {
  type: 'spring',
  stiffness: 360,
  damping: 22,
  mass: 0.9,
} as const
const EASE_IN = [0.55, 0, 0.75, 0.2] as const
const REST = 'translate(0px, 0px) scale(1, 1)'

/**
 * One gooey layout: a pill at the trigger edge and one blob per menu row. At
 * rest the blobs tile the panel, so they fuse into its shape; tucked, they
 * shrink into the pill.
 */
export interface GooScene {
  pill: HTMLElement
  blobs: HTMLElement[]
  /** The menu rows that match `blobs`, whose text fades with them. */
  rows: HTMLElement[]
  tucked: string[]
  /** The pill pulled back behind the trigger edge, where the layer clips it. */
  pillHidden: string
  /** True when the menu hangs below the trigger. */
  down: boolean
}

const px = (value: number): string => `${Math.round(value * 10) / 10}px`

function setBox(
  el: HTMLElement,
  left: number,
  top: number,
  width: number,
  height: number,
): void {
  el.style.left = px(left)
  el.style.top = px(top)
  el.style.width = px(width)
  el.style.height = px(height)
}

/**
 * Sizes the goo layer from the trigger edge to past the far side of the panel
 * and lays out its blobs. The layer clips at the trigger edge, so the pill
 * centred on that edge shows only its outer half: the goo seems to pour out
 * of the trigger. Returns null when nothing has a size (no layout yet).
 */
export function layoutGoo(
  layer: HTMLElement,
  panel: HTMLElement,
  trigger: HTMLElement,
  rows: HTMLElement[],
  down: boolean,
): GooScene | null {
  const fill = layer.firstElementChild as HTMLElement | null
  const menu = panel.getBoundingClientRect()
  const t = trigger.getBoundingClientRect()
  if (!fill || !menu.width || !menu.height || !t.width || !t.height) {
    return null
  }

  const edge = down ? t.bottom : t.top
  const top = down ? edge : menu.top - BLEED
  const left = Math.min(menu.left, t.left) - BLEED
  const right = Math.max(menu.right, t.right) + BLEED
  const bottom = down ? menu.bottom + BLEED : edge
  // The layer sits in the popover shell, which wraps the panel exactly.
  setBox(layer, left - menu.left, top - menu.top, right - left, bottom - top)

  const kept: HTMLElement[] = []
  const boxes: DOMRect[] = []
  for (const row of rows) {
    const box = row.getBoundingClientRect()
    if (box.height > 0 && box.bottom > menu.top && box.top < menu.bottom) {
      kept.push(row)
      boxes.push(box)
    }
  }

  while (fill.children.length < boxes.length + 1) {
    fill.append(document.createElement('span'))
  }
  while (fill.children.length > boxes.length + 1)
    fill.lastElementChild?.remove()
  const [pill, ...blobs] = Array.from(fill.children) as HTMLElement[]

  const radius =
    Number.parseFloat(getComputedStyle(panel).borderTopLeftRadius) || 0
  const place = (el: HTMLElement, x: number, y: number, w: number, h: number) =>
    setBox(el, x - left, y - top, w, h)

  place(pill, t.left, edge - t.height / 2, t.width, t.height)
  pill.style.borderRadius = px(t.height / 2)

  const cx = t.left + t.width / 2
  // Tucked blobs sit wholly behind the trigger edge, inside the pill's hidden
  // half, so they emerge from the edge and vanish back into it.
  const sink = (down ? -1 : 1) * t.height * 0.35
  const sx = Math.min(1, (t.width * 0.7) / menu.width)
  const tucked = boxes.map((box, i) => {
    // Split the gaps between rows so the blobs meet edge to edge.
    const y0 = i === 0 ? menu.top : (boxes[i - 1].bottom + box.top) / 2
    const y1 =
      i === boxes.length - 1 ? menu.bottom : (box.bottom + boxes[i + 1].top) / 2
    const h = y1 - y0
    place(blobs[i], menu.left, y0, menu.width, h)
    blobs[i].style.borderRadius = px(Math.min(radius, h / 2))
    const sy = Math.min(1, (t.height * 0.5) / h)
    const dx = cx - (menu.left + menu.width / 2)
    const dy = edge + sink - (y0 + h / 2)
    return `translate(${px(dx)}, ${px(dy)}) scale(${sx}, ${sy})`
  })

  return {
    pill,
    blobs,
    rows: kept,
    tucked,
    pillHidden: `translate(0px, ${px(sink * 2)}) scale(1, 1)`,
    down,
  }
}

/** Reads each element's running transform as translate/scale, to reverse from mid-flight. */
export function readGoo(scene: GooScene): string[] | null {
  const out: string[] = []
  for (const el of [scene.pill, ...scene.blobs]) {
    const match = /^matrix\(([^)]+)\)$/.exec(getComputedStyle(el).transform)
    if (!match) return null
    const [a, , , d, e, f] = match[1].split(',').map(Number)
    out.push(`translate(${px(e)}, ${px(f)}) scale(${a}, ${d})`)
  }
  return out
}

/** Order in which the blobs leave the pill: nearest the trigger first. */
const order = (scene: GooScene, i: number): number =>
  scene.down ? i : scene.blobs.length - 1 - i

/**
 * Opening: blobs drop out of the pill one after another and stretch into
 * place, each row's text fading in behind its blob; the pill then drains back
 * into the trigger. `from` continues a reversed close from where it was.
 */
export function pourOut(
  scene: GooScene,
  from: string[] | null,
): AnimationPlaybackControls[] {
  const { pill, blobs, rows, tucked, pillHidden } = scene
  const step = Math.min(0.04, 0.24 / Math.max(1, blobs.length - 1))
  const pillFrom = from?.[0] ?? REST
  pill.style.transform = pillFrom
  const motion = [
    animate(
      pill,
      { transform: [pillFrom, pillHidden] },
      {
        duration: 0.28,
        ease: EASE_IN,
        delay: (blobs.length - 1) * step + 0.12,
      },
    ),
  ]
  blobs.forEach((blob, i) => {
    const delay = order(scene, i) * step
    const start = from?.[i + 1] ?? tucked[i]
    blob.style.transform = start
    motion.push(
      animate(blob, { transform: [start, REST] }, { ...DROP_SPRING, delay }),
    )
    if (!from) rows[i].style.opacity = '0'
    motion.push(
      animate(
        rows[i],
        { opacity: 1 },
        { duration: 0.2, ease: EASE_OUT, delay: delay + 0.1 },
      ),
    )
  })
  return motion
}

/**
 * Closing: the text fades, the pill pokes out of the trigger again, and the
 * blobs, farthest first, are pulled back into it before it drains away.
 */
export function drainBack(
  scene: GooScene,
  from: string[] | null,
): AnimationPlaybackControls[] {
  const { pill, blobs, rows, tucked, pillHidden } = scene
  const step = Math.min(0.03, 0.16 / Math.max(1, blobs.length - 1))
  const travel = 0.26
  const total = (blobs.length - 1) * step + travel + 0.16
  const motion = [
    animate(
      pill,
      {
        transform: [from?.[0] ?? pillHidden, REST, REST, pillHidden],
      },
      { duration: total, times: [0, 0.2, 0.8, 1], ease: EASE_OUT },
    ),
  ]
  blobs.forEach((blob, i) => {
    motion.push(
      animate(
        blob,
        { transform: [from?.[i + 1] ?? REST, tucked[i]] },
        {
          duration: travel,
          ease: EASE_IN,
          delay: (blobs.length - 1 - order(scene, i)) * step,
        },
      ),
      animate(rows[i], { opacity: 0 }, { duration: 0.1, ease: EASE_OUT }),
    )
  })
  return motion
}
