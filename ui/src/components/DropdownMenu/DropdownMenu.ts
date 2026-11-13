import { html, LitElement, nothing, type PropertyValues } from 'lit'
import type { AnimationPlaybackControls } from 'motion'
import { OverlayPresenceController } from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import {
  FOCUSABLE_ELEMENTS_SELECTOR,
  getFocusableElements,
} from '../../utils/focus-trap'
import {
  EASE_OUT,
  prefersReducedMotion,
  stagger,
  subtleAnimate,
} from '../../utils/motion'
import { dropdownMenuStyles } from './DropdownMenu.styles'
import { drainBack, type GooScene, layoutGoo, pourOut, readGoo } from './gooey'
import { MoulMenuItem } from './MenuItem'
import './MenuGroup'
import './MenuSeparator'

export type DropdownMenuPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end'
export type DropdownMenuVariant = 'default' | 'gooey'

export interface DropdownMenuActionDetail {
  /** The item's `value`, or its label text when it has none. */
  value: string
  item: MoulMenuItem
}

/** Where focus goes when the menu opens: an item, the menu itself, or nowhere. */
type FocusIntent = 'first' | 'last' | 'menu' | 'none'

interface SetOpenOptions {
  focus?: FocusIntent
  emit?: boolean
  returnFocus?: boolean
}

const GAP = 6
const VIEWPORT_MARGIN = 8
const TYPEAHEAD_RESET = 500
const ITEM_EVENTS = ['keydown', 'click', 'pointermove'] as const
let gooCount = 0

/** The element that really takes focus: the trigger itself, or the first focusable thing in its shadow root (a `moul-button`'s inner `<button>`). */
function focusTargetOf(el: HTMLElement): HTMLElement {
  if (el.matches(FOCUSABLE_ELEMENTS_SELECTOR) || !el.shadowRoot) return el
  return getFocusableElements(el)[0] ?? el
}

function isFocused(el: Element): boolean {
  return (el.getRootNode() as Document | ShadowRoot).activeElement === el
}

/**
 * A menu of actions that opens from a trigger button, for "more actions",
 * account and overflow menus: plain items, checkbox and radio items, links,
 * groups and separators. The menu floats in the top layer, grows out of the
 * trigger edge and flips above it when there is no room below. Use
 * `<moul-select>` to pick a form value instead. `variant="gooey"` pours the
 * items out of the trigger as liquid blobs.
 *
 * Put any focusable element (usually a `<moul-button>`) in the `trigger` slot
 * and `<moul-menu-item>`, `<moul-menu-group>` and `<moul-menu-separator>` in
 * the default slot. Activating an item fires `action`; regular and link items
 * then close the menu, while checkbox and radio items keep it open so several
 * can be changed in a row. Items may also arrive through a forwarded `<slot>`
 * from another component's shadow root: the menu reads its flattened slot.
 *
 * Keyboard and screen readers: the slotted trigger keeps its own focus and
 * gets `aria-haspopup="menu"` and `aria-expanded` (on the host and, for a
 * trigger like `<moul-button>` whose focus lives in its shadow root, on the
 * inner `<button>` too); `aria-controls` is not set, because an ID cannot
 * point into this shadow root. A click toggles the menu and focuses the menu
 * surface; `Enter`, `Space` and `Arrow Down` open it and focus the first
 * enabled item, `Arrow Up` the last. The surface has `role="menu"` and is
 * named by `label`, else the trigger's `aria-label` or text. In the menu,
 * `Arrow Down`/`Arrow Up` move focus through the items and wrap, `Home`/`End`
 * go to the first and last, and typing a letter jumps to the next item whose
 * label starts with what was typed. Disabled items are focusable, as the
 * WAI-ARIA menu pattern asks, but `Enter`, `Space` and clicks do nothing on
 * them. `Escape` closes and returns focus to the trigger; `Tab` closes and
 * lets focus move on; a click outside closes. Hovering an item focuses it.
 * There are no submenus. `show()` moves focus to the first enabled item;
 * setting `is-open` does not move focus.
 *
 * Reduced motion: the menu appears and disappears at once, without growing
 * out of the trigger, the items do not stagger in, and the gooey variant
 * skips the goo entirely.
 *
 * @slot trigger - The element that opens the menu, usually a `<moul-button>`.
 * @slot - The menu's items, groups and separators.
 * @fires openchange - When the menu opens or closes from a click, a key, an outside click or `show()`/`hide()`/`toggle()`; `detail.isOpen`.
 * @fires action - When an item is activated; `detail: { value, item }`.
 * @csspart trigger - The wrapper around the trigger slot.
 * @csspart popover - The top-layer shell that is positioned and animated.
 * @csspart menu - The visible menu surface (`role="menu"`).
 * @csspart goo - The gooey layer behind the surface (gooey variant only).
 * @cssprop --dropdown-menu-background - The surface and goo colour. Defaults to `--color-bg-elevated`.
 * @cssprop --dropdown-menu-min-width - Minimum width; the menu is never narrower than its trigger. Defaults to `10rem`.
 * @cssprop --dropdown-menu-max-width - Maximum width. Defaults to `20rem`.
 * @cssprop --dropdown-menu-max-height - Maximum height before the items scroll; also capped by the room beside the trigger. Defaults to `20rem`.
 */
export class MoulDropdownMenu extends LitElement {
  static override styles = dropdownMenuStyles

  static override properties = {
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    placement: { type: String, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    variant: { type: String, reflect: true },
    label: { type: String, reflect: true },
  }

  declare isOpen: boolean
  declare placement: DropdownMenuPlacement
  declare isDisabled: boolean
  declare variant: DropdownMenuVariant
  declare label: string

  public overlayPresence: OverlayPresenceController
  private readonly gooId = `moul-dropdown-goo-${++gooCount}`
  private transition = 0
  /** Whether the menu is showing or opening; the controller lags behind while the goo drains. */
  private shown = false
  private side: 'top' | 'bottom' = 'bottom'
  private frame = 0
  private typeBuffer = ''
  private typeTimer: ReturnType<typeof setTimeout> | undefined
  private suppressClick = false
  private ariaTargets: HTMLElement[] = []
  /** Items listened to while open; listening on them directly also covers forwarded items. */
  private boundItems: MoulMenuItem[] = []
  private rowMotion: AnimationPlaybackControls | null = null
  private gooMotion: AnimationPlaybackControls[] = []
  private endGooMotion: (() => void) | null = null

  constructor() {
    super()
    this.isOpen = false
    this.placement = 'bottom-start'
    this.isDisabled = false
    this.variant = 'default'
    this.label = ''

    this.overlayPresence = new OverlayPresenceController(this, {
      preset: 'popover',
      popover: () => this.popoverEl,
      target: () => this.popoverEl,
      onLightDismiss: () => this.setOpen(false, { emit: true }),
    })
  }

  /** The slotted trigger element. */
  public get triggerEl(): HTMLElement | null {
    const slot = this.renderRoot?.querySelector<HTMLSlotElement>(
      'slot[name="trigger"]',
    )
    return (slot?.assignedElements({ flatten: true })[0] as HTMLElement) ?? null
  }

  public get popoverEl(): HTMLElement | null {
    return this.renderRoot?.querySelector('[part~="popover"]') ?? null
  }

  /** The `role="menu"` surface. */
  public get menuEl(): HTMLElement | null {
    return this.renderRoot?.querySelector('[part~="menu"]') ?? null
  }

  /** The menu's top-level rows, through forwarded slots: items, groups and separators. */
  private get rows(): HTMLElement[] {
    const slot =
      this.renderRoot?.querySelector<HTMLSlotElement>('slot:not([name])')
    return (
      (slot?.assignedElements({ flatten: true }) ?? []) as HTMLElement[]
    ).filter((row) => !row.hidden)
  }

  /** Every item in order, including those in groups and those forwarded through a slot. */
  public get items(): MoulMenuItem[] {
    return this.rows
      .flatMap((row) =>
        row instanceof MoulMenuItem
          ? [row]
          : Array.from(row.querySelectorAll('moul-menu-item')),
      )
      .filter((item) => !item.hidden)
  }

  /** Opens the menu and focuses its first enabled item. */
  public show(): Promise<void> {
    return this.setOpen(true, { focus: 'first', emit: true })
  }

  /** Closes the menu, returning focus to the trigger if it was in the menu. */
  public hide(): Promise<void> {
    return this.setOpen(false, { emit: true })
  }

  public toggle(): Promise<void> {
    return this.isOpen ? this.hide() : this.show()
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('keydown', this.handleHostKeyDown)
    this.addEventListener('click', this.handleHostClick)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('keydown', this.handleHostKeyDown)
    this.removeEventListener('click', this.handleHostClick)
    this.stopTracking()
    this.stopMotion()
    clearTimeout(this.typeTimer)
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed)
    if (this.isDisabled && this.isOpen) this.isOpen = false
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed)
    if (changed.has('isOpen') && this.isOpen !== this.shown) {
      // `is-open` set from outside: follow it once this update has settled.
      queueMicrotask(() => {
        if (this.isOpen === this.shown) return
        if (this.isOpen) this.openMenu('none')
        else this.closeMenu(this.focusIsInside())
      })
    }
    if (changed.has('label')) this.syncTrigger()
    if (changed.has('isDisabled') && changed.get('isDisabled') !== undefined) {
      for (const el of this.ariaTargets) {
        if (this.isDisabled) el.setAttribute('aria-disabled', 'true')
        else el.removeAttribute('aria-disabled')
      }
    }
  }

  private async setOpen(
    next: boolean,
    { focus = 'none', emit = false, returnFocus }: SetOpenOptions = {},
  ): Promise<void> {
    if (next && this.isDisabled) return
    if (next === this.isOpen && next === this.shown) {
      if (next) this.focusInto(focus)
      return
    }
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
    await (next
      ? this.openMenu(focus)
      : this.closeMenu(returnFocus ?? this.focusIsInside()))
  }

  private async openMenu(focus: FocusIntent): Promise<void> {
    const popover = this.popoverEl
    if (!popover) return
    const id = ++this.transition
    this.shown = true
    const from = this.gooMotion.length ? this.currentGoo() : null
    this.stopMotion()
    this.syncTrigger()
    // Show and place the panel before the first frame, so it never flashes
    // at the wrong spot, and so focus can move into it right away.
    if (popover.showPopover && !popover.matches(':popover-open')) {
      try {
        popover.showPopover()
      } catch {
        // No Popover API: the fixed position still floats it.
      }
    }
    this.place()
    this.startTracking()
    this.focusInto(focus)

    const isReduced = prefersReducedMotion()
    const scene =
      this.variant === 'gooey' && !isReduced ? this.layoutGoo() : null
    if (scene) {
      popover.setAttribute('data-goo', '')
      const opening = this.overlayPresence.setOpen(true, null, {
        instant: true,
      })
      await this.runGoo(pourOut(scene, from))
      if (id === this.transition) this.endGoo(scene)
      await opening
      return
    }
    const opening = this.overlayPresence.setOpen(true)
    if (!isReduced) this.staggerRows()
    await opening
  }

  private async closeMenu(returnFocus: boolean): Promise<void> {
    const id = ++this.transition
    this.shown = false
    const from = this.gooMotion.length ? this.currentGoo() : null
    this.stopMotion()
    this.syncTrigger()
    this.stopTracking()
    this.typeBuffer = ''
    if (returnFocus) this.focusTrigger()

    const scene =
      this.variant === 'gooey' && !prefersReducedMotion()
        ? this.layoutGoo()
        : null
    if (scene) {
      this.popoverEl?.setAttribute('data-goo', '')
      await this.runGoo(drainBack(scene, from))
      if (id !== this.transition) return
      await this.overlayPresence.setOpen(false, null, { instant: true })
    } else {
      await this.overlayPresence.setOpen(false)
    }
    if (id === this.transition && scene) this.endGoo(scene)
  }

  /** Stops the row stagger and any goo in flight; the stagger jumps to its end so it cleans up. */
  private stopMotion(): void {
    this.rowMotion?.complete()
    this.rowMotion = null
    for (const motion of this.gooMotion) motion.stop()
    this.gooMotion = []
    this.endGooMotion?.()
    this.endGooMotion = null
  }

  private staggerRows(): void {
    const rows = this.rows
    if (rows.length === 0) return
    const down = this.side === 'bottom'
    for (const row of rows) row.style.opacity = '0'
    this.rowMotion = subtleAnimate(
      rows,
      {
        opacity: [0, 1],
        transform: [`translateY(${down ? -4 : 4}px)`, 'translateY(0px)'],
      },
      {
        duration: 0.2,
        ease: EASE_OUT,
        delay: stagger(Math.min(0.025, 0.15 / rows.length), {
          from: down ? 'first' : 'last',
        }),
      },
    )
  }

  private layoutGoo(): GooScene | null {
    const layer = this.renderRoot?.querySelector<HTMLElement>('[part~="goo"]')
    const panel = this.menuEl
    const trigger = this.triggerEl
    if (!layer || !panel || !trigger) return null
    return layoutGoo(layer, panel, trigger, this.rows, this.side === 'bottom')
  }

  private currentGoo(): string[] | null {
    const scene = this.layoutGoo()
    return scene ? readGoo(scene) : null
  }

  /** Resolves when every goo animation settles, or at once when they are stopped. */
  private runGoo(motion: AnimationPlaybackControls[]): Promise<void> {
    this.gooMotion = motion
    return new Promise<void>((resolve) => {
      this.endGooMotion = resolve
      Promise.all(motion.map((m) => m.finished.catch(() => {}))).then(() => {
        if (this.gooMotion === motion) this.gooMotion = []
        resolve()
      })
    })
  }

  private endGoo(scene: GooScene): void {
    this.popoverEl?.removeAttribute('data-goo')
    for (const row of scene.rows) row.style.removeProperty('opacity')
  }

  /**
   * Pins the shell beside the trigger: below or above it per `placement`,
   * flipped when the other side has more room, aligned to the trigger's start
   * or end edge and kept inside the viewport, growing from the trigger edge.
   */
  private place(): void {
    const popover = this.popoverEl
    const panel = this.menuEl
    const trigger = this.triggerEl
    const [preferred, align] = (this.placement || 'bottom-start').split('-')
    this.side = preferred === 'top' ? 'top' : 'bottom'
    popover?.setAttribute('data-side', this.side)
    if (!popover || !panel || !trigger) return
    const t = trigger.getBoundingClientRect()
    if (t.width === 0 && t.height === 0) return

    panel.style.setProperty('--_trigger-width', `${Math.round(t.width)}px`)
    panel.style.removeProperty('--_available')
    const below = window.innerHeight - t.bottom - GAP - VIEWPORT_MARGIN
    const above = t.top - GAP - VIEWPORT_MARGIN
    const natural = popover.offsetHeight
    const isUp =
      preferred === 'top'
        ? !(natural > above && below > above)
        : natural > below && above > below
    const room = Math.max(120, Math.floor(isUp ? above : below))
    panel.style.setProperty('--_available', `${room}px`)
    const height = Math.min(natural, room)
    const width = popover.offsetWidth

    const top = isUp
      ? Math.max(VIEWPORT_MARGIN, t.top - GAP - height)
      : t.bottom + GAP
    // `start` and `end` follow the writing direction.
    const isRtl = getComputedStyle(trigger).direction === 'rtl'
    const left = Math.min(
      Math.max(
        VIEWPORT_MARGIN,
        (align === 'end') !== isRtl ? t.right - width : t.left,
      ),
      Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN),
    )
    popover.style.top = `${Math.round(top)}px`
    popover.style.left = `${Math.round(left)}px`
    const originX = Math.min(Math.max(t.left + t.width / 2 - left, 0), width)
    popover.style.transformOrigin = `${Math.round(originX)}px ${isUp ? '100%' : '0px'}`
    this.side = isUp ? 'top' : 'bottom'
    popover.setAttribute('data-side', this.side)
  }

  private readonly reposition = (event: Event): void => {
    const panel = this.menuEl
    if (panel && event.composedPath().includes(panel)) return
    cancelAnimationFrame(this.frame)
    this.frame = requestAnimationFrame(() => this.place())
  }

  private startTracking(): void {
    window.addEventListener('scroll', this.reposition, true)
    window.addEventListener('resize', this.reposition)
    document.addEventListener('pointerdown', this.handleOutsidePointer, true)
    this.bindItems()
  }

  private stopTracking(): void {
    cancelAnimationFrame(this.frame)
    window.removeEventListener('scroll', this.reposition, true)
    window.removeEventListener('resize', this.reposition)
    document.removeEventListener('pointerdown', this.handleOutsidePointer, true)
    this.bindItems(false)
  }

  private bindItems(bind = true): void {
    for (const item of this.boundItems) {
      for (const type of ITEM_EVENTS) {
        item.removeEventListener(type, this.handleItemEvent)
      }
    }
    this.boundItems = bind ? this.items : []
    for (const item of this.boundItems) {
      for (const type of ITEM_EVENTS) {
        item.addEventListener(type, this.handleItemEvent)
      }
    }
  }

  private readonly handleItemsChange = (): void => {
    if (this.shown) this.bindItems()
  }

  private readonly handleOutsidePointer = (event: Event): void => {
    const path = event.composedPath()
    if (path.includes(this) || this.boundItems.some((i) => path.includes(i))) {
      return
    }
    this.setOpen(false, { emit: true, returnFocus: false })
  }

  /** Sets the menu-button ARIA on the trigger and names the menu after it. */
  private syncTrigger(): void {
    const trigger = this.triggerEl
    const targets = trigger
      ? [...new Set([trigger, focusTargetOf(trigger)])]
      : []
    for (const el of this.ariaTargets) {
      if (targets.includes(el)) continue
      el.removeAttribute('aria-haspopup')
      el.removeAttribute('aria-expanded')
    }
    this.ariaTargets = targets
    for (const el of targets) {
      el.setAttribute('aria-haspopup', 'menu')
      el.setAttribute('aria-expanded', String(this.isOpen))
      if (this.isDisabled) el.setAttribute('aria-disabled', 'true')
    }
    const name =
      this.label ||
      trigger?.getAttribute('aria-label') ||
      trigger?.textContent?.replace(/\s+/g, ' ').trim()
    if (name) this.menuEl?.setAttribute('aria-label', name)
    else this.menuEl?.removeAttribute('aria-label')
  }

  private readonly handleTriggerSlotChange = async (): Promise<void> => {
    // A Lit trigger renders its inner <button> after it is slotted.
    await (this.triggerEl as { updateComplete?: Promise<unknown> } | null)
      ?.updateComplete
    this.syncTrigger()
  }

  private focusTrigger(): void {
    const trigger = this.triggerEl
    if (trigger) focusTargetOf(trigger).focus()
  }

  private focusInto(focus: FocusIntent): void {
    if (focus === 'none') return
    const items = this.items
    const index =
      focus === 'first'
        ? items.findIndex((item) => !item.isDisabled)
        : focus === 'last'
          ? items.findLastIndex((item) => !item.isDisabled)
          : -1
    if (items[index]) items[index].focus()
    else this.menuEl?.focus({ preventScroll: true })
  }

  /** True when focus is on the menu surface or one of its items, even a forwarded one. */
  private focusIsInside(): boolean {
    const items: Element[] = this.items
    let el: Element | null = document.activeElement
    while (el) {
      if (el === this.menuEl || items.includes(el)) return true
      el = el.shadowRoot?.activeElement ?? null
    }
    return false
  }

  /**
   * Ignores the click a native button synthesizes from the Enter or Space this
   * component already handled, until that key is released.
   */
  private holdClick(): void {
    this.suppressClick = true
    window.addEventListener(
      'keyup',
      () => setTimeout(() => (this.suppressClick = false)),
      { once: true, capture: true },
    )
  }

  private readonly handleHostClick = (event: MouseEvent): void => {
    const trigger = this.triggerEl
    if (!trigger || !event.composedPath().includes(trigger)) return
    if (this.isDisabled || this.suppressClick) return
    if (this.isOpen) {
      this.setOpen(false, { emit: true, returnFocus: true })
    } else {
      // A real pointer click focuses the surface; a synthetic one (detail 0) behaves like a key.
      this.setOpen(true, {
        focus: event.detail === 0 ? 'first' : 'menu',
        emit: true,
      })
    }
  }

  /** Keys on the trigger, and on the menu surface itself; items handle their own. */
  private readonly handleHostKeyDown = (event: KeyboardEvent): void => {
    const path = event.composedPath()
    if (this.boundItems.some((item) => path.includes(item))) return
    const panel = this.menuEl
    if (panel && path.includes(panel)) {
      this.handleMenuKey(event, null)
      return
    }
    const trigger = this.triggerEl
    if (!trigger || !path.includes(trigger) || this.isDisabled) return

    const { key } = event
    if (key === 'Escape' && this.isOpen) {
      event.preventDefault()
      event.stopPropagation()
      this.setOpen(false, { emit: true })
    } else if (key === 'Tab' && this.isOpen) {
      this.setOpen(false, { emit: true, returnFocus: false })
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      this.holdClick()
      if (this.isOpen) this.setOpen(false, { emit: true })
      else this.setOpen(true, { focus: 'first', emit: true })
    } else if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault()
      this.setOpen(true, {
        focus: key === 'ArrowUp' ? 'last' : 'first',
        emit: true,
      })
    }
  }

  private readonly handleItemEvent = (event: Event): void => {
    const item = event.currentTarget as MoulMenuItem
    if (event.type === 'keydown') {
      this.handleMenuKey(event as KeyboardEvent, item)
    } else if (event.type === 'click') {
      this.activate(event, item)
    } else if ((event as PointerEvent).pointerType !== 'touch') {
      // Hovering focuses an item, so the pointer and the arrow keys share one highlight.
      if (item.isDisabled) this.releaseHighlight()
      else if (!isFocused(item)) item.focus({ preventScroll: true })
    }
  }

  private handleMenuKey(event: KeyboardEvent, item: MoulMenuItem | null): void {
    const items = this.items
    const count = items.length
    const current = item ? items.indexOf(item) : -1

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Home':
      case 'End': {
        event.preventDefault()
        const isDown = event.key === 'ArrowDown'
        if (current < 0 && (isDown || event.key === 'ArrowUp')) {
          this.focusInto(isDown ? 'first' : 'last')
          return
        }
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? count - 1
              : (current + (isDown ? 1 : -1) + count) % count
        items[next]?.focus()
        return
      }
      case 'Enter':
      case ' ':
        event.preventDefault()
        this.holdClick()
        items[current]?.click()
        return
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        this.setOpen(false, { emit: true, returnFocus: true })
        return
      case 'Tab':
        this.setOpen(false, { emit: true, returnFocus: false })
        return
    }

    const { key } = event
    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.typeahead(key.toLowerCase(), items, current)
    }
  }

  /**
   * Type-ahead: letters typed within half a second build a prefix; repeating
   * one letter cycles through the items that start with it.
   */
  private typeahead(
    char: string,
    items: MoulMenuItem[],
    current: number,
  ): void {
    clearTimeout(this.typeTimer)
    this.typeBuffer += char
    this.typeTimer = setTimeout(() => (this.typeBuffer = ''), TYPEAHEAD_RESET)
    const buffer = this.typeBuffer
    const isRepeat = [...buffer].every((c) => c === buffer[0])
    const query = isRepeat ? buffer[0] : buffer
    const start = isRepeat || current < 0 ? current + 1 : current
    for (let i = 0; i < items.length; i++) {
      const item = items[(start + i) % items.length]
      if (item.label.toLowerCase().startsWith(query)) {
        item.focus()
        return
      }
    }
  }

  private activate(event: Event, item: MoulMenuItem): void {
    if (item.isDisabled) {
      event.preventDefault()
      return
    }
    const isToggle = item.type === 'checkbox' || item.type === 'radio'
    if (item.type === 'checkbox') {
      item.isChecked = !item.isChecked
    } else if (item.type === 'radio') {
      const group = item.closest('moul-menu-group')
      for (const other of this.items) {
        if (
          other.type === 'radio' &&
          other.closest('moul-menu-group') === group
        ) {
          other.isChecked = other === item
        }
      }
    }
    this.dispatchEvent(
      new CustomEvent<DropdownMenuActionDetail>('action', {
        bubbles: true,
        composed: true,
        detail: { value: item.value || item.label, item },
      }),
    )
    if (!isToggle) this.setOpen(false, { emit: true, returnFocus: true })
  }

  /** Over the surface but off any item (padding, a heading, a separator): drop the highlight. */
  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return
    if (event.composedPath().some((node) => node instanceof MoulMenuItem))
      return
    this.releaseHighlight()
  }

  private readonly handlePointerLeave = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch') this.releaseHighlight()
  }

  /** Moves focus from an item back to the surface, dropping the highlight but keeping the keys working. */
  private releaseHighlight(): void {
    if (this.items.some(isFocused)) this.menuEl?.focus({ preventScroll: true })
  }

  protected override render() {
    const isGooey = this.variant === 'gooey'
    return html`
      <div part="trigger">
        <slot name="trigger" @slotchange=${this.handleTriggerSlotChange}></slot>
      </div>
      <div part="popover" popover="manual">
        ${
          isGooey
            ? html`<div part="goo" aria-hidden="true">
              <div class="goo-fill" style="filter: url(#${this.gooId})"></div>
            </div>`
            : nothing
        }
        <div
          part="menu"
          role="menu"
          tabindex="-1"
          @pointermove=${this.handlePointerMove}
          @pointerleave=${this.handlePointerLeave}
        >
          <slot @slotchange=${this.handleItemsChange}></slot>
        </div>
      </div>
      ${
        isGooey
          ? html`<svg class="goo-defs" aria-hidden="true" focusable="false">
            <filter id=${this.gooId} color-interpolation-filters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="7"></feGaussianBlur>
              <feColorMatrix
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8"
              ></feColorMatrix>
            </filter>
          </svg>`
          : nothing
      }
    `
  }
}

defineElement('moul-dropdown-menu', MoulDropdownMenu)

declare global {
  interface HTMLElementTagNameMap {
    'moul-dropdown-menu': MoulDropdownMenu
  }
}
