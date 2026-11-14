import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './RelationshipGraph'
import type {
  MoulRelationshipGraph,
  RelationshipGraphLink,
  RelationshipGraphNode,
} from './RelationshipGraph'

const NODES: RelationshipGraphNode[] = [
  { id: 'web', label: 'Web app', group: 'Clients' },
  { id: 'mobile', label: 'Mobile app', group: 'Clients' },
  { id: 'api', label: 'API', description: 'Node service', group: 'Services' },
  { id: 'auth', label: 'Auth', group: 'Services' },
  { id: 'db', label: 'Postgres', group: 'Data', tone: 'success' },
  { id: 'cache', label: 'Redis', group: 'Data' },
]

const LINKS: RelationshipGraphLink[] = [
  { source: 'web', target: 'api', label: 'calls' },
  { source: 'mobile', target: 'api' },
  { source: 'api', target: 'auth' },
  { source: 'api', target: 'db' },
  { source: 'api', target: 'cache' },
  { source: 'auth', target: 'db' },
]

async function mount(
  attrs: Partial<MoulRelationshipGraph> = {},
): Promise<MoulRelationshipGraph> {
  const el = await fixture<MoulRelationshipGraph>(
    html`<moul-relationship-graph></moul-relationship-graph>`,
  )
  Object.assign(el, { nodes: NODES, links: LINKS, ...attrs })
  await el.updateComplete
  return el
}

const nodeEl = (el: MoulRelationshipGraph, id: string) =>
  el.shadowRoot?.querySelector<SVGGElement>(`.node[data-id="${id}"]`) ??
  (null as unknown as SVGGElement)

const linkEl = (el: MoulRelationshipGraph, source: string, target: string) =>
  el.shadowRoot?.querySelector<SVGGElement>(
    `.link[data-source="${source}"][data-target="${target}"]`,
  ) ?? (null as unknown as SVGGElement)

const focused = (el: MoulRelationshipGraph) =>
  (el.shadowRoot?.activeElement as Element | null)?.getAttribute('data-id')

async function press(el: MoulRelationshipGraph, key: string): Promise<void> {
  const target = (el.shadowRoot?.activeElement ??
    el.shadowRoot?.querySelector('.node[tabindex="0"]')) as SVGGElement
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      composed: true,
      cancelable: true,
    }),
  )
  await el.updateComplete
}

function hover(el: MoulRelationshipGraph, id: string | null): void {
  const target = id ? nodeEl(el, id) : null
  if (target) {
    target.dispatchEvent(
      new PointerEvent('pointerover', { bubbles: true, composed: true }),
    )
  }
}

describe('<moul-relationship-graph>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
  })

  it('draws one node per unique id and one link per valid pair', async () => {
    const el = await mount({
      nodes: [...NODES, { id: 'web', label: 'Duplicate' }],
      links: [...LINKS, { source: 'api', target: 'nowhere' }],
    })
    expect(el.shadowRoot?.querySelectorAll('.node')).toHaveLength(6)
    expect(el.shadowRoot?.querySelectorAll('.link')).toHaveLength(6)
    expect(nodeEl(el, 'web').textContent).toContain('Web app')
    expect(
      nodeEl(el, 'api').querySelector('.node-description')?.textContent,
    ).toBe('Node service')
  })

  it('draws link labels in a pill', async () => {
    const el = await mount()
    const labels = el.shadowRoot?.querySelectorAll('.link-label')
    expect(labels).toHaveLength(1)
    expect(labels?.[0]?.textContent).toContain('calls')
  })

  it('shows the empty slot when there are no nodes', async () => {
    const el = await fixture<MoulRelationshipGraph>(
      html`<moul-relationship-graph
        ><span slot="empty">Nothing yet</span></moul-relationship-graph
      >`,
    )
    expect(el.shadowRoot?.querySelector('[part="empty"]')).not.toBeNull()
    expect(el.shadowRoot?.querySelector('svg')).toBeNull()
  })

  it('colours nodes by group, a tone winning over the group', async () => {
    const el = await mount({ showLegend: true })
    const dot = (id: string) =>
      nodeEl(el, id)
        .querySelector<SVGElement>('.node-dot')
        ?.getAttribute('style')
    expect(dot('web')).toContain('var(--color-chart-1)')
    expect(dot('api')).toContain('var(--color-chart-2)')
    expect(dot('db')).toContain('var(--color-success)')
    const legend = el.shadowRoot?.querySelectorAll('[part="legend"] li')
    expect([...(legend ?? [])].map((li) => li.textContent?.trim())).toEqual([
      'Clients',
      'Services',
      'Data',
    ])
  })

  it('lays layers out top to bottom when vertical', async () => {
    const el = await mount({ direction: 'vertical' })
    const y = (id: string) =>
      Number(
        /translate\([\d.]+ ([\d.]+)\)/.exec(
          nodeEl(el, id).getAttribute('transform') ?? '',
        )?.[1],
      )
    expect(y('web')).toBeLessThan(y('api'))
    expect(y('api')).toBeLessThan(y('auth'))
  })

  it('reports upstream and downstream nodes', async () => {
    const el = await mount()
    expect(el.upstreamOf('api')).toEqual(['auth', 'db', 'cache'])
    expect(el.downstreamOf('db')).toEqual(['api', 'auth', 'web', 'mobile'])
  })

  describe('trace', () => {
    it('lights up the hovered node, its dependencies and its dependents', async () => {
      const el = await mount()
      hover(el, 'auth')
      await el.updateComplete
      expect(nodeEl(el, 'auth').classList.contains('is-root')).toBe(true)
      expect(nodeEl(el, 'db').classList.contains('is-upstream')).toBe(true)
      expect(nodeEl(el, 'api').classList.contains('is-downstream')).toBe(true)
      expect(nodeEl(el, 'web').classList.contains('is-downstream')).toBe(true)
      expect(nodeEl(el, 'cache').classList.contains('is-dimmed')).toBe(true)
      expect(linkEl(el, 'auth', 'db').classList.contains('is-upstream')).toBe(
        true,
      )
      expect(
        linkEl(el, 'api', 'auth').classList.contains('is-downstream'),
      ).toBe(true)
      // api → db does not pass through auth.
      expect(linkEl(el, 'api', 'db').classList.contains('is-dimmed')).toBe(true)
      expect(
        linkEl(el, 'auth', 'db').querySelector('.link-flow'),
      ).not.toBeNull()
    })

    it('limits the trace to one direction', async () => {
      const el = await mount({ trace: 'upstream' })
      hover(el, 'api')
      await el.updateComplete
      expect(nodeEl(el, 'db').classList.contains('is-upstream')).toBe(true)
      expect(nodeEl(el, 'web').classList.contains('is-dimmed')).toBe(true)
      el.trace = 'downstream'
      await el.updateComplete
      expect(nodeEl(el, 'db').classList.contains('is-dimmed')).toBe(true)
      expect(nodeEl(el, 'web').classList.contains('is-downstream')).toBe(true)
    })

    it('clears when the pointer leaves the node', async () => {
      const el = await mount()
      hover(el, 'api')
      await el.updateComplete
      nodeEl(el, 'api').dispatchEvent(
        new PointerEvent('pointerout', {
          bubbles: true,
          composed: true,
          relatedTarget: document.body,
        }),
      )
      await el.updateComplete
      expect(el.shadowRoot?.querySelector('.graph.has-trace')).toBeNull()
    })

    it('fires tracechange with the traced paths', async () => {
      const el = await mount()
      const details: unknown[] = []
      el.addEventListener('tracechange', (e) =>
        details.push((e as CustomEvent).detail),
      )
      hover(el, 'auth')
      await el.updateComplete
      expect(details).toEqual([
        { id: 'auth', upstream: ['db'], downstream: ['api', 'web', 'mobile'] },
      ])
    })
  })

  describe('selection and activation', () => {
    it('selects on click, clears on a second click and pins the trace', async () => {
      const el = await mount()
      const events: unknown[] = []
      el.addEventListener('selectionchange', (e) =>
        events.push((e as CustomEvent).detail.selectedKey),
      )
      nodeEl(el, 'api').dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true, detail: 1 }),
      )
      await el.updateComplete
      expect(el.selectedKey).toBe('api')
      expect(el.getAttribute('selected-key')).toBe('api')
      expect(nodeEl(el, 'api').getAttribute('aria-pressed')).toBe('true')
      expect(nodeEl(el, 'db').classList.contains('is-upstream')).toBe(true)
      nodeEl(el, 'api').dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true, detail: 1 }),
      )
      await el.updateComplete
      expect(el.selectedKey).toBe('')
      expect(events).toEqual(['api', ''])
    })

    it('fires node-action on a double-click, without toggling twice', async () => {
      const el = await mount()
      const actions: string[] = []
      el.addEventListener('node-action', (e) =>
        actions.push((e as CustomEvent).detail.id),
      )
      const node = nodeEl(el, 'db')
      node.dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true, detail: 1 }),
      )
      node.dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true, detail: 2 }),
      )
      node.dispatchEvent(
        new MouseEvent('dblclick', { bubbles: true, composed: true }),
      )
      await el.updateComplete
      expect(actions).toEqual(['db'])
      expect(el.selectedKey).toBe('db')
    })

    it('keeps a selection set before its node arrives, selecting nothing meanwhile', async () => {
      const el = await fixture<MoulRelationshipGraph>(
        html`<moul-relationship-graph selected-key="cache"></moul-relationship-graph>`,
      )
      el.nodes = NODES.filter((n) => n.id !== 'cache')
      el.links = LINKS
      await el.updateComplete
      expect(el.selectedKey).toBe('cache')
      expect(el.shadowRoot?.querySelector('[aria-pressed="true"]')).toBeNull()
      expect(el.shadowRoot?.querySelector('.graph.has-trace')).toBeNull()
      el.nodes = NODES
      await el.updateComplete
      expect(nodeEl(el, 'cache').getAttribute('aria-pressed')).toBe('true')
      expect(nodeEl(el, 'cache').getAttribute('tabindex')).toBe('-1')
    })
  })

  describe('keyboard and screen readers', () => {
    it('is a named group of buttons that spell out their links', async () => {
      const el = await mount({ label: 'Service map' })
      const svg = el.shadowRoot?.querySelector('svg')
      expect(svg?.getAttribute('role')).toBe('group')
      expect(svg?.getAttribute('aria-label')).toBe('Service map')
      const api = nodeEl(el, 'api')
      expect(api.getAttribute('role')).toBe('button')
      expect(api.getAttribute('aria-pressed')).toBe('false')
      expect(api.getAttribute('aria-label')).toBe(
        'API, Node service, depends on Auth, Postgres and Redis, used by Web app and Mobile app',
      )
      expect(nodeEl(el, 'web').getAttribute('aria-label')).toBe(
        'Web app, depends on API',
      )
      expect(
        el.shadowRoot?.querySelector('.links')?.getAttribute('aria-hidden'),
      ).toBe('true')
    })

    it('names nodes with describeNode when given', async () => {
      const el = await mount({
        describeNode: (node, { dependsOn }) =>
          `${node.id}: ${dependsOn.length} deps`,
      })
      expect(nodeEl(el, 'api').getAttribute('aria-label')).toBe('api: 3 deps')
    })

    it('has one tab stop, on the selected node or else the first', async () => {
      const el = await mount()
      const stops = () =>
        [...(el.shadowRoot?.querySelectorAll('.node[tabindex="0"]') ?? [])].map(
          (n) => n.getAttribute('data-id'),
        )
      expect(stops()).toEqual(['web'])
      const selectedEl = await mount({ selectedKey: 'auth' })
      expect(
        [
          ...(selectedEl.shadowRoot?.querySelectorAll('.node[tabindex="0"]') ??
            []),
        ].map((n) => n.getAttribute('data-id')),
      ).toEqual(['auth'])
    })

    it('moves along links with Arrow Right and Left, within a layer with Up and Down', async () => {
      const el = await mount()
      nodeEl(el, 'web').focus()
      await el.updateComplete
      expect(focused(el)).toBe('web')
      await press(el, 'ArrowDown')
      expect(focused(el)).toBe('mobile')
      await press(el, 'ArrowRight')
      expect(focused(el)).toBe('api')
      await press(el, 'ArrowRight')
      // auth and cache are both linked to api in the next layer.
      expect(['auth', 'cache']).toContain(focused(el))
      nodeEl(el, 'auth').focus()
      await el.updateComplete
      await press(el, 'ArrowRight')
      // db is linked to auth; cache, in auth's layer, is not reached across.
      expect(focused(el)).toBe('db')
      await press(el, 'ArrowLeft')
      // auth and api both link to db; auth is in the nearer layer.
      expect(focused(el)).toBe('auth')
      await press(el, 'Home')
      expect(focused(el)).toBe(
        el.shadowRoot?.querySelector('.node')?.getAttribute('data-id'),
      )
      await press(el, 'End')
      const all = el.shadowRoot?.querySelectorAll('.node')
      expect(focused(el)).toBe(all?.[all.length - 1]?.getAttribute('data-id'))
      // Only the focused node holds the tab stop.
      expect(
        el.shadowRoot?.querySelectorAll('.node[tabindex="0"]'),
      ).toHaveLength(1)
    })

    it('swaps the axes when vertical', async () => {
      const el = await mount({ direction: 'vertical' })
      nodeEl(el, 'web').focus()
      await el.updateComplete
      await press(el, 'ArrowRight')
      expect(focused(el)).toBe('mobile')
      await press(el, 'ArrowDown')
      expect(focused(el)).toBe('api')
      await press(el, 'ArrowUp')
      expect(['web', 'mobile']).toContain(focused(el))
    })

    it('traces the focused node, selects with Space, acts with Enter and clears with Escape', async () => {
      const el = await mount()
      const actions: string[] = []
      el.addEventListener('node-action', (e) =>
        actions.push((e as CustomEvent).detail.id),
      )
      nodeEl(el, 'api').focus()
      await el.updateComplete
      expect(nodeEl(el, 'api').classList.contains('is-root')).toBe(true)
      await press(el, ' ')
      expect(el.selectedKey).toBe('api')
      await press(el, 'Enter')
      expect(actions).toEqual(['api'])
      await press(el, 'Escape')
      expect(el.selectedKey).toBe('')
      expect(el.shadowRoot?.querySelector('.graph.has-trace')).toBeNull()
      // Moving on traces again.
      await press(el, 'ArrowRight')
      expect(el.shadowRoot?.querySelector('.graph.has-trace')).not.toBeNull()
    })

    it('lets Escape through when there is nothing to clear', async () => {
      const el = await mount()
      nodeEl(el, 'web').focus()
      await el.updateComplete
      await press(el, 'Escape')
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        composed: true,
        cancelable: true,
      })
      nodeEl(el, 'web').dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
    })
  })

  describe('reduced motion', () => {
    it('draws no flowing dash on traced links', async () => {
      motion = mockReducedMotion(true)
      const el = await mount()
      hover(el, 'auth')
      await el.updateComplete
      expect(linkEl(el, 'auth', 'db').classList.contains('is-upstream')).toBe(
        true,
      )
      expect(el.shadowRoot?.querySelector('.link-flow')).toBeNull()
    })

    it('follows the setting when it changes', async () => {
      motion = mockReducedMotion(false)
      const el = await mount()
      hover(el, 'auth')
      await el.updateComplete
      expect(el.shadowRoot?.querySelector('.link-flow')).not.toBeNull()
      motion.set(true)
      await el.updateComplete
      expect(el.shadowRoot?.querySelector('.link-flow')).toBeNull()
    })
  })
})
