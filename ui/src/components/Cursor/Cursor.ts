import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { cursorStyles } from './Cursor.styles'

/**
 * `dot`: a small dot right on the pointer with a ring that trails it.
 * `label`: an arrow with a pill of text that trails it.
 * `arrow`: a smooth arrow in place of the system one.
 */
export type CursorVariant = 'dot' | 'label' | 'arrow'

/** `element` replaces the cursor over the element's own content; `page` over the whole page. */
export type CursorScope = 'element' | 'page'

const VARIANTS: readonly CursorVariant[] = ['dot', 'label', 'arrow']
const SCOPES: readonly CursorScope[] = ['element', 'page']

/** A spring the follower's parts chase the pointer with. Infinite stiffness sticks to it. */
interface Spring {
  stiffness: number
  damping: number
}

/** Stays on the pointer. */
const EXACT: Spring = { stiffness: Number.POSITIVE_INFINITY, damping: 0 }
/** Trails a little and overshoots slightly before it settles: the ring and the pill. */
const TRAIL: Spring = { stiffness: 170, damping: 20 }
/** Barely behind, never overshoots: the arrow, which stands in for the real cursor. */
const SMOOTH: Spring = { stiffness: 700, damping: 52 }

/** A frame longer than this (a busy or hidden tab) is integrated as this long, so the spring cannot explode. */
const MAX_STEP = 1 / 30
/** Distance and speed under which a part counts as settled and the loop stops. */
const REST = 0.05

/** Where the pointer gets the system cursor back: text entry and frames. */
const NATIVE_SELECTOR = [
  'textarea',
  'iframe',
  '[contenteditable]:not([contenteditable="false"])',
  'input:not([type="button"], [type="submit"], [type="reset"], [type="checkbox"], [type="radio"], [type="range"], [type="color"], [type="file"], [type="image"])',
].join(', ')

/** What the follower grows over. */
const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'select',
  'summary',
  'label',
  'input',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
].join(', ')

/**
 * Inner parts that Moul elements (and many others) give a `cursor: pointer`
 * inside their shadow root, where a page style cannot reach them except
 * through `::part()`.
 */
const SHADOW_PARTS = ['button', 'base', 'control', 'link', 'trigger', 'item']

const ROOT_ATTRIBUTE = 'data-moul-cursor-active'

function hideCursorRules(scope: string): string {
  const parts = SHADOW_PARTS.map((part) => `${scope} *::part(${part})`)
  return `${[scope, `${scope} *`, ...parts].join(',\n')} { cursor: none !important; }`
}

/**
 * Hides the system cursor while a follower stands in for it. It has to live
 * in the document (or the shadow root the element sits in), because a
 * shadow root's own styles cannot reach the content slotted into it.
 */
const HIDE_CURSOR_CSS = `@media not (forced-colors: active) {
@media (prefers-reduced-motion: no-preference) {
${hideCursorRules('moul-cursor[data-active]')}
${hideCursorRules(`:root[${ROOT_ATTRIBUTE}]`)}
}
}`

const styledRoots = new WeakSet<Document | ShadowRoot>()

function installHideCursorStyles(root: Document | ShadowRoot): void {
  if (styledRoots.has(root)) return
  styledRoots.add(root)
  try {
    if (
      typeof CSSStyleSheet === 'function' &&
      'adoptedStyleSheets' in root &&
      typeof CSSStyleSheet.prototype.replaceSync === 'function'
    ) {
      const sheet = new CSSStyleSheet()
      sheet.replaceSync(HIDE_CURSOR_CSS)
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet]
      return
    }
  } catch {
    // Fall through to a <style> element.
  }
  const style = document.createElement('style')
  style.textContent = HIDE_CURSOR_CSS
  const parent = isDocument(root) ? root.head : root
  parent?.append(style)
}

// By node type, not instanceof, which fails across frames and in some test DOMs.
function isDocument(node: Node): node is Document {
  return node.nodeType === 9
}

function isShadowRoot(node: Node): node is ShadowRoot {
  return node.nodeType === 11 && 'host' in node
}

/** One part of the follower and the spring it moves on. */
class Body {
  x = 0
  y = 0
  vx = 0
  vy = 0
  written = ''
  spring: Spring

  constructor(spring: Spring) {
    this.spring = spring
  }

  /** Jumps to the point, at rest. */
  place(x: number, y: number): void {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
  }

  /** Advances by `dt` seconds toward the point; returns whether it is still moving. */
  step(x: number, y: number, dt: number): boolean {
    const { stiffness, damping } = this.spring
    if (!Number.isFinite(stiffness)) {
      this.place(x, y)
      return false
    }
    // Semi-implicit Euler: stable for these stiffnesses at up to MAX_STEP.
    this.vx += (stiffness * (x - this.x) - damping * this.vx) * dt
    this.vy += (stiffness * (y - this.y) - damping * this.vy) * dt
    this.x += this.vx * dt
    this.y += this.vy * dt
    const isMoving =
      Math.abs(x - this.x) > REST ||
      Math.abs(y - this.y) > REST ||
      Math.abs(this.vx) > REST ||
      Math.abs(this.vy) > REST
    if (!isMoving) this.place(x, y)
    return isMoving
  }

  /** Writes the position, unless it has not changed since the last frame. */
  write(el: HTMLElement | null): void {
    const value = `${Math.round(this.x * 10) / 10}px ${Math.round(this.y * 10) / 10}px`
    if (!el || value === this.written) return
    this.written = value
    el.style.translate = value
  }
}

/**
 * Replaces the mouse cursor over an area with a smooth follower: a dot with
 * a ring that trails it (`variant="dot"`, the default), an arrow with a pill
 * of text (`label`), or a smooth arrow (`arrow`). Wrap the content it
 * applies to, or set `scope="page"` to replace the cursor over the whole page
 * (then the element can sit anywhere, empty). The follower grows over links
 * and buttons, shrinks a little on press, and any element with a
 * `data-cursor-label` attribute shows that text beside it, in every variant,
 * for a "View" or "Drag" over a gallery. Text fields and frames get the
 * system cursor back, and an inner `moul-cursor` takes over inside its own
 * area. Only a mouse is followed: touch and pen keep their usual behaviour,
 * and the system cursor returns whenever the pointer leaves. The follower is
 * drawn in the top layer, so transformed or clipped ancestors do not move or
 * cut it; it is placed by `translate` alone, once per frame, and the frame
 * loop stops as soon as it catches up with a still pointer. It lives in the
 * effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role; the content
 * keeps its own semantics and focus order, and keyboard focus rings are
 * untouched. The follower is decorative and hidden from assistive
 * technology, so a `data-cursor-label` must only repeat what the content
 * already says. Where the system forces its own colours (Windows high
 * contrast) the system cursor stays and no follower is drawn.
 *
 * Reduced motion: no follower is drawn and the system cursor stays as it is,
 * changing back at once if the setting is turned on while it shows.
 *
 * @slot - The content the cursor is replaced over. Ignored with `scope="page"`, where it simply shows.
 *
 * @csspart follower - The layer that holds the follower; it ignores the pointer.
 * @csspart lead - The part right on the pointer: the dot or the arrow.
 * @csspart trail - The part that trails: the ring, or the pill with the label.
 *
 * @cssprop --cursor-color - The dot, the ring and the arrow. Defaults to `var(--color-fg)`.
 * @cssprop --cursor-outline - The thin outline round the arrow and the dot, so they show on any background. Defaults to `var(--color-bg)`.
 * @cssprop --cursor-size - The diameter of the ring. Defaults to `2.25rem`.
 * @cssprop --cursor-label-background - The pill's fill. Defaults to `var(--color-primary-solid)`.
 * @cssprop --cursor-label-color - The pill's text. Defaults to `var(--color-fg-on-primary)`.
 */
export class MoulCursor extends LitElement {
  static override styles = cursorStyles

  static override properties = {
    variant: { type: String, reflect: true },
    label: { type: String },
    scope: { type: String, reflect: true },
  }

  /** The follower's look. An unknown value falls back to `dot`. */
  declare variant: CursorVariant
  /** Text in the pill of the `label` variant. A hovered element's `data-cursor-label` wins. */
  declare label: string
  /** Where the cursor is replaced. An unknown value falls back to `element`. */
  declare scope: CursorScope

  private readonly lead = new Body(EXACT)
  private readonly trail = new Body(TRAIL)
  private targetX = 0
  private targetY = 0
  private frame = 0
  private lastTime = 0
  private isReduced = false
  private isShowing = false
  private isHidingCursor = false
  private hoverLabel = ''
  private stopWatchingMotion: (() => void) | null = null
  private listenedTo: EventTarget | null = null

  constructor() {
    super()
    this.variant = 'dot'
    this.label = ''
    this.scope = 'element'
  }

  /** Whether the follower is showing in place of the system cursor. */
  public get isActive(): boolean {
    return this.isShowing
  }

  private get followerEl(): HTMLElement | null {
    return (
      this.renderRoot?.querySelector<HTMLElement>('[part="follower"]') ?? null
    )
  }

  private get leadEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('[part="lead"]') ?? null
  }

  private get trailEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('[part="trail"]') ?? null
  }

  private get isPage(): boolean {
    return this.scope === 'page'
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      if (isReduced) this.deactivate()
    })
    if (typeof window !== 'undefined') {
      window.addEventListener('blur', this.handleWindowBlur)
    }
    this.listen()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    if (typeof window !== 'undefined') {
      window.removeEventListener('blur', this.handleWindowBlur)
    }
    this.unlisten()
    this.deactivate()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('variant') && !VARIANTS.includes(this.variant)) {
      this.variant = 'dot'
    }
    if (changed.has('scope') && !SCOPES.includes(this.scope)) {
      this.scope = 'element'
    }
    if (changed.has('variant')) {
      // In the arrow and label variants the arrow replaces the system cursor, so it moves smoothly but barely lags.
      this.lead.spring = this.variant === 'dot' ? EXACT : SMOOTH
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('scope') && changed.get('scope') !== undefined) {
      this.deactivate()
      this.unlisten()
      this.listen()
    }
    if (changed.has('label') || changed.has('variant')) this.syncLabel()
  }

  /** Where the pointer is watched: the element itself, or the whole document. */
  private listen(): void {
    const source: EventTarget = this.isPage ? document : this
    source.addEventListener(
      'pointermove',
      this.handlePointerMove as EventListener,
      {
        passive: true,
      },
    )
    source.addEventListener(
      'pointerover',
      this.handlePointerOver as EventListener,
    )
    source.addEventListener(
      'pointerdown',
      this.handlePointerDown as EventListener,
    )
    source.addEventListener('pointerup', this.handlePointerUp as EventListener)
    if (this.isPage) {
      document.addEventListener('pointerout', this.handlePointerOut)
    } else {
      this.addEventListener('pointerleave', this.handlePointerLeave)
    }
    this.listenedTo = source
  }

  private unlisten(): void {
    const source = this.listenedTo
    if (!source) return
    source.removeEventListener(
      'pointermove',
      this.handlePointerMove as EventListener,
    )
    source.removeEventListener(
      'pointerover',
      this.handlePointerOver as EventListener,
    )
    source.removeEventListener(
      'pointerdown',
      this.handlePointerDown as EventListener,
    )
    source.removeEventListener(
      'pointerup',
      this.handlePointerUp as EventListener,
    )
    document.removeEventListener('pointerout', this.handlePointerOut)
    this.removeEventListener('pointerleave', this.handlePointerLeave)
    this.listenedTo = null
  }

  /**
   * Whether this element should draw the follower for an event: a mouse,
   * motion allowed, not over a text field or frame, and not inside another
   * `moul-cursor` that draws its own.
   */
  private claims(event: PointerEvent): boolean {
    if (event.pointerType !== 'mouse' || this.isReduced) return false
    for (const node of event.composedPath()) {
      if (node === this) break
      if (!(node instanceof Element)) continue
      if (node.matches(NATIVE_SELECTOR)) return false
      if (node.localName === 'moul-cursor' && node !== this) return false
    }
    return true
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    this.targetX = event.clientX
    this.targetY = event.clientY
    if (!this.claims(event)) {
      this.deactivate()
      return
    }
    if (!this.isShowing) this.activate()
    this.schedule()
  }

  private readonly handlePointerOver = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return
    if (!this.claims(event)) {
      this.deactivate()
      return
    }
    let label = ''
    let isInteractive = false
    for (const node of event.composedPath()) {
      if (node === this) break
      if (!(node instanceof Element)) continue
      if (!label && node.hasAttribute('data-cursor-label')) {
        label = node.getAttribute('data-cursor-label') ?? ''
      }
      if (!isInteractive && node.matches(INTERACTIVE_SELECTOR)) {
        isInteractive = !node.matches(':disabled')
      }
    }
    this.hoverLabel = label
    this.syncLabel()
    this.followerEl?.toggleAttribute('data-interactive', isInteractive)
    // A dialog or popover opened after the follower would cover it.
    if (this.isShowing && isOverTopLayer(event)) this.raise()
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') {
      // A finger or a pen on a hybrid device: give the system cursor back.
      this.deactivate()
      return
    }
    this.followerEl?.setAttribute('data-pressed', '')
  }

  private readonly handlePointerUp = (): void => {
    this.followerEl?.removeAttribute('data-pressed')
  }

  private readonly handlePointerLeave = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse') this.deactivate()
  }

  /** The pointer left the window. */
  private readonly handlePointerOut = (event: PointerEvent): void => {
    if (!event.relatedTarget) this.deactivate()
  }

  private readonly handleWindowBlur = (): void => {
    this.deactivate()
  }

  /** Shows the follower right on the pointer, without flying in from where it last was. */
  private activate(): void {
    const follower = this.followerEl
    if (!follower) return
    this.isShowing = true
    this.lead.place(this.targetX, this.targetY)
    this.trail.place(this.targetX, this.targetY)
    this.lead.write(this.leadEl)
    this.trail.write(this.trailEl)
    this.raise()
    follower.setAttribute('data-visible', '')
    this.hideSystemCursor(true)
  }

  private deactivate(): void {
    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = 0
    this.lastTime = 0
    this.hideSystemCursor(false)
    if (!this.isShowing) return
    this.isShowing = false
    const follower = this.followerEl
    follower?.removeAttribute('data-visible')
    follower?.removeAttribute('data-pressed')
  }

  /** Puts the follower on top of the top layer, above any dialog opened since. */
  private raise(): void {
    const follower = this.followerEl as
      | (HTMLElement & { showPopover?: () => void; hidePopover?: () => void })
      | null
    if (typeof follower?.showPopover !== 'function') return
    try {
      if (follower.matches(':popover-open')) follower.hidePopover?.()
      follower.showPopover()
    } catch {
      // Not connected, or the popover API refused: the fixed position still works.
    }
  }

  private hideSystemCursor(hide: boolean): void {
    if (hide === this.isHidingCursor) return
    this.isHidingCursor = hide
    if (hide) {
      const root = this.isPage ? document : this.getRootNode()
      if (isDocument(root) || isShadowRoot(root)) installHideCursorStyles(root)
    }
    if (this.isPage) {
      document.documentElement.toggleAttribute(ROOT_ATTRIBUTE, hide)
    } else {
      this.toggleAttribute('data-active', hide)
    }
  }

  private syncLabel(): void {
    const follower = this.followerEl
    const text = this.renderRoot?.querySelector<HTMLElement>('.text')
    if (!follower || !text) return
    const label =
      this.hoverLabel || (this.variant === 'label' ? this.label : '')
    if (text.textContent !== label) text.textContent = label
    follower.toggleAttribute('data-has-label', label !== '')
  }

  private schedule(): void {
    if (this.frame || typeof requestAnimationFrame !== 'function') return
    this.frame = requestAnimationFrame(this.tick)
  }

  private readonly tick = (time: number): void => {
    this.frame = 0
    if (!this.isShowing) return
    const dt = this.lastTime
      ? Math.min(Math.max((time - this.lastTime) / 1000, 0), MAX_STEP)
      : 1 / 60
    const leadMoving = this.lead.step(this.targetX, this.targetY, dt)
    const trailMoving = this.trail.step(this.targetX, this.targetY, dt)
    this.lead.write(this.leadEl)
    this.trail.write(this.trailEl)
    if (leadMoving || trailMoving) {
      this.lastTime = time
      this.schedule()
    } else {
      // Caught up with a still pointer: no more frames until it moves.
      this.lastTime = 0
    }
  }

  protected override render() {
    const arrow = html`<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 2.5 20 10.2l-7.1 2.2-3.2 7.1Z" />
    </svg>`
    return html`<slot></slot>
      <div part="follower" class="follower" popover="manual" aria-hidden="true">
        <span part="lead" class="lead">
          ${this.variant === 'dot' ? html`<span class="dot"></span>` : arrow}
        </span>
        <span part="trail" class="trail">
          <span class="shape"><span class="text"></span></span>
        </span>
      </div>`
  }
}

/** Whether the pointer is over an open dialog or popover other than a follower. */
function isOverTopLayer(event: Event): boolean {
  for (const node of event.composedPath()) {
    if (!(node instanceof Element)) continue
    if (node.localName === 'dialog' && node.hasAttribute('open')) return true
    if (
      node.hasAttribute('popover') &&
      node.getAttribute('part') !== 'follower'
    ) {
      try {
        if (node.matches(':popover-open')) return true
      } catch {
        return false
      }
    }
  }
  return false
}

defineElement('moul-cursor', MoulCursor)

declare global {
  interface HTMLElementTagNameMap {
    'moul-cursor': MoulCursor
  }
}
