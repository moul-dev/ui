import { html, LitElement, nothing, type PropertyValues } from 'lit'
import {
  DragController,
  type DragState,
} from '../../controllers/drag.controller'
import {
  OverlayPresenceController,
  type OverlayPreset,
} from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import {
  focusFirstElement,
  getDeepActiveElement,
  restoreFocus,
  trapFocus,
} from '../../utils/focus-trap'
import { drawerStyles } from './Drawer.styles'

export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom'
export type DrawerSize = 'sm' | 'md' | 'lg'

/** Share of the sheet's height a drag must pass for the release to dismiss it. */
const DISMISS_FRACTION = 1 / 3
/** Downward release speed (px/s) that dismisses a sheet however short the drag. */
const FLICK_VELOCITY = 500
/** Pixels a press travels before it becomes a drag, as in the drag controller. */
const DRAG_THRESHOLD = 4
/** Presses that start on these never drag a sheet. */
const TEXT_FIELD =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"]'

/**
 * How a press on a sheet may drag it: `free` in either direction, `down` once
 * it heads down (it started in scrollable content at its top), `blocked` not
 * at all (it started on a text field or in scrolled content, or it set off
 * upward from the top of the content).
 */
type SheetGesture = 'free' | 'down' | 'blocked'

/**
 * A panel that slides in from one edge of the viewport (`placement` left,
 * right, top or bottom) over a dimmed backdrop, on a modal native `<dialog>`,
 * for filters, settings and detail views, with `header`, body and `footer`
 * slots. With `is-sheet` it is a bottom sheet instead, whatever `placement`
 * says: a grab handle on top, as tall as its content up to 90% of the
 * viewport, and dragged down to dismiss. A sheet closes when it is let go
 * past a third of its height or flicked down; otherwise it springs back. Its
 * scrolling body drags the sheet only from the top of its content and only
 * downward, so the content still scrolls, and a press on a text field never
 * drags it. Dragging up stretches and springs back, and so does dragging down
 * when `isDismissable` is false.
 *
 * Keyboard and screen readers: on open, focus moves to the first focusable
 * element in the panel, `Tab` and `Shift+Tab` cycle inside it, and on close
 * focus returns to the element that had it before, even one inside another
 * shadow root. `Escape` always closes the drawer; a click outside the panel
 * closes it unless `isDismissable` is false. Screen readers get the native
 * `dialog` role with `aria-modal="true"`, but no accessible name: the header
 * is not linked with `aria-labelledby`. A sheet's grab handle is decorative:
 * hidden from screen readers and never a tab stop. As a "Close" button it
 * would take the focus the drawer gives its first control on open, be
 * announced before the content, and do nothing on a sheet that is not
 * dismissable. Dragging is a pointer gesture only, and screen readers are not
 * told the sheet can be dragged: `Escape` is the keyboard path to the same
 * result, and a sheet for touch screen readers should carry its own close or
 * done button.
 *
 * Reduced motion: the panel appears and disappears at once instead of sliding
 * in from and back out to its edge, and the backdrop does not fade. A sheet
 * still follows the finger while it is dragged, because that movement is the
 * user's own, but on release it closes or returns to place at once instead of
 * springing, and the backdrop does not ease back.
 *
 * @slot header - Title row at the top of the panel.
 * @slot - The panel body, which scrolls when it overflows.
 * @slot footer - Actions at the bottom of the panel.
 * @fires openchange - From `setOpen()`, and when `Escape`, a click outside or a drag on a sheet closes the drawer; `detail.isOpen` is the new state. Setting `isOpen` directly does not fire it.
 * @csspart dialog - The native `<dialog>`, full viewport.
 * @csspart base - The panel.
 * @csspart handle - A sheet's grab handle, the pill at the top.
 * @csspart header - The header row.
 * @csspart body - The scrolling body.
 * @csspart footer - The footer row.
 */
export class MoulDrawer extends LitElement {
  static override styles = drawerStyles

  static override properties = {
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    placement: { type: String, reflect: true },
    size: { type: String, reflect: true },
    isDismissable: {
      type: Boolean,
      reflect: true,
      attribute: 'is-dismissable',
    },
    isSheet: { type: Boolean, reflect: true, attribute: 'is-sheet' },
  }

  declare isOpen: boolean
  /** Ignored while `isSheet` is true. */
  declare placement: DrawerPlacement
  /** Width (left and right) or height (top and bottom); ignored by a sheet, which fits its content. */
  declare size: DrawerSize
  declare isDismissable: boolean
  /** A bottom sheet with a grab handle that is dragged down to dismiss. */
  declare isSheet: boolean

  public overlayPresence: OverlayPresenceController
  private previousActiveElement: HTMLElement | null = null
  private readonly drag: DragController
  private sheetGesture: SheetGesture = 'free'
  private pressStart = { id: -1, x: 0, y: 0 }
  private sheetHeight = 0
  private dismissOnRelease = false

  constructor() {
    super()
    this.isOpen = false
    this.placement = 'right'
    this.size = 'md'
    this.isDismissable = true
    this.isSheet = false

    this.overlayPresence = new OverlayPresenceController(this, {
      preset: `drawer-${this.placement}` as OverlayPreset,
      dialog: () => this.dialogEl,
    })

    const isHeld = (): boolean => this.sheetGesture !== 'free'
    this.drag = new DragController(this, {
      axis: 'y',
      handle: () => (this.isSheet ? this.contentEl : null),
      // On the dialog, next to `--_sheet-progress`; the panel inherits it.
      styleTarget: () => this.dialogEl,
      prefix: '--_drag',
      // Read on every move: a press in scrollable content waits here until
      // `watchSheetDirection` sees which way it heads.
      get threshold() {
        return isHeld() ? Number.POSITIVE_INFINITY : DRAG_THRESHOLD
      },
      bounds: () => (this.isDismissable ? { top: 0 } : { top: 0, bottom: 0 }),
      disabled: () => !this.isOpen || this.sheetGesture === 'blocked',
      onStart: () => {
        this.sheetHeight = this.contentEl?.getBoundingClientRect().height ?? 0
      },
      onMove: (state) => this.setSheetProgress(state.y),
      release: (state) => this.sheetRestingPoint(state),
      onEnd: () => {
        if (this.dismissOnRelease) void this.setOpen(false)
        else if (this.isOpen) this.setSheetProgress(0)
      },
    })
  }

  public get dialogEl(): HTMLDialogElement | null {
    return this.shadowRoot?.querySelector<HTMLDialogElement>('dialog') ?? null
  }

  public get contentEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector<HTMLElement>('[part="base"]') ?? null
  }

  public get isMounted(): boolean {
    return this.overlayPresence.isMounted
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('keydown', this.handleKeyDown)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('keydown', this.handleKeyDown)
    this.stopWatchingDirection()
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('placement') || changedProps.has('isSheet')) {
      this.overlayPresence.preset = `drawer-${
        this.isSheet ? 'bottom' : this.placement
      }` as OverlayPreset
    }

    if (changedProps.has('isOpen')) {
      if (this.isOpen !== this.overlayPresence.isOpen) {
        if (this.isOpen) {
          this.openDrawer()
        } else {
          this.closeDrawer()
        }
      }
    }
  }

  public async setOpen(nextOpen: boolean): Promise<void> {
    if (this.isOpen === nextOpen && this.overlayPresence.isOpen === nextOpen)
      return
    this.isOpen = nextOpen
    this.dispatchEvent(
      new CustomEvent('openchange', {
        bubbles: true,
        composed: true,
        detail: { isOpen: this.isOpen },
      }),
    )
    if (nextOpen) {
      await this.openDrawer()
    } else {
      await this.closeDrawer()
    }
  }

  private async openDrawer(): Promise<void> {
    this.previousActiveElement = getDeepActiveElement()
    // A sheet dismissed by a drag closed where it was let go.
    if (this.drag.state.y !== 0) this.drag.jumpTo({ x: 0, y: 0 })
    this.dialogEl?.style.removeProperty('--_sheet-progress')

    await this.overlayPresence.setOpen(true)
    const dialog = this.dialogEl
    if (dialog) {
      focusFirstElement(this.contentEl ?? dialog)
    }
  }

  private async closeDrawer(): Promise<void> {
    await this.overlayPresence.setOpen(false)
    restoreFocus(this.previousActiveElement)
  }

  /** Where a released sheet rests: in place when it closes (the close slide takes it from there), else back at the top. */
  private sheetRestingPoint(state: DragState): { x: number; y: number } {
    const height = this.sheetHeight || window.innerHeight
    const speed = state.velocityY
    this.dismissOnRelease =
      this.isOpen &&
      this.isDismissable &&
      state.y > 0 &&
      (speed > FLICK_VELOCITY ||
        (state.y > height * DISMISS_FRACTION && speed > -FLICK_VELOCITY))
    return this.dismissOnRelease || !this.isOpen
      ? { x: 0, y: state.y }
      : { x: 0, y: 0 }
  }

  /** Fades the backdrop as the sheet travels down its own height. */
  private setSheetProgress(y: number): void {
    const height = this.sheetHeight || window.innerHeight
    const progress = Math.min(1, Math.max(0, y / height))
    this.dialogEl?.style.setProperty(
      '--_sheet-progress',
      String(Math.round(progress * 1000) / 1000),
    )
  }

  /**
   * Runs before the drag controller sees the press (it listens on the host),
   * and decides how a press on a sheet may drag it.
   */
  private readonly handleSheetPointerDown = (e: PointerEvent): void => {
    if (!this.isSheet || !e.isPrimary) return
    this.stopWatchingDirection()
    this.sheetGesture = this.gestureFor(e)
    if (this.sheetGesture !== 'down') return
    this.pressStart = { id: e.pointerId, x: e.clientX, y: e.clientY }
    // Capture on window runs before the controller's own window listener.
    window.addEventListener('pointermove', this.watchSheetDirection, true)
    window.addEventListener('pointerup', this.stopWatchingDirection, true)
    window.addEventListener('pointercancel', this.stopWatchingDirection, true)
  }

  private gestureFor(e: PointerEvent): SheetGesture {
    const path = e.composedPath()
    const inPanel = path
      .slice(0, Math.max(0, path.indexOf(e.currentTarget as EventTarget)))
      .filter((node): node is Element => node instanceof Element)
    // Text fields keep the pointer for placing the caret and selecting text.
    if (inPanel.some((el) => el.matches(TEXT_FIELD))) return 'blocked'
    const body = this.shadowRoot?.querySelector('[part="body"]')
    const index = body ? inPanel.indexOf(body) : -1
    // The handle, header and footer always drag.
    if (index < 0) return 'free'
    const scrollers = inPanel.slice(0, index + 1)
    if (scrollers.some((el) => el.scrollTop > 0)) return 'blocked'
    return scrollers.some((el) => el.scrollHeight > el.clientHeight + 1)
      ? 'down'
      : 'free'
  }

  /** Down from the top of the content drags the sheet; any other way scrolls the content. */
  private readonly watchSheetDirection = (e: PointerEvent): void => {
    if (e.pointerId !== this.pressStart.id) return
    const dx = e.clientX - this.pressStart.x
    const dy = e.clientY - this.pressStart.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < DRAG_THRESHOLD) return
    this.sheetGesture = dy > Math.abs(dx) ? 'free' : 'blocked'
    this.stopWatchingDirection()
  }

  private readonly stopWatchingDirection = (): void => {
    window.removeEventListener('pointermove', this.watchSheetDirection, true)
    window.removeEventListener('pointerup', this.stopWatchingDirection, true)
    window.removeEventListener(
      'pointercancel',
      this.stopWatchingDirection,
      true,
    )
  }

  /**
   * Keeps a touch that is dragging the sheet from also scrolling the content
   * or the page. Not passive, so it is bound on sheets only.
   */
  private readonly handleSheetTouchMove = {
    handleEvent: (e: TouchEvent): void => {
      if (this.drag.state.isDragging && e.cancelable) e.preventDefault()
    },
    passive: false,
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isOpen) return

    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      this.setOpen(false)
      return
    }

    if (e.key === 'Tab') {
      trapFocus(this.dialogEl ?? this, e)
    }
  }

  private readonly handleDialogClick = (e: MouseEvent): void => {
    if (!this.isDismissable) return

    const content = this.contentEl
    if (!content) return

    const rect = content.getBoundingClientRect()
    const isInside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom

    if (!isInside) {
      this.setOpen(false)
    }
  }

  protected override render() {
    return html`
      <dialog
        part="dialog"
        aria-modal="true"
        class="dialog"
        ?data-dragging=${this.drag.state.isDragging}
        @click=${this.handleDialogClick}
      >
        <div
          part="base"
          class="drawer-card"
          @pointerdown=${this.handleSheetPointerDown}
          @touchmove=${this.isSheet ? this.handleSheetTouchMove : nothing}
        >
          ${
            this.isSheet
              ? html`<div part="handle" aria-hidden="true"></div>`
              : nothing
          }
          <div part="header">
            <slot name="header"></slot>
          </div>
          <div part="body">
            <slot></slot>
          </div>
          <div part="footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </dialog>
    `
  }
}

defineElement('moul-drawer', MoulDrawer)

declare global {
  interface HTMLElementTagNameMap {
    'moul-drawer': MoulDrawer
  }
}
