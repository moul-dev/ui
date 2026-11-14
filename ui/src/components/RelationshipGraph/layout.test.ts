import { describe, expect, it } from 'vitest'
import {
  assignLayers,
  findBackLinks,
  type GraphLayout,
  layoutGraph,
  linkMidpoint,
  linkPath,
  reachable,
  sanitize,
} from './layout'

const box = (id: string, width = 80, height = 34) => ({ id, width, height })
const link = (source: string, target: string) => ({ source, target })

/** True when no two boxes overlap. */
function noOverlaps(layout: GraphLayout): boolean {
  const boxes = [...layout.nodes.values()]
  for (let a = 0; a < boxes.length; a++) {
    for (let b = a + 1; b < boxes.length; b++) {
      const p = boxes[a]!
      const q = boxes[b]!
      const apart =
        p.x + p.width <= q.x ||
        q.x + q.width <= p.x ||
        p.y + p.height <= q.y ||
        q.y + q.height <= p.y
      if (!apart) return false
    }
  }
  return true
}

/** Counts crossings between straight links that join adjacent layers. */
function crossings(layout: GraphLayout): number {
  const segs = layout.links.map((l) => {
    const s = layout.nodes.get(l.source)!
    const t = layout.nodes.get(l.target)!
    return { sl: s.layer, so: s.order, tl: t.layer, to: t.order }
  })
  let count = 0
  for (let a = 0; a < segs.length; a++) {
    for (let b = a + 1; b < segs.length; b++) {
      const p = segs[a]!
      const q = segs[b]!
      if (p.sl !== q.sl || p.tl !== q.tl) continue
      if ((p.so - q.so) * (p.to - q.to) < 0) count++
    }
  }
  return count
}

describe('sanitize', () => {
  it('keeps the first node per id and drops self, unknown and repeated links', () => {
    const clean = sanitize(
      [box('a'), box('b'), box('a', 10)],
      [link('a', 'b'), link('a', 'a'), link('a', 'x'), link('a', 'b')],
    )
    expect(clean.nodes.map((n) => [n.id, n.width])).toEqual([
      ['a', 80],
      ['b', 80],
    ])
    expect(clean.links).toEqual([{ source: 'a', target: 'b', index: 0 }])
  })
})

describe('findBackLinks', () => {
  it('finds nothing in a graph with no cycles', () => {
    expect(
      findBackLinks(['a', 'b', 'c'], [link('a', 'b'), link('b', 'c')]).size,
    ).toBe(0)
  })

  it('finds the link that closes each cycle', () => {
    const back = findBackLinks(
      ['a', 'b', 'c'],
      [link('a', 'b'), link('b', 'c'), link('c', 'a')],
    )
    expect([...back]).toEqual([2])
  })

  it('handles a long chain without recursing', () => {
    const ids = Array.from({ length: 5000 }, (_, i) => `n${i}`)
    const links = ids.slice(1).map((id, i) => link(ids[i]!, id))
    links.push(link(ids[ids.length - 1]!, ids[0]!))
    expect([...findBackLinks(ids, links)]).toEqual([links.length - 1])
  })
})

describe('assignLayers', () => {
  it('puts each node one layer past the deepest node that links to it', () => {
    const layers = assignLayers(
      ['web', 'api', 'db', 'cache'],
      [
        link('web', 'api'),
        link('api', 'db'),
        link('web', 'db'),
        link('api', 'cache'),
      ],
    )
    expect(Object.fromEntries(layers)).toEqual({
      web: 0,
      api: 1,
      db: 2,
      cache: 2,
    })
  })

  it('starts unlinked nodes at layer 0', () => {
    expect(assignLayers(['solo'], []).get('solo')).toBe(0)
  })
})

describe('layoutGraph', () => {
  const services = {
    nodes: ['web', 'mobile', 'api', 'auth', 'db', 'cache'].map((id) => box(id)),
    links: [
      link('web', 'api'),
      link('mobile', 'api'),
      link('api', 'auth'),
      link('api', 'db'),
      link('api', 'cache'),
      link('auth', 'db'),
    ],
  }

  it('lays layers out left to right with links leaving and entering box edges', () => {
    const layout = layoutGraph(services.nodes, services.links)
    expect(layout.layers).toHaveLength(4)
    const web = layout.nodes.get('web')!
    const api = layout.nodes.get('api')!
    const db = layout.nodes.get('db')!
    expect(web.x).toBeLessThan(api.x)
    expect(api.x).toBeLessThan(db.x)
    const first = layout.links.find(
      (l) => l.source === 'web' && l.target === 'api',
    )!
    expect(first.points[0]).toEqual({
      x: web.x + web.width,
      y: web.y + web.height / 2,
    })
    expect(first.points.at(-1)).toEqual({
      x: api.x,
      y: api.y + api.height / 2,
    })
  })

  it('never overlaps two boxes and stays inside its padded size', () => {
    const layout = layoutGraph(services.nodes, services.links, { padding: 10 })
    expect(noOverlaps(layout)).toBe(true)
    for (const node of layout.nodes.values()) {
      expect(node.x).toBeGreaterThanOrEqual(10 - 1e-6)
      expect(node.y).toBeGreaterThanOrEqual(10 - 1e-6)
      expect(node.x + node.width).toBeLessThanOrEqual(layout.width - 10 + 1e-6)
      expect(node.y + node.height).toBeLessThanOrEqual(
        layout.height - 10 + 1e-6,
      )
    }
  })

  it('routes a link that skips layers through dummy points between them', () => {
    const layout = layoutGraph(services.nodes, services.links)
    const skip = layout.links.find(
      (l) => l.source === 'api' && l.target === 'db',
    )!
    // api sits in layer 1 and db in layer 3, so the link passes layer 2.
    expect(skip.points).toHaveLength(3)
  })

  it('untangles crossings that the input order would cause', () => {
    // Input order pairs a with d and b with c, which crosses unless reordered.
    const layout = layoutGraph(
      [box('a'), box('b'), box('c'), box('d')],
      [link('a', 'd'), link('b', 'c')],
    )
    expect(crossings(layout)).toBe(0)
  })

  it('reverses a link that closes a cycle and keeps its own direction', () => {
    const layout = layoutGraph(
      [box('a'), box('b'), box('c')],
      [link('a', 'b'), link('b', 'c'), link('c', 'a')],
    )
    const back = layout.links.find((l) => l.source === 'c')!
    expect(back.isReversed).toBe(true)
    const c = layout.nodes.get('c')!
    const a = layout.nodes.get('a')!
    // It still starts at c and ends at a.
    expect(back.points[0]!.x).toBe(c.x)
    expect(back.points.at(-1)!.x).toBe(a.x + a.width)
  })

  it('runs top to bottom when vertical', () => {
    const layout = layoutGraph(services.nodes, services.links, {
      direction: 'vertical',
    })
    expect(layout.direction).toBe('vertical')
    expect(layout.nodes.get('web')!.y).toBeLessThan(layout.nodes.get('api')!.y)
    expect(noOverlaps(layout)).toBe(true)
  })

  it('separates neighbours by the node gap', () => {
    const layout = layoutGraph(
      [box('root'), box('x'), box('y'), box('z')],
      [link('root', 'x'), link('root', 'y'), link('root', 'z')],
      { nodeGap: 20 },
    )
    const [x, y, z] = layout.layers[1]!.map((id) => layout.nodes.get(id)!)
    expect(y!.y - (x!.y + x!.height)).toBeGreaterThanOrEqual(20 - 1e-6)
    expect(z!.y - (y!.y + y!.height)).toBeGreaterThanOrEqual(20 - 1e-6)
    // The parent sits level with the middle child.
    const root = layout.nodes.get('root')!
    expect(root.y + root.height / 2).toBeCloseTo(y!.y + y!.height / 2, 5)
  })

  it('returns an empty drawing for no nodes', () => {
    const layout = layoutGraph([], [])
    expect(layout.nodes.size).toBe(0)
    expect(layout.links).toEqual([])
    expect(layout.width).toBeGreaterThanOrEqual(0)
  })
})

describe('linkPath', () => {
  it('draws curves that leave and enter along the direction', () => {
    expect(
      linkPath(
        [
          { x: 0, y: 0 },
          { x: 100, y: 50 },
        ],
        'horizontal',
      ),
    ).toBe('M0,0C50,0 50,50 100,50')
    expect(
      linkPath(
        [
          { x: 0, y: 0 },
          { x: 50, y: 100 },
        ],
        'vertical',
      ),
    ).toBe('M0,0C0,50 50,50 50,100')
  })

  it('stops short of the end to leave room for an arrowhead', () => {
    expect(
      linkPath(
        [
          { x: 100, y: 0 },
          { x: 0, y: 0 },
        ],
        'horizontal',
        6,
      ),
    ).toMatch(/ 6,0$/)
  })
})

describe('linkMidpoint', () => {
  it('takes the middle point or the middle of the middle segment', () => {
    expect(
      linkMidpoint([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 0 },
      ]),
    ).toEqual({ x: 10, y: 10 })
    expect(
      linkMidpoint([
        { x: 0, y: 0 },
        { x: 10, y: 20 },
      ]),
    ).toEqual({ x: 5, y: 10 })
  })
})

describe('reachable', () => {
  it('walks every node reachable once, nearest first, through cycles', () => {
    const next = new Map([
      ['a', ['b', 'c']],
      ['b', ['d']],
      ['c', ['d']],
      ['d', ['a']],
    ])
    expect(reachable('a', next)).toEqual(['b', 'c', 'd'])
  })
})
