import { html, LitElement, nothing, type PropertyValues } from 'lit'
import type { AnimationPlaybackControls } from 'motion'
import { defineElement } from '../../utils/define-element'
import {
  EASE_OUT,
  prefersReducedMotion,
  subtleAnimate,
} from '../../utils/motion'
import { stepAlert, stepCheck } from './icons'
import type { MoulStepper, StepperOrientation } from './Stepper'
import { stepStyles } from './Stepper.styles'

export type StepStatus = 'complete' | 'current' | 'upcoming'

/**
 * One step of a `moul-stepper`: a header button (indicator, `label` and
 * `description`) and a panel, the default slot, that shows while the step is
 * current. The stepper works out its state; set `is-invalid` to flag a step
 * with errors and `is-disabled` to take it out of reach.
 *
 * Keyboard and screen readers: the host has `role="listitem"`. The header is
 * a native `<button>` named by `label` (plus ", completed" or ", has an
 * error" when that applies) and described by `description`; the current step
 * has `aria-current="step"` and steps the user cannot go to are
 * `aria-disabled`. Only one step button is in the tab order; the parent
 * `moul-stepper` handles the arrow keys, `Home` and `End`, and `Enter` or
 * `Space` go to the focused step when allowed. The panel is a `role="group"`
 * named by the label, and `hidden` while the step is not current.
 *
 * Reduced motion: a panel that becomes current slides in from the direction
 * of travel (24px sideways, or 8px vertically in a vertical stepper) while
 * fading in, the connector after a completed step fills over 400ms, and the
 * indicator colours fade; under reduced motion all of it happens at once.
 *
 * @slot - The step's panel content.
 * @slot icon - A custom indicator; replaces the number, check and alert mark.
 * @csspart item - The header row: trigger and connector.
 * @csspart trigger - The step button.
 * @csspart indicator - The circle with the number, check, alert mark or icon.
 * @csspart label - The label text.
 * @csspart description - The description text.
 * @csspart connector - The track to the next step (absent on the last step).
 * @csspart connector-fill - The accent fill inside the connector.
 * @csspart panel - The panel wrapper around the default slot.
 */
export class MoulStep extends LitElement {
  static override styles = stepStyles

  static override properties = {
    label: { type: String },
    description: { type: String },
    isInvalid: { type: Boolean, reflect: true, attribute: 'is-invalid' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    index: { attribute: false },
    status: { attribute: false },
    orientation: { attribute: false },
    isLast: { attribute: false },
    isReachable: { attribute: false },
    isFocusTarget: { attribute: false },
  }

  declare label: string
  declare description: string
  /** Marks the step as having errors: an alert mark and error colours. */
  declare isInvalid: boolean
  /** Makes the step unreachable by clicking, the keyboard, `next()`, `previous()` and `goTo()`. */
  declare isDisabled: boolean
  /** @internal Set by the stepper. */
  declare index: number
  /** @internal Set by the stepper; mirrored to `data-status`. */
  declare status: StepStatus
  /** @internal Set by the stepper; mirrored to `data-orientation`. */
  declare orientation: StepperOrientation
  /** @internal Set by the stepper. */
  declare isLast: boolean
  /** @internal Set by the stepper: whether the user may go here now. */
  declare isReachable: boolean
  /** @internal Set by the stepper: whether this button is the one in the tab order. */
  declare isFocusTarget: boolean

  /** @internal Set by the stepper: 1 or -1 to slide the panel in on the next change to current. */
  public enterFrom = 0

  private slide: AnimationPlaybackControls | null = null

  constructor() {
    super()
    this.label = ''
    this.description = ''
    this.isInvalid = false
    this.isDisabled = false
    this.index = 0
    this.status = 'upcoming'
    this.orientation = 'horizontal'
    this.isLast = false
    this.isReachable = false
    this.isFocusTarget = false
  }

  /** @internal The step button, for the stepper's arrow keys. */
  public get triggerEl(): HTMLButtonElement | null {
    return this.shadowRoot?.querySelector('[part~="trigger"]') ?? null
  }

  /** @internal The indicator circle the stepper's highlight glides to. */
  public get indicatorEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[part~="indicator"]') ?? null
  }

  private get stepper(): MoulStepper | null {
    const parent = this.parentElement
    return parent?.localName === 'moul-stepper' ? (parent as MoulStepper) : null
  }

  /** Moves focus to the step button. */
  public override focus(options?: FocusOptions): void {
    const trigger = this.triggerEl
    if (trigger) trigger.focus(options)
    else super.focus(options)
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'listitem')
  }

  protected override willUpdate(changedProps: PropertyValues<this>): void {
    super.willUpdate(changedProps)
    if (changedProps.has('status')) this.dataset.status = this.status
    if (changedProps.has('orientation')) {
      this.dataset.orientation = this.orientation
    }
  }

  protected override updated(changedProps: PropertyValues<this>): void {
    super.updated(changedProps)
    // The stepper reads these, so it re-syncs when one changes after the first render.
    const isStepperInput = (['label', 'isInvalid', 'isDisabled'] as const).some(
      (key) => changedProps.get(key) !== undefined,
    )
    if (isStepperInput) this.stepper?.requestUpdate()

    if (!changedProps.has('status')) return
    this.endSlide()
    if (this.status === 'current') {
      const direction = this.enterFrom
      this.enterFrom = 0
      if (direction !== 0) this.slideIn(direction)
    }
  }

  private get panelEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[part~="panel"]') ?? null
  }

  /** Stops a slide that is still running and leaves the panel at rest. */
  private endSlide(): void {
    if (!this.slide) return
    this.slide.stop()
    this.slide = null
    this.removeAttribute('data-entering')
    this.panelEl?.style.removeProperty('opacity')
    this.panelEl?.style.removeProperty('transform')
  }

  private slideIn(direction: number): void {
    const panel = this.panelEl
    if (!panel || prefersReducedMotion()) return
    const isVertical = this.orientation === 'vertical'
    const isRtl =
      typeof getComputedStyle === 'function' &&
      getComputedStyle(this).direction === 'rtl'
    const distance =
      (isVertical ? 8 : 24) * direction * (isRtl && !isVertical ? -1 : 1)
    const axis = isVertical ? 'Y' : 'X'
    // Clipped while it slides, so the offset never adds a page scrollbar.
    this.setAttribute('data-entering', '')
    const slide = subtleAnimate(
      panel,
      {
        opacity: [0, 1],
        transform: [`translate${axis}(${distance}px)`, `translate${axis}(0px)`],
      },
      { duration: 0.28, ease: EASE_OUT },
    )
    this.slide = slide
    slide.finished?.then(() => {
      if (this.slide !== slide) return
      this.slide = null
      this.removeAttribute('data-entering')
    })
  }

  private readonly handleClick = (): void => {
    this.stepper?.handleStepActivate(this)
  }

  private renderMark() {
    if (this.isInvalid) return stepAlert()
    if (this.status === 'complete') return stepCheck()
    return html`<span aria-hidden="true">${this.index + 1}</span>`
  }

  protected override render() {
    const isCurrent = this.status === 'current'
    const state = this.isInvalid
      ? ', has an error'
      : this.status === 'complete'
        ? ', completed'
        : ''
    return html`
      <div part="item" class="item" style="grid-column: ${this.index + 1}">
        <button
          part="trigger"
          type="button"
          tabindex=${this.isFocusTarget ? '0' : '-1'}
          aria-labelledby="label state"
          aria-describedby=${this.description ? 'description' : nothing}
          aria-current=${isCurrent ? 'step' : nothing}
          aria-disabled=${this.isReachable || isCurrent ? nothing : 'true'}
          @click=${this.handleClick}
        >
          <span part="indicator" aria-hidden="true">
            <slot name="icon">${this.renderMark()}</slot>
          </span>
          <span class="text">
            <span part="label" id="label">${this.label}</span>
            <span id="state" class="sr-only">${state}</span>
            ${
              this.description
                ? html`<span part="description" id="description">${this.description}</span>`
                : nothing
            }
          </span>
        </button>
        ${
          this.isLast
            ? nothing
            : html`<span part="connector" aria-hidden="true">
                <span part="connector-fill"></span>
              </span>`
        }
      </div>
      <div
        part="panel"
        role="group"
        aria-labelledby="label"
        ?hidden=${!isCurrent}
      >
        <slot></slot>
      </div>
    `
  }
}

defineElement('moul-step', MoulStep)

declare global {
  interface HTMLElementTagNameMap {
    'moul-step': MoulStep
  }
}
