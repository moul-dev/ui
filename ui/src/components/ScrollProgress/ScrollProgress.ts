import { html, LitElement, type PropertyValues } from 'lit'
import { ScrollController } from '../../controllers/scroll.controller'
import type { SemanticTone } from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { scrollProgressStyles } from './ScrollProgress.styles'

/** `top` and `bottom` are fixed to that edge of the viewport; `inline` sits in the normal flow at the width of its parent. */
export type ScrollProgressPlacement = 'top' | 'bottom' | 'inline'

const PLACEMENTS: readonly ScrollProgressPlacement[] = [
  'top',
  'bottom',
  'inline',
]

const TONES: readonly SemanticTone[] = [
  'primary',
  'accent',
  'success',
  'warning',
  'error',
]

/**
 * A thin bar that fills from the inline start as the reader scrolls, so a
 * long article or a landing page shows how far through it they are. Put one
 * in the page and it follows the page, fixed along the top of the viewport;
 * `placement="bottom"` fixes it along the bottom instead. To follow a scroll
 * container, give the container an id and the bar `for="that-id"`, and use
 * `placement="inline"` to place it yourself, for example sticky at the top of
 * the panel. Where the browser has scroll-driven animations a native scroll
 * timeline fills the bar, and no script runs while the reader scrolls;
 * elsewhere a passive scroll listener fills it once per frame. It lives in the
 * effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable, and hidden from screen
 * readers with `aria-hidden="true"` on the host. It is decoration: the
 * scrollbar and the reader's own position in the text already say where they
 * are, so announcing a percentage would only repeat it.
 *
 * Reduced motion: the bar keeps following the scroll, because the reader is
 * the one moving it, and it adds no easing or spring of its own; it is never
 * ahead of or behind the page.
 *
 * @csspart base - The track: the full length of the bar, transparent unless `--scroll-progress-track` is set.
 * @csspart bar - The fill, scaled from the inline start by the scroll progress.
 *
 * @cssprop --scroll-progress-color - The colour of the fill. Defaults to the `tone` colour.
 * @cssprop --scroll-progress-height - The thickness of the bar. Defaults to `3px`.
 * @cssprop --scroll-progress-track - The colour of the unfilled track. Defaults to `transparent`.
 */
export class MoulScrollProgress extends LitElement {
  static override styles = scrollProgressStyles

  static override properties = {
    htmlFor: { type: String, attribute: 'for' },
    placement: { type: String, reflect: true },
    tone: { type: String, reflect: true },
  }

  /** The id of a scroll container in the same document or shadow root to follow. Empty follows the page. */
  declare htmlFor: string
  /** Where the bar sits. Defaults to `top`; an unknown value falls back to it. */
  declare placement: ScrollProgressPlacement
  /** The colour of the fill. Defaults to `primary`; an unknown value falls back to it. */
  declare tone: SemanticTone

  private scrolling: ScrollController | null = null
  /** The container being followed, or null for the page. */
  private source: Element | null = null
  /** Watches the root for the container while `for` names one that is not there yet. */
  private observer: MutationObserver | null = null

  constructor() {
    super()
    this.htmlFor = ''
    this.placement = 'top'
    this.tone = 'primary'
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('aria-hidden', 'true')
    this.bind()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.unbind()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('placement') && !PLACEMENTS.includes(this.placement)) {
      this.placement = 'top'
    }
    if (changed.has('tone') && !TONES.includes(this.tone)) {
      this.tone = 'primary'
    }
    if (changed.has('htmlFor')) this.bind()
  }

  /** Follows the container named by `for`, or the page, and waits for the container if it is not there yet. */
  private bind(): void {
    if (!this.isConnected) return
    const root = this.getRootNode() as Document | ShadowRoot
    const id = this.htmlFor
    const target = id ? (root.getElementById?.(id) ?? null) : null
    const isWaiting = Boolean(id && !target)
    this.watchFor(isWaiting ? root : null)
    if (isWaiting) {
      // An empty bar until the container exists, rather than the page's progress.
      this.stopFollowing()
      return
    }
    if (this.scrolling && target === this.source) return
    this.stopFollowing()
    this.source = target
    this.scrolling = new ScrollController(
      this,
      target ? { source: () => target } : {},
    )
  }

  private unbind(): void {
    this.watchFor(null)
    this.stopFollowing()
  }

  private stopFollowing(): void {
    if (this.scrolling) {
      this.scrolling.hostDisconnected()
      this.removeController(this.scrolling)
    }
    this.scrolling = null
    this.source = null
    // Explicitly empty: the variable inherits, so an ancestor's progress would otherwise show through.
    this.style.setProperty('--scroll-progress', '0')
  }

  private watchFor(root: Node | null): void {
    if (!root) {
      this.observer?.disconnect()
      this.observer = null
    } else if (!this.observer && typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver(() => this.bind())
      this.observer.observe(root, {
        childList: true,
        subtree: true,
        attributeFilter: ['id'],
      })
    }
  }

  protected override render() {
    return html`<div part="base"><div part="bar"></div></div>`
  }
}

defineElement('moul-scroll-progress', MoulScrollProgress)

declare global {
  interface HTMLElementTagNameMap {
    'moul-scroll-progress': MoulScrollProgress
  }
}
