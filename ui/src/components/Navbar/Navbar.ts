import { html, LitElement, type PropertyValues } from 'lit'
import {
  ScrollController,
  type ScrollState,
} from '../../controllers/scroll.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { navbarStyles } from './Navbar.styles'

/** `bar` runs the full width of the page; `floating` is a rounded pill inset from the viewport edges. */
export type NavbarVariant = 'bar' | 'floating'

/** Tokens for `effect`: `shrink` lowers (and, floating, narrows) the bar once scrolled; `glass` turns it translucent. */
export type NavbarEffect = 'shrink' | 'glass'

const VARIANTS: readonly NavbarVariant[] = ['bar', 'floating']
const DEFAULT_THRESHOLD = 24
const DEFAULT_COLLAPSE_BELOW = 768

/**
 * The top bar of a site: a brand, the navigation and a few actions, sticky
 * at the top of the page. `hide-on-scroll` slides it out of view while the
 * reader scrolls down and brings it back on the way up; `effect="shrink"`
 * lowers the bar (and narrows a `variant="floating"` pill) once the page is
 * scrolled; `effect="glass"` turns it from transparent at the top of the page
 * to a translucent, blurred surface. Put the brand in `slot="brand"`, links
 * or a `moul-navigation-menu` in the default slot, and buttons, a search
 * field or a theme toggle in `slot="actions"`. A `moul-banner` in
 * `slot="banner"` rides above the bar; with `hide-on-scroll` on the banner,
 * the navbar slides it away once the page is scrolled. Below `collapse-below`
 * pixels of its own width (768 by default) the navigation moves behind a
 * menu button into a panel under the bar, and a `moul-navigation-menu` in it
 * is switched to `orientation="vertical"`. It follows the page's scroll, or
 * the scroll container named by `for`. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: the navbar itself is never focusable. The
 * default slot sits in a `<nav>` landmark named by `label` ("Main" by
 * default), and focus moves through the brand, the navigation and the
 * actions in the order they appear. Collapsed, the order is the brand, the
 * actions, then the menu button: a disclosure button with `aria-expanded`
 * and `aria-controls`, named by `menu-label` ("Menu"), which the open panel
 * follows in the focus order. `Escape` closes the panel and returns focus to the
 * button; following a link, or pressing outside the navbar, closes it
 * too. A bar hidden by scrolling returns as soon as focus moves
 * into it, and never hides while focus is inside it or the panel is open.
 *
 * Reduced motion: `hide-on-scroll` does nothing, so the bar always stays in
 * view; the shrink and glass changes happen without transitions; the panel
 * appears and the menu icon changes without sliding or turning.
 *
 * @slot - The navigation: links or a `moul-navigation-menu`, inside a `<nav>` landmark.
 * @slot brand - The site's name or logo, at the inline start.
 * @slot actions - Buttons, a search field or a theme toggle, at the inline end. They stay in the bar when it collapses.
 * @slot banner - A `moul-banner` (or any announcement) above the bar, which rides with it.
 *
 * @csspart base - Everything the navbar draws: the banner and the bar. It slides out of view with `hide-on-scroll`.
 * @csspart banner - The box that holds the `banner` slot.
 * @csspart bar - The bar itself, which shrinks and turns to glass.
 * @csspart brand - The box that holds the `brand` slot.
 * @csspart nav - The `<nav>` landmark around the default slot.
 * @csspart panel - The box around the `<nav>`: in line in the bar, or the panel under it when collapsed.
 * @csspart actions - The box that holds the `actions` slot.
 * @csspart menu-button - The button that opens the panel when the navbar is collapsed.
 *
 * @cssprop --navbar-height - The bar's height. Defaults to `4rem`.
 * @cssprop --navbar-shrunk-height - The bar's height once scrolled, with `effect="shrink"`. Defaults to `3.25rem`.
 * @cssprop --navbar-background - The bar's background. Defaults to `var(--color-background)`; with `glass`, the colour of the glass.
 * @cssprop --navbar-max-width - The width of the bar's content (or of a floating pill). Defaults to `72rem`.
 * @cssprop --navbar-shrunk-width - The width a floating pill narrows to once scrolled, with `effect="shrink"`. Defaults to `48rem`.
 * @cssprop --navbar-inset - The gap between a floating pill and the viewport edges. Defaults to `0.75rem`.
 * @cssprop --navbar-z-index - The stacking order of the sticky navbar. Defaults to `100`.
 *
 * @fires openchange - When the reader opens or closes the panel. `detail.isOpen` is the new state.
 */
export class MoulNavbar extends LitElement {
  static override styles = navbarStyles

  static override properties = {
    label: { type: String },
    variant: { type: String, reflect: true },
    effect: { type: String, reflect: true },
    hideOnScroll: { type: Boolean, reflect: true, attribute: 'hide-on-scroll' },
    threshold: { type: Number },
    collapseBelow: { type: Number, attribute: 'collapse-below' },
    menuLabel: { type: String, attribute: 'menu-label' },
    htmlFor: { type: String, attribute: 'for' },
    isMenuOpen: { type: Boolean, reflect: true, attribute: 'is-menu-open' },
    isScrolled: { type: Boolean, reflect: true, attribute: 'is-scrolled' },
    isRetracted: { type: Boolean, reflect: true, attribute: 'is-retracted' },
    isCollapsed: { type: Boolean, reflect: true, attribute: 'is-collapsed' },
    isBannerAway: { state: true },
  }

  /** The accessible name of the `<nav>` landmark. Defaults to `Main`. */
  declare label: string
  /** `bar` (default) or `floating`; an unknown value falls back to `bar`. */
  declare variant: NavbarVariant
  /** Space-separated effects: `shrink`, `glass`, or both. Empty by default. */
  declare effect: string
  /** Slide out of view while the reader scrolls down; come back on the way up. */
  declare hideOnScroll: boolean
  /** Pixels the page must be scrolled before the navbar counts as scrolled. Defaults to 24. */
  declare threshold: number
  /** Collapse the navigation behind a menu button below this many pixels of the navbar's width. Defaults to 768; 0 never collapses. */
  declare collapseBelow: number
  /** The accessible name of the menu button. Defaults to `Menu`. */
  declare menuLabel: string
  /** The id of a scroll container in the same document or shadow root to follow. Empty follows the page. */
  declare htmlFor: string
  /** Whether the collapsed panel is open. Setting it opens or closes the panel without an event. */
  declare isMenuOpen: boolean
  /** Read-only: the page is scrolled past `threshold`. */
  declare isScrolled: boolean
  /** Read-only: the bar is out of view because of `hide-on-scroll`. */
  declare isRetracted: boolean
  /** Read-only: the navbar is narrower than `collapse-below` and shows the menu button. */
  declare isCollapsed: boolean
  /** A banner with `hide-on-scroll` is slid out of view. */
  private declare isBannerAway: boolean

  private readonly scrolling: ScrollController
  /** Takes the scroll variable the controller writes every frame, off the page and out of the cascade. */
  private readonly scrollSink: HTMLElement | null =
    typeof document === 'undefined' ? null : document.createElement('span')
  private resizeObserver: ResizeObserver | null = null
  private bannerBox: Element | null = null
  private stopWatchingMotion: (() => void) | null = null
  private isReduced = false
  /** Navigation menus this navbar turned vertical, with the orientation each one had before. */
  private readonly orientedMenus = new Map<Element, string | null>()

  constructor() {
    super()
    this.label = 'Main'
    this.variant = 'bar'
    this.effect = ''
    this.hideOnScroll = false
    this.threshold = DEFAULT_THRESHOLD
    this.collapseBelow = DEFAULT_COLLAPSE_BELOW
    this.menuLabel = 'Menu'
    this.htmlFor = ''
    this.isMenuOpen = false
    this.isScrolled = false
    this.isRetracted = false
    this.isCollapsed = false
    this.isBannerAway = false
    this.scrolling = new ScrollController(this, {
      source: () => this.scrollSource(),
      trackDirection: true,
      forceFallback: true,
      property: '--_navbar-scroll',
      styleTarget: () => this.scrollSink,
      onScroll: this.handleScroll,
    })
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      if (isReduced) {
        this.isRetracted = false
        this.isBannerAway = false
      }
    })
    this.addEventListener('keydown', this.handleKeyDown)
    this.addEventListener('focusin', this.handleFocusIn)
    this.addEventListener('click', this.handleLinkClick)
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(this.handleResize)
      this.resizeObserver.observe(this)
      if (this.bannerBox) this.resizeObserver.observe(this.bannerBox)
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.removeEventListener('keydown', this.handleKeyDown)
    this.removeEventListener('focusin', this.handleFocusIn)
    this.removeEventListener('click', this.handleLinkClick)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.listenOutside(false)
    this.restoreMenus()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('variant') && !VARIANTS.includes(this.variant)) {
      this.variant = 'bar'
    }
    if (changed.has('hideOnScroll') && !this.hideOnScroll) {
      this.isRetracted = false
    }
    if (changed.has('isCollapsed') && !this.isCollapsed && this.isMenuOpen) {
      this.setMenuOpen(false)
    }
    if (changed.has('htmlFor') && changed.get('htmlFor') !== undefined) {
      // Follow the new container from where it is now.
      this.scrolling.hostDisconnected()
      this.scrolling.hostConnected()
    }
  }

  protected override firstUpdated(): void {
    this.bannerBox = this.renderRoot.querySelector('.banner')
    if (this.bannerBox) this.resizeObserver?.observe(this.bannerBox)
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('isCollapsed')) this.syncMenus()
    if (changed.has('isMenuOpen')) this.listenOutside(this.isMenuOpen)
  }

  /** Opens or closes the collapsed panel as the reader would, firing `openchange`. */
  public setMenuOpen(isOpen: boolean): void {
    if (this.isMenuOpen === isOpen) return
    this.isMenuOpen = isOpen
    this.dispatchEvent(
      new CustomEvent('openchange', {
        bubbles: true,
        composed: true,
        detail: { isOpen },
      }),
    )
  }

  private get thresholdPx(): number {
    return Number.isFinite(this.threshold) && this.threshold >= 0
      ? this.threshold
      : DEFAULT_THRESHOLD
  }

  private get collapsePx(): number {
    return Number.isFinite(this.collapseBelow) && this.collapseBelow >= 0
      ? this.collapseBelow
      : DEFAULT_COLLAPSE_BELOW
  }

  private get menuButton(): HTMLButtonElement | null {
    return this.renderRoot?.querySelector('[part="menu-button"]') ?? null
  }

  private scrollSource(): Element | null {
    if (!this.htmlFor || !this.isConnected) return null
    const root = this.getRootNode() as Document | ShadowRoot
    return root.getElementById?.(this.htmlFor) ?? null
  }

  private hasFocusInside(): boolean {
    if (typeof document === 'undefined') return false
    const active = document.activeElement
    return Boolean(
      (active && active !== document.body && this.contains(active)) ||
        this.shadowRoot?.activeElement,
    )
  }

  private hasHidingBanner(): boolean {
    for (const child of this.children) {
      if (child.slot === 'banner' && child.hasAttribute('hide-on-scroll')) {
        return true
      }
    }
    return false
  }

  private readonly handleScroll = (state: ScrollState): void => {
    const isScrolled = state.offset > this.thresholdPx
    if (isScrolled !== this.isScrolled) this.isScrolled = isScrolled

    const isBack = !isScrolled || state.direction === 'backward'
    const isForward = isScrolled && state.direction === 'forward'
    const canMove = !this.isReduced

    if (isBack) {
      if (this.isRetracted) this.isRetracted = false
      if (this.isBannerAway) this.isBannerAway = false
      return
    }
    if (!isForward || !canMove) return
    if (
      this.hideOnScroll &&
      !this.isRetracted &&
      !this.isMenuOpen &&
      !this.hasFocusInside()
    ) {
      this.isRetracted = true
    }
    if (!this.isBannerAway && this.hasHidingBanner()) this.isBannerAway = true
  }

  private readonly handleResize = (entries: ResizeObserverEntry[]): void => {
    for (const entry of entries) {
      if (entry.target === this) {
        const width = entry.contentRect.width
        if (width <= 0) continue
        const limit = this.collapsePx
        const isCollapsed = limit > 0 && width < limit
        if (isCollapsed !== this.isCollapsed) this.isCollapsed = isCollapsed
      } else if (entry.target === this.bannerBox) {
        const height =
          entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height
        const base = this.renderRoot.querySelector<HTMLElement>('.base')
        base?.style.setProperty('--_navbar-banner-h', `${height}px`)
      }
    }
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !this.isMenuOpen) return
    event.preventDefault()
    this.setMenuOpen(false)
    this.menuButton?.focus()
  }

  private readonly handleFocusIn = (): void => {
    // A keyboard user tabbing back into a hidden bar must be able to see it.
    if (this.isRetracted) this.isRetracted = false
  }

  private readonly handleOutsidePointer = (event: PointerEvent): void => {
    if (!event.composedPath().includes(this)) this.setMenuOpen(false)
  }

  private listenOutside(isOn: boolean): void {
    if (typeof document === 'undefined') return
    document.removeEventListener('pointerdown', this.handleOutsidePointer)
    if (isOn) {
      document.addEventListener('pointerdown', this.handleOutsidePointer)
    }
  }

  private readonly handleMenuButton = (): void => {
    this.setMenuOpen(!this.isMenuOpen)
  }

  /** Following a link closes the open panel, so the next page (or section) is not covered. */
  private readonly handleLinkClick = (event: MouseEvent): void => {
    if (!this.isCollapsed || !this.isMenuOpen) return
    const isLink = event
      .composedPath()
      .some(
        (node) =>
          node instanceof Element &&
          node.localName === 'a' &&
          node.hasAttribute('href'),
      )
    if (isLink) this.setMenuOpen(false)
  }

  private readonly handleNavSlotChange = (): void => {
    this.syncMenus()
  }

  /**
   * Collapsed, a `moul-navigation-menu` in the default slot is switched to
   * `orientation="vertical"`, so it opens its panels in line inside the
   * navbar's panel. The orientation each one had is put back on expanding.
   */
  private syncMenus(): void {
    const menus = this.isCollapsed
      ? [...this.children].filter(
          (child) =>
            child.localName === 'moul-navigation-menu' &&
            !child.getAttribute('slot'),
        )
      : []
    for (const [menu, original] of this.orientedMenus) {
      if (menus.includes(menu)) continue
      restoreAttribute(menu, 'orientation', original)
      this.orientedMenus.delete(menu)
    }
    for (const menu of menus) {
      if (this.orientedMenus.has(menu)) continue
      this.orientedMenus.set(menu, menu.getAttribute('orientation'))
      menu.setAttribute('orientation', 'vertical')
    }
  }

  private restoreMenus(): void {
    for (const [menu, original] of this.orientedMenus) {
      restoreAttribute(menu, 'orientation', original)
    }
    this.orientedMenus.clear()
  }

  protected override render() {
    const brand = html`<div part="brand" class="brand">
      <slot name="brand"></slot>
    </div>`
    const panel = html`<div part="panel" id="panel" class="panel">
      <nav part="nav" class="nav" aria-label=${this.label || 'Main'}>
        <slot @slotchange=${this.handleNavSlotChange}></slot>
      </nav>
    </div>`
    const actions = html`<div part="actions" class="actions">
      <slot name="actions"></slot>
    </div>`
    const menuButton = html`<button
      part="menu-button"
      class="menu-button"
      type="button"
      aria-controls="panel"
      aria-expanded=${this.isMenuOpen ? 'true' : 'false'}
      aria-label=${this.menuLabel || 'Menu'}
      @click=${this.handleMenuButton}
    >
      <svg class="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path class="menu-line menu-line-top" d="M4 8h16"></path>
        <path class="menu-line menu-line-bottom" d="M4 16h16"></path>
      </svg>
    </button>`

    const baseClass = this.isBannerAway ? 'base is-banner-away' : 'base'
    // The focus order follows what the reader sees: brand, navigation,
    // actions in a wide bar; brand, actions, menu button, then the panel
    // that opens under the bar when it is collapsed.
    return html`<div part="base" class=${baseClass}>
      <div part="banner" class="banner">
        <slot name="banner"></slot>
      </div>
      <div class="frame">
        <div part="bar" class="bar">
          ${
            this.isCollapsed
              ? html`${brand}${actions}${menuButton}${panel}`
              : html`${brand}${panel}${actions}`
          }
        </div>
      </div>
    </div>`
  }
}

function restoreAttribute(
  element: Element,
  name: string,
  value: string | null,
): void {
  if (value === null) element.removeAttribute(name)
  else element.setAttribute(name, value)
}

defineElement('moul-navbar', MoulNavbar)

declare global {
  interface HTMLElementTagNameMap {
    'moul-navbar': MoulNavbar
  }
}
