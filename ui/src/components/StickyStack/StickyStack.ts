import { html, LitElement, type PropertyValues } from 'lit'
import { classMap } from 'lit/directives/class-map.js'
import { InViewController } from '../../controllers/in-view.controller'
import { ScrollController } from '../../controllers/scroll.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion } from '../../utils/motion'
import {
  findScrollRoot,
  scrollPortHeight,
  scrollPortTop,
} from '../../utils/scroll-root'
import { stickyStackStyles } from './StickyStack.styles'
import {
  type StackChildBox,
  type StackRange,
  stackRanges,
} from './sticky-stack-layout'

const PROGRESS_PROPERTY = '--_sticky-stack-progress'
const INDEX_PROPERTY = '--_sticky-stack-index'
const FROM_PROPERTY = '--_sticky-stack-from'
const SPAN_PROPERTY = '--_sticky-stack-span'
const DEPTH_PROPERTY = '--_sticky-stack-depth'
const CHILD_PROPERTIES = [
  INDEX_PROPERTY,
  FROM_PROPERTY,
  SPAN_PROPERTY,
  DEPTH_PROPERTY,
]

const DEFAULT_MIN_SCALE = 0.9

/**
 * Cards or whole sections that stack up as the page scrolls: each child
 * sticks near the top of the screen and the next one slides up over it, a
 * little lower each time, so the edges of the earlier ones peek out above it
 * like a pile of cards. A child that is covered shrinks slightly and dims, so
 * the pile reads as depth. Put the cards (or sections) in it as children;
 * they stay where they are in the DOM. Sticking is plain CSS
 * `position: sticky`, so no ancestor between the stack and the scrolling box
 * may clip its overflow. The shrink follows a native scroll timeline where
 * the browser has one and a passive scroll listener elsewhere; it changes
 * only `scale` and `filter`, so nothing is laid out again while the reader
 * scrolls. `min-scale` sets how small the bottom card gets. It lives in the
 * effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role; the
 * children are read and reached with Tab in their order. When keyboard focus
 * moves into a card that later cards cover, the scroll goes back until that
 * card is on top of the pile, so the focused control is never hidden.
 *
 * Reduced motion: the cards still stick and stack, because the pile is
 * layout and the reader's own scrolling moves it, but nothing shrinks or
 * dims, and the scroll back to a focused card jumps instead of gliding.
 *
 * @slot - The cards or sections to stack, each one an element.
 *
 * @csspart stack - The column that holds the children. Pad its end to hold the finished pile in view a little longer.
 *
 * @cssprop --sticky-stack-top - Where the first child sticks, from the top of the scrolling box. Defaults to `var(--spacing-4)`.
 * @cssprop --sticky-stack-step - How much lower each next child sticks, so the earlier ones peek out. Defaults to `var(--spacing-4)`.
 * @cssprop --sticky-stack-gap - The space between children before they stack. Defaults to `var(--spacing-8)`.
 * @cssprop --sticky-stack-dim - How much the bottom card darkens, from 0 (not at all) to 1 (black). Defaults to `0.2`.
 */
export class MoulStickyStack extends LitElement {
  static override styles = stickyStackStyles

  static override properties = {
    minScale: { type: Number, attribute: 'min-scale' },
  }

  /** The scale the bottom card shrinks to once the pile is complete, from 0.5 to 1; 1 turns shrinking off. Defaults to 0.9. */
  declare minScale: number

  private readonly inView: InViewController
  private scrollRoot: Element | null | undefined = undefined
  private ranges: StackRange[] = []
  /** The children the variables were written on, so a removed one is cleaned up. */
  private styled = new Set<HTMLElement>()
  private resizeObserver: ResizeObserver | null = null
  private measureFrame = 0

  constructor() {
    super()
    this.minScale = DEFAULT_MIN_SCALE
    new ScrollController(this, {
      timeline: 'view',
      property: PROGRESS_PROPERTY,
      source: () => this.resolveScrollRoot(),
    })
    // Only for `will-change`: the cards get their own layers while near the screen.
    this.inView = new InViewController(this, {
      rootMargin: '50% 0px',
      pauseOffscreen: false,
    })
  }

  private get stackEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('[part="stack"]') ?? null
  }

  private get stackChildren(): HTMLElement[] {
    return [...this.children].filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.localName !== 'template',
    )
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('focusin', this.handleFocusIn)
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.scheduleMeasure, { passive: true })
    }
    // Moved elsewhere: the children lost their variables when it disconnected.
    if (this.hasUpdated) {
      this.observeSizes()
      this.syncChildren()
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('focusin', this.handleFocusIn)
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.scheduleMeasure)
    }
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    if (this.measureFrame) cancelAnimationFrame(this.measureFrame)
    this.measureFrame = 0
    this.scrollRoot = undefined
    for (const child of this.styled) {
      for (const name of CHILD_PROPERTIES) child.style.removeProperty(name)
    }
    this.styled.clear()
    this.ranges = []
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('minScale')) {
      const value = Number(this.minScale)
      this.minScale = Number.isFinite(value)
        ? Math.min(1, Math.max(0.5, value))
        : DEFAULT_MIN_SCALE
      this.style.setProperty('--_sticky-stack-min-scale', String(this.minScale))
    }
  }

  protected override firstUpdated(): void {
    this.observeSizes()
    this.syncChildren()
  }

  private resolveScrollRoot(): Element | null {
    if (this.scrollRoot === undefined) this.scrollRoot = findScrollRoot(this)
    return this.scrollRoot
  }

  private observeSizes(): void {
    if (typeof ResizeObserver !== 'function') return
    this.resizeObserver?.disconnect()
    this.resizeObserver = new ResizeObserver(this.scheduleMeasure)
    this.resizeObserver.observe(this)
    for (const child of this.stackChildren) this.resizeObserver.observe(child)
    const root = this.resolveScrollRoot()
    if (root) this.resizeObserver.observe(root)
  }

  private readonly handleSlotChange = (): void => {
    this.syncChildren()
    this.observeSizes()
  }

  /** Numbers the children, so each sticks one step lower, and forgets removed ones. */
  private syncChildren(): void {
    const children = this.stackChildren
    for (const child of this.styled) {
      if (children.includes(child)) continue
      for (const name of CHILD_PROPERTIES) child.style.removeProperty(name)
      this.styled.delete(child)
    }
    children.forEach((child, index) => {
      child.style.setProperty(INDEX_PROPERTY, String(index))
      this.styled.add(child)
    })
    this.scheduleMeasure()
  }

  private readonly scheduleMeasure = (): void => {
    if (this.measureFrame || typeof requestAnimationFrame !== 'function') return
    this.measureFrame = requestAnimationFrame(() => {
      this.measureFrame = 0
      this.measure()
    })
  }

  /**
   * Reads where every child sits in the normal flow and writes, on each one,
   * the stretch of the host's view timeline over which it shrinks. It runs on
   * resize and when the children change, never while the reader scrolls.
   */
  private measure(): void {
    const stack = this.stackEl
    const children = this.stackChildren
    if (!stack || typeof getComputedStyle !== 'function') return
    const px = (value: string) => Number.parseFloat(value) || 0
    const stackStyle = getComputedStyle(stack)
    const gap = px(stackStyle.rowGap)
    // Neither box is sticky or transformed, so their rects are their layout places.
    let top =
      stack.getBoundingClientRect().top -
      this.getBoundingClientRect().top +
      px(stackStyle.borderTopWidth) +
      px(stackStyle.paddingTop)

    const boxes: StackChildBox[] = children.map((child, index) => {
      const style = getComputedStyle(child)
      top += px(style.marginTop)
      const box = {
        top,
        height: child.offsetHeight,
        stuck: px(style.top),
      }
      top +=
        box.height +
        px(style.marginBottom) +
        (index < children.length - 1 ? gap : 0)
      return box
    })

    const root = this.resolveScrollRoot()
    this.ranges = stackRanges(boxes, scrollPortHeight(root), this.offsetHeight)
    children.forEach((child, index) => {
      const range = this.ranges[index]
      child.style.setProperty(FROM_PROPERTY, String(range.from))
      child.style.setProperty(SPAN_PROPERTY, String(range.span))
      child.style.setProperty(DEPTH_PROPERTY, String(range.depth))
      this.styled.add(child)
    })
  }

  /** Brings a covered card back to the top of the pile when keyboard focus moves into it. */
  private readonly handleFocusIn = (event: FocusEvent): void => {
    const child = this.childFrom(event)
    if (!child) return
    const index = this.stackChildren.indexOf(child)
    const range = this.ranges[index]
    if (!range || range.depth === 0) return
    const target = event.target as Element | null
    if (!target || !isFocusVisible(target)) return

    const root = this.resolveScrollRoot()
    const offset = scrollPortTop(root) - this.getBoundingClientRect().top
    if (offset <= range.start + 1) return
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth'
    const top = range.stick - offset
    if (root) root.scrollBy({ top, behavior })
    else window.scrollBy({ top, behavior })
  }

  /** The direct child an event came from, if any. */
  private childFrom(event: Event): HTMLElement | null {
    for (const node of event.composedPath()) {
      if (node === this) break
      if (node instanceof HTMLElement && node.parentElement === this)
        return node
    }
    return null
  }

  protected override render() {
    return html`<div
      part="stack"
      class=${classMap({ stack: true, near: this.inView.isInView })}
    >
      <slot @slotchange=${this.handleSlotChange}></slot>
    </div>`
  }
}

function isFocusVisible(el: Element): boolean {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

defineElement('moul-sticky-stack', MoulStickyStack)

declare global {
  interface HTMLElementTagNameMap {
    'moul-sticky-stack': MoulStickyStack
  }
}
