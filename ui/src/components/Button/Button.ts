import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { PressController } from '../../controllers/press.controller'
import { defineElement } from '../../utils/define-element'
import { EASE_OUT, prefersReducedMotion } from '../../utils/motion'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import type { MoulForm } from '../Form/Form'
import '../IconMorph/IconMorph'
import { buttonStyles } from './Button.styles'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'danger-soft'

export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonType = 'button' | 'submit' | 'reset'

export type ButtonState = 'idle' | 'pending' | 'success' | 'error'

/** An animated edge: a travelling spark, a flowing rainbow, or a breathing glow. */
export type ButtonEffect = 'shimmer' | 'rainbow' | 'neon'

/** The `moul-icon-morph` name for each state; these three morph into each other. */
const STATE_ICONS = { pending: 'loader', success: 'check', error: 'error' }

// The effect ring turns by animating this angle. Shadow roots ignore
// `@property`, so it is registered once here; where registration is missing
// (or the page already did it) the ring simply stays still.
try {
  CSS.registerProperty({
    name: '--moul-button-angle',
    syntax: '<angle>',
    inherits: false,
    initialValue: '0deg',
  })
} catch {
  // Already registered, or the browser cannot register properties.
}

/**
 * A button for actions, in seven variants (primary, secondary, tertiary,
 * outline, ghost, danger, danger-soft) and three sizes, with an icon-only
 * mode. It fires `press`, and with `type="submit"` or `type="reset"` submits
 * or resets the enclosing `<form>` or `moul-form`. `state` shows how the
 * action it started is going: `pending` adds a spinning loader that morphs
 * into a check for `success` or an alert mark for `error`, which also tint
 * the button in the success or danger colours; back in `idle` the icon folds
 * away. In an icon-only button the state icon takes the content's place. The
 * `pending`, `success` and `error` slots swap in a label for their state, and
 * the width follows. `run(task)` does all of this for a promise: pending
 * while it runs, then success or error for `state-duration` milliseconds. It
 * resolves with the task's value and re-throws its error, so callers must
 * catch it. `is-pending` is the same as `state="pending"`. For landing pages,
 * `effect` animates the edge (`shimmer`, a spark that travels round it;
 * `rainbow`, a flowing border in the chart colours with a soft glow beneath;
 * `neon`, a glow that breathes), `is-pulsing` sends a soft ring outward to
 * draw the eye, and content in the `hover` slot slides in as the label slides
 * away on hover or keyboard focus.
 *
 * Keyboard and screen readers: focus goes to a native `<button>` in the shadow
 * root, so Tab reaches it and Enter or Space press it. `is-disabled` disables
 * that button (out of the tab order, `aria-disabled="true"`). While pending
 * it stays focusable but ignores presses and sets `aria-busy="true"`; in
 * `success` and `error` it presses as usual. The state icon is hidden from
 * screen readers. Entering `pending`, `success` or `error` is announced
 * politely by a live region in the shadow root, with the text of that state's
 * slot, or else `pending-label` ("Loading"), `success-label` ("Done") or
 * `error-label` ("Failed"). The name is the slotted content, or a state slot's
 * while it shows: an `aria-label` or `aria-labelledby` on the host only
 * silences the `is-icon` dev warning and is not copied to the inner button.
 * The `hover` slot is decoration and hidden from screen readers, so the name
 * stays the label; keyboard focus (`:focus-visible`) shows the swap as hover
 * does. Effects and the pulse are visual only. There is no link mode; use
 * `moul-link` for navigation.
 *
 * Reduced motion: the button scales down slightly while pressed; hover,
 * press, focus and state colours fade; the state icon grows in, morphs
 * between states and folds away; a label change animates the width; the
 * effect ring turns or breathes, the pulse ring grows outward, and the hover
 * swap slides. Under reduced motion there is no press scale and no fade, the
 * icon and the width change at once, and the loader pulses instead of
 * spinning; the `shimmer` and `rainbow` rings hold still, `neon` glows
 * steadily, there is no pulse, and the hover swap changes at once.
 *
 * @slot - The label.
 * @slot prefix - Content before the label, such as an icon.
 * @slot suffix - Content after the label.
 * @slot pending - Replaces the label while pending, such as "Saving…".
 * @slot success - Replaces the label in `success`, such as "Saved"; its text is also announced.
 * @slot error - Replaces the label in `error`, such as "Retry"; its text is also announced.
 * @slot hover - Slides in from below as the label slides away, on hover and keyboard focus, while idle. Decoration: hidden from screen readers.
 * @fires press - On activation by pointer, Enter or Space, unless disabled or pending; `detail.originalEvent` is the `click`.
 * @csspart button - The native `<button>`.
 * @csspart icon - The box around the state icon (a `moul-icon-morph`); it has no width in `idle`.
 * @csspart prefix - The `prefix` slot.
 * @csspart content - The box around the label, whose width animates when the label changes.
 * @csspart hover - The box around the `hover` slot, stacked with the label inside `content`.
 * @csspart suffix - The `suffix` slot.
 * @cssprop --button-effect-duration - One cycle of the `effect`: a turn of the ring, or a breath of the glow. Defaults to `3s`.
 * @cssprop --button-effect-color - The `shimmer` spark (defaults to the text colour) and the `neon` glow (defaults to the accent, or the danger colour on the danger variants).
 * @cssprop --button-pulse-color - The pulse ring. Defaults to the accent, or the danger colour on the danger variants.
 * @cssprop --button-pulse-duration - One pulse. Defaults to `1.5s`.
 */
export class MoulButton extends LitElement {
  static override styles = buttonStyles

  static override properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    type: { type: String, reflect: true },
    state: { type: String, reflect: true },
    stateDuration: { type: Number, attribute: 'state-duration' },
    pendingLabel: { type: String, attribute: 'pending-label' },
    successLabel: { type: String, attribute: 'success-label' },
    errorLabel: { type: String, attribute: 'error-label' },
    isIcon: { type: Boolean, reflect: true, attribute: 'is-icon' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isPending: { type: Boolean, reflect: true, attribute: 'is-pending' },
    effect: { type: String, reflect: true },
    isPulsing: { type: Boolean, reflect: true, attribute: 'is-pulsing' },
  }

  declare variant: ButtonVariant
  declare size: ButtonSize
  declare type: ButtonType
  /** Progress of the action; `is-pending` also makes it `pending`. */
  declare state: ButtonState
  /** Milliseconds `run()` keeps `success` or `error` before `idle`; `0` keeps it. */
  declare stateDuration: number
  /** Announced on `pending` when there is no `pending` slot. */
  declare pendingLabel: string
  /** Announced on `success` when there is no `success` slot. */
  declare successLabel: string
  /** Announced on `error` when there is no `error` slot. */
  declare errorLabel: string
  declare isIcon: boolean
  declare isDisabled: boolean
  declare isPending: boolean
  /**
   * An animated edge: `shimmer`, `rainbow` or `neon`. Unset (the default) or
   * any other value draws none. It holds still while disabled.
   */
  declare effect: ButtonEffect | undefined
  /** Sends a soft ring outward from the button, over and over, while it is idle and enabled. */
  declare isPulsing: boolean

  public pressController: PressController

  /** The state last rendered, and the label width just before it changed. */
  private shown?: ButtonState
  private labelWidth = 0
  private resizing?: Animation
  /** The icon is created on the first state other than `idle`, then kept. */
  private icon = ''
  private runs = 0
  private timer?: ReturnType<typeof setTimeout>
  private timedState?: ButtonState
  /** Drops the icon once it has folded away, so a hidden loader stops spinning. */
  private foldTimer?: ReturnType<typeof setTimeout>

  constructor() {
    super()
    this.variant = 'primary'
    this.size = 'md'
    this.type = 'button'
    this.state = 'idle'
    this.stateDuration = 2000
    this.pendingLabel = 'Loading'
    this.successLabel = 'Done'
    this.errorLabel = 'Failed'
    this.isIcon = false
    this.isDisabled = false
    this.isPending = false
    this.isPulsing = false

    // Press feedback is the stylesheet's :active scale; this tracks state only.
    this.pressController = new PressController(this, {
      disabled: () => this.isDisabled || this.currentState === 'pending',
    })
  }

  /** `state`, with `is-pending` and unknown values folded in. */
  private get currentState(): ButtonState {
    const { state } = this
    return this.isPending || state === 'pending'
      ? 'pending'
      : state === 'success' || state === 'error'
        ? state
        : 'idle'
  }

  /**
   * Sets `pending`, awaits `task`, then sets `success` or `error` and returns
   * to `idle` after `state-duration` milliseconds. It resolves with the
   * task's value and rejects with its error, so catch it. A later `run()` owns
   * the state, and a new run or any state change cancels the return to idle.
   */
  public async run<T>(task: () => Promise<T>): Promise<T> {
    const run = ++this.runs
    clearTimeout(this.timer)
    this.state = 'pending'
    try {
      const value = await task()
      this.settle(run, 'success')
      return value
    } catch (error) {
      this.settle(run, 'error')
      throw error
    }
  }

  private settle(run: number, state: ButtonState): void {
    if (run !== this.runs) return
    this.state = state
    if (this.stateDuration > 0) {
      this.timedState = state
      this.timer = setTimeout(() => {
        this.state = 'idle'
      }, this.stateDuration)
    }
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('click', this.handleClick)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('click', this.handleClick)
    clearTimeout(this.foldTimer)
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)
    const state = this.currentState
    if (state !== this.timedState) clearTimeout(this.timer)
    if (state === this.shown) return
    if (state !== 'idle') this.icon = STATE_ICONS[state]
    // Measured before the label changes, mid-animation if one is running.
    this.labelWidth =
      this.renderRoot.querySelector('.content')?.getBoundingClientRect()
        .width ?? 0
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    const state = this.currentState
    if (state !== this.shown) {
      if (state === 'pending') {
        this.setAttribute('aria-busy', 'true')
      } else {
        this.removeAttribute('aria-busy')
      }
      if (this.shown) this.resizeLabel()
      this.shown = state
      clearTimeout(this.foldTimer)
      if (state === 'idle' && this.icon) {
        this.foldTimer = setTimeout(() => {
          if (this.currentState === 'idle') this.icon = ''
          this.requestUpdate()
        }, 400)
      }
    }

    if (changedProperties.has('isDisabled')) {
      if (this.isDisabled) {
        this.setAttribute('aria-disabled', 'true')
      } else {
        this.removeAttribute('aria-disabled')
      }
    }

    if (this.isIcon) {
      const hasVisibleLabel = Boolean(this.textContent?.trim())
      warnMissingLabel(this, 'icon-only button', hasVisibleLabel)
    }
  }

  /** Animates the label box from its old width to the new label's, so nothing jumps. */
  private resizeLabel(): void {
    const content = this.renderRoot.querySelector<HTMLElement>('.content')
    if (!content) return
    this.resizing?.cancel()
    content.style.overflowX = ''
    if (prefersReducedMotion() || !content.animate) return
    const from = this.labelWidth
    const to = content.getBoundingClientRect().width
    if (Math.abs(to - from) < 1) return
    // Clip sideways only, so tall glyphs (Khmer) still show in full.
    content.style.overflowX = 'clip'
    const animation = content.animate(
      [{ width: `${from}px` }, { width: `${to}px` }],
      { duration: 300, easing: `cubic-bezier(${EASE_OUT})` },
    )
    animation.onfinish = () => {
      if (this.resizing === animation) content.style.overflowX = ''
    }
    this.resizing = animation
  }

  /** The text announced for `state`: its slot's text, or the label attribute. */
  private announcement(state: ButtonState): string {
    if (state === 'idle') return ''
    const text = Array.from(this.children)
      .filter((child) => child.getAttribute('slot') === state)
      .map((child) => child.textContent)
      .join(' ')
      .trim()
    return (
      text ||
      (state === 'pending'
        ? this.pendingLabel
        : state === 'success'
          ? this.successLabel
          : this.errorLabel)
    )
  }

  /**
   * The inner `<button>` turns a pointer, touch, Enter, or Space activation
   * into exactly one `click`, so `press` comes from `click` alone. Pressing on
   * `pointerup` or `keyup` as well fired it twice per activation.
   */
  private readonly handleClick = (e: MouseEvent): void => {
    if (this.isDisabled || this.currentState === 'pending') {
      e.preventDefault()
      e.stopImmediatePropagation()
      return
    }

    this.dispatchPressEvent(e)
    this.handleFormIntegration()
  }

  private dispatchPressEvent(originalEvent?: Event): void {
    this.dispatchEvent(
      new CustomEvent('press', {
        bubbles: true,
        composed: true,
        detail: { originalEvent },
      }),
    )
  }

  private handleFormIntegration(): void {
    // <moul-form> keeps its native <form> in its shadow root, out of reach of
    // closest('form'), so match the wrapper too and take whichever is nearest.
    const form = this.closest<HTMLFormElement | MoulForm>('form, moul-form')
    if (!form) return

    if (this.type === 'submit') {
      if (
        form instanceof HTMLFormElement &&
        typeof form.requestSubmit === 'function'
      ) {
        form.requestSubmit()
      } else {
        // MoulForm.submit() validates first, like a native requestSubmit().
        form.submit()
      }
    } else if (this.type === 'reset') {
      form.reset()
    }
  }

  /** Whether the `hover` slot has content; read from the children so it holds on the first render too. */
  private get hasHover(): boolean {
    return Array.from(this.children).some(
      (child) => child.getAttribute('slot') === 'hover',
    )
  }

  private readonly handleHoverSlotChange = (): void => {
    this.requestUpdate()
  }

  protected override render() {
    const state = this.currentState
    const label = html`<slot></slot>`
    return html`
      <button
        part="button"
        class=${state}
        type=${this.type}
        ?disabled=${this.isDisabled}
        aria-busy=${state === 'pending' ? 'true' : 'false'}
        aria-disabled=${this.isDisabled ? 'true' : 'false'}
      >
        <span part="icon" class="icon">
          ${
            this.icon
              ? html`<moul-icon-morph name=${this.icon} size="sm"></moul-icon-morph>`
              : nothing
          }
        </span>
        <slot name="prefix" part="prefix"></slot>
        <span part="content" class=${this.hasHover ? 'content swap' : 'content'}>
          ${
            state === 'idle'
              ? label
              : // The state's slot, falling back to the label when it is empty.
                html`<slot name=${state}>${label}</slot>`
          }
          <span part="hover" class="hover" aria-hidden="true">
            <slot name="hover" @slotchange=${this.handleHoverSlotChange}></slot>
          </span>
        </span>
        <slot name="suffix" part="suffix"></slot>
      </button>
      <span class="sr-only" role="status">${this.announcement(state)}</span>
    `
  }
}

defineElement('moul-button', MoulButton)

declare global {
  interface HTMLElementTagNameMap {
    'moul-button': MoulButton
  }
}
