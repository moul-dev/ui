import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { edgeBlurStyles } from './EdgeBlur.styles'

/** `vertical` scrolls up and down and blurs the top and bottom; `horizontal` scrolls sideways and blurs the inline start and end. */
export type EdgeBlurOrientation = 'vertical' | 'horizontal'

/** Which edges blur. `start` is the top, or the inline start in horizontal mode (the right in right-to-left text). */
export type EdgeBlurEdges = 'both' | 'start' | 'end'

const ORIENTATIONS: readonly EdgeBlurOrientation[] = ['vertical', 'horizontal']
const EDGES: readonly EdgeBlurEdges[] = ['both', 'start', 'end']

/** Blur layers per edge, each twice as strong as the one before. */
const LAYERS = [1, 2, 3, 4] as const

/** Attributes that name the element; with a name it becomes a region. */
const LABEL_ATTRIBUTES = ['aria-label', 'aria-labelledby'] as const

/**
 * A scroll container whose content blurs out progressively toward its
 * edges, so a list or a column of text fades softly into the page instead
 * of stopping at a hard line. The element is itself the scroller: give it a
 * `height` or `max-height` (or, with `orientation="horizontal"`, let its
 * width limit it) and put the content inside. Several layers of
 * `backdrop-filter` blur, each stronger than the last, ramp up across a band
 * at each edge; `edges` picks `both`, `start` or `end`. Where the browser
 * has scroll-driven animations, an edge's blur fades out when there is
 * nothing more to scroll that way, so the first line is sharp at the top;
 * elsewhere the content is padded by the band's length at each blurred
 * edge, so the first and last lines can still be scrolled clear of it. In
 * horizontal mode the children sit in a row. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: the element joins the tab order
 * (`tabindex="0"`, unless you set a `tabindex` of your own) so keyboard users
 * can reach it and scroll it with the arrow keys, Page Up, Page Down, Home
 * and End, and it shows a focus ring. Give it an `aria-label` or
 * `aria-labelledby`: with a name it takes `role="region"` (unless you set a
 * role), so screen readers announce what it holds; without one it adds no
 * role. The blur layers are `aria-hidden` and ignore the pointer, so the
 * content under them stays readable, clickable and selectable. The bands
 * set the element's `scroll-padding`, so something inside that takes focus
 * is scrolled clear of the blur.
 *
 * Reduced motion: nothing moves on a timer. The scroll-linked fade of each
 * edge stays under `prefers-reduced-motion: reduce`, because it follows only
 * the reader's own scrolling. Where colours are forced (Windows high
 * contrast) and when printing, the blur layers are removed.
 *
 * @slot - The content to scroll. In horizontal mode each child is one item in the row.
 *
 * @csspart content - The wrapper around the content; pad the content here rather than on the element, so the blur reaches the very edge.
 * @csspart edge - Each blurred band (also `edge-start` or `edge-end`).
 * @csspart edge-start - The band at the top, or at the inline start in horizontal mode.
 * @csspart edge-end - The band at the bottom, or at the inline end in horizontal mode.
 *
 * @cssprop --edge-blur-size - The length of each blurred band. Defaults to `4rem`.
 * @cssprop --edge-blur-strength - The blur at the very edge; the layers before it step down by halves. Defaults to `8px`.
 * @cssprop --edge-blur-fade-color - A colour the content also fades into toward the edge, such as the surface behind the element. Defaults to `transparent` (blur only).
 * @cssprop --edge-blur-gap - Space between the items in horizontal mode. Defaults to `var(--spacing-4)`.
 */
export class MoulEdgeBlur extends LitElement {
  static override styles = edgeBlurStyles

  static override properties = {
    orientation: { type: String, reflect: true },
    edges: { type: String, reflect: true },
  }

  /** Lit's attributes for the properties above, plus the two that name the element. */
  static override get observedAttributes(): string[] {
    // biome-ignore lint/complexity/noThisInStatic: super runs Lit's getter for this subclass; LitElement.observedAttributes would list none of its properties
    return [...super.observedAttributes, ...LABEL_ATTRIBUTES]
  }

  /** The way the content scrolls. Defaults to `vertical`. */
  declare orientation: EdgeBlurOrientation
  /** Which edges blur: `both`, `start` (top, or inline start) or `end` (bottom, or inline end). Defaults to `both`. */
  declare edges: EdgeBlurEdges

  /** Whether the element set `role="region"` itself, so it may take it away again. */
  private hasOwnRole = false

  constructor() {
    super()
    this.orientation = 'vertical'
    this.edges = 'both'
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    // A scroll container must be reachable by keyboard, or its content is
    // out of reach for anyone without a pointer.
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0')
    this.syncRole()
  }

  public override attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    super.attributeChangedCallback(name, oldValue, newValue)
    if ((LABEL_ATTRIBUTES as readonly string[]).includes(name)) this.syncRole()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (
      changed.has('orientation') &&
      !ORIENTATIONS.includes(this.orientation)
    ) {
      this.orientation = 'vertical'
    }
    if (changed.has('edges') && !EDGES.includes(this.edges)) {
      this.edges = 'both'
    }
  }

  /** A named scroller is a region a screen reader can list and jump to; an unnamed one stays generic. */
  private syncRole(): void {
    const isLabelled = LABEL_ATTRIBUTES.some((name) =>
      Boolean(this.getAttribute(name)?.trim()),
    )
    if (isLabelled && !this.hasAttribute('role')) {
      this.setAttribute('role', 'region')
      this.hasOwnRole = true
    } else if (
      !isLabelled &&
      this.hasOwnRole &&
      this.getAttribute('role') === 'region'
    ) {
      this.removeAttribute('role')
      this.hasOwnRole = false
    }
  }

  private renderEdge(edge: 'start' | 'end') {
    return html`<div
      part="edge edge-${edge}"
      class="edge ${edge}"
      aria-hidden="true"
    >
      ${LAYERS.map(
        (layer) => html`<div class="layer blur layer-${layer}"></div>`,
      )}
      <div class="layer tint"></div>
    </div>`
  }

  protected override render() {
    const hasStart = this.edges !== 'end'
    const hasEnd = this.edges !== 'start'
    return html`${hasStart ? this.renderEdge('start') : nothing}
      <div part="content" class="content"><slot></slot></div>
      ${hasEnd ? this.renderEdge('end') : nothing}`
  }
}

defineElement('moul-edge-blur', MoulEdgeBlur)

declare global {
  interface HTMLElementTagNameMap {
    'moul-edge-blur': MoulEdgeBlur
  }
}
