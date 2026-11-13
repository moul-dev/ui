import { html, LitElement, type PropertyValues } from 'lit'
import { OverlayPresenceController } from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import {
  FOCUSABLE_ELEMENTS_SELECTOR,
  getDeepActiveElement,
} from '../../utils/focus-trap'
import { prefersReducedMotion } from '../../utils/motion'
import '../AnimatedList/AnimatedList'
import '../Badge/Badge'
import { bell } from './icons'
import { notificationBellStyles } from './NotificationBell.styles'

export type NotificationBellPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end'

/** Space between the bell and its panel. */
const GAP = 8
/** Closest the panel comes to the edge of the viewport. */
const VIEWPORT_MARGIN = 8
/** How long one swing of the bell lasts; matches the keyframes. */
const SWING_MS = 800

let bellCount = 0

/**
 * The first element `Tab` reaches inside `root`, following slots and the
 * shadow roots of slotted elements, so a `<moul-button>` in `header-actions`
 * counts.
 */
function firstFocusable(root: Element): HTMLElement | null {
  let children: Element[]
  if (root instanceof HTMLSlotElement) {
    const assigned = root.assignedElements({ flatten: true })
    children = assigned.length > 0 ? assigned : [...root.children]
  } else {
    children = [...(root.shadowRoot ?? root).children]
  }
  for (const el of children) {
    if (!(el instanceof HTMLElement) || el.hidden || el.inert) continue
    // Slots have no box of their own, so only a candidate's visibility is checked.
    if (
      el.matches(FOCUSABLE_ELEMENTS_SELECTOR) &&
      el.checkVisibility?.() !== false
    ) {
      return el
    }
    const inner = firstFocusable(el)
    if (inner) return inner
  }
  return null
}

/**
 * A bell button that shows how many notifications are unread and opens a
 * panel listing them. The count sits on the bell as a `<moul-badge>` and the
 * bell swings when it goes up. The panel hangs from the bell in the top
 * layer, with a header, the notifications (the slotted children, in any
 * markup, arriving and leaving through a `<moul-animated-list>`), an `empty`
 * message when there are none, and a footer.
 *
 * Keyboard and screen readers: the bell is a native button, so `Tab` reaches
 * it and `Enter` or `Space` opens and closes the panel. It is named by
 * `label` and the count ("Notifications, 3 unread"), and has
 * `aria-haspopup="dialog"` and `aria-expanded`. The panel is a non-modal
 * `role="dialog"` named by `label`; when the bell opens it, focus moves to the
 * first focusable element inside, or the panel itself. `Escape` closes it and
 * returns focus to the bell. A click outside, or `Tab` past its last element,
 * closes it without moving focus back. A change in the count is not
 * announced: announce new notifications with a toast or a live region if
 * they need it.
 *
 * Reduced motion: the bell does not swing, the panel appears and disappears
 * at once instead of growing from the bell, and notifications arrive and
 * leave without animating.
 *
 * @slot - The notifications, one element each; newest first reads best.
 * @slot header - Replaces the panel's heading (`label` by default).
 * @slot header-actions - Controls beside the heading, such as "Mark all read".
 * @slot empty - Shown when there are no notifications. Defaults to "No notifications".
 * @slot footer - Below the list, such as a "View all" link.
 * @csspart button - The bell button.
 * @csspart icon - The bell icon, which swings.
 * @csspart badge - The `<moul-badge>` with the count.
 * @csspart popover - The top-layer shell that positions the panel.
 * @csspart panel - The visible panel (`role="dialog"`).
 * @csspart header - The row with the heading and its actions.
 * @csspart title - The default heading text.
 * @csspart body - The scrolling area around the list and the empty message.
 * @csspart list - The `<moul-animated-list>` of notifications.
 * @csspart empty - The empty message.
 * @csspart footer - The row around the footer slot, shown when it has content.
 * @fires openchange - When the bell, `Escape`, a click outside, leaving with `Tab`, or `setOpen()` opens or closes the panel; `detail.isOpen` is the new state. Setting `isOpen` directly does not fire it.
 * @cssprop --notification-bell-size - Size of the bell button. Defaults to `2.5rem`.
 * @cssprop --notification-bell-width - Width of the panel. Defaults to `22rem`.
 */
export class MoulNotificationBell extends LitElement {
  static override styles = notificationBellStyles

  static override properties = {
    count: { type: Number, reflect: true },
    max: { type: Number, reflect: true },
    label: { type: String, reflect: true },
    unreadLabel: { type: String, attribute: 'unread-label' },
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    placement: { type: String, reflect: true },
    hasItems: { state: true },
    hasFooter: { state: true },
  }

  /** Unread notifications; 0 hides the badge. */
  declare count: number
  /** Highest count shown before it reads `99+`. */
  declare max: number
  /** Names the bell and the panel, and is the panel's default heading. */
  declare label: string
  /** Word after the count in the bell's name, for other languages. */
  declare unreadLabel: string
  declare isOpen: boolean
  /** Where the panel hangs from the bell; it flips when the other side has more room. */
  declare placement: NotificationBellPlacement
  declare hasItems: boolean
  declare hasFooter: boolean

  public overlayPresence: OverlayPresenceController
  private readonly panelId = `moul-notification-panel-${++bellCount}`
  /** Whether the panel is up, which trails `isOpen` while it changes. */
  private shown = false
  private frame = 0
  private swingTimer: ReturnType<typeof setTimeout> | undefined

  constructor() {
    super()
    this.count = 0
    this.max = 99
    this.label = 'Notifications'
    this.unreadLabel = 'unread'
    this.isOpen = false
    this.placement = 'bottom-end'
    this.hasItems = false
    this.hasFooter = false

    this.overlayPresence = new OverlayPresenceController(this, {
      preset: 'popover',
      popover: () => this.popoverEl,
      target: () => this.popoverEl,
    })
  }

  public get buttonEl(): HTMLButtonElement | null {
    return this.shadowRoot?.querySelector('[part~="button"]') ?? null
  }

  public get panelEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[part~="panel"]') ?? null
  }

  private get popoverEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[part~="popover"]') ?? null
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('keydown', this.handleKeyDown)
    this.addEventListener('focusout', this.handleFocusOut)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('keydown', this.handleKeyDown)
    this.removeEventListener('focusout', this.handleFocusOut)
    this.stopTracking()
    clearTimeout(this.swingTimer)
  }

  /** Opens or closes the panel and fires `openchange`. Opening moves focus into it. */
  public setOpen(nextOpen: boolean): Promise<void> {
    return this.applyOpen(nextOpen, {
      focus: true,
      returnFocus: this.focusIsInside(),
    })
  }

  public toggle(): Promise<void> {
    return this.setOpen(!this.isOpen)
  }

  /**
   * Shrinks a notification away while the others close ranks, then removes it
   * from the DOM; see `<moul-animated-list>`. Resolves once it is gone.
   */
  public removeItem(item: HTMLElement): Promise<void> {
    const list = this.shadowRoot?.querySelector('moul-animated-list')
    if (list) return list.removeItem(item)
    item.remove()
    return Promise.resolve()
  }

  protected override firstUpdated(): void {
    // Slots filled from the start may not report a change.
    for (const slot of this.shadowRoot?.querySelectorAll('slot') ?? []) {
      if (!slot.name) this.syncItems(slot)
      else if (slot.name === 'footer') this.syncFooter(slot)
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed)
    if (changed.has('isOpen') && this.isOpen !== this.shown) {
      // `is-open` set from outside: follow it without taking focus.
      if (this.isOpen) void this.openPanel(false)
      else void this.closePanel(this.focusIsInside())
    }
    if (changed.has('placement') && this.shown) this.place()
    const previous = changed.get('count')
    if (
      changed.has('count') &&
      previous !== undefined &&
      this.count > previous
    ) {
      this.swing()
    }
  }

  private async applyOpen(
    next: boolean,
    { focus = false, returnFocus = false, emit = true } = {},
  ): Promise<void> {
    if (next === this.isOpen && next === this.shown) return
    this.isOpen = next
    if (emit) {
      this.dispatchEvent(
        new CustomEvent('openchange', {
          bubbles: true,
          composed: true,
          detail: { isOpen: next },
        }),
      )
    }
    await (next ? this.openPanel(focus) : this.closePanel(returnFocus))
  }

  private async openPanel(focus: boolean): Promise<void> {
    const popover = this.popoverEl
    const panel = this.panelEl
    if (!popover || !panel) return
    this.shown = true
    // Shown and placed before the first frame, so it never flashes at the wrong spot.
    if (popover.showPopover && !popover.matches(':popover-open')) {
      try {
        popover.showPopover()
      } catch {
        // No Popover API: the fixed position still floats it.
      }
    }
    this.place()
    this.startTracking()
    if (focus) (firstFocusable(panel) ?? panel).focus()
    await this.overlayPresence.setOpen(true)
  }

  private async closePanel(returnFocus: boolean): Promise<void> {
    this.shown = false
    this.stopTracking()
    if (returnFocus) this.buttonEl?.focus()
    await this.overlayPresence.setOpen(false)
  }

  /**
   * Hangs the panel below or above the bell per `placement`, flipped when the
   * other side has more room, aligned to the bell's start or end edge and kept
   * inside the viewport. An upward panel is pinned by its bottom edge, so
   * notifications that arrive while it is open grow it away from the bell.
   */
  private place(): void {
    const popover = this.popoverEl
    const button = this.buttonEl
    if (!popover || !button) return
    const t = button.getBoundingClientRect()
    if (t.width === 0 && t.height === 0) return
    const [side, align] = (this.placement || 'bottom-end').split('-')
    const style = popover.style
    style.removeProperty('--_available')
    const below = window.innerHeight - t.bottom - GAP - VIEWPORT_MARGIN
    const above = t.top - GAP - VIEWPORT_MARGIN
    const natural = popover.offsetHeight
    const isUp =
      side === 'top'
        ? !(natural > above && below > above)
        : natural > below && above > below
    style.setProperty(
      '--_available',
      `${Math.max(160, Math.floor(isUp ? above : below))}px`,
    )
    if (isUp) {
      style.top = 'auto'
      style.bottom = `${Math.round(window.innerHeight - t.top + GAP)}px`
    } else {
      style.bottom = 'auto'
      style.top = `${Math.round(t.bottom + GAP)}px`
    }
    const width = popover.offsetWidth
    // `start` and `end` follow the writing direction.
    const isRtl = getComputedStyle(button).direction === 'rtl'
    const left = Math.min(
      Math.max(
        VIEWPORT_MARGIN,
        (align === 'start') === isRtl ? t.right - width : t.left,
      ),
      Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN),
    )
    style.left = `${Math.round(left)}px`
    // Grow out of the bell.
    const originX = Math.min(Math.max(t.left + t.width / 2 - left, 0), width)
    style.transformOrigin = `${Math.round(originX)}px ${isUp ? '100%' : '0px'}`
    popover.setAttribute('data-side', isUp ? 'top' : 'bottom')
  }

  private readonly reposition = (event: Event): void => {
    const panel = this.panelEl
    if (panel && event.composedPath().includes(panel)) return
    cancelAnimationFrame(this.frame)
    this.frame = requestAnimationFrame(() => this.place())
  }

  private startTracking(): void {
    window.addEventListener('scroll', this.reposition, true)
    window.addEventListener('resize', this.reposition)
    document.addEventListener('pointerdown', this.handleOutsidePointer, true)
  }

  private stopTracking(): void {
    cancelAnimationFrame(this.frame)
    window.removeEventListener('scroll', this.reposition, true)
    window.removeEventListener('resize', this.reposition)
    document.removeEventListener('pointerdown', this.handleOutsidePointer, true)
  }

  private readonly handleOutsidePointer = (event: Event): void => {
    if (event.composedPath().includes(this)) return
    void this.applyOpen(false)
  }

  private readonly handleButtonClick = (): void => {
    void this.toggle()
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !this.isOpen) return
    event.preventDefault()
    event.stopPropagation()
    void this.applyOpen(false, { returnFocus: true })
  }

  /** `Tab` past the last element in the panel closes it. */
  private readonly handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget
    if (!this.isOpen || !(next instanceof Node) || this.isWithin(next)) return
    void this.applyOpen(false)
  }

  private syncItems(slot: HTMLSlotElement): void {
    this.hasItems = slot.assignedElements({ flatten: true }).length > 0
    if (this.shown) this.place()
  }

  private syncFooter(slot: HTMLSlotElement): void {
    this.hasFooter = slot.assignedNodes({ flatten: true }).length > 0
  }

  private readonly handleItemsChange = (event: Event): void => {
    this.syncItems(event.currentTarget as HTMLSlotElement)
  }

  private readonly handleFooterChange = (event: Event): void => {
    this.syncFooter(event.currentTarget as HTMLSlotElement)
  }

  /** Whether `node` is the bell, in its panel, or one of its slotted children, at any shadow depth. */
  private isWithin(node: Node): boolean {
    let current: Node | null = node
    while (current) {
      if (
        current === this ||
        this.contains(current) ||
        this.shadowRoot?.contains(current)
      ) {
        return true
      }
      const root = current.getRootNode()
      current = root instanceof ShadowRoot ? root.host : null
    }
    return false
  }

  private focusIsInside(): boolean {
    const active = getDeepActiveElement()
    if (!active || active === this.buttonEl) return false
    return this.isWithin(active)
  }

  /** One swing of the bell, restarted if it is already swinging. */
  private swing(): void {
    if (prefersReducedMotion()) return
    const icon = this.shadowRoot?.querySelector<HTMLElement>('[part~="icon"]')
    if (!icon) return
    icon.removeAttribute('data-swinging')
    // Read layout so removing and adding the attribute restarts the keyframes.
    void icon.offsetWidth
    icon.setAttribute('data-swinging', '')
    clearTimeout(this.swingTimer)
    this.swingTimer = setTimeout(
      () => icon.removeAttribute('data-swinging'),
      SWING_MS,
    )
  }

  protected override render() {
    const count = Math.max(0, Math.floor(Number(this.count) || 0))
    const shown = count > this.max ? `${this.max}+` : String(count)
    const name =
      count > 0 ? `${this.label}, ${shown} ${this.unreadLabel}` : this.label
    return html`
      <button
        part="button"
        type="button"
        aria-label=${name}
        aria-haspopup="dialog"
        aria-expanded=${this.isOpen ? 'true' : 'false'}
        aria-controls=${this.panelId}
        @click=${this.handleButtonClick}
      >
        <span part="icon">${bell()}</span>
        ${
          count > 0
            ? html`<moul-badge
                part="badge"
                tone="error"
                variant="solid"
                size="sm"
                count=${count}
                max=${this.max}
                aria-hidden="true"
              ></moul-badge>`
            : ''
        }
      </button>
      <div part="popover" popover="manual">
        <div
          part="panel"
          id=${this.panelId}
          role="dialog"
          aria-label=${this.label}
          tabindex="-1"
        >
          <div part="header">
            <slot name="header"><span part="title">${this.label}</span></slot>
            <slot name="header-actions"></slot>
          </div>
          <div part="body">
            <moul-animated-list part="list">
              <slot @slotchange=${this.handleItemsChange}></slot>
            </moul-animated-list>
            <div part="empty" ?hidden=${this.hasItems}>
              <slot name="empty">No notifications</slot>
            </div>
          </div>
          <div part="footer" ?hidden=${!this.hasFooter}>
            <slot name="footer" @slotchange=${this.handleFooterChange}></slot>
          </div>
        </div>
      </div>
    `
  }
}

defineElement('moul-notification-bell', MoulNotificationBell)

declare global {
  interface HTMLElementTagNameMap {
    'moul-notification-bell': MoulNotificationBell
  }
}
