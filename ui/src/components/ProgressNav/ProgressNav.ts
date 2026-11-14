import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { keyed } from 'lit/directives/keyed.js'
import {
  ScrollController,
  type ScrollState,
} from '../../controllers/scroll.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion } from '../../utils/motion'
import { progressNavStyles } from './ProgressNav.styles'

/** `bottom` and `top` are fixed to that edge of the viewport, centred; `inline` sits in the normal flow. */
export type ProgressNavPlacement = 'bottom' | 'top' | 'inline'

const PLACEMENTS: readonly ProgressNavPlacement[] = ['bottom', 'top', 'inline']
const DEFAULT_HEADINGS = 'h2, h3'
const DEFAULT_LABEL = 'On this page'
/** A heading becomes the active one once its top passes this far down the view. */
const ACTIVE_LINE = 0.25

interface HeadingEntry {
  el: HTMLElement
  id: string
  text: string
  level: number
}

interface HeadingNode {
  index: number
  children: HeadingNode[]
}

/**
 * A floating pill that shows how far the reader is through a long page and
 * which section they are in: a small ring fills as the page scrolls, and the
 * active heading's text slides in beside it as the reader passes each one.
 * Pressing the pill opens a list of every heading, nested by level, to jump
 * to. Point `for` at the id of the article (by default the page's `main`,
 * else the body) and choose which headings count with `headings`, `h2, h3`
 * by default. The ring follows the article if it scrolls itself, else the
 * page. Headings without an id are given one. It stays out of sight until the
 * reader reaches the first heading, unless `is-always-visible` is set. It
 * lives in the effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: a `<nav>` landmark named by `label` ("On this
 * page"), holding a button whose name is the label and the active heading,
 * with `aria-expanded` and `aria-controls` for the list. Enter or Space opens
 * the list; Down or Up on the pill opens it and moves focus to the active
 * link; inside the list Up, Down, Home and End move between the links, and
 * Escape closes it and returns focus to the pill. Choosing a link scrolls to
 * its heading and moves focus there (adding `tabindex="-1"` if the heading
 * cannot take focus). The active link has `aria-current="location"`. The
 * ring is `aria-hidden`; the heading change is not announced, because the
 * reader's own scrolling caused it. While out of sight it is hidden from
 * assistive technology too.
 *
 * Reduced motion: the heading text swaps at once instead of sliding, a jump
 * to a heading is instant instead of smooth, the pill and list appear
 * without moving, and the ring follows the scroll exactly, with no easing.
 *
 * @fires openchange - The list opened or closed. `detail.isOpen` is the new state.
 *
 * @csspart base - The `<nav>` that holds the pill and the list.
 * @csspart pill - The button: ring, active heading and chevron.
 * @csspart ring - The progress ring.
 * @csspart current - The active heading's text.
 * @csspart panel - The floating box that holds the list.
 * @csspart list - Each list of links (nested lists for deeper levels).
 * @csspart link - Each heading link.
 *
 * @cssprop --progress-nav-color - The colour of the ring's fill. Defaults to `var(--color-accent)`.
 * @cssprop --progress-nav-offset - The gap between the pill and the viewport edge it is fixed to. Defaults to `1.5rem`.
 * @cssprop --progress-nav-max-width - The widest the heading text gets before it is cut short. Defaults to `16rem`.
 */
export class MoulProgressNav extends LitElement {
  static override styles = progressNavStyles

  static override properties = {
    htmlFor: { type: String, attribute: 'for' },
    headings: { type: String },
    placement: { type: String, reflect: true },
    label: { type: String },
    isAlwaysVisible: {
      type: Boolean,
      reflect: true,
      attribute: 'is-always-visible',
    },
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    entries: { state: true },
    activeIndex: { state: true },
  }

  /** The id of the article whose headings are listed. Empty uses the page's `main`, else the body. */
  declare htmlFor: string
  /** A selector for the headings to list, matched inside the article. Defaults to `h2, h3`. */
  declare headings: string
  /** Where the pill sits. Defaults to `bottom`; an unknown value falls back to it. */
  declare placement: ProgressNavPlacement
  /** The landmark's name, also read before the active heading. Defaults to "On this page". */
  declare label: string
  /** Show the pill from the start, instead of once the reader reaches the first heading. */
  declare isAlwaysVisible: boolean
  /** Whether the list of headings is open. */
  declare isOpen: boolean
  private declare entries: HeadingEntry[]
  private declare activeIndex: number

  private scrolling: ScrollController | null = null
  private container: HTMLElement | null = null
  private scrollsItself = false
  private containerObserver: MutationObserver | null = null
  private rootObserver: MutationObserver | null = null
  private recollectFrame = 0
  /** The text that slides away when the active heading changes. */
  private leavingText: string | null = null
  private swapCount = 0
  private swapDirection: 'forward' | 'backward' = 'forward'

  constructor() {
    super()
    this.htmlFor = ''
    this.headings = DEFAULT_HEADINGS
    this.placement = 'bottom'
    this.label = DEFAULT_LABEL
    this.isAlwaysVisible = false
    this.isOpen = false
    this.entries = []
    this.activeIndex = -1
  }

  /** The heading the reader is in, or null before the first one. */
  public get activeHeading(): HTMLElement | null {
    return this.entries[this.activeIndex]?.el ?? null
  }

  private get pillEl(): HTMLButtonElement | null {
    return this.renderRoot?.querySelector('[part="pill"]') ?? null
  }

  private get links(): HTMLAnchorElement[] {
    return [
      ...(this.renderRoot?.querySelectorAll<HTMLAnchorElement>(
        '[part="link"]',
      ) ?? []),
    ]
  }

  private get isShown(): boolean {
    return this.isAlwaysVisible || this.activeIndex >= 0
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('keydown', this.handleKeyDown)
    this.addEventListener('focusout', this.handleFocusOut)
    this.bind()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('keydown', this.handleKeyDown)
    this.removeEventListener('focusout', this.handleFocusOut)
    document.removeEventListener('pointerdown', this.handleOutsidePointer, true)
    this.unbind()
  }

  /** Reads the headings again, for content that changed in a way the element could not see. */
  public refresh(): void {
    this.collect()
    this.measureActive()
  }

  /** Opens or closes the list of headings and fires `openchange`. */
  public setOpen(isOpen: boolean): void {
    if (this.isOpen === isOpen) return
    this.isOpen = isOpen
    this.dispatchEvent(
      new CustomEvent('openchange', {
        bubbles: true,
        composed: true,
        detail: { isOpen },
      }),
    )
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('placement') && !PLACEMENTS.includes(this.placement)) {
      this.placement = 'bottom'
    }
    if (
      (changed.has('htmlFor') && changed.get('htmlFor') !== undefined) ||
      (changed.has('headings') && changed.get('headings') !== undefined)
    ) {
      this.bind(true)
    }
    if (changed.has('activeIndex') && !this.isShown && this.isOpen) {
      this.setOpen(false)
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('isOpen')) {
      if (this.isOpen) {
        document.addEventListener(
          'pointerdown',
          this.handleOutsidePointer,
          true,
        )
      } else {
        document.removeEventListener(
          'pointerdown',
          this.handleOutsidePointer,
          true,
        )
      }
    }
  }

  /** Finds the article, its headings and the scroller, and waits for the article if it is not there yet. */
  private bind(force = false): void {
    if (!this.isConnected) return
    const root = this.getRootNode() as Document | ShadowRoot
    const id = this.htmlFor
    const target = id
      ? ((root.getElementById?.(id) as HTMLElement | null) ?? null)
      : ((document.querySelector('main') as HTMLElement | null) ??
        document.body)
    this.watchRoot(id && !target ? root : null)
    if (!target) {
      this.stopFollowing()
      this.container = null
      this.entries = []
      this.activeIndex = -1
      return
    }
    if (!force && this.scrolling && target === this.container) return

    this.stopFollowing()
    this.container = target
    this.collect()
    this.watchContainer(target)
    this.scrollsItself = isScrollContainer(target)
    this.scrolling = new ScrollController(this, {
      ...(this.scrollsItself ? { source: () => target } : {}),
      onScroll: this.handleScroll,
    })
  }

  private unbind(): void {
    this.watchRoot(null)
    this.containerObserver?.disconnect()
    this.containerObserver = null
    if (this.recollectFrame) cancelAnimationFrame(this.recollectFrame)
    this.recollectFrame = 0
    this.stopFollowing()
    this.container = null
  }

  private stopFollowing(): void {
    if (this.scrolling) {
      this.scrolling.hostDisconnected()
      this.removeController(this.scrolling)
    }
    this.scrolling = null
    // The variable inherits, so an ancestor's progress would otherwise show through.
    this.style.setProperty('--scroll-progress', '0')
  }

  private watchRoot(root: Node | null): void {
    if (!root) {
      this.rootObserver?.disconnect()
      this.rootObserver = null
    } else if (!this.rootObserver && typeof MutationObserver !== 'undefined') {
      this.rootObserver = new MutationObserver(() => this.bind())
      this.rootObserver.observe(root, {
        childList: true,
        subtree: true,
        attributeFilter: ['id'],
      })
    }
  }

  /** Reads the headings again when the article's content changes, at most once a frame. */
  private watchContainer(container: HTMLElement): void {
    this.containerObserver?.disconnect()
    this.containerObserver = null
    if (typeof MutationObserver === 'undefined') return
    this.containerObserver = new MutationObserver(() => {
      if (this.recollectFrame || typeof requestAnimationFrame !== 'function')
        return
      this.recollectFrame = requestAnimationFrame(() => {
        this.recollectFrame = 0
        this.refresh()
      })
    })
    this.containerObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    })
  }

  /** Lists the headings in the article, giving an id to any that lack one. */
  private collect(): void {
    const container = this.container
    if (!container) {
      this.entries = []
      return
    }
    let found: HTMLElement[] = []
    try {
      found = [
        ...container.querySelectorAll<HTMLElement>(
          this.headings || DEFAULT_HEADINGS,
        ),
      ]
    } catch {
      found = []
    }
    const root = this.getRootNode() as Document | ShadowRoot
    const entries = found.map((el) => {
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
      if (!el.id) el.id = uniqueId(slugify(text), root)
      return { el, id: el.id, text, level: headingLevel(el) }
    })
    const isSame =
      entries.length === this.entries.length &&
      entries.every(
        (entry, i) =>
          entry.el === this.entries[i].el &&
          entry.text === this.entries[i].text &&
          entry.id === this.entries[i].id,
      )
    if (!isSame) this.entries = entries
  }

  private readonly handleScroll = (state: ScrollState): void => {
    this.measureActive(state)
  }

  /**
   * The active heading is the last one whose top has passed a line a quarter
   * of the way down the view. The tops are in document order, so a binary
   * search reads only a handful of them each frame. At the very end of the
   * page the last heading in view wins, since the final sections may be too
   * short to reach the line.
   */
  private measureActive(state?: ScrollState): void {
    const entries = this.entries
    if (entries.length === 0 || typeof window === 'undefined') {
      this.setActive(-1)
      return
    }
    const view = this.viewBox()
    const line = view.top + view.height * ACTIVE_LINE
    const top = (index: number) => entries[index].el.getBoundingClientRect().top

    let low = 0
    let high = entries.length - 1
    let active = -1
    while (low <= high) {
      const mid = (low + high) >> 1
      if (top(mid) <= line) {
        active = mid
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    const progress = state?.progress ?? this.scrolling?.state.progress ?? 0
    if (progress >= 0.999 && this.canScroll()) {
      const bottom = view.top + view.height
      for (let i = entries.length - 1; i > active; i--) {
        if (top(i) < bottom) {
          active = i
          break
        }
      }
    }
    this.setActive(active)
  }

  private setActive(index: number): void {
    if (index === this.activeIndex) return
    const previous = this.activeIndex
    // The first heading slides in from nothing; later ones push the last away.
    this.leavingText =
      previous >= 0 && !prefersReducedMotion()
        ? (this.entries[previous]?.text ?? null)
        : null
    this.swapDirection = index > previous ? 'forward' : 'backward'
    this.swapCount++
    this.activeIndex = index
  }

  private viewBox(): { top: number; height: number } {
    const container = this.container
    if (container && this.scrollsItself) {
      return {
        top: container.getBoundingClientRect().top,
        height: container.clientHeight,
      }
    }
    return { top: 0, height: window.innerHeight }
  }

  private canScroll(): boolean {
    const source = this.scrollsItself
      ? this.container
      : (document.scrollingElement ?? document.documentElement)
    return Boolean(source && source.scrollHeight > source.clientHeight)
  }

  private readonly handleLeavingEnd = (): void => {
    this.leavingText = null
    this.requestUpdate()
  }

  private readonly handlePillClick = (): void => {
    this.setOpen(!this.isOpen)
  }

  private readonly handleLinkClick = (event: MouseEvent): void => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey)
      return
    const link = event.currentTarget as HTMLAnchorElement
    const index = Number(link.dataset.index)
    const entry = this.entries[index]
    if (!entry) return
    event.preventDefault()
    this.goTo(entry)
    this.setActive(index)
    this.setOpen(false)
  }

  /** Scrolls to a heading, moves focus to it and records it in the address. */
  private goTo(entry: HeadingEntry): void {
    const heading = entry.el
    heading.scrollIntoView?.({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    })
    if (heading.tabIndex < 0 && !heading.hasAttribute('tabindex')) {
      heading.setAttribute('tabindex', '-1')
    }
    heading.focus({ preventScroll: true })
    try {
      if (location.hash !== `#${entry.id}`) {
        history.pushState(null, '', `#${entry.id}`)
      }
    } catch {
      // A sandboxed or opaque document cannot change its address.
    }
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const path = event.composedPath()
    const pill = this.pillEl
    const links = this.links
    const linkIndex = links.findIndex((link) => path.includes(link))

    if (event.key === 'Escape' && this.isOpen) {
      event.preventDefault()
      event.stopPropagation()
      this.setOpen(false)
      pill?.focus()
      return
    }

    if (pill && path.includes(pill)) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
      event.preventDefault()
      this.setOpen(true)
      void this.updateComplete.then(() => {
        const all = this.links
        ;(all[Math.max(0, this.activeIndex)] ?? all[0])?.focus()
      })
      return
    }

    if (linkIndex < 0) return
    let next: number
    switch (event.key) {
      case 'ArrowDown':
        next = Math.min(links.length - 1, linkIndex + 1)
        break
      case 'ArrowUp':
        next = Math.max(0, linkIndex - 1)
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = links.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    links[next]?.focus()
  }

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null
    if (!this.isOpen || !next) return
    if (next === this || this.contains(next) || this.renderRoot.contains(next))
      return
    this.setOpen(false)
  }

  private readonly handleOutsidePointer = (event: PointerEvent): void => {
    if (!event.composedPath().includes(this)) this.setOpen(false)
  }

  private renderTree(nodes: HeadingNode[], isRoot: boolean): unknown {
    return html`<ol
      part="list"
      class=${isRoot ? 'list' : 'list nested'}
      id=${isRoot ? 'list' : nothing}
    >
      ${nodes.map((node) => {
        const entry = this.entries[node.index]
        const isActive = node.index === this.activeIndex
        return html`<li>
          <a
            part="link"
            class="link"
            href="#${entry.id}"
            data-index=${node.index}
            aria-current=${isActive ? 'location' : nothing}
            @click=${this.handleLinkClick}
            >${entry.text}</a
          >
          ${node.children.length > 0 ? this.renderTree(node.children, false) : nothing}
        </li>`
      })}
    </ol>`
  }

  protected override render() {
    const active = this.entries[this.activeIndex]
    const text = active?.text ?? this.label
    const isShown = this.isShown
    const isOpen = this.isOpen && isShown
    const leaving = this.leavingText
    return html`<nav
      part="base"
      class="base"
      aria-label=${this.label || DEFAULT_LABEL}
      ?data-shown=${isShown}
      ?data-open=${isOpen}
    >
      <button
        part="pill"
        class="pill"
        type="button"
        aria-expanded=${isOpen ? 'true' : 'false'}
        aria-controls="panel"
        @click=${this.handlePillClick}
      >
        <svg part="ring" class="ring" viewBox="0 0 20 20" aria-hidden="true">
          <circle class="track" cx="10" cy="10" r="8" pathLength="100"></circle>
          <circle class="fill" cx="10" cy="10" r="8" pathLength="100"></circle>
        </svg>
        ${active ? html`<span class="visually-hidden">${this.label}: </span>` : nothing}
        <span
          part="current"
          class="current"
          data-direction=${this.swapDirection}
        >
          ${keyed(
            this.swapCount,
            html`${
              leaving !== null
                ? html`<span
                    class="text leaving"
                    aria-hidden="true"
                    @animationend=${this.handleLeavingEnd}
                    >${leaving}</span
                  >`
                : nothing
            }<span class=${this.swapCount > 1 ? 'text entering' : 'text'}
              >${text}</span
            >`,
          )}
        </span>
        <svg class="chevron" viewBox="0 0 16 16" aria-hidden="true">
          <path d="m4 10 4-4 4 4"></path>
        </svg>
      </button>
      <div part="panel" class="panel" id="panel">
        ${
          this.entries.length > 0
            ? this.renderTree(nest(this.entries), true)
            : nothing
        }
      </div>
    </nav>`
  }
}

/** Builds the nested outline: each heading holds the deeper ones that follow it. */
function nest(entries: HeadingEntry[]): HeadingNode[] {
  const roots: HeadingNode[] = []
  const stack: Array<{ level: number; node: HeadingNode }> = []
  entries.forEach((entry, index) => {
    const node: HeadingNode = { index, children: [] }
    while (stack.length > 0 && stack[stack.length - 1].level >= entry.level) {
      stack.pop()
    }
    const parent = stack[stack.length - 1]
    if (parent) parent.node.children.push(node)
    else roots.push(node)
    stack.push({ level: entry.level, node })
  })
  return roots
}

function headingLevel(el: HTMLElement): number {
  const match = /^h([1-6])$/i.exec(el.localName)
  if (match) return Number(match[1])
  const aria = Number(el.getAttribute('aria-level'))
  return Number.isFinite(aria) && aria > 0 ? aria : 2
}

function slugify(text: string): string {
  const slug = text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'section'
}

function uniqueId(base: string, root: Document | ShadowRoot): string {
  const taken = (id: string) =>
    Boolean(root.getElementById?.(id) ?? document.getElementById(id))
  if (!taken(base)) return base
  let n = 2
  while (taken(`${base}-${n}`)) n++
  return `${base}-${n}`
}

function isScrollContainer(el: HTMLElement): boolean {
  if (el === document.body || el === document.documentElement) return false
  if (typeof getComputedStyle !== 'function') return false
  const overflow = getComputedStyle(el).overflowY
  return overflow === 'auto' || overflow === 'scroll'
}

defineElement('moul-progress-nav', MoulProgressNav)

declare global {
  interface HTMLElementTagNameMap {
    'moul-progress-nav': MoulProgressNav
  }
}
