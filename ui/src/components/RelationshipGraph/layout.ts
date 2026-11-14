/**
 * A layered layout for directed graphs, after Sugiyama: break cycles, assign
 * layers, insert a dummy node wherever a link skips a layer, order each layer
 * to cut down on crossings, then place the nodes. Pure functions, no DOM, so
 * the element and the tests share it.
 *
 * Every link points from a node to one it depends on, so the layers run from
 * the nodes nothing depends on (layer 0) to the deepest dependencies.
 */

export type GraphDirection = 'horizontal' | 'vertical'

export interface LayoutNodeInput {
  id: string
  /** Box width in px. */
  width: number
  /** Box height in px. */
  height: number
}

export interface LayoutLinkInput {
  source: string
  target: string
}

export interface LayoutOptions {
  /** `horizontal` lays layers out left to right, `vertical` top to bottom. */
  direction?: GraphDirection
  /** Space between layers, along the direction of the links. */
  layerGap?: number
  /** Space between neighbouring nodes in a layer. */
  nodeGap?: number
  /** Space around the drawing. */
  padding?: number
  /** Down-and-up passes spent reordering layers to reduce crossings. */
  sweeps?: number
}

export interface Point {
  x: number
  y: number
}

export interface PositionedNode {
  id: string
  /** Left edge. */
  x: number
  /** Top edge. */
  y: number
  width: number
  height: number
  layer: number
  /** Position within its layer, counting only real nodes. */
  order: number
}

export interface PositionedLink {
  source: string
  target: string
  /** Index of the link in the input array. */
  index: number
  /** From the source's edge to the target's edge, through any dummy points between. */
  points: Point[]
  /** The link closes a cycle, so it runs against the layer order. */
  isReversed: boolean
}

export interface GraphLayout {
  width: number
  height: number
  direction: GraphDirection
  nodes: Map<string, PositionedNode>
  /** Real node ids per layer, in order. */
  layers: string[][]
  links: PositionedLink[]
}

/** One node of the working graph: a real node or a dummy on a long link. */
interface Vertex {
  id: string
  isDummy: boolean
  /** Extent along the links (width when horizontal). */
  main: number
  /** Extent across the links (height when horizontal). */
  cross: number
  layer: number
  /** Centre across the links, once placed. */
  pos: number
  preds: Vertex[]
  succs: Vertex[]
}

const DEFAULTS = {
  direction: 'horizontal' as GraphDirection,
  layerGap: 72,
  nodeGap: 16,
  padding: 16,
  sweeps: 4,
}

/**
 * Keeps the first node for each id and the first link for each pair of
 * endpoints, and drops links to unknown nodes and links from a node to itself.
 */
export function sanitize(
  nodes: readonly LayoutNodeInput[],
  links: readonly LayoutLinkInput[],
): {
  nodes: LayoutNodeInput[]
  links: (LayoutLinkInput & { index: number })[]
} {
  const seen = new Map<string, LayoutNodeInput>()
  for (const node of nodes) {
    if (node && typeof node.id === 'string' && !seen.has(node.id)) {
      seen.set(node.id, node)
    }
  }
  const pairs = new Set<string>()
  const kept: (LayoutLinkInput & { index: number })[] = []
  links.forEach((link, index) => {
    if (!link || link.source === link.target) return
    if (!seen.has(link.source) || !seen.has(link.target)) return
    const pair = `${link.source}\u0000${link.target}`
    if (pairs.has(pair)) return
    pairs.add(pair)
    kept.push({ source: link.source, target: link.target, index })
  })
  return { nodes: [...seen.values()], links: kept }
}

/**
 * Finds the links that close a cycle, with a depth-first search from each
 * node in input order: a link back to a node still on the search path is one.
 * Reversing those links leaves a graph with no cycles.
 */
export function findBackLinks(
  ids: readonly string[],
  links: readonly LayoutLinkInput[],
): Set<number> {
  const out = new Map<string, { target: string; index: number }[]>()
  for (const id of ids) out.set(id, [])
  links.forEach((link, index) => {
    out.get(link.source)?.push({ target: link.target, index })
  })
  const state = new Map<string, 1 | 2>()
  const back = new Set<number>()
  for (const root of ids) {
    if (state.has(root)) continue
    // An explicit stack, so a long chain cannot overflow the call stack.
    const stack: [string, number][] = [[root, 0]]
    state.set(root, 1)
    while (stack.length > 0) {
      const frame = stack[stack.length - 1] as [string, number]
      const edges = out.get(frame[0]) ?? []
      if (frame[1] >= edges.length) {
        state.set(frame[0], 2)
        stack.pop()
        continue
      }
      const edge = edges[frame[1]++] as { target: string; index: number }
      const seen = state.get(edge.target)
      if (seen === 1) back.add(edge.index)
      else if (seen === undefined) {
        state.set(edge.target, 1)
        stack.push([edge.target, 0])
      }
    }
  }
  return back
}

/**
 * Longest-path layering of a graph with no cycles: a node sits one layer past
 * the deepest node that links to it, so nodes nothing links to start at 0.
 */
export function assignLayers(
  ids: readonly string[],
  edges: readonly LayoutLinkInput[],
): Map<string, number> {
  const indegree = new Map<string, number>()
  const out = new Map<string, string[]>()
  for (const id of ids) {
    indegree.set(id, 0)
    out.set(id, [])
  }
  for (const edge of edges) {
    out.get(edge.source)?.push(edge.target)
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1)
  }
  const layer = new Map<string, number>()
  const queue = ids.filter((id) => indegree.get(id) === 0)
  for (const id of queue) layer.set(id, 0)
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i] as string
    const next = (layer.get(id) ?? 0) + 1
    for (const target of out.get(id) ?? []) {
      if ((layer.get(target) ?? -1) < next) layer.set(target, next)
      const left = (indegree.get(target) ?? 0) - 1
      indegree.set(target, left)
      if (left === 0) queue.push(target)
    }
  }
  // Only reachable when the edges still hold a cycle; park what is left at 0.
  for (const id of ids) if (!layer.has(id)) layer.set(id, 0)
  return layer
}

/** Counts the crossings between two adjacent layers, `upper` linked to `lower` through `succs`. */
function countCrossings(upper: Vertex[], lower: Vertex[]): number {
  const index = new Map(lower.map((v, i) => [v, i]))
  const ends: [number, number][] = []
  upper.forEach((v, i) => {
    for (const s of v.succs) {
      const j = index.get(s)
      if (j !== undefined) ends.push([i, j])
    }
  })
  let crossings = 0
  for (let a = 0; a < ends.length; a++) {
    const [ua, la] = ends[a] as [number, number]
    for (let b = a + 1; b < ends.length; b++) {
      const [ub, lb] = ends[b] as [number, number]
      if ((ua - ub) * (la - lb) < 0) crossings++
    }
  }
  return crossings
}

function totalCrossings(layers: Vertex[][]): number {
  let total = 0
  for (let l = 0; l + 1 < layers.length; l++) {
    total += countCrossings(layers[l] as Vertex[], layers[l + 1] as Vertex[])
  }
  return total
}

/** Re-sorts `layer` by the mean index of each vertex's neighbours in the fixed layer. */
function sortByBarycenter(
  layer: Vertex[],
  fixed: Vertex[],
  neighbours: (v: Vertex) => Vertex[],
): Vertex[] {
  const index = new Map(fixed.map((v, i) => [v, i]))
  const keyed = layer.map((v, i) => {
    const near = neighbours(v)
      .map((n) => index.get(n))
      .filter((n): n is number => n !== undefined)
    // A vertex with no neighbours there keeps its place.
    const key =
      near.length > 0 ? near.reduce((a, b) => a + b, 0) / near.length : i
    return { v, key, i }
  })
  keyed.sort((a, b) => a.key - b.key || a.i - b.i)
  return keyed.map((k) => k.v)
}

/** Orders every layer, keeping the arrangement with the fewest crossings. */
function orderLayers(layers: Vertex[][], sweeps: number): Vertex[][] {
  let current = layers.map((layer) => [...layer])
  // Seed each layer from the one before it.
  for (let l = 1; l < current.length; l++) {
    current[l] = sortByBarycenter(
      current[l] as Vertex[],
      current[l - 1] as Vertex[],
      (v) => v.preds,
    )
  }
  let best = current.map((layer) => [...layer])
  let bestCount = totalCrossings(best)
  for (let sweep = 0; sweep < sweeps && bestCount > 0; sweep++) {
    for (let l = 1; l < current.length; l++) {
      current[l] = sortByBarycenter(
        current[l] as Vertex[],
        current[l - 1] as Vertex[],
        (v) => v.preds,
      )
    }
    for (let l = current.length - 2; l >= 0; l--) {
      current[l] = sortByBarycenter(
        current[l] as Vertex[],
        current[l + 1] as Vertex[],
        (v) => v.succs,
      )
    }
    const count = totalCrossings(current)
    if (count < bestCount) {
      bestCount = count
      best = current.map((layer) => [...layer])
    }
  }
  current = best
  return current
}

/** The least distance between the centres of two neighbours in a layer. */
function separation(a: Vertex, b: Vertex, gap: number): number {
  const space = a.isDummy || b.isDummy ? gap / 2 : gap
  return (a.cross + b.cross) / 2 + space
}

/**
 * Places each layer as close to its desired positions as the order and the
 * separations allow: one pass pushes right from the desired spots, one pushes
 * left, and their average still keeps every gap, since both do.
 */
function placeLayer(layer: Vertex[], desired: number[], gap: number): void {
  const n = layer.length
  if (n === 0) return
  const forward = new Array<number>(n)
  const backward = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    const want = desired[i] as number
    forward[i] =
      i === 0
        ? want
        : Math.max(
            want,
            (forward[i - 1] as number) +
              separation(layer[i - 1] as Vertex, layer[i] as Vertex, gap),
          )
  }
  for (let i = n - 1; i >= 0; i--) {
    const want = desired[i] as number
    backward[i] =
      i === n - 1
        ? want
        : Math.min(
            want,
            (backward[i + 1] as number) -
              separation(layer[i] as Vertex, layer[i + 1] as Vertex, gap),
          )
  }
  for (let i = 0; i < n; i++) {
    ;(layer[i] as Vertex).pos =
      ((forward[i] as number) + (backward[i] as number)) / 2
  }
}

/** Assigns every vertex a centre across the links, pulling each toward its neighbours. */
function assignPositions(layers: Vertex[][], gap: number): void {
  // Start stacked from 0, each layer centred on the widest.
  const extents = layers.map((layer) =>
    layer.reduce(
      (sum, v, i) =>
        i === 0
          ? sum + v.cross / 2
          : sum + separation(layer[i - 1] as Vertex, v, gap),
      layer.length > 0 ? (layer[layer.length - 1] as Vertex).cross / 2 : 0,
    ),
  )
  const widest = Math.max(0, ...extents)
  layers.forEach((layer, l) => {
    let pos = (widest - (extents[l] as number)) / 2
    layer.forEach((v, i) => {
      if (i === 0) pos += v.cross / 2
      else pos += separation(layer[i - 1] as Vertex, v, gap)
      v.pos = pos
    })
  })
  const mean = (vs: Vertex[]) =>
    vs.reduce((sum, v) => sum + v.pos, 0) / vs.length
  const pull = (layer: Vertex[], neighbours: (v: Vertex) => Vertex[]) => {
    const desired = layer.map((v) => {
      const near = neighbours(v)
      return near.length > 0 ? mean(near) : v.pos
    })
    placeLayer(layer, desired, gap)
  }
  for (let iteration = 0; iteration < 8; iteration++) {
    if (iteration % 2 === 0) {
      for (let l = 1; l < layers.length; l++) {
        pull(layers[l] as Vertex[], (v) => v.preds)
      }
    } else {
      for (let l = layers.length - 2; l >= 0; l--) {
        pull(layers[l] as Vertex[], (v) => v.succs)
      }
    }
  }
}

/**
 * Lays out a directed graph in layers. Nodes keep the size they are given;
 * the result is in px with the drawing's top-left corner at 0,0.
 */
export function layoutGraph(
  nodes: readonly LayoutNodeInput[],
  links: readonly LayoutLinkInput[],
  options: LayoutOptions = {},
): GraphLayout {
  const { direction, layerGap, nodeGap, padding, sweeps } = {
    ...DEFAULTS,
    ...Object.fromEntries(
      Object.entries(options).filter(([, value]) => value !== undefined),
    ),
  } as Required<LayoutOptions>
  const isHorizontal = direction !== 'vertical'
  const clean = sanitize(nodes, links)
  const ids = clean.nodes.map((node) => node.id)
  const back = findBackLinks(ids, clean.links)

  // Edges with no cycles: back links run the other way while layering.
  const edges = clean.links.map((link, i) =>
    back.has(i)
      ? { source: link.target, target: link.source, link, isReversed: true }
      : { source: link.source, target: link.target, link, isReversed: false },
  )
  const layerOf = assignLayers(ids, edges)

  const vertices = new Map<string, Vertex>()
  for (const node of clean.nodes) {
    const width = Math.max(0, Number(node.width) || 0)
    const height = Math.max(0, Number(node.height) || 0)
    vertices.set(node.id, {
      id: node.id,
      isDummy: false,
      main: isHorizontal ? width : height,
      cross: isHorizontal ? height : width,
      layer: layerOf.get(node.id) ?? 0,
      pos: 0,
      preds: [],
      succs: [],
    })
  }

  // Break every edge that skips layers into a chain through dummies.
  const chains = edges.map((edge, e) => {
    const from = vertices.get(edge.source) as Vertex
    const to = vertices.get(edge.target) as Vertex
    const chain: Vertex[] = [from]
    for (let l = from.layer + 1; l < to.layer; l++) {
      const dummy: Vertex = {
        id: `\u0000dummy-${e}-${l}`,
        isDummy: true,
        main: 0,
        cross: 0,
        layer: l,
        pos: 0,
        preds: [],
        succs: [],
      }
      chain.push(dummy)
    }
    chain.push(to)
    for (let i = 0; i + 1 < chain.length; i++) {
      ;(chain[i] as Vertex).succs.push(chain[i + 1] as Vertex)
      ;(chain[i + 1] as Vertex).preds.push(chain[i] as Vertex)
    }
    return chain
  })

  const depth = Math.max(-1, ...[...vertices.values()].map((v) => v.layer)) + 1
  const layers: Vertex[][] = Array.from({ length: depth }, () => [])
  for (const v of vertices.values()) (layers[v.layer] as Vertex[]).push(v)
  for (const chain of chains) {
    for (const v of chain) if (v.isDummy) (layers[v.layer] as Vertex[]).push(v)
  }

  const ordered = orderLayers(layers, sweeps)
  assignPositions(ordered, nodeGap)

  // Shift so the drawing starts at the padding.
  let low = Number.POSITIVE_INFINITY
  let high = Number.NEGATIVE_INFINITY
  for (const layer of ordered) {
    for (const v of layer) {
      low = Math.min(low, v.pos - v.cross / 2)
      high = Math.max(high, v.pos + v.cross / 2)
    }
  }
  if (!Number.isFinite(low)) {
    low = 0
    high = 0
  }
  const crossShift = padding - low
  const crossSize = high - low + padding * 2

  // Layers along the links: each as deep as its deepest node.
  const layerExtent = ordered.map((layer) =>
    Math.max(0, ...layer.map((v) => v.main)),
  )
  const layerStart: number[] = []
  let cursor = padding
  layerExtent.forEach((extent, l) => {
    layerStart[l] = cursor
    cursor += extent + (l < layerExtent.length - 1 ? layerGap : 0)
  })
  const mainSize = layerExtent.length > 0 ? cursor + padding : padding * 2
  const mainCenter = (v: Vertex) =>
    (layerStart[v.layer] as number) + (layerExtent[v.layer] as number) / 2
  const toPoint = (main: number, cross: number): Point =>
    isHorizontal ? { x: main, y: cross } : { x: cross, y: main }

  const positioned = new Map<string, PositionedNode>()
  const realLayers: string[][] = ordered.map((layer) => {
    const real = layer.filter((v) => !v.isDummy)
    real.forEach((v, order) => {
      const center = toPoint(mainCenter(v), v.pos + crossShift)
      const width = isHorizontal ? v.main : v.cross
      const height = isHorizontal ? v.cross : v.main
      positioned.set(v.id, {
        id: v.id,
        x: center.x - width / 2,
        y: center.y - height / 2,
        width,
        height,
        layer: v.layer,
        order,
      })
    })
    return real.map((v) => v.id)
  })

  const positionedLinks: PositionedLink[] = edges.map((edge, e) => {
    const chain = chains[e] as Vertex[]
    const points = chain.map((v, i) => {
      const cross = v.pos + crossShift
      if (v.isDummy) return toPoint(mainCenter(v), cross)
      // Leave the first box from its far side, enter the last on its near side.
      const half = v.main / 2
      const main = mainCenter(v) + (i === 0 ? half : -half)
      return toPoint(main, cross)
    })
    if (edge.isReversed) points.reverse()
    return {
      source: edge.link.source,
      target: edge.link.target,
      index: edge.link.index,
      points,
      isReversed: edge.isReversed,
    }
  })

  return {
    width: isHorizontal ? mainSize : crossSize,
    height: isHorizontal ? crossSize : mainSize,
    direction: isHorizontal ? 'horizontal' : 'vertical',
    nodes: positioned,
    layers: realLayers,
    links: positionedLinks,
  }
}

/**
 * An SVG path through `points` made of cubic curves that leave and enter each
 * point along the layout direction, so links flow out of one box and into the
 * next. `trimEnd` stops short of the last point, to leave room for an arrowhead.
 */
export function linkPath(
  points: readonly Point[],
  direction: GraphDirection,
  trimEnd = 0,
): string {
  if (points.length < 2) return ''
  const pts = points.map((p) => ({ ...p }))
  const isHorizontal = direction !== 'vertical'
  if (trimEnd > 0) {
    const last = pts[pts.length - 1] as Point
    const prev = pts[pts.length - 2] as Point
    const sign = isHorizontal
      ? Math.sign(last.x - prev.x) || 1
      : Math.sign(last.y - prev.y) || 1
    if (isHorizontal) last.x -= sign * trimEnd
    else last.y -= sign * trimEnd
  }
  const r = (n: number) => Math.round(n * 10) / 10
  const first = pts[0] as Point
  let d = `M${r(first.x)},${r(first.y)}`
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1] as Point
    const q = pts[i] as Point
    if (isHorizontal) {
      const mx = r(p.x + (q.x - p.x) / 2)
      d += `C${mx},${r(p.y)} ${mx},${r(q.y)} ${r(q.x)},${r(q.y)}`
    } else {
      const my = r(p.y + (q.y - p.y) / 2)
      d += `C${r(p.x)},${my} ${r(q.x)},${my} ${r(q.x)},${r(q.y)}`
    }
  }
  return d
}

/** The middle of a link: its middle point, or the middle of its middle segment. */
export function linkMidpoint(points: readonly Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 }
  if (points.length % 2 === 1) {
    return { ...(points[(points.length - 1) / 2] as Point) }
  }
  const a = points[points.length / 2 - 1] as Point
  const b = points[points.length / 2] as Point
  // A curve with matching tangents at both ends passes through the chord's midpoint.
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/** Every node reachable from `id` by following `next`, nearest first, without `id` itself. */
export function reachable(
  id: string,
  next: ReadonlyMap<string, readonly string[]>,
): string[] {
  const seen = new Set<string>([id])
  const order: string[] = []
  const queue = [id]
  for (let i = 0; i < queue.length; i++) {
    for (const n of next.get(queue[i] as string) ?? []) {
      if (seen.has(n)) continue
      seen.add(n)
      order.push(n)
      queue.push(n)
    }
  }
  return order
}
