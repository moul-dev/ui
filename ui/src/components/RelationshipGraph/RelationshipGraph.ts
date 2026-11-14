import { html, LitElement, nothing, type PropertyValues, svg } from 'lit'
import { LayoutIndicatorController } from '../../controllers/layout-indicator.controller'
import type { SemanticTone } from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { getChartColor } from '../ChartCommon'
import {
  type GraphDirection,
  type GraphLayout,
  type LayoutNodeInput,
  layoutGraph,
  linkMidpoint,
  linkPath,
  type PositionedNode,
  reachable,
  sanitize,
} from './layout'
import { relationshipGraphStyles } from './RelationshipGraph.styles'

export interface RelationshipGraphNode {
  /** Unique key, used by `links`, `selected-key` and the events. */
  id: string
  /** The name shown in the box; defaults to `id`. */
  label?: string
  /** A second, quieter line under the label, such as a kind or a version. */
  description?: string
  /** Nodes in one group share a chart colour and a legend entry. */
  group?: string
  /** Colours the node's dot with a semantic tone instead of its group colour. */
  tone?: SemanticTone
  [key: string]: unknown
}

export interface RelationshipGraphLink {
  /** The node that depends on `target`. */
  source: string
  /** The node `source` depends on. */
  target: string
  /** A short word drawn on the link, such as "reads" or "calls". */
  label?: string
  [key: string]: unknown
}

export type RelationshipGraphDirection = GraphDirection
export type RelationshipGraphTrace = 'both' | 'upstream' | 'downstream'

export interface RelationshipGraphRelations {
  /** The nodes this one links to directly. */
  dependsOn: RelationshipGraphNode[]
  /** The nodes that link to this one directly. */
  usedBy: RelationshipGraphNode[]
}

export interface RelationshipGraphSelectionChangeDetail {
  /** The selected node's id, or `''` when the selection was cleared. */
  selectedKey: string
  node: RelationshipGraphNode | null
}

export interface RelationshipGraphNodeActionDetail {
  id: string
  node: RelationshipGraphNode
}

export interface RelationshipGraphTraceChangeDetail {
  /** The node whose path is traced, or null when nothing is. */
  id: string | null
  /** Everything it depends on, directly or not, nearest first. */
  upstream: string[]
  /** Everything that depends on it, directly or not, nearest first. */
  downstream: string[]
}

const DIRECTIONS: RelationshipGraphDirection[] = ['horizontal', 'vertical']
const TRACES: RelationshipGraphTrace[] = ['both', 'upstream', 'downstream']

const TONE_COLORS: Record<SemanticTone, string> = {
  primary: 'var(--color-accent)',
  accent: 'var(--color-primary-500)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-danger)',
}

/** Box geometry, in px. */
const PAD_X = 12
const PAD_Y = 8
const LABEL_LINE = 18
const DESCRIPTION_LINE = 16
const DOT = 8
const DOT_GAP = 8
const MIN_WIDTH = 72
const MAX_WIDTH = 220
const ARROW = 7
const PILL_PAD = 6
const PILL_HEIGHT = 18
/** The smallest the drawing shrinks to fit; past this it scrolls instead. */
const MIN_SCALE = 0.75

type TextKind = 'label' | 'description'

/** Width per character, in ems, for when text cannot be measured. */
const EM_PER_CHAR: Record<TextKind, number> = { label: 0.58, description: 0.54 }
const FALLBACK_SIZE: Record<TextKind, number> = { label: 14, description: 12 }

let canvasContext: CanvasRenderingContext2D | null | undefined

function measuringContext(): CanvasRenderingContext2D | null {
  if (canvasContext !== undefined) return canvasContext
  try {
    canvasContext =
      typeof document === 'undefined'
        ? null
        : (document.createElement('canvas').getContext?.('2d') ?? null)
  } catch {
    canvasContext = null
  }
  return canvasContext
}

/** "a", "a and b", "a, b and c". */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

const nameOf = (node: RelationshipGraphNode) => node.label || node.id

/** The default accessible name: "api, Node service, depends on db and cache, used by web". */
export function describeRelationshipNode(
  node: RelationshipGraphNode,
  { dependsOn, usedBy }: RelationshipGraphRelations,
): string {
  const parts = [nameOf(node)]
  if (node.description) parts.push(node.description)
  if (dependsOn.length)
    parts.push(`depends on ${joinNames(dependsOn.map(nameOf))}`)
  if (usedBy.length) parts.push(`used by ${joinNames(usedBy.map(nameOf))}`)
  return parts.join(', ')
}

/** What one node draws, worked out once per data change. */
interface NodeView {
  node: RelationshipGraphNode
  label: string
  description: string
  isTruncated: boolean
  /** The dot colour, from its tone or group; empty draws no dot. */
  color: string
  width: number
  height: number
}

/** Everything derived from `nodes`, `links` and `direction`. */
interface GraphModel {
  views: Map<string, NodeView>
  /** Node ids in reading order: layer by layer. */
  order: string[]
  dependsOn: Map<string, string[]>
  usedBy: Map<string, string[]>
  groups: string[]
  layout: GraphLayout
}

/**
 * A graph of nodes and the links between them, laid out in layers so every
 * link runs one way: from a node to what it depends on. Use it for service
 * maps, package dependencies, data lineage and any other web of
 * relationships. Hovering, focusing or selecting a node traces its path:
 * everything it depends on (upstream) and everything that depends on it
 * (downstream) lights up, the rest dims, and the traced links carry a
 * flowing dash. `trace` limits that to one direction.
 *
 * Give it `nodes` (`{ id, label?, description?, group?, tone? }`) and
 * `links` (`{ source, target, label? }`, where `source` depends on
 * `target`). The layout breaks cycles, keeps crossings down and lays the
 * layers out left to right, or top to bottom with `direction="vertical"`.
 * The drawing shrinks to fit its container down to three quarters of its
 * size, then scrolls.
 *
 * Keyboard and screen readers: the drawing is a `role="group"` named by
 * `label` (default "Relationship graph") and is one tab stop, with a roving
 * `tabindex` that starts on the selected node, else the first. Each node is
 * a `role="button"` with `aria-pressed` for the selection and a name that
 * spells out its direct links, such as "api, depends on db and cache, used
 * by web" (`describeNode` changes it). Arrow keys move through the drawing
 * as it looks: along the links (`Arrow Right` and `Arrow Left` when
 * horizontal, `Arrow Down` and `Arrow Up` when vertical) to the nearest
 * linked node in the next or previous layer, or to the nearest node there
 * when none is linked; across the links to the next or previous node in the
 * same layer. `Home` and `End` go to the first and last node. `Space` or a
 * click selects a node or clears it again; `Enter` or a double-click fires
 * `node-action`. `Escape` clears the selection and the trace. Focusing a
 * node traces it, as hovering does. The links, arrowheads and link labels
 * are hidden from screen readers; the node names carry the same facts. The
 * layout is not mirrored under `dir="rtl"`.
 *
 * Reduced motion: traced links do not carry a flowing dash, and nodes and
 * links dim and light up at once instead of fading.
 *
 * @slot empty - Shown instead of the drawing when there are no nodes.
 * @fires selectionchange - The user selected a node or cleared the selection; `detail` is `{ selectedKey, node }`.
 * @fires node-action - A node was activated with `Enter` or a double-click; `detail` is `{ id, node }`.
 * @fires tracechange - The traced node changed (hover, focus, selection or `Escape`); `detail` is `{ id, upstream, downstream }`.
 * @csspart base - The scrolling frame around the drawing.
 * @csspart svg - The drawing.
 * @csspart node - A node's group (`role="button"`).
 * @csspart node-box - A node's box.
 * @csspart link - A link's group: its path and arrowhead.
 * @csspart link-label - A link label's pill.
 * @csspart legend - The list of groups under the drawing, with `show-legend`.
 * @csspart empty - The wrapper of the `empty` slot.
 * @cssprop --relationship-graph-upstream-color - Colour of traced dependencies. Defaults to `var(--color-accent)`.
 * @cssprop --relationship-graph-downstream-color - Colour of traced dependents. Defaults to `var(--color-chart-2)`.
 * @cssprop --relationship-graph-max-height - Tallest the frame grows before it scrolls. Defaults to `none`.
 */
export class MoulRelationshipGraph extends LitElement {
  static override styles = relationshipGraphStyles

  static override properties = {
    nodes: { attribute: false },
    links: { attribute: false },
    direction: { type: String, reflect: true },
    trace: { type: String, reflect: true },
    selectedKey: { type: String, reflect: true, attribute: 'selected-key' },
    label: { type: String },
    showLegend: { type: Boolean, reflect: true, attribute: 'show-legend' },
    describeNode: { attribute: false },
    hovered: { state: true },
    focused: { state: true },
    isReduced: { state: true },
  }

  declare nodes: RelationshipGraphNode[]
  declare links: RelationshipGraphLink[]
  /** `horizontal` runs the layers left to right; `vertical` top to bottom. */
  declare direction: RelationshipGraphDirection
  /** Which way hovering, focusing or selecting a node traces its path. */
  declare trace: RelationshipGraphTrace
  /** The selected node's id; empty when none is. */
  declare selectedKey: string
  /** The drawing's accessible name. */
  declare label: string
  /** List the node groups and their colours under the drawing. */
  declare showLegend: boolean
  /** Builds each node's accessible name from the node and its direct links. */
  declare describeNode?: (
    node: RelationshipGraphNode,
    relations: RelationshipGraphRelations,
  ) => string

  private declare hovered: string | null
  private declare focused: string | null
  private declare isReduced: boolean

  private readonly resize = new LayoutIndicatorController(this, {
    observeDimensions: true,
  })
  private model: GraphModel | null = null
  /** The node holding the tab stop. */
  private active: string | null = null
  /** Escape hides the focused node's trace until focus moves. */
  private isFocusTraceCleared = false
  private lastTrace: string | null = null
  /** Bumped when fonts change, so labels are measured again. */
  private fontVersion = 0
  private fonts: Record<TextKind, string> | null = null
  private stopWatchingMotion: (() => void) | null = null

  constructor() {
    super()
    this.nodes = []
    this.links = []
    this.direction = 'horizontal'
    this.trace = 'both'
    this.selectedKey = ''
    this.label = ''
    this.showLegend = false
    this.describeNode = undefined
    this.hovered = null
    this.focused = null
    this.isReduced = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
    })
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
  }

  /** Every node `id` depends on, directly or not, nearest first. */
  public upstreamOf(id: string): string[] {
    return this.model ? reachable(id, this.model.dependsOn) : []
  }

  /** Every node that depends on `id`, directly or not, nearest first. */
  public downstreamOf(id: string): string[] {
    return this.model ? reachable(id, this.model.usedBy) : []
  }

  /** Moves focus, and the tab stop, to the node with this id. */
  public async focusNode(id: string): Promise<void> {
    await this.updateComplete
    this.moveTo(id)
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (!DIRECTIONS.includes(this.direction)) this.direction = 'horizontal'
    if (!TRACES.includes(this.trace)) this.trace = 'both'
    if (typeof this.selectedKey !== 'string') this.selectedKey = ''
    if (
      !this.model ||
      changed.has('nodes') ||
      changed.has('links') ||
      changed.has('direction')
    ) {
      this.model = this.buildModel()
    }
    const ids = this.model.views
    // A `selectedKey` with no node selects nothing, and is kept for when its
    // node arrives: markup can set it before the data does.
    if (this.hovered && !ids.has(this.hovered)) this.hovered = null
    if (this.focused && !ids.has(this.focused)) this.focused = null
    if (!this.active || !ids.has(this.active)) {
      this.active =
        (ids.has(this.selectedKey) ? this.selectedKey : this.model.order[0]) ||
        null
    }
  }

  protected override firstUpdated(): void {
    // A frame later, still before the first paint, the probes have their fonts.
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        if (this.isConnected) this.readFonts()
      })
    } else this.readFonts()
    // Web fonts that finish loading change every label's width.
    document.fonts?.ready?.then(() => {
      if (this.isConnected) this.readFonts()
    })
  }

  protected override updated(): void {
    const traced = this.traceRoot()
    if (traced !== this.lastTrace) {
      this.lastTrace = traced
      this.dispatchEvent(
        new CustomEvent<RelationshipGraphTraceChangeDetail>('tracechange', {
          bubbles: true,
          composed: true,
          detail: {
            id: traced,
            upstream: traced ? this.upstreamOf(traced) : [],
            downstream: traced ? this.downstreamOf(traced) : [],
          },
        }),
      )
    }
  }

  /** Reads the label fonts off hidden probes; a change lays the graph out again. */
  private readFonts(): void {
    const read = (kind: TextKind): string => {
      const probe = this.renderRoot.querySelector(`.probe-${kind}`)
      if (!probe) return ''
      const style = getComputedStyle(probe)
      const size = Number.parseFloat(style.fontSize)
      if (!size || !style.fontFamily) return ''
      return `${style.fontWeight || 'normal'} ${size}px ${style.fontFamily}`
    }
    const next = { label: read('label'), description: read('description') }
    if (
      next.label === (this.fonts?.label ?? '') &&
      next.description === (this.fonts?.description ?? '')
    ) {
      return
    }
    this.fonts = next
    this.fontVersion++
    this.model = this.buildModel()
    this.requestUpdate()
  }

  private textWidth(text: string, kind: TextKind): number {
    const font = this.fonts?.[kind]
    const context = font ? measuringContext() : null
    if (context && font) {
      context.font = font
      const width = context.measureText(text).width
      if (Number.isFinite(width) && width > 0) return width
    }
    const size =
      Number.parseFloat(font?.split(' ')[1] ?? '') || FALLBACK_SIZE[kind]
    return text.length * size * EM_PER_CHAR[kind]
  }

  /** Shortens `text` with an ellipsis until it fits `max` px. */
  private truncate(
    text: string,
    kind: TextKind,
    max: number,
  ): [string, boolean] {
    if (this.textWidth(text, kind) <= max) return [text, false]
    let low = 0
    let high = text.length
    while (low < high) {
      const mid = Math.ceil((low + high) / 2)
      if (this.textWidth(`${text.slice(0, mid).trimEnd()}…`, kind) <= max) {
        low = mid
      } else {
        high = mid - 1
      }
    }
    return [`${text.slice(0, low).trimEnd()}…`, true]
  }

  private buildModel(): GraphModel {
    const nodes = (Array.isArray(this.nodes) ? this.nodes : []).filter(
      (node): node is RelationshipGraphNode =>
        !!node && typeof node.id === 'string' && node.id !== '',
    )
    const links = Array.isArray(this.links) ? this.links : []
    const clean = sanitize(
      nodes.map((node) => ({ id: node.id, width: 0, height: 0 })),
      links,
    )
    const byId = new Map<string, RelationshipGraphNode>()
    for (const node of nodes) if (!byId.has(node.id)) byId.set(node.id, node)

    const groups: string[] = []
    for (const node of byId.values()) {
      if (node.group && !groups.includes(node.group)) groups.push(node.group)
    }

    const dependsOn = new Map<string, string[]>()
    const usedBy = new Map<string, string[]>()
    for (const id of byId.keys()) {
      dependsOn.set(id, [])
      usedBy.set(id, [])
    }
    for (const link of clean.links) {
      dependsOn.get(link.source)?.push(link.target)
      usedBy.get(link.target)?.push(link.source)
    }

    const views = new Map<string, NodeView>()
    for (const node of byId.values()) {
      const tone = node.tone && TONE_COLORS[node.tone]
      const color =
        tone || (node.group ? getChartColor(groups.indexOf(node.group)) : '')
      const lead = color ? DOT + DOT_GAP : 0
      const room = MAX_WIDTH - PAD_X * 2 - lead
      const [label, cutLabel] = this.truncate(nameOf(node), 'label', room)
      const [description, cutDescription] = node.description
        ? this.truncate(String(node.description), 'description', room)
        : ['', false]
      const text = Math.max(
        this.textWidth(label, 'label'),
        description ? this.textWidth(description, 'description') : 0,
      )
      views.set(node.id, {
        node,
        label,
        description,
        isTruncated: cutLabel || cutDescription,
        color,
        width: Math.round(
          Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, text + lead + PAD_X * 2)),
        ),
        height: PAD_Y * 2 + LABEL_LINE + (description ? DESCRIPTION_LINE : 0),
      })
    }

    const inputs: LayoutNodeInput[] = [...views.values()].map((view) => ({
      id: view.node.id,
      width: view.width,
      height: view.height,
    }))
    const layout = layoutGraph(inputs, clean.links, {
      direction: this.direction,
      // Link labels need room between the layers.
      layerGap: clean.links.some((l) => links[l.index]?.label) ? 96 : 72,
    })
    return {
      views,
      order: layout.layers.flat(),
      dependsOn,
      usedBy,
      groups,
      layout,
    }
  }

  /** The node whose path is traced: hovered, else focused, else selected. */
  private traceRoot(): string | null {
    const focused = this.isFocusTraceCleared ? null : this.focused
    const selected = this.model?.views.has(this.selectedKey)
      ? this.selectedKey
      : null
    return this.hovered ?? focused ?? selected
  }

  private nodeAt(event: Event): string | null {
    for (const target of event.composedPath()) {
      if (target === this) break
      if (target instanceof Element && target.classList.contains('node')) {
        return target.getAttribute('data-id')
      }
    }
    return null
  }

  private nodeElement(id: string): SVGGElement | null {
    for (const el of this.renderRoot.querySelectorAll<SVGGElement>('.node')) {
      if (el.getAttribute('data-id') === id) return el
    }
    return null
  }

  private moveTo(id: string | null | undefined): void {
    if (!id || !this.model?.views.has(id)) return
    this.active = id
    // The render moves the tab stop; focus can move now.
    this.requestUpdate()
    this.nodeElement(id)?.focus()
  }

  private emit(type: string, detail: unknown): void {
    this.dispatchEvent(
      new CustomEvent(type, { bubbles: true, composed: true, detail }),
    )
  }

  /** Selects `id`, or clears the selection when it is already selected. */
  private toggleSelection(id: string): void {
    const next = this.selectedKey === id ? '' : id
    this.selectedKey = next
    this.emit('selectionchange', {
      selectedKey: next,
      node: next ? (this.model?.views.get(next)?.node ?? null) : null,
    })
  }

  private activate(id: string): void {
    const node = this.model?.views.get(id)?.node
    if (node) this.emit('node-action', { id, node })
  }

  private readonly handlePointerOver = (event: PointerEvent): void => {
    const id = this.nodeAt(event)
    if (id) this.hovered = id
  }

  private readonly handlePointerOut = (event: PointerEvent): void => {
    const id = this.nodeAt(event)
    if (!id || this.hovered !== id) return
    const to = event.relatedTarget
    // Moving between parts of one node is not leaving it.
    if (to instanceof Element && this.nodeElement(id)?.contains(to)) return
    this.hovered = null
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const id = this.nodeAt(event)
    // The second click of a double-click is left to `dblclick`.
    if (!id || event.detail > 1) return
    this.moveTo(id)
    this.toggleSelection(id)
  }

  private readonly handleDoubleClick = (event: MouseEvent): void => {
    const id = this.nodeAt(event)
    if (id) this.activate(id)
  }

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const id = this.nodeAt(event)
    if (!id) return
    this.active = id
    if (this.focused !== id) this.isFocusTraceCleared = false
    this.focused = id
  }

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const to = event.relatedTarget
    if (to instanceof Node && this.renderRoot.contains(to)) return
    this.focused = null
    this.isFocusTraceCleared = false
  }

  /** The nearest node across one layer, preferring nodes linked to `id`. */
  private across(id: string, step: 1 | -1): string | undefined {
    const model = this.model
    const from = model?.layout.nodes.get(id)
    if (!model || !from) return undefined
    const vertical = model.layout.direction === 'vertical'
    const cross = (n: PositionedNode) =>
      vertical ? n.x + n.width / 2 : n.y + n.height / 2
    const here = cross(from)
    const linked = [
      ...(model.dependsOn.get(id) ?? []),
      ...(model.usedBy.get(id) ?? []),
    ]
      .map((other) => model.layout.nodes.get(other))
      .filter(
        (n): n is PositionedNode =>
          !!n && Math.sign(n.layer - from.layer) === step,
      )
    const candidates =
      linked.length > 0
        ? linked
        : (model.layout.layers[from.layer + step] ?? []).map(
            (other) => model.layout.nodes.get(other) as PositionedNode,
          )
    let best: PositionedNode | undefined
    for (const n of candidates) {
      if (
        !best ||
        Math.abs(n.layer - from.layer) < Math.abs(best.layer - from.layer) ||
        (n.layer === best.layer &&
          Math.abs(cross(n) - here) < Math.abs(cross(best) - here))
      ) {
        best = n
      }
    }
    return best?.id
  }

  /** The next or previous node in the same layer. */
  private within(id: string, step: 1 | -1): string | undefined {
    const from = this.model?.layout.nodes.get(id)
    if (!from) return undefined
    return this.model?.layout.layers[from.layer]?.[from.order + step]
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const id = this.nodeAt(event)
    if (!id || !this.model || event.altKey || event.ctrlKey || event.metaKey) {
      return
    }
    const vertical = this.model.layout.direction === 'vertical'
    const order = this.model.order
    const moves: Record<string, () => string | undefined> = {
      ArrowRight: () => (vertical ? this.within(id, 1) : this.across(id, 1)),
      ArrowLeft: () => (vertical ? this.within(id, -1) : this.across(id, -1)),
      ArrowDown: () => (vertical ? this.across(id, 1) : this.within(id, 1)),
      ArrowUp: () => (vertical ? this.across(id, -1) : this.within(id, -1)),
      Home: () => order[0],
      End: () => order[order.length - 1],
    }
    const move = moves[event.key]
    if (move) {
      this.moveTo(move())
    } else if (event.key === ' ') {
      this.toggleSelection(id)
    } else if (event.key === 'Enter') {
      this.activate(id)
    } else if (event.key === 'Escape') {
      const hadTrace = this.traceRoot() !== null
      this.isFocusTraceCleared = true
      this.hovered = null
      if (this.selectedKey) this.toggleSelection(this.selectedKey)
      // Nothing to clear: let the key reach whatever holds the graph.
      if (!hadTrace) return
      this.requestUpdate()
    } else {
      return
    }
    event.preventDefault()
  }

  private renderLinks(
    layout: GraphLayout,
    up: Set<string>,
    down: Set<string>,
    root: string | null,
  ) {
    const upFrom = new Set(up).add(root ?? '')
    const downTo = new Set(down).add(root ?? '')
    const links = Array.isArray(this.links) ? this.links : []
    const states = layout.links.map((link) => {
      if (!root) return ''
      if (upFrom.has(link.source) && up.has(link.target)) return 'is-upstream'
      if (downTo.has(link.target) && down.has(link.source)) {
        return 'is-downstream'
      }
      return 'is-dimmed'
    })
    const paths = svg`${layout.links.map((link, i) => {
      const state = states[i]
      const end = link.points[link.points.length - 1]
      const prev = link.points[link.points.length - 2]
      if (!end || !prev) return nothing
      const d = linkPath(link.points, layout.direction, ARROW - 1)
      const vertical = layout.direction === 'vertical'
      const sign = vertical
        ? Math.sign(end.y - prev.y) || 1
        : Math.sign(end.x - prev.x) || 1
      const arrow = vertical
        ? `M${end.x},${end.y}L${end.x - ARROW / 2},${end.y - sign * ARROW}L${end.x + ARROW / 2},${end.y - sign * ARROW}Z`
        : `M${end.x},${end.y}L${end.x - sign * ARROW},${end.y - ARROW / 2}L${end.x - sign * ARROW},${end.y + ARROW / 2}Z`
      const isTraced = state === 'is-upstream' || state === 'is-downstream'
      return svg`
        <g
          part="link"
          class="link ${state} ${link.isReversed ? 'is-reversed' : ''}"
          data-source=${link.source}
          data-target=${link.target}
        >
          <path class="link-path" d=${d}></path>
          ${isTraced && !this.isReduced ? svg`<path class="link-flow" d=${d}></path>` : nothing}
          <path class="link-arrow" d=${arrow}></path>
        </g>
      `
    })}`
    const labels = svg`${layout.links.map((link, i) => {
      const text = links[link.index]?.label
      if (!text) return nothing
      const label = this.truncate(String(text), 'description', 120)[0]
      const width = Math.round(
        this.textWidth(label, 'description') + PILL_PAD * 2,
      )
      const mid = linkMidpoint(link.points)
      return svg`
        <g
          part="link-label"
          class="link-label ${states[i]}"
          transform="translate(${Math.round(mid.x - width / 2)} ${Math.round(mid.y - PILL_HEIGHT / 2)})"
        >
          <rect width=${width} height=${PILL_HEIGHT} rx=${PILL_HEIGHT / 2}></rect>
          <text x=${width / 2} y=${PILL_HEIGHT / 2}>${label}</text>
        </g>
      `
    })}`
    return svg`
      <g class="links" aria-hidden="true">${paths}</g>
      <g class="link-labels" aria-hidden="true">${labels}</g>
    `
  }

  private renderNode(
    view: NodeView,
    box: PositionedNode,
    state: string,
    relations: RelationshipGraphRelations,
  ) {
    const { node } = view
    const isSelected = this.selectedKey === node.id
    const name = (this.describeNode ?? describeRelationshipNode)(
      node,
      relations,
    )
    const lead = view.color ? DOT + DOT_GAP : 0
    const labelY = PAD_Y + LABEL_LINE / 2
    return svg`
      <g
        part="node"
        class="node ${state} ${isSelected ? 'is-selected' : ''}"
        data-id=${node.id}
        role="button"
        tabindex=${this.active === node.id ? '0' : '-1'}
        aria-pressed=${isSelected ? 'true' : 'false'}
        aria-label=${name}
        transform="translate(${box.x} ${box.y})"
      >
        ${view.isTruncated ? svg`<title>${nameOf(node)}${node.description ? ` · ${node.description}` : ''}</title>` : nothing}
        <rect
          class="node-ring"
          x="-3"
          y="-3"
          width=${box.width + 6}
          height=${box.height + 6}
          rx="11"
        ></rect>
        <rect
          part="node-box"
          class="node-box"
          width=${box.width}
          height=${box.height}
          rx="8"
        ></rect>
        ${
          view.color
            ? svg`<circle
                class="node-dot"
                style="--_node-color: ${view.color}"
                cx=${PAD_X + DOT / 2}
                cy=${labelY}
                r=${DOT / 2}
              ></circle>`
            : nothing
        }
        <text class="node-label" x=${PAD_X + lead} y=${labelY}>${view.label}</text>
        ${
          view.description
            ? svg`<text
                class="node-description"
                x=${PAD_X + lead}
                y=${PAD_Y + LABEL_LINE + DESCRIPTION_LINE / 2}
              >${view.description}</text>`
            : nothing
        }
      </g>
    `
  }

  protected override render() {
    const probes = html`
      <span class="probe probe-label" aria-hidden="true">M</span>
      <span class="probe probe-description" aria-hidden="true">M</span>
    `
    const model = this.model
    if (!model || model.views.size === 0) {
      return html`
        <div part="empty" class="empty">
          <slot name="empty"><p class="empty-message">No nodes to show</p></slot>
        </div>
        ${probes}
      `
    }
    const { layout, views } = model
    const root = this.traceRoot()
    const up = new Set(
      root && this.trace !== 'downstream' ? this.upstreamOf(root) : [],
    )
    const down = new Set(
      root && this.trace !== 'upstream' ? this.downstreamOf(root) : [],
    )
    const available = this.resize.width || this.clientWidth
    const scale =
      available > 0
        ? Math.min(1, Math.max(MIN_SCALE, available / layout.width))
        : 1
    const nodeState = (id: string): string => {
      if (!root) return ''
      if (id === root) return 'is-root'
      if (up.has(id)) return 'is-upstream'
      if (down.has(id)) return 'is-downstream'
      return 'is-dimmed'
    }
    const lookup = (ids: string[] | undefined) =>
      (ids ?? []).map((id) => views.get(id)?.node as RelationshipGraphNode)

    return html`
      <div part="base" class="base">
        <svg
          part="svg"
          class="graph ${root ? 'has-trace' : ''}"
          role="group"
          aria-label=${this.label || 'Relationship graph'}
          width=${Math.round(layout.width * scale)}
          height=${Math.round(layout.height * scale)}
          viewBox="0 0 ${layout.width} ${layout.height}"
          data-font-version=${this.fontVersion}
          @pointerover=${this.handlePointerOver}
          @pointerout=${this.handlePointerOut}
          @click=${this.handleClick}
          @dblclick=${this.handleDoubleClick}
          @focusin=${this.handleFocusIn}
          @focusout=${this.handleFocusOut}
          @keydown=${this.handleKeyDown}
        >
          ${this.renderLinks(layout, up, down, root)}
          <g class="nodes">
            ${model.order.map((id) => {
              const view = views.get(id) as NodeView
              const box = layout.nodes.get(id) as PositionedNode
              return this.renderNode(view, box, nodeState(id), {
                dependsOn: lookup(model.dependsOn.get(id)),
                usedBy: lookup(model.usedBy.get(id)),
              })
            })}
          </g>
        </svg>
      </div>
      ${
        this.showLegend && model.groups.length > 0
          ? html`
              <ul part="legend" class="legend">
                ${model.groups.map(
                  (group, i) => html`
                    <li>
                      <span
                        class="legend-dot"
                        style="--_node-color: ${getChartColor(i)}"
                      ></span>
                      ${group}
                    </li>
                  `,
                )}
              </ul>
            `
          : nothing
      }
      ${probes}
    `
  }
}

defineElement('moul-relationship-graph', MoulRelationshipGraph)

declare global {
  interface HTMLElementTagNameMap {
    'moul-relationship-graph': MoulRelationshipGraph
  }
}
