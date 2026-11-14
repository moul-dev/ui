import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { FOCUSABLE_ELEMENTS_SELECTOR } from '../../utils/focus-trap'
import { prefersReducedMotion } from '../../utils/motion'
import { navigationMenuStyles } from './NavigationMenu.styles'
import { MoulNavigationMenuItem } from './NavigationMenuItem'
import './NavigationMenuLink'

export type NavigationMenuOrientation = 'horizontal' | 'vertical'

/** Hover must rest on a trigger this long before the first panel opens. */
const OPEN_DELAY = 120
/** The pointer may leave the triggers and the panel for this long before it closes. */
const CLOSE_DELAY = 250
/** A click this soon after a hover opened the same panel keeps it open. */
const HOVER_CLICK_GRACE = 600
/** How far panel content slides as it enters or leaves, in pixels. */
const SHIFT = 24
const ENTER_MS = 220
const ENTER_DELAY_MS = 60
const LEAVE_MS = 160
/** The panel keeps this far from the window edges, in pixels. */
const EDGE = 8
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

/**
 * Site navigation whose panels open on hover and morph from one item to the
 * next, as in a mega menu: one floating panel slides and resizes as the
 * pointer moves along the triggers, and its content slides in from the side
 * the pointer came from. Put `moul-navigation-menu-item` elements in it;
 * each is a trigger with a panel of links (fill it with
 * `moul-navigation-menu-link` cards or any markup), or, with `href`, a plain
 * link. `orientation="vertical"` turns it into a stacked list whose panels
 * open inline under their triggers, for a narrow screen or a mobile menu
 * panel; `moul-navbar` switches to it when it collapses. The element adds no
 * landmark: put it in a `<nav>` or in `moul-navbar`, which provides one. It
 * lives in the effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: a list of native buttons and links. Each
 * trigger has `aria-expanded` and `aria-controls`. Left and Right (Up and
 * Down when vertical, mirrored in right-to-left text) move focus between the
 * items, and Home and End to the first and last. `Enter`, `Space` and, when
 * horizontal, Down open a panel and move focus to its first link; `Escape`
 * closes it and returns focus to its trigger. Tabbing past a panel's last
 * link closes it and moves on to the next trigger, and focus or a press
 * outside the menu closes it. Mouse hover opens panels; touch and pen open
 * them with a tap.
 *
 * Reduced motion: the floating panel jumps to its new size and place, its
 * content swaps without sliding or fading, and vertical panels open and close
 * at once.
 *
 * @slot - The `moul-navigation-menu-item` elements.
 *
 * @fires openchange - A panel opened or closed after a hover, press or key. `detail.value` is the open item's value, or an empty string.
 *
 * @csspart base - The box the floating panel is positioned against.
 * @csspart list - The row (or column) of items, with `role="list"`.
 * @csspart viewport - The floating surface behind the open panel that morphs between items.
 * @csspart indicator - The small arrow on the panel's top edge that points at the open trigger.
 *
 * @cssprop --navigation-menu-background - The floating panel's surface. Defaults to `var(--color-bg-elevated)`.
 * @cssprop --navigation-menu-radius - The floating panel's corner radius. Defaults to `var(--radius-2xl)`.
 * @cssprop --navigation-menu-offset - The gap between the triggers and the floating panel. Defaults to `0.5rem`.
 * @cssprop --navigation-menu-panel-max-width - The widest a panel may grow. Defaults to `44rem`.
 */
export class MoulNavigationMenu extends LitElement {
  static override styles = navigationMenuStyles

  static override properties = {
    value: { type: String, reflect: true },
    orientation: { type: String, reflect: true },
  }

  /** The open item's value, or empty. Setting it opens that item without an event. */
  declare value: string
  /** `horizontal` (default) floats one morphing panel; `vertical` opens panels inline. */
  declare orientation: NavigationMenuOrientation

  /** The item whose panel is open. */
  private current: MoulNavigationMenuItem | null = null
  private openTimer: ReturnType<typeof setTimeout> | null = null
  private closeTimer: ReturnType<typeof setTimeout> | null = null
  private focusTimer: ReturnType<typeof setTimeout> | null = null
  private pendingItem: MoulNavigationMenuItem | null = null
  private hoverOpened = { value: '', at: 0 }
  /** When the pointer last pressed inside the menu; focus that a press moves is left to the click. */
  private pressedAt = 0
  private readonly leaving = new Map<MoulNavigationMenuItem, Animation>()
  private resizeObserver: ResizeObserver | null = null
  private isListening = false
  /** Bumped on every switch, so an older async open stops when a newer one starts. */
  private switchId = 0

  constructor() {
    super()
    this.value = ''
    this.orientation = 'horizontal'
  }

  public get items(): MoulNavigationMenuItem[] {
    return [...this.children].filter(
      (child): child is MoulNavigationMenuItem =>
        child instanceof MoulNavigationMenuItem,
    )
  }

  private get baseEl(): HTMLElement | null {
    return this.renderRoot?.querySelector('[part~="base"]') ?? null
  }

  private get isVertical(): boolean {
    return this.orientation === 'vertical'
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('pointerover', this.handlePointerOver)
    this.addEventListener('pointerleave', this.handlePointerLeave)
    this.addEventListener('pointerdown', this.handlePointerDown)
    this.addEventListener('click', this.handleClick)
    this.addEventListener('keydown', this.handleKeyDown)
    this.addEventListener('focusin', this.handleFocusIn)
    this.addEventListener('focusout', this.handleFocusOut)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('pointerover', this.handlePointerOver)
    this.removeEventListener('pointerleave', this.handlePointerLeave)
    this.removeEventListener('pointerdown', this.handlePointerDown)
    this.removeEventListener('click', this.handleClick)
    this.removeEventListener('keydown', this.handleKeyDown)
    this.removeEventListener('focusin', this.handleFocusIn)
    this.removeEventListener('focusout', this.handleFocusOut)
    this.clearTimers()
    this.listen(false)
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (
      changed.has('orientation') &&
      this.orientation !== 'horizontal' &&
      this.orientation !== 'vertical'
    ) {
      this.orientation = 'horizontal'
    }
    // A change of layout closes whatever was open in the old one.
    if (
      changed.has('orientation') &&
      changed.get('orientation') !== undefined
    ) {
      this.value = ''
    }
    // A value no item has opens nothing.
    if (changed.has('value') && this.value && !this.findItem(this.value)) {
      this.value = ''
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('orientation')) this.syncItems()
    if (changed.has('value') || changed.has('orientation')) {
      void this.applyValue()
    }
  }

  /** Opens the item with this value (or closes with ''), firing `openchange` when it changes. */
  private setValue(next: string): void {
    this.clearTimers()
    if (next === this.value) return
    this.value = next
    this.dispatchEvent(
      new CustomEvent('openchange', {
        detail: { value: next },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private syncItems(): void {
    for (const item of this.items) {
      item.setAttribute('data-orientation', this.orientation)
    }
  }

  private readonly handleSlotChange = (): void => {
    this.syncItems()
    if (this.value && !this.findItem(this.value)) this.value = ''
  }

  private findItem(value: string): MoulNavigationMenuItem | null {
    if (!value) return null
    return (
      this.items.find((item) => item.hasPanel && item.itemValue === value) ??
      null
    )
  }

  /** Brings the panels in line with `value`: closes the old one, opens and places the new one. */
  private async applyValue(): Promise<void> {
    const id = ++this.switchId
    const next = this.findItem(this.value)
    const previous = this.current
    const base = this.baseEl
    const isFloating = !this.isVertical
    if (this.value && !next) {
      this.value = ''
      return
    }

    if (previous === next) {
      if (next && isFloating) this.place(next, false)
      return
    }
    this.current = next
    const isReduced = prefersReducedMotion()
    const items = this.items
    const travel =
      previous && next
        ? Math.sign(items.indexOf(next) - items.indexOf(previous)) *
          (this.isRtl() ? -1 : 1)
        : 0

    if (previous) {
      previous.isOpen = false
      if (isFloating && !isReduced) this.animateLeave(previous, -travel)
    }
    this.observe(next)
    this.listen(Boolean(next) && isFloating)
    if (!next) {
      base?.removeAttribute('data-open')
      return
    }

    this.cancelLeave(next)
    next.isOpen = true
    await next.updateComplete
    if (id !== this.switchId || !isFloating) return
    this.place(next, !previous)
    base?.setAttribute('data-open', '')
    if (!isReduced) this.animateEnter(next, travel)
  }

  /**
   * Sizes the floating surface to the item's panel and centres both under its
   * trigger, but never past the menu's start edge, and kept inside the window.
   */
  private place(item: MoulNavigationMenuItem, isInstant: boolean): void {
    const base = this.baseEl
    const panel = item.panelEl
    const trigger = item.triggerEl
    if (!base || !panel || !trigger) return
    const box = base.getBoundingClientRect()
    const anchor = trigger.getBoundingClientRect()
    const width = panel.offsetWidth
    const height = panel.offsetHeight
    const windowWidth =
      document.documentElement?.clientWidth || window.innerWidth || 0
    const centre = anchor.left + anchor.width / 2
    let left = centre - width / 2
    // Never reach back past the menu's own start edge: a menu at the start of
    // a bar would otherwise hang over the brand, or out of a clipping box.
    const isRtl = getComputedStyle(this).direction === 'rtl'
    left = isRtl ? Math.min(left, box.right - width) : Math.max(left, box.left)
    if (windowWidth > 0) left = Math.min(left, windowWidth - EDGE - width)
    left = Math.max(left, EDGE)
    const x = Math.round(left - box.left)
    const indicator = Math.round(centre - box.left)

    panel.style.left = `${x}px`
    if (isInstant) base.setAttribute('data-instant', '')
    base.style.setProperty('--_nm-x', `${x}px`)
    base.style.setProperty('--_nm-w', `${width}px`)
    base.style.setProperty('--_nm-h', `${height}px`)
    base.style.setProperty('--_nm-ix', `${indicator}px`)
    base.style.setProperty('--_nm-origin', `${indicator - x}px 0`)
    if (isInstant) {
      // Commit the snapped geometry before the transitions come back.
      void base.offsetWidth
      base.removeAttribute('data-instant')
    }
  }

  private animateEnter(item: MoulNavigationMenuItem, travel: number): void {
    const panel = item.panelEl
    if (typeof panel?.animate !== 'function') return
    const from =
      travel === 0 ? 'translateY(-4px)' : `translateX(${travel * SHIFT}px)`
    panel.animate(
      [
        { opacity: 0, transform: from },
        { opacity: 1, transform: 'none' },
      ],
      // Switching, the content waits a beat so the surface has started to
      // morph toward it before it arrives.
      {
        duration: ENTER_MS,
        delay: travel === 0 ? 0 : ENTER_DELAY_MS,
        easing: EASE_OUT,
        fill: 'backwards',
      },
    )
  }

  /** Keeps a closing panel on screen while it slides out, out of reach of focus and the pointer. */
  private animateLeave(item: MoulNavigationMenuItem, travel: number): void {
    const panel = item.panelEl
    if (typeof panel?.animate !== 'function') return
    this.cancelLeave(item)
    panel.setAttribute('data-leaving', '')
    panel.inert = true
    const to = travel === 0 ? 'none' : `translateX(${travel * SHIFT}px)`
    const animation = panel.animate(
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: to },
      ],
      { duration: LEAVE_MS, easing: EASE_OUT, fill: 'forwards' },
    )
    this.leaving.set(item, animation)
    const done = () => {
      if (this.leaving.get(item) !== animation) return
      this.cancelLeave(item)
    }
    animation.finished.then(done, done)
  }

  private cancelLeave(item: MoulNavigationMenuItem): void {
    const animation = this.leaving.get(item)
    this.leaving.delete(item)
    animation?.cancel()
    const panel = item.panelEl
    if (!panel) return
    panel.removeAttribute('data-leaving')
    panel.inert = false
  }

  /** Re-places the floating panel when the open panel's content changes size. */
  private observe(item: MoulNavigationMenuItem | null): void {
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    const panel = item?.panelEl
    if (!panel || this.isVertical || typeof ResizeObserver !== 'function') {
      return
    }
    this.resizeObserver = new ResizeObserver(() => {
      if (this.current === item && item) this.place(item, false)
    })
    this.resizeObserver.observe(panel)
  }

  private listen(isOn: boolean): void {
    if (isOn === this.isListening || typeof document === 'undefined') return
    this.isListening = isOn
    if (isOn) {
      document.addEventListener('pointerdown', this.handleOutsidePress, true)
      window.addEventListener('resize', this.handleResize)
    } else {
      document.removeEventListener('pointerdown', this.handleOutsidePress, true)
      window.removeEventListener('resize', this.handleResize)
    }
  }

  private readonly handleResize = (): void => {
    if (this.current) this.place(this.current, true)
  }

  private readonly handleOutsidePress = (event: PointerEvent): void => {
    if (!event.composedPath().includes(this)) this.setValue('')
  }

  /** The item the event happened in, from its composed path. */
  private itemFrom(event: Event): MoulNavigationMenuItem | null {
    for (const node of event.composedPath()) {
      if (
        node instanceof MoulNavigationMenuItem &&
        node.parentElement === this
      ) {
        return node
      }
      if (node === this) break
    }
    return null
  }

  private readonly handlePointerOver = (event: PointerEvent): void => {
    if (this.isVertical || event.pointerType !== 'mouse') return
    const item = this.itemFrom(event)
    const path = event.composedPath()
    const trigger = item?.triggerEl
    const isOnTrigger = Boolean(trigger && path.includes(trigger))
    if (!item || !isOnTrigger) {
      // Over a panel (anywhere in an item but its trigger) or the floating
      // surface: stay open. Anywhere else: let a pending open lapse.
      const viewport = this.renderRoot?.querySelector('[part~="viewport"]')
      const isOnPanel =
        Boolean(item?.hasPanel) || Boolean(viewport && path.includes(viewport))
      if (isOnPanel) this.clearCloseTimer()
      this.clearOpenTimer()
      return
    }
    this.clearCloseTimer()
    if (!item.hasPanel) {
      this.clearOpenTimer()
      if (this.value) this.scheduleClose()
      return
    }
    if (this.value === item.itemValue) return
    if (this.value) {
      // Already open: morph straight to the next item.
      this.openByHover(item)
      return
    }
    if (this.pendingItem === item && this.openTimer) return
    this.clearOpenTimer()
    this.pendingItem = item
    this.openTimer = setTimeout(() => {
      this.openTimer = null
      this.pendingItem = null
      this.openByHover(item)
    }, OPEN_DELAY)
  }

  private readonly handlePointerLeave = (event: PointerEvent): void => {
    if (this.isVertical || event.pointerType !== 'mouse') return
    this.clearOpenTimer()
    if (this.value) this.scheduleClose()
  }

  private readonly handlePointerDown = (): void => {
    this.pressedAt = Date.now()
  }

  private openByHover(item: MoulNavigationMenuItem): void {
    this.hoverOpened = { value: item.itemValue, at: Date.now() }
    this.setValue(item.itemValue)
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const item = this.itemFrom(event)
    const path = event.composedPath()
    const trigger = item?.triggerEl
    if (item?.hasPanel && trigger && path.includes(trigger)) {
      // Clicks from Enter and Space carry no click count.
      const isKeyboard = event.detail === 0
      const value = item.itemValue
      if (this.value === value) {
        const isHoverClick =
          !isKeyboard &&
          this.hoverOpened.value === value &&
          Date.now() - this.hoverOpened.at < HOVER_CLICK_GRACE
        if (!isHoverClick) this.setValue('')
        return
      }
      this.setValue(value)
      if (isKeyboard) void this.focusPanel(item)
      return
    }
    // A link chosen in the open panel (anywhere in the open item but its
    // trigger) closes it.
    if (
      this.value &&
      item &&
      item === this.current &&
      path.some(
        (node) =>
          node instanceof HTMLAnchorElement && node.hasAttribute('href'),
      )
    ) {
      this.setValue('')
    }
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      const open = this.current
      if (!this.value || !open) return
      event.preventDefault()
      event.stopPropagation()
      this.setValue('')
      open.focusTrigger()
      return
    }
    const item = this.itemFrom(event)
    const trigger = item?.triggerEl
    if (!item || !trigger || event.composedPath()[0] !== trigger) return

    const items = this.items.filter((entry) => entry.triggerEl)
    const index = items.indexOf(item)
    const isRtl = this.isRtl()
    const previousKey = this.isVertical
      ? 'ArrowUp'
      : isRtl
        ? 'ArrowRight'
        : 'ArrowLeft'
    const nextKey = this.isVertical
      ? 'ArrowDown'
      : isRtl
        ? 'ArrowLeft'
        : 'ArrowRight'
    let target: MoulNavigationMenuItem | undefined
    if (event.key === previousKey) target = items[Math.max(0, index - 1)]
    else if (event.key === nextKey) {
      target = items[Math.min(items.length - 1, index + 1)]
    } else if (event.key === 'Home') target = items[0]
    else if (event.key === 'End') target = items[items.length - 1]
    else if (event.key === 'ArrowDown' && !this.isVertical && item.hasPanel) {
      event.preventDefault()
      this.setValue(item.itemValue)
      void this.focusPanel(item)
      return
    } else return

    event.preventDefault()
    target?.focusTrigger()
  }

  /** Focus moving to another item closes the open panel (horizontal only). */
  private readonly handleFocusIn = (event: FocusEvent): void => {
    if (this.isVertical || !this.value) return
    // A press on another trigger morphs to it on click instead of closing first.
    if (Date.now() - this.pressedAt < HOVER_CLICK_GRACE) return
    const item = this.itemFrom(event)
    if (item !== this.current) this.setValue('')
  }

  /**
   * Focus leaving the menu closes the open panel. Checked a task later, once
   * focus has landed: a press on plain text inside a panel moves focus to the
   * page, which must not close it (an outside press does that).
   */
  private readonly handleFocusOut = (): void => {
    if (this.isVertical || !this.value) return
    if (this.focusTimer) clearTimeout(this.focusTimer)
    this.focusTimer = setTimeout(() => {
      this.focusTimer = null
      const active = document.activeElement
      if (active && active !== document.body && !this.contains(active)) {
        this.setValue('')
      }
    })
  }

  /** Moves focus to the first focusable element in the item's panel, once it is open. */
  private async focusPanel(item: MoulNavigationMenuItem): Promise<void> {
    await this.updateComplete
    await item.updateComplete
    if (this.current !== item) return
    for (const child of item.children) {
      const target = firstFocusable(child)
      if (target) {
        target.focus()
        return
      }
    }
  }

  private isRtl(): boolean {
    if (typeof getComputedStyle !== 'function') return false
    return getComputedStyle(this).direction === 'rtl'
  }

  private scheduleClose(): void {
    if (this.closeTimer) return
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null
      this.setValue('')
    }, CLOSE_DELAY)
  }

  private clearOpenTimer(): void {
    if (this.openTimer) clearTimeout(this.openTimer)
    this.openTimer = null
    this.pendingItem = null
  }

  private clearCloseTimer(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer)
    this.closeTimer = null
  }

  private clearTimers(): void {
    this.clearOpenTimer()
    this.clearCloseTimer()
    if (this.focusTimer) clearTimeout(this.focusTimer)
    this.focusTimer = null
  }

  protected override render() {
    return html`<div part="base">
      <div part="list" role="list">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
      <div part="viewport" aria-hidden="true"></div>
      <div part="indicator" aria-hidden="true"></div>
    </div>`
  }
}

/** The first element in `root` (itself, its shadow root, then its children) that takes focus. */
function firstFocusable(root: Element): HTMLElement | null {
  if (!(root instanceof HTMLElement)) return null
  if (root.matches(FOCUSABLE_ELEMENTS_SELECTOR) && !root.inert) return root
  for (const child of root.shadowRoot?.children ?? []) {
    const found = firstFocusable(child)
    if (found) return found
  }
  for (const child of root.children) {
    const found = firstFocusable(child)
    if (found) return found
  }
  return null
}

defineElement('moul-navigation-menu', MoulNavigationMenu)

declare global {
  interface HTMLElementTagNameMap {
    'moul-navigation-menu': MoulNavigationMenu
  }
}
