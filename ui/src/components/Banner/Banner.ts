import { html, LitElement, nothing, type PropertyValues } from 'lit'
import {
  ScrollController,
  type ScrollState,
} from '../../controllers/scroll.controller'
import type { SemanticTone } from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { bannerStyles } from './Banner.styles'

/** `solid` fills the banner with the tone; `flat` tints it. */
export type BannerVariant = 'solid' | 'flat'

const TONES: readonly SemanticTone[] = [
  'primary',
  'accent',
  'success',
  'warning',
  'error',
]
const VARIANTS: readonly BannerVariant[] = ['solid', 'flat']
const DEFAULT_THRESHOLD = 24
/** The longest the collapse on dismiss may take before the banner hides anyway. */
const DISMISS_FALLBACK_MS = 450
const STORAGE_PREFIX = 'moul-banner:'

/**
 * A one-line announcement across the top of a page, such as a release, an
 * event or planned downtime, with an optional action and a close button.
 * It sits in the normal flow; `is-sticky` keeps it at the top of the
 * viewport, and in a `moul-navbar`'s `banner` slot it rides above the bar.
 * `hide-on-scroll` slides a sticky banner out of view while the reader
 * scrolls down and brings it back on the way up (in a navbar, the navbar
 * does the sliding). `is-dismissable` adds a close button; dismissing fires
 * a cancelable `dismiss` event, folds the banner away and sets `hidden`,
 * and with `storage-key` the choice is kept in `localStorage`, so the
 * banner stays hidden on later visits. `tone` and `variant` set the colours.
 * It lives in the effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: the banner is a `region` landmark named by
 * `label` ("Announcement" by default; an `aria-label` or `aria-labelledby`
 * of your own wins), so it can be found and skipped. The banner itself is
 * not focusable; links and buttons in it are, in order, followed by the
 * close button, which is named by `dismiss-label` ("Dismiss announcement").
 * The message is not announced as it appears: it is page content, read in
 * place.
 *
 * Reduced motion: `hide-on-scroll` does nothing, so the banner stays in
 * view, and dismissing hides it at once instead of folding it away.
 *
 * @slot - The message. Links directly in it take the banner's colour and an underline.
 * @slot icon - An icon before the message.
 * @slot action - A button or link after the message.
 *
 * @csspart base - The banner's box, which folds away on dismiss and slides away with `hide-on-scroll`.
 * @csspart content - The row that holds the icon, message, action and close button.
 * @csspart icon - The box that holds the `icon` slot.
 * @csspart message - The box that holds the message.
 * @csspart action - The box that holds the `action` slot.
 * @csspart close-button - The button that dismisses the banner, with `is-dismissable`.
 *
 * @cssprop --banner-background - The background. Defaults to the tone's solid or soft colour.
 * @cssprop --banner-color - The text colour. Defaults to the tone's matching foreground.
 * @cssprop --banner-z-index - The stacking order of a sticky banner. Defaults to `101`.
 *
 * @fires dismiss - When the reader presses the close button, before the banner hides. Cancelable: call `preventDefault()` to keep it.
 */
export class MoulBanner extends LitElement {
  static override styles = bannerStyles

  static override properties = {
    label: { type: String },
    tone: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    isDismissable: {
      type: Boolean,
      reflect: true,
      attribute: 'is-dismissable',
    },
    dismissLabel: { type: String, attribute: 'dismiss-label' },
    isSticky: { type: Boolean, reflect: true, attribute: 'is-sticky' },
    hideOnScroll: { type: Boolean, reflect: true, attribute: 'hide-on-scroll' },
    threshold: { type: Number },
    storageKey: { type: String, attribute: 'storage-key' },
    htmlFor: { type: String, attribute: 'for' },
    isRetracted: { type: Boolean, reflect: true, attribute: 'is-retracted' },
    isDismissing: { state: true },
    hasIcon: { state: true },
    hasAction: { state: true },
  }

  /** The accessible name of the region. Defaults to `Announcement`. */
  declare label: string
  /** `primary` (default), `accent`, `success`, `warning` or `error`; an unknown value falls back to `primary`. */
  declare tone: SemanticTone
  /** `solid` (default) or `flat`; an unknown value falls back to `solid`. */
  declare variant: BannerVariant
  /** Show a close button. */
  declare isDismissable: boolean
  /** The accessible name of the close button. Defaults to `Dismiss announcement`. */
  declare dismissLabel: string
  /** Stay at the top of the viewport while the page scrolls. */
  declare isSticky: boolean
  /** Slide out of view while the reader scrolls down (sticky, or in a navbar); come back on the way up. */
  declare hideOnScroll: boolean
  /** Pixels the page must be scrolled before `hide-on-scroll` acts. Defaults to 24. */
  declare threshold: number
  /** Remember a dismissal in `localStorage` under `moul-banner:<key>`, and stay hidden once dismissed. */
  declare storageKey: string
  /** The id of a scroll container in the same document or shadow root to follow. Empty follows the page. */
  declare htmlFor: string
  /** Read-only: the banner is out of view because of `hide-on-scroll`. */
  declare isRetracted: boolean
  private declare isDismissing: boolean
  private declare hasIcon: boolean
  private declare hasAction: boolean

  private scrolling: ScrollController | null = null
  private readonly scrollSink: HTMLElement | null =
    typeof document === 'undefined' ? null : document.createElement('span')
  private stopWatchingMotion: (() => void) | null = null
  private isReduced = false
  private ownsLabel = false
  private dismissTimer: ReturnType<typeof setTimeout> | null = null
  private finishDismiss: (() => void) | null = null

  constructor() {
    super()
    this.label = 'Announcement'
    this.tone = 'primary'
    this.variant = 'solid'
    this.isDismissable = false
    this.dismissLabel = 'Dismiss announcement'
    this.isSticky = false
    this.hideOnScroll = false
    this.threshold = DEFAULT_THRESHOLD
    this.storageKey = ''
    this.htmlFor = ''
    this.isRetracted = false
    this.isDismissing = false
    this.hasIcon = false
    this.hasAction = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (!this.hasAttribute('role')) this.setAttribute('role', 'region')
    this.syncLabel()
    if (this.wasDismissed()) this.hidden = true
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      this.syncScrolling()
    })
    this.syncScrolling()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.stopScrolling()
    this.finishDismiss?.()
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('tone') && !TONES.includes(this.tone)) {
      this.tone = 'primary'
    }
    if (changed.has('variant') && !VARIANTS.includes(this.variant)) {
      this.variant = 'solid'
    }
    if (changed.has('label')) this.syncLabel()
    if (changed.has('storageKey') && this.wasDismissed()) this.hidden = true
    if (
      (changed.has('hideOnScroll') &&
        changed.get('hideOnScroll') !== undefined) ||
      (changed.has('isSticky') && changed.get('isSticky') !== undefined)
    ) {
      this.syncScrolling()
    }
    if (changed.has('htmlFor') && changed.get('htmlFor') !== undefined) {
      this.stopScrolling()
      this.syncScrolling()
    }
  }

  /**
   * Dismisses the banner as the close button does: fires the cancelable
   * `dismiss` event, remembers the choice under `storage-key`, folds the
   * banner away and sets `hidden`. Resolves to false if a listener kept it.
   */
  public async dismiss(): Promise<boolean> {
    if (this.hidden || this.isDismissing) return false
    const event = new CustomEvent('dismiss', {
      bubbles: true,
      composed: true,
      cancelable: true,
    })
    if (!this.dispatchEvent(event)) return false
    this.remember()
    if (this.isReduced || !this.isConnected) {
      this.hidden = true
      return true
    }
    this.isDismissing = true
    this.isRetracted = false
    await new Promise<void>((resolve) => {
      this.finishDismiss = () => {
        if (this.dismissTimer) clearTimeout(this.dismissTimer)
        this.dismissTimer = null
        this.finishDismiss = null
        resolve()
      }
      this.dismissTimer = setTimeout(
        () => this.finishDismiss?.(),
        DISMISS_FALLBACK_MS,
      )
    })
    this.isDismissing = false
    this.hidden = true
    return true
  }

  private get thresholdPx(): number {
    return Number.isFinite(this.threshold) && this.threshold >= 0
      ? this.threshold
      : DEFAULT_THRESHOLD
  }

  private get storageName(): string {
    return `${STORAGE_PREFIX}${this.storageKey}`
  }

  /** A navbar slides its banner itself, together with the bar. */
  private get isInNavbar(): boolean {
    return (
      this.slot === 'banner' && this.parentElement?.localName === 'moul-navbar'
    )
  }

  private wasDismissed(): boolean {
    if (!this.storageKey) return false
    try {
      return globalThis.localStorage?.getItem(this.storageName) === 'dismissed'
    } catch {
      // Storage blocked (private mode, sandboxed frame): show it.
      return false
    }
  }

  private remember(): void {
    if (!this.storageKey) return
    try {
      globalThis.localStorage?.setItem(this.storageName, 'dismissed')
    } catch {
      // Storage blocked or full: the banner still hides for this visit.
    }
  }

  private syncLabel(): void {
    const hasOwnName =
      (this.hasAttribute('aria-label') && !this.ownsLabel) ||
      this.hasAttribute('aria-labelledby')
    if (hasOwnName) return
    this.setAttribute('aria-label', this.label || 'Announcement')
    this.ownsLabel = true
  }

  /** Follows the scroll only while hiding on scroll can do something. */
  private syncScrolling(): void {
    const shouldFollow =
      this.isConnected &&
      this.hideOnScroll &&
      this.isSticky &&
      !this.isReduced &&
      !this.isInNavbar
    if (!shouldFollow) {
      this.stopScrolling()
      this.isRetracted = false
      return
    }
    if (this.scrolling) return
    this.scrolling = new ScrollController(this, {
      source: () => this.scrollSource(),
      trackDirection: true,
      forceFallback: true,
      property: '--_banner-scroll',
      styleTarget: () => this.scrollSink,
      onScroll: this.handleScroll,
    })
    // A controller added to a connected host is started by `addController`.
  }

  private stopScrolling(): void {
    if (!this.scrolling) return
    this.scrolling.hostDisconnected()
    this.removeController(this.scrolling)
    this.scrolling = null
  }

  private scrollSource(): Element | null {
    if (!this.htmlFor || !this.isConnected) return null
    const root = this.getRootNode() as Document | ShadowRoot
    return root.getElementById?.(this.htmlFor) ?? null
  }

  private readonly handleScroll = (state: ScrollState): void => {
    const isScrolled = state.offset > this.thresholdPx
    if (!isScrolled || state.direction === 'backward') {
      if (this.isRetracted) this.isRetracted = false
    } else if (state.direction === 'forward' && !this.isRetracted) {
      this.isRetracted = true
    }
  }

  private readonly handleClose = (): void => {
    void this.dismiss()
  }

  private readonly handleIconSlotChange = (event: Event): void => {
    this.hasIcon = hasAssigned(event.target as HTMLSlotElement)
  }

  private readonly handleActionSlotChange = (event: Event): void => {
    this.hasAction = hasAssigned(event.target as HTMLSlotElement)
  }

  private readonly handleTransitionEnd = (event: TransitionEvent): void => {
    if (event.target !== event.currentTarget) return
    if (event.propertyName === 'grid-template-rows') this.finishDismiss?.()
  }

  protected override render() {
    const baseClass = this.isDismissing ? 'base is-dismissing' : 'base'
    return html`<div
      part="base"
      class=${baseClass}
      @transitionend=${this.handleTransitionEnd}
    >
      <div class="fold">
        <div part="content" class="content">
          <div class="lead">
            <span part="icon" class="icon" ?hidden=${!this.hasIcon}>
              <slot name="icon" @slotchange=${this.handleIconSlotChange}></slot>
            </span>
            <div part="message" class="message"><slot></slot></div>
          </div>
          <div part="action" class="action" ?hidden=${!this.hasAction}>
            <slot
              name="action"
              @slotchange=${this.handleActionSlotChange}
            ></slot>
          </div>
          ${
            this.isDismissable
              ? html`<button
                part="close-button"
                class="close-button"
                type="button"
                aria-label=${this.dismissLabel || 'Dismiss announcement'}
                @click=${this.handleClose}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8"></path>
                </svg>
              </button>`
              : nothing
          }
        </div>
      </div>
    </div>`
  }
}

function hasAssigned(slot: HTMLSlotElement): boolean {
  return slot
    .assignedNodes({ flatten: true })
    .some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE ||
        Boolean(node.textContent?.trim()),
    )
}

defineElement('moul-banner', MoulBanner)

declare global {
  interface HTMLElementTagNameMap {
    'moul-banner': MoulBanner
  }
}
