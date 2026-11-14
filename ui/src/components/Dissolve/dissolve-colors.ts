import { colorToRgba } from '../../controllers/canvas-color.controller'

/**
 * The colours an item is made of, read once when it starts to dissolve, so
 * the dust looks like the item: a grid of cells over the item's box, each
 * with the background it shows and the colour of its text.
 */
export interface ItemColors {
  /** Distinct colours found, as strings a canvas takes. */
  colors: string[]
  columns: number
  rows: number
  /** Per cell, row by row: index of its background colour, or -1 where the item has none. */
  backgrounds: Int16Array
  /** Per cell: index of its text colour, or -1 where no element was found. */
  texts: Int16Array
}

/** Most distinct colours kept: the dust is drawn one colour at a time. */
const MAX_COLORS = 12

/** The flat-tree parent: a slotted element's slot, a shadow root's host, else the parent. */
function composedParent(node: Element): Element | null {
  if (node.assignedSlot) return node.assignedSlot
  if (node.parentElement) return node.parentElement
  const root = node.getRootNode()
  return root instanceof ShadowRoot ? root.host : null
}

/** The deepest element at a viewport point, looking inside open shadow roots. */
export function deepElementFromPoint(x: number, y: number): Element | null {
  if (typeof document.elementFromPoint !== 'function') return null
  let element = document.elementFromPoint(x, y)
  for (let depth = 0; depth < 8 && element?.shadowRoot; depth++) {
    const inner = element.shadowRoot.elementFromPoint?.(x, y) ?? null
    if (!inner || inner === element) break
    element = inner
  }
  return element
}

/** Whether `node` is `host` or inside it, across shadow boundaries. */
function isWithin(node: Element, host: Element): boolean {
  for (let current: Element | null = node; current; ) {
    if (current === host) return true
    current = composedParent(current)
  }
  return false
}

function isVisibleColor(color: string): boolean {
  return Boolean(color) && colorToRgba(color)[3] > 0.05
}

/** The first visible background from `element` up to `host` (not beyond), or null. */
export function backgroundWithin(
  element: Element,
  host: Element,
): string | null {
  for (let current: Element | null = element; current; ) {
    if (current === host) return null
    const background = getComputedStyle(current).backgroundColor
    if (isVisibleColor(background)) return background
    current = composedParent(current)
  }
  return null
}

/**
 * Reads the item's colours over a grid of cells about `cellSize` pixels
 * across (at most 16 by 10). Points outside the viewport, or covered by
 * something that is not the item, fall back to the item's first child.
 */
export function sampleItemColors(
  host: HTMLElement,
  rect: DOMRect,
  cellSize = 20,
): ItemColors {
  const columns = Math.max(1, Math.min(16, Math.round(rect.width / cellSize)))
  const rows = Math.max(1, Math.min(10, Math.round(rect.height / cellSize)))
  const colors: string[] = []
  const backgrounds = new Int16Array(columns * rows).fill(-1)
  const texts = new Int16Array(columns * rows).fill(-1)
  const indexOf = (color: string | null): number => {
    if (!color) return -1
    const found = colors.indexOf(color)
    if (found !== -1) return found
    if (colors.length >= MAX_COLORS) return 0
    colors.push(color)
    return colors.length - 1
  }

  const first = host.firstElementChild
  const fallbackBackground = first ? backgroundWithin(first, host) : null
  const fallbackText = getComputedStyle(first ?? host).color || null

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = rect.left + ((column + 0.5) / columns) * rect.width
      const y = rect.top + ((row + 0.5) / rows) * rect.height
      const onScreen =
        x >= 0 && y >= 0 && x < viewportWidth && y < viewportHeight
      const element = onScreen ? deepElementFromPoint(x, y) : null
      const cell = row * columns + column
      if (element && element !== host && isWithin(element, host)) {
        backgrounds[cell] = indexOf(backgroundWithin(element, host))
        texts[cell] = indexOf(getComputedStyle(element).color || null)
      } else {
        backgrounds[cell] = indexOf(fallbackBackground)
        texts[cell] = indexOf(fallbackText)
      }
    }
  }
  return { colors, columns, rows, backgrounds, texts }
}

/**
 * The colour index a particle at (`x`, `y`) in the item's box takes: mostly
 * the background there, sometimes the text, so cards shed their fill and a
 * line of text sheds its ink. `roll` is a random number in [0, 1). Returns
 * -1 when the item has no colour there at all.
 */
export function particleColor(
  sample: ItemColors,
  x: number,
  y: number,
  width: number,
  height: number,
  roll: number,
): number {
  const column = Math.min(
    sample.columns - 1,
    Math.max(0, Math.floor((x / Math.max(1, width)) * sample.columns)),
  )
  const row = Math.min(
    sample.rows - 1,
    Math.max(0, Math.floor((y / Math.max(1, height)) * sample.rows)),
  )
  const cell = row * sample.columns + column
  const background = sample.backgrounds[cell]
  const text = sample.texts[cell]
  if (background === -1) return text
  if (text === -1) return background
  return roll < 0.72 ? background : text
}
