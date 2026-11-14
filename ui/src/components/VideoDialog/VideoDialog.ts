import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { getDeepActiveElement, restoreFocus } from '../../utils/focus-trap'
import { prefersReducedMotion } from '../../utils/motion'
import { videoDialogStyles } from './VideoDialog.styles'

/** How the video panel arrives: out of the thumbnail, a fade, or a rise from below. */
export type VideoDialogAnimation = 'expand' | 'fade' | 'slide-up'

/** `video` plays `src` in a `<video>`, `embed` in an `<iframe>`; empty decides by the file extension. */
export type VideoDialogType = '' | 'video' | 'embed'

const ANIMATIONS: readonly VideoDialogAnimation[] = [
  'expand',
  'fade',
  'slide-up',
]
const TYPES: readonly VideoDialogType[] = ['', 'video', 'embed']

/** File extensions that play in a `<video>` rather than an embedded player. */
const VIDEO_FILE = /\.(?:mp4|m4v|webm|ogg|ogv|mov)$/i

const ENTER_MS = 420
const EXIT_MS = 280
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'
const EASE_IN = 'cubic-bezier(0.4, 0, 0.8, 0.6)'

/**
 * Resolves `src` against the page and keeps it only if it is a web address,
 * so a `javascript:` or `data:` URL never reaches the player.
 */
function safeMediaUrl(src: string): URL | null {
  const value = src.trim()
  if (!value) return null
  try {
    const base = typeof document === 'undefined' ? undefined : document.baseURI
    const url = new URL(value, base)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url
  } catch {
    // Not a URL at all.
  }
  console.warn(
    `[@moul-dev/web-component] <moul-video-dialog> ignored src "${value}": only http and https URLs are played.`,
  )
  return null
}

/**
 * A video thumbnail with a play button that opens the video in a dialog, as
 * in a product hero's "watch the tour". Put an image in `slot="thumbnail"`
 * and set `src` to an embed URL (a YouTube or Vimeo player, which plays in
 * an `<iframe>`) or a video file (`.mp4`, `.webm`, `.ogg`, `.mov`, which
 * plays in a `<video>` with its controls; `type="video"` or `type="embed"`
 * decides when the extension cannot). The player is created when the dialog
 * opens and removed when it closes, so nothing loads until the reader asks
 * and closing stops the sound. `animation` sets how the panel arrives:
 * `expand` (default) grows it out of the thumbnail and shrinks it back,
 * `fade` and `slide-up` are quieter. Toggle `is-open` to open it from
 * script. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: the thumbnail is one native `<button>` named
 * by `label` (default "Play video"), with `aria-haspopup="dialog"`; the
 * thumbnail image is not read separately. It opens a native modal
 * `<dialog>` with the same name, so the page behind is inert. Focus moves to
 * the close button, named by `close-label`, and `Tab` reaches the player's
 * own controls. `Escape`, the close button and a click on the backdrop all
 * close it, and focus returns to the thumbnail button. The `<iframe>` is
 * titled with `label`.
 *
 * Reduced motion: the panel and backdrop appear and disappear at once, the
 * ring round the play button does not pulse, and the thumbnail does not
 * grow under the pointer.
 *
 * @slot thumbnail - The poster image, usually an `<img alt="">`; it sets the button's size.
 *
 * @fires openchange - When the reader opens or closes the dialog. `detail.isOpen` is the new state. Setting `isOpen` from script does not fire it.
 *
 * @csspart trigger - The button around the thumbnail.
 * @csspart thumbnail - The box that holds the thumbnail slot.
 * @csspart play-icon - The play button drawn over the thumbnail, with its pulsing ring.
 * @csspart dialog - The native `<dialog>`, the full-screen layer over the backdrop.
 * @csspart panel - The video's frame inside the dialog.
 * @csspart iframe - The embedded player, while open.
 * @csspart video - The `<video>` player, while open.
 * @csspart close-button - The button that closes the dialog.
 *
 * @cssprop --video-dialog-width - The largest width of the video panel. Defaults to `64rem`; it also stays within the viewport.
 * @cssprop --video-dialog-aspect-ratio - The panel's aspect ratio. Defaults to `16 / 9`.
 * @cssprop --video-dialog-radius - The corner radius of the thumbnail and the panel. Defaults to `var(--radius-2xl)`.
 * @cssprop --video-dialog-play-size - The diameter of the play button. Defaults to `4.5rem`.
 */
export class MoulVideoDialog extends LitElement {
  static override styles = videoDialogStyles

  static override properties = {
    src: { type: String },
    type: { type: String },
    label: { type: String },
    closeLabel: { type: String, attribute: 'close-label' },
    animation: { type: String, reflect: true },
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    isMounted: { state: true },
  }

  /** The video: an embed URL or a video file. Only `http:` and `https:` addresses (or relative ones) play. */
  declare src: string
  /** `video` or `embed` to choose the player; empty (default) decides by the file extension. */
  declare type: VideoDialogType
  /** The name of the thumbnail button, the dialog and the player. Defaults to `Play video`. */
  declare label: string
  /** The name of the close button. Defaults to `Close video`. */
  declare closeLabel: string
  /** How the panel arrives and leaves. Defaults to `expand`; an unknown value falls back to it. */
  declare animation: VideoDialogAnimation
  /** Whether the dialog is open. */
  declare isOpen: boolean
  /** Whether the player is in the dialog: from the start of opening to the end of closing. */
  private declare isMounted: boolean

  /** Whether the dialog is shown or on its way, as opposed to `isOpen`, the asked-for state. */
  private isShown = false
  /** Bumped by every open and close, so a slower one that was overtaken stops. */
  private transition = 0
  private panelAnimation: Animation | null = null
  private returnFocusTo: HTMLElement | null = null

  constructor() {
    super()
    this.src = ''
    this.type = ''
    this.label = 'Play video'
    this.closeLabel = 'Close video'
    this.animation = 'expand'
    this.isOpen = false
    this.isMounted = false
  }

  private get dialogEl(): HTMLDialogElement | null {
    return this.shadowRoot?.querySelector('dialog') ?? null
  }

  private get panelEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector<HTMLElement>('[part="panel"]') ?? null
  }

  private get triggerEl(): HTMLButtonElement | null {
    return (
      this.shadowRoot?.querySelector<HTMLButtonElement>('[part="trigger"]') ??
      null
    )
  }

  private get closeEl(): HTMLButtonElement | null {
    return (
      this.shadowRoot?.querySelector<HTMLButtonElement>(
        '[part="close-button"]',
      ) ?? null
    )
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.transition++
    this.panelAnimation?.cancel()
    this.panelAnimation = null
    if (this.dialogEl?.open) this.dialogEl.close()
    this.isShown = false
    this.isMounted = false
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('animation') && !ANIMATIONS.includes(this.animation)) {
      this.animation = 'expand'
    }
    if (changed.has('type') && !TYPES.includes(this.type)) {
      this.type = ''
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('isOpen') && this.isOpen !== this.isShown) {
      if (this.isOpen) void this.show()
      else void this.hide()
    }
  }

  /**
   * Opens or closes the dialog as the reader would, firing `openchange`.
   * Resolves once the panel has finished arriving or leaving.
   */
  public async setOpen(next: boolean): Promise<void> {
    if (this.isOpen === next && this.isShown === next) return
    this.isOpen = next
    this.dispatchEvent(
      new CustomEvent('openchange', {
        detail: { isOpen: next },
        bubbles: true,
        composed: true,
      }),
    )
    await (next ? this.show() : this.hide())
  }

  private async show(): Promise<void> {
    if (this.isShown) return
    this.isShown = true
    const token = ++this.transition
    if (!this.returnFocusTo) {
      // Safari does not focus a clicked button, so the body may hold focus.
      const active = getDeepActiveElement()
      this.returnFocusTo =
        active && active !== document.body ? active : this.triggerEl
    }
    this.isMounted = true
    await this.updateComplete
    if (token !== this.transition) return

    const dialog = this.dialogEl
    if (!dialog) return
    this.panelAnimation?.cancel()
    dialog.removeAttribute('data-closing')
    try {
      if (!dialog.open) dialog.showModal()
    } catch (error) {
      console.warn(
        '[@moul-dev/web-component] <moul-video-dialog> could not open its dialog:',
        error,
      )
      return
    }
    this.closeEl?.focus()
    await this.play(this.enterKeyframes(), {
      duration: ENTER_MS,
      easing: EASE_OUT,
    })
  }

  private async hide(): Promise<void> {
    if (!this.isShown) return
    this.isShown = false
    const token = ++this.transition
    const dialog = this.dialogEl
    if (dialog?.open) {
      dialog.setAttribute('data-closing', '')
      await this.play(this.exitKeyframes(), {
        duration: EXIT_MS,
        easing: this.animation === 'expand' ? EASE_OUT : EASE_IN,
        fill: 'forwards',
      })
      if (token !== this.transition) return
      dialog.close()
      dialog.removeAttribute('data-closing')
    }
    this.panelAnimation?.cancel()
    this.panelAnimation = null
    this.isMounted = false
    const target = this.returnFocusTo?.isConnected
      ? this.returnFocusTo
      : this.triggerEl
    this.returnFocusTo = null
    restoreFocus(target)
  }

  /** Runs one panel animation, or nothing under reduced motion or without the Web Animations API. */
  private async play(
    keyframes: Keyframe[] | null,
    options: KeyframeAnimationOptions,
  ): Promise<void> {
    const panel = this.panelEl
    if (
      !keyframes ||
      !panel ||
      prefersReducedMotion() ||
      typeof panel.animate !== 'function'
    ) {
      return
    }
    this.panelAnimation?.cancel()
    const animation = panel.animate(keyframes, options)
    this.panelAnimation = animation
    try {
      await animation.finished
    } catch {
      // Cancelled by the next open or close.
    }
  }

  /** The panel's first pose: in the thumbnail's box for `expand`, nearly in place otherwise. */
  private enterKeyframes(): Keyframe[] {
    const from = this.thumbnailPose()
    if (from) {
      return [
        { transform: from, opacity: 0 },
        { opacity: 1, offset: 0.3 },
        { transform: 'none', opacity: 1 },
      ]
    }
    return this.animation === 'slide-up'
      ? [
          { transform: 'translateY(3rem)', opacity: 0 },
          { transform: 'none', opacity: 1 },
        ]
      : [
          { transform: 'scale(0.96)', opacity: 0 },
          { transform: 'none', opacity: 1 },
        ]
  }

  private exitKeyframes(): Keyframe[] {
    const to = this.thumbnailPose()
    if (to) {
      return [
        { transform: 'none', opacity: 1 },
        { opacity: 1, offset: 0.7 },
        { transform: to, opacity: 0 },
      ]
    }
    return this.animation === 'slide-up'
      ? [
          { transform: 'none', opacity: 1 },
          { transform: 'translateY(3rem)', opacity: 0 },
        ]
      : [
          { transform: 'none', opacity: 1 },
          { transform: 'scale(0.96)', opacity: 0 },
        ]
  }

  /**
   * The transform that lays the panel over the thumbnail, for `expand`, or
   * null when either box has no size (the thumbnail scrolled away, or no
   * layout yet) and a plain fade is the honest motion.
   */
  private thumbnailPose(): string | null {
    if (this.animation !== 'expand') return null
    const trigger = this.triggerEl
    const panel = this.panelEl
    if (!trigger || !panel) return null
    const from = trigger.getBoundingClientRect()
    const to = panel.getBoundingClientRect()
    if (!from.width || !from.height || !to.width || !to.height) return null
    const dx = from.left + from.width / 2 - (to.left + to.width / 2)
    const dy = from.top + from.height / 2 - (to.top + to.height / 2)
    const sx = from.width / to.width
    const sy = from.height / to.height
    return `translate(${round(dx)}px, ${round(dy)}px) scale(${round(sx, 4)}, ${round(sy, 4)})`
  }

  private readonly handleTriggerClick = (): void => {
    this.returnFocusTo = this.triggerEl
    void this.setOpen(true)
  }

  private readonly handleCloseClick = (): void => {
    void this.setOpen(false)
  }

  private readonly handleDialogKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    void this.setOpen(false)
  }

  /** The browser's own Escape path; it would close the dialog without the exit. */
  private readonly handleCancel = (event: Event): void => {
    event.preventDefault()
    void this.setOpen(false)
  }

  /** Closed some other way (a second Escape the browser insisted on): catch up. */
  private readonly handleNativeClose = (): void => {
    if (this.isShown) void this.setOpen(false)
  }

  /** The dialog fills the viewport; a click that lands on it, not on the panel, is on the backdrop. */
  private readonly handleDialogClick = (event: MouseEvent): void => {
    if (event.target === this.dialogEl) void this.setOpen(false)
  }

  private renderMedia() {
    const url = safeMediaUrl(this.src)
    if (!url) return nothing
    const name = this.label || 'Play video'
    const isFile =
      this.type === 'video' ||
      (this.type !== 'embed' && VIDEO_FILE.test(url.pathname))
    if (isFile) {
      return html`<video
        part="video"
        src=${url.href}
        aria-label=${name}
        controls
        autoplay
        playsinline
      ></video>`
    }
    return html`<iframe
      part="iframe"
      src=${url.href}
      title=${name}
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>`
  }

  protected override render() {
    const name = this.label || 'Play video'
    return html`
      <button
        part="trigger"
        class="trigger"
        type="button"
        aria-label=${name}
        aria-haspopup="dialog"
        @click=${this.handleTriggerClick}
      >
        <span part="thumbnail" class="thumbnail"><slot name="thumbnail"></slot></span>
        <span part="play-icon" class="play" aria-hidden="true">
          <span class="play-disc">
            <svg viewBox="0 0 24 24" width="24" height="24" focusable="false">
              <path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z" fill="currentColor" />
            </svg>
          </span>
        </span>
      </button>
      <dialog
        part="dialog"
        aria-label=${name}
        @keydown=${this.handleDialogKeyDown}
        @cancel=${this.handleCancel}
        @close=${this.handleNativeClose}
        @click=${this.handleDialogClick}
      >
        <div part="panel" class="panel">
          ${this.isMounted ? this.renderMedia() : nothing}
        </div>
        <button
          part="close-button"
          class="close"
          type="button"
          aria-label=${this.closeLabel || 'Close video'}
          @click=${this.handleCloseClick}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </dialog>
    `
  }
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

defineElement('moul-video-dialog', MoulVideoDialog)

declare global {
  interface HTMLElementTagNameMap {
    'moul-video-dialog': MoulVideoDialog
  }
}
