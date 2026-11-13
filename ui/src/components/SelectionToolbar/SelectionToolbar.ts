import { html, LitElement, type PropertyValues } from 'lit'
import { type AnimationPlaybackControls, animate } from 'motion'
import { defineElement } from '../../utils/define-element'
import { close } from '../../utils/icons'
import {
  EASE_OUT,
  type Pose,
  poseTransform,
  prefersReducedMotion,
  REST_POSE,
  readPose,
  SPRING_GENTLE,
  SPRING_SNAPPY,
  subtleAnimate,
} from '../../utils/motion'
import type { MoulTable } from '../Table/Table'
import { selectionToolbarStyles } from './SelectionToolbar.styles'

export type SelectionToolbarPosition = 'fixed' | 'sticky' | 'static'

type Bindable = HTMLElement &
  Partial<Pick<MoulTable, 'selectedKeys' | 'clearSelection'>>

/** Where the bar rests while hidden: lower, faded and a touch smaller. */
const HIDDEN_POSE: Pose = { opacity: 0, y: 24, scale: 0.96 }
/** Quiet time after the last count change before it is announced, in ms. */
const ANNOUNCE_DELAY = 400
const NAV_KEYS = ['ArrowRight', 'ArrowLeft', 'Home', 'End']
const TEXT_ENTRY =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]), textarea, [contenteditable]:not([contenteditable="false"])'
const FOCUSABLE =
  'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'

/** What `focus()` should land on for a toolbar item: itself, or the control in its shadow root (`moul-button`). */
const focusTarget = (item: HTMLElement): HTMLElement | null =>
  item.matches(FOCUSABLE)
    ? item
    : (item.shadowRoot?.querySelector<HTMLElement>(FOCUSABLE) ?? null)

/** Disabled is read from the property too, as it is set before the attribute reflects. */
const isNavigable = (item: HTMLElement): boolean =>
  !item.hidden &&
  !(item as { isDisabled?: boolean }).isDisabled &&
  !item.hasAttribute('is-disabled') &&
  focusTarget(item) !== null

const setTabIndex = (el: HTMLElement, value: string | null): void => {
  if (el.getAttribute('tabindex') === value) return
  if (value === null) el.removeAttribute('tabindex')
  else el.setAttribute('tabindex', value)
}

const hasFocus = (el: HTMLElement): boolean =>
  (el.getRootNode() as Document | ShadowRoot).activeElement === el

/**
 * A floating bar of bulk actions for the selected rows of a table, such as
 * Archive, Export or Delete. It shows "3 selected", the action buttons you
 * slot in, and a button that clears the selection, and it appears only while
 * `count` is above zero. Point `for` at a `<moul-table>` and it keeps `count`
 * in step with the table's selection and clears the table when cleared.
 * Without `for`, set `count` yourself. By default it floats at the bottom
 * centre of the viewport (`position="fixed"`); `sticky` pins it to the bottom
 * of its scroll container and `static` leaves it in the flow.
 *
 * Keyboard and screen readers: the bar is a `role="toolbar"` named by `label`
 * ("Bulk actions"), with one Tab stop. `Arrow Right` and `Arrow Left` move
 * focus between the slotted buttons and the clear button, wrapping (they swap
 * under `dir="rtl"`), and `Home` and `End` go to the first and last;
 * disabled and hidden buttons are skipped, and Tab returns to the button
 * last focused. `Escape` anywhere in the bar clears the selection through the
 * same cancelable `clear` event as the clear button, which is named "Clear
 * selection" (`clear-label`). The "3 selected" text describes the toolbar,
 * and a polite live region announces the count about 400ms after it last
 * changed ("3 selected", or the text of the `label` slot), so select all
 * announces once; the default text is English. Appearing never moves focus.
 * While hidden the bar is `hidden`, so neither focus nor screen readers reach
 * it, and while it slides away it is already `inert`. If it hides while
 * focus is inside it, focus goes back to the element that had it before the
 * bar, or else to the first control of the bound table.
 *
 * Reduced motion: the bar slides up and fades in with a spring, slides down
 * and fades out when it goes, and the count pops when it changes; under
 * reduced motion it appears and disappears at once and the count does not
 * pop. The clear button's hover colour changes at once.
 *
 * @slot - The action buttons, usually `moul-button`s (`size="sm"` fits the bar), as direct children: the arrow keys move between direct children, so buttons inside a wrapper such as `moul-button-group` are not reached.
 * @slot label - Replaces the "N selected" text; keep it in step with `count`. Its text is what the live region announces.
 * @fires clear - Cancelable. The clear button or `Escape` asked to clear the selection; unless you call `preventDefault()`, the bound table's `clearSelection()` runs and `count` becomes 0.
 * @fires openchange - The bar appeared or started to go; `detail: { isOpen }`. Not fired for the first render.
 * @csspart bar - The floating toolbar.
 * @csspart label - The wrapper of the `label` slot and the default "N selected" text.
 * @csspart count - The number in the default text.
 * @csspart actions - The wrapper of the default slot.
 * @csspart divider - The line before the clear button.
 * @csspart clear-button - The button that clears the selection.
 * @csspart status - The visually hidden live region.
 * @cssprop --selection-toolbar-offset - Gap between the bar and the bottom edge for `fixed` and `sticky` (default `var(--spacing-4)`, 1rem); `fixed` adds the safe-area inset.
 */
export class MoulSelectionToolbar extends LitElement {
  static override styles = selectionToolbarStyles

  static override properties = {
    count: { type: Number, reflect: true },
    htmlFor: { type: String, attribute: 'for' },
    label: { type: String },
    clearLabel: { type: String, attribute: 'clear-label' },
    position: { type: String, reflect: true },
  }

  /** How many items are selected. The bar shows while it is above 0. */
  declare count: number
  /** The id of a `moul-table` in the same document or shadow root to follow. */
  declare htmlFor: string
  /** Accessible name of the toolbar. */
  declare label: string
  /** Accessible name of the clear button. */
  declare clearLabel: string
  declare position: SelectionToolbarPosition

  /** Whether the bar is (or is becoming) visible: `count > 0` as last rendered. */
  private isShown = false
  /** Whether the bar is rendered: shown, or still sliding away. */
  private isMounted = false
  private motion: AnimationPlaybackControls | null = null
  private pendingSlide: 'in' | 'out' | null = null
  private isPopPending = false
  private isOpenChangePending = false
  /** The count on screen; keeps the last one while the bar slides away. */
  private shownCount = 0
  private announcement = ''
  private announceTimer: ReturnType<typeof setTimeout> | undefined
  private hasLabel = false
  /** The item holding the toolbar's one Tab stop. */
  private activeItem: HTMLElement | null = null
  /** The last element outside the bar that had focus, to return to. */
  private returnFocus: HTMLElement | null = null
  private table: Bindable | null = null
  private observer: MutationObserver | null = null

  constructor() {
    super()
    this.count = 0
    this.htmlFor = ''
    this.label = 'Bulk actions'
    this.clearLabel = 'Clear selection'
    this.position = 'fixed'
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.ownerDocument.addEventListener('focusin', this.trackFocus)
    // On the host, so events from slotted buttons arrive in every DOM.
    this.addEventListener('keydown', this.handleKeyDown)
    this.addEventListener('focusin', this.handleFocusIn)
    this.bind()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.ownerDocument.removeEventListener('focusin', this.trackFocus)
    this.removeEventListener('keydown', this.handleKeyDown)
    this.removeEventListener('focusin', this.handleFocusIn)
    this.unbind()
    this.releaseTabStops()
    clearTimeout(this.announceTimer)
    this.stopMotion()
    this.pendingSlide = null
    this.returnFocus = null
    if (this.isMounted !== this.isShown) {
      this.isMounted = this.isShown
      this.requestUpdate()
    }
  }

  private get bar(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>('[part~="bar"]')
  }

  /** The toolbar's buttons in order: the slotted ones, then the clear button. */
  private get items(): HTMLElement[] {
    const slot =
      this.renderRoot.querySelector<HTMLSlotElement>('slot:not([name])')
    const clear = this.renderRoot.querySelector<HTMLElement>(
      '[part~="clear-button"]',
    )
    const slotted = (slot?.assignedElements({ flatten: true }) ??
      []) as HTMLElement[]
    return clear ? [...slotted, clear] : slotted
  }

  // ── Binding to a table ────────────────────────────────────────────────

  /** Follows the table named by `for`, and waits for it if it is not there yet. */
  private bind(): void {
    const root = this.getRootNode() as Document | ShadowRoot
    const id = this.isConnected ? this.htmlFor : ''
    const next = (id ? root.getElementById?.(id) : null) as Bindable | null
    this.watchFor(Boolean(id && !next), root)
    if (next === this.table) return
    this.table?.removeEventListener('selectionchange', this.handleSelection)
    this.table = next
    if (!next) return
    next.addEventListener('selectionchange', this.handleSelection)
    if (Array.isArray(next.selectedKeys)) this.count = next.selectedKeys.length
  }

  private unbind(): void {
    this.watchFor(false)
    this.table?.removeEventListener('selectionchange', this.handleSelection)
    this.table = null
  }

  private watchFor(isWaiting: boolean, root?: Node): void {
    if (!isWaiting || !root) {
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

  private readonly handleSelection = (event: Event): void => {
    const table = this.table
    // Selection events from the table's own children are not the table's.
    if (!table || event.target !== table) return
    this.count = table.selectedKeys?.length ?? 0
  }

  // ── Clearing ──────────────────────────────────────────────────────────

  private requestClear(): boolean {
    const isAllowed = this.dispatchEvent(
      new CustomEvent('clear', {
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    )
    if (!isAllowed) return false
    this.table?.clearSelection?.()
    this.count = 0
    return true
  }

  // ── Focus ─────────────────────────────────────────────────────────────

  private readonly trackFocus = (event: FocusEvent): void => {
    const path = event.composedPath()
    if (path.includes(this)) return
    if (path[0] instanceof HTMLElement) this.returnFocus = path[0]
  }

  private holdsFocus(): boolean {
    const active = (this.getRootNode() as Document | ShadowRoot).activeElement
    return active !== null && (active === this || this.contains(active))
  }

  /** Moves focus out of a bar that is about to hide, so it does not fall to `<body>`. */
  private restoreFocus(): void {
    const candidates = [
      this.returnFocus,
      this.table?.shadowRoot?.querySelector<HTMLElement>(FOCUSABLE),
    ]
    for (const el of candidates) {
      if (!el?.isConnected) continue
      el.focus()
      if (hasFocus(el)) return
    }
  }

  /** Items whose `tabindex` this toolbar manages, with the value each had before. */
  private readonly managed = new Map<HTMLElement, string | null>()

  /** Gives items that left the toolbar (or all, when it disconnects) their own `tabindex` back. */
  private releaseTabStops(keep: HTMLElement[] = []): void {
    for (const [item, original] of this.managed) {
      if (keep.includes(item)) continue
      setTabIndex(item, original)
      this.managed.delete(item)
    }
  }

  /** Keeps exactly one item in the Tab order: the last focused, else the first. */
  private syncTabStops(): void {
    const items = this.items
    this.releaseTabStops(items)
    for (const item of items) {
      // Only the app's slotted actions; the clear button is the toolbar's own.
      if (!this.managed.has(item) && item.getRootNode() !== this.shadowRoot) {
        this.managed.set(item, item.getAttribute('tabindex'))
      }
    }
    const remembered = this.activeItem
    const active =
      remembered && items.includes(remembered) && isNavigable(remembered)
        ? remembered
        : items.find(isNavigable)
    for (const item of items) {
      setTabIndex(
        item,
        item !== active
          ? '-1'
          : // A host such as `moul-button`: its inner button is the one stop.
            item.shadowRoot && focusTarget(item) !== item
            ? null
            : '0',
      )
    }
  }

  private focusItem(item: HTMLElement): void {
    this.activeItem = item
    this.syncTabStops()
    focusTarget(item)?.focus()
  }

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const path = event.composedPath()
    const item = this.items.find((el) => path.includes(el))
    if (item && item !== this.activeItem) {
      this.activeItem = item
      this.syncTabStops()
    }
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey) return
    if (event.metaKey || event.shiftKey) return
    if (event.key === 'Escape') {
      if (this.requestClear()) event.preventDefault()
      return
    }
    if (!NAV_KEYS.includes(event.key)) return
    const path = event.composedPath()
    // Arrows and Home/End belong to a text field's caret.
    if ((path[0] as Element).matches?.(TEXT_ENTRY)) return
    const items = this.items.filter(isNavigable)
    const from = items.findIndex((item) => path.includes(item))
    if (from < 0) return
    const step = getComputedStyle(this).direction === 'rtl' ? -1 : 1
    const last = items.length - 1
    let to: number
    if (event.key === 'ArrowRight') to = from + step
    else if (event.key === 'ArrowLeft') to = from - step
    else if (event.key === 'Home') to = 0
    else to = last
    event.preventDefault()
    this.focusItem(items[to < 0 ? last : to > last ? 0 : to])
  }

  private readonly handleSlotChange = (): void => {
    this.syncTabStops()
    // Moul buttons render their inner button a moment later.
    Promise.all(
      this.items.map(
        (item) => (item as Partial<LitElement>).updateComplete ?? true,
      ),
    ).then(() => this.syncTabStops())
  }

  private readonly handleLabelSlot = (event: Event): void => {
    this.hasLabel = (event.target as HTMLSlotElement).assignedNodes().length > 0
  }

  // ── Announcements ─────────────────────────────────────────────────────

  private announce(): void {
    clearTimeout(this.announceTimer)
    this.announceTimer = setTimeout(() => {
      this.announcement = this.count > 0 ? this.labelText() : ''
      this.requestUpdate()
    }, ANNOUNCE_DELAY)
  }

  private labelText(): string {
    const slot =
      this.renderRoot.querySelector<HTMLSlotElement>('slot[name="label"]')
    const text = slot?.assignedNodes().length
      ? slot
          .assignedNodes({ flatten: true })
          .map((node) => node.textContent)
          .join('')
          .replace(/\s+/g, ' ')
          .trim()
      : ''
    return text || `${this.count} selected`
  }

  // ── Motion ────────────────────────────────────────────────────────────

  private stopMotion(): void {
    this.motion?.stop()
    this.motion = null
    const bar = this.bar
    bar?.style.removeProperty('opacity')
    bar?.style.removeProperty('transform')
  }

  private slide(isIn: boolean): void {
    const bar = this.bar
    if (!bar) return
    const to = isIn ? REST_POSE : HIDDEN_POSE
    // A reversal starts from wherever the bar is now.
    const from = this.motion ? readPose(bar) : isIn ? HIDDEN_POSE : REST_POSE
    this.motion?.stop()
    const controls = animate(
      bar,
      {
        opacity: [from.opacity, to.opacity],
        transform: [poseTransform(from), poseTransform(to)],
      },
      isIn ? SPRING_GENTLE : { duration: 0.18, ease: EASE_OUT },
    )
    this.motion = controls
    controls.then(() => {
      if (this.motion !== controls) return
      this.stopMotion()
      if (isIn) return
      this.isMounted = false
      this.requestUpdate()
    })
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('htmlFor')) this.bind()
    const isOpen = this.count > 0
    const wasOpen = this.isShown
    if (isOpen) this.shownCount = this.count
    if (isOpen !== wasOpen) {
      // Before the bar turns inert, which would drop focus to <body>.
      if (!isOpen && this.holdsFocus()) this.restoreFocus()
      // Each appearance starts its Tab stop on the first action again.
      if (!isOpen) this.activeItem = null
      const isAnimated = this.hasUpdated && !prefersReducedMotion()
      this.isShown = isOpen
      this.isMounted = isOpen || isAnimated
      this.pendingSlide = isAnimated ? (isOpen ? 'in' : 'out') : null
      if (!isAnimated) this.stopMotion()
      if (this.hasUpdated) this.isOpenChangePending = true
    }
    if (changed.has('count') && this.hasUpdated) {
      this.announce()
      this.isPopPending = wasOpen && isOpen && !prefersReducedMotion()
    }
  }

  protected override firstUpdated(): void {
    this.handleSlotChange()
  }

  protected override updated(): void {
    const slide = this.pendingSlide
    this.pendingSlide = null
    if (slide) this.slide(slide === 'in')
    // Actions often turn disabled as the selection changes.
    this.syncTabStops()
    if (this.isPopPending) {
      this.isPopPending = false
      const target = this.renderRoot.querySelector<HTMLElement>(
        this.hasLabel ? '[part~="label"]' : '[part~="count"]',
      )
      if (target) {
        subtleAnimate(
          target,
          { transform: ['scale(1.2)', 'scale(1)'] },
          SPRING_SNAPPY,
        )
      }
    }
    if (this.isOpenChangePending) {
      this.isOpenChangePending = false
      this.dispatchEvent(
        new CustomEvent('openchange', {
          bubbles: true,
          composed: true,
          detail: { isOpen: this.isShown },
        }),
      )
    }
  }

  protected override render() {
    return html`
      <div
        part="bar"
        role="toolbar"
        aria-label=${this.label || 'Bulk actions'}
        aria-describedby="label"
        ?hidden=${!this.isMounted}
        ?inert=${!this.isShown}
      >
        <span part="label" id="label">
          <slot name="label" @slotchange=${this.handleLabelSlot}>
            <span part="count">${this.shownCount}</span> selected
          </slot>
        </span>
        <div part="actions">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
        <span part="divider" aria-hidden="true"></span>
        <button
          part="clear-button"
          type="button"
          aria-label=${this.clearLabel || 'Clear selection'}
          @click=${this.requestClear}
        >
          ${close()}
        </button>
      </div>
      <div part="status" class="sr-only" role="status">${this.announcement}</div>
    `
  }
}

defineElement('moul-selection-toolbar', MoulSelectionToolbar)

declare global {
  interface HTMLElementTagNameMap {
    'moul-selection-toolbar': MoulSelectionToolbar
  }
}
