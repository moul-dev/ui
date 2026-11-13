import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { type AnimationPlaybackControls, animate } from 'motion'
import { defineElement } from '../../utils/define-element'
import {
  getDeepActiveElement,
  restoreFocus,
  trapFocus,
} from '../../utils/focus-trap'
import { close } from '../../utils/icons'
import {
  EASE_OUT,
  prefersReducedMotion,
  SPRING_SNAPPY,
} from '../../utils/motion'
import { expandableCardStyles } from './ExpandableCard.styles'

/** Width of the open card: `sm` 28rem, `md` 40rem, `lg` 56rem, never wider than the viewport. */
export type ExpandableCardSize = 'sm' | 'md' | 'lg'

/** Where the card is in its open and close cycle. */
type Phase = 'collapsed' | 'opening' | 'open' | 'closing'

interface Box {
  top: number
  left: number
  width: number
  height: number
}

const HEADING = 'h1, h2, h3, h4, h5, h6, [role="heading"]'

/** Inline styles that pin the panel to a box while it morphs. */
const PINNED = [
  'top',
  'right',
  'bottom',
  'left',
  'margin',
  'width',
  'height',
  'opacity',
]

const boxOf = (el: Element): Box => {
  const { top, left, width, height } = el.getBoundingClientRect()
  return { top, left, width, height }
}

const px = (value: number): string => `${Math.round(value * 100) / 100}px`

const sameBox = (a: Box, b: Box): boolean =>
  Math.abs(a.top - b.top) < 0.5 &&
  Math.abs(a.left - b.left) < 0.5 &&
  Math.abs(a.width - b.width) < 0.5 &&
  Math.abs(a.height - b.height) < 0.5

/**
 * A card that grows into a dialog and shrinks back into its place. Closed, it
 * is an inline card showing its `media` and default content, and the whole
 * card is a button. Pressed, the same panel springs from its spot in the page
 * to a centred dialog over a dimmed backdrop, where the `details` slot appears
 * below the shared content and scrolls if it is long. A placeholder keeps the
 * card's space in the page meanwhile, so nothing around it moves.
 *
 * Keyboard and screen readers: the closed card is one `Tab` stop with
 * `role="button"`, `aria-haspopup="dialog"` and `aria-expanded="false"`, named
 * by `label` or else by its text; `Enter` or `Space` opens it. Open, it is a
 * modal `role="dialog"` named by `label`, or else by the text of the first
 * heading (`h1` to `h6`) among its slotted content; the rest of the page is
 * inert, focus moves to the close button and `Tab` stays inside the card.
 * `Escape`, the close button or a click on the backdrop closes it, and focus
 * returns to the element that had it before, normally the card. Because the
 * closed card is a button, do not put links or buttons in its `media` or
 * default content; put them in `details`.
 *
 * Reduced motion: the dialog fades in at the centre and fades out again
 * instead of growing out of the card and shrinking back into it, and the card
 * does not lift on hover.
 *
 * @slot - Content shown both closed and open, such as a title and a line of text.
 * @slot media - A full-bleed image or video above the content.
 * @slot details - Content shown only while the card is open.
 *
 * @csspart base - The card panel: a `<dialog>`, inline while closed and in the top layer while open.
 * @csspart media - The wrapper of the `media` slot.
 * @csspart content - The wrapper of the default and `details` slots; it scrolls while open.
 * @csspart details - The wrapper of the `details` slot.
 * @csspart close-button - The close button, shown while open.
 * @csspart placeholder - The box that holds the card's place in the page while it is open.
 *
 * @cssprop --expandable-card-width - Width of the open card. Defaults to the width `size` picks.
 * @cssprop --expandable-card-media-ratio - Aspect ratio of slotted media. Defaults to `16 / 9`.
 *
 * @fires openchange - From `setOpen()` and `toggle()`, and when the card, the close button, `Escape` or the backdrop opens or closes it; `detail.isOpen` is the new state. Setting `isOpen` directly does not fire it.
 */
export class MoulExpandableCard extends LitElement {
  static override styles = expandableCardStyles

  static override properties = {
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    size: { type: String, reflect: true },
    label: { type: String, reflect: true },
    closeLabel: { type: String, attribute: 'close-label' },
    phase: { state: true },
  }

  declare isOpen: boolean
  declare size: ExpandableCardSize
  /** Accessible name of the card and its dialog. Without it the dialog takes the first heading's text. */
  declare label: string
  /** Accessible name of the close button. */
  declare closeLabel: string
  private declare phase: Phase

  /** The open or closed state the card is heading for. */
  private target: 'open' | 'collapsed' = 'collapsed'
  private running: Promise<void> = Promise.resolve()
  /** Bumped by every open and close, so an interrupted one stops where it is. */
  private generation = 0
  private motion: AnimationPlaybackControls[] = []
  private previousFocus: HTMLElement | null = null
  private dialogName = ''

  constructor() {
    super()
    this.isOpen = false
    this.size = 'md'
    this.label = ''
    this.closeLabel = 'Close'
    this.phase = 'collapsed'
  }

  /** The card panel, a `<dialog>` that stays in the page while closed. */
  public get panelEl(): HTMLDialogElement | null {
    return this.shadowRoot?.querySelector<HTMLDialogElement>('dialog') ?? null
  }

  private get placeholderEl(): HTMLElement | null {
    return (
      this.shadowRoot?.querySelector<HTMLElement>('[part="placeholder"]') ??
      null
    )
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    // On the host, so keys and clicks from slotted content are seen in every engine.
    this.addEventListener('click', this.handleClick)
    this.addEventListener('keydown', this.handleKeyDown)
    // Moved in the document while open: the dialog left the top layer with it.
    if (this.hasUpdated && this.isOpen) {
      void this.updateComplete.then(() => this.sync())
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('click', this.handleClick)
    this.removeEventListener('keydown', this.handleKeyDown)
    this.generation++
    this.stopMotion()
    this.clearPinned()
    if (this.panelEl?.open) this.panelEl.close()
    this.target = 'collapsed'
    this.running = Promise.resolve()
    this.phase = 'collapsed'
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)
    // After this update, so the open or close it starts does not re-render inside it.
    if (changedProps.has('isOpen')) queueMicrotask(() => void this.sync())
  }

  /** Opens or closes the card and fires `openchange`; resolves once the motion settles. */
  public async setOpen(nextOpen: boolean): Promise<void> {
    if (this.isOpen === nextOpen) return this.running
    this.isOpen = nextOpen
    this.dispatchEvent(
      new CustomEvent('openchange', {
        bubbles: true,
        composed: true,
        detail: { isOpen: this.isOpen },
      }),
    )
    await this.sync()
  }

  public toggle(): Promise<void> {
    return this.setOpen(!this.isOpen)
  }

  /** Starts the open or close that `isOpen` asks for, unless it is already under way. */
  private sync(): Promise<void> {
    const wanted = this.isOpen ? 'open' : 'collapsed'
    if (wanted === this.target) return this.running
    this.target = wanted
    this.running = wanted === 'open' ? this.expand() : this.collapse()
    return this.running
  }

  private async expand(): Promise<void> {
    const token = ++this.generation
    const panel = this.panelEl
    const placeholder = this.placeholderEl
    if (!panel || !placeholder || !this.isConnected) return

    // Where the panel is now: its spot in the page, or mid-way through a close.
    const from = boxOf(panel)
    const fromOpacity = panel.open ? this.currentOpacity(panel) : 1
    if (!panel.open) {
      this.previousFocus = getDeepActiveElement()
      // Layout size, not the visual box: a pressed card is briefly scaled down.
      placeholder.style.width = px(panel.offsetWidth)
      placeholder.style.height = px(panel.offsetHeight)
    }
    this.stopMotion()
    this.dialogName = this.label || this.headingText()
    this.phase = 'opening'
    await this.updateComplete
    if (token !== this.generation) return

    if (!panel.open) {
      try {
        panel.showModal()
      } catch (error) {
        console.warn(
          '[@moul-dev/web-component] <moul-expandable-card> could not open its dialog:',
          error,
        )
        this.phase = 'collapsed'
        return
      }
    }
    this.clearPinned()
    const to = boxOf(panel)
    this.focusCloseButton()

    if (prefersReducedMotion()) {
      await this.play([
        animate(
          panel,
          { opacity: [fromOpacity === 1 ? 0 : fromOpacity, 1] },
          { duration: 0.15, ease: EASE_OUT },
        ),
      ])
    } else {
      await this.play(this.morph(panel, from, to, true))
    }
    if (token !== this.generation) return
    this.clearPinned()
    this.phase = 'open'
  }

  private async collapse(): Promise<void> {
    const token = ++this.generation
    const panel = this.panelEl
    const placeholder = this.placeholderEl
    if (!panel || !placeholder || !panel.open) {
      this.phase = 'collapsed'
      return
    }

    const from = boxOf(panel)
    const fromOpacity = this.currentOpacity(panel)
    this.stopMotion()
    this.phase = 'closing'
    await this.updateComplete
    if (token !== this.generation) return

    const content = this.shadowRoot?.querySelector('[part="content"]')
    if (content) content.scrollTop = 0
    const to = boxOf(placeholder)

    if (prefersReducedMotion()) {
      await this.play([
        animate(
          panel,
          { opacity: [fromOpacity, 0] },
          { duration: 0.15, ease: EASE_OUT },
        ),
      ])
    } else {
      await this.play(this.morph(panel, from, to, false))
    }
    if (token !== this.generation) return

    panel.close()
    this.clearPinned()
    this.phase = 'collapsed'
    await this.updateComplete
    const back = this.previousFocus
    this.previousFocus = null
    restoreFocus(back && back !== document.body ? back : panel)
  }

  /**
   * Springs the panel from one box to another by its real size and position,
   * so text rewraps and media resizes instead of stretching, and fades the
   * details and close button in or out alongside.
   */
  private morph(
    panel: HTMLElement,
    from: Box,
    to: Box,
    isOpening: boolean,
  ): AnimationPlaybackControls[] {
    if (sameBox(from, to)) return []
    // Pinned to the start box now, so no frame shows it centred or in the corner.
    Object.assign(panel.style, {
      right: 'auto',
      bottom: 'auto',
      margin: '0',
      top: px(from.top),
      left: px(from.left),
      width: px(from.width),
      height: px(from.height),
    })
    const motion = [
      animate(
        panel,
        {
          top: [px(from.top), px(to.top)],
          left: [px(from.left), px(to.left)],
          width: [px(from.width), px(to.width)],
          height: [px(from.height), px(to.height)],
        },
        SPRING_SNAPPY,
      ),
    ]
    const extras = this.shadowRoot?.querySelectorAll<HTMLElement>(
      '[part="details"], [part="close-button"]',
    )
    for (const el of extras ?? []) {
      motion.push(
        animate(
          el,
          { opacity: isOpening ? [0, 1] : [this.currentOpacity(el), 0] },
          isOpening
            ? { duration: 0.2, delay: 0.08, ease: EASE_OUT }
            : { duration: 0.12, ease: EASE_OUT },
        ),
      )
    }
    return motion
  }

  /** Resolves when every animation settles, or at once when they are stopped. */
  private play(motion: AnimationPlaybackControls[]): Promise<void> {
    this.motion = motion
    return Promise.all(motion.map((m) => m.finished.catch(() => {}))).then(
      () => {
        if (this.motion === motion) this.motion = []
      },
    )
  }

  private stopMotion(): void {
    for (const m of this.motion) m.stop()
    this.motion = []
    for (const el of this.shadowRoot?.querySelectorAll<HTMLElement>(
      '[part="details"], [part="close-button"]',
    ) ?? []) {
      el.style.removeProperty('opacity')
    }
  }

  private clearPinned(): void {
    const panel = this.panelEl
    if (!panel) return
    for (const name of PINNED) panel.style.removeProperty(name)
  }

  private currentOpacity(el: Element): number {
    if (typeof getComputedStyle !== 'function') return 1
    const value = Number.parseFloat(getComputedStyle(el).opacity)
    return Number.isFinite(value) ? value : 1
  }

  private focusCloseButton(): void {
    const button = this.shadowRoot?.querySelector<HTMLButtonElement>(
      '[part="close-button"]',
    )
    try {
      ;(button ?? this.panelEl)?.focus({ preventScroll: true })
    } catch {
      // The dialog closed again before focus could move.
    }
  }

  /** Text of the first heading among the slotted content, to name the dialog. */
  private headingText(): string {
    const slots =
      this.shadowRoot?.querySelectorAll<HTMLSlotElement>('slot') ?? []
    for (const slot of slots) {
      for (const el of slot.assignedElements({ flatten: true })) {
        const heading = el.matches(HEADING) ? el : el.querySelector(HEADING)
        const text = heading?.textContent?.replace(/\s+/g, ' ').trim()
        if (text) return text
      }
    }
    return ''
  }

  private readonly handleClick = (e: MouseEvent): void => {
    const panel = this.panelEl
    if (!panel) return
    if (this.phase === 'collapsed') {
      void this.setOpen(true)
      return
    }
    // A click on the backdrop lands on the dialog itself, outside its box.
    if (e.composedPath()[0] !== panel || !this.isOpen) return
    const rect = panel.getBoundingClientRect()
    const isInside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    if (!isInside) void this.setOpen(false)
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (this.phase === 'collapsed') {
      if (e.composedPath()[0] !== this.panelEl) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        void this.setOpen(true)
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      void this.setOpen(false)
    } else if (e.key === 'Tab' && this.panelEl) {
      trapFocus(this.panelEl, e)
    }
  }

  /** `Escape` reached the dialog without a keydown (a close request): close with motion instead. */
  private readonly handleCancel = (e: Event): void => {
    e.preventDefault()
    void this.setOpen(false)
  }

  protected override render() {
    const isCollapsed = this.phase === 'collapsed'
    const name = isCollapsed ? this.label : this.dialogName
    return html`
      <dialog
        part="base"
        data-phase=${this.phase}
        role=${isCollapsed ? 'button' : 'dialog'}
        tabindex=${isCollapsed ? '0' : '-1'}
        aria-haspopup=${isCollapsed ? 'dialog' : nothing}
        aria-expanded=${isCollapsed ? 'false' : nothing}
        aria-modal=${isCollapsed ? nothing : 'true'}
        aria-label=${name || nothing}
        @cancel=${this.handleCancel}
      >
        <button
          part="close-button"
          type="button"
          aria-label=${this.closeLabel}
          @click=${() => this.setOpen(false)}
        >
          ${close()}
        </button>
        <div part="media"><slot name="media"></slot></div>
        <div part="content">
          <slot></slot>
          <div part="details"><slot name="details"></slot></div>
        </div>
      </dialog>
      <div part="placeholder" aria-hidden="true"></div>
    `
  }
}

defineElement('moul-expandable-card', MoulExpandableCard)

declare global {
  interface HTMLElementTagNameMap {
    'moul-expandable-card': MoulExpandableCard
  }
}
