import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { placeIndicator } from '../../utils/motion'
import type { MoulStep } from './Step'
import { stepperStyles } from './Stepper.styles'

export type StepperOrientation = 'horizontal' | 'vertical'

export interface StepperChangeDetail {
  /** The step about to become current. */
  current: number
  /** The step that is current now. */
  previous: number
}

/**
 * A row (or column) of numbered `moul-step` elements for multi-step flows
 * such as sign-up, checkout or setup wizards. Steps before `current` show a
 * check, the connector fills up to the current step, a halo glides to the
 * current indicator, and only the current step's panel is shown. Drive it
 * with your own buttons through `next()`, `previous()` and `goTo()`; cancel
 * its `stepchange` event to keep the user on a step that does not validate.
 *
 * Keyboard and screen readers: the steps form an ordered list
 * (`role="list"`), each step header a button, with `aria-current="step"` on
 * the current one. Only one step button is in the tab order (roving
 * tabindex): `Arrow Right` and `Arrow Left` (`Arrow Down` and `Arrow Up` when
 * `orientation="vertical"`) move focus between steps, wrapping, and `Home`
 * and `End` to the first and last; moving focus does not change the step.
 * `Enter` or `Space` goes to the focused step when that is allowed. Steps the
 * user cannot go to (disabled ones, and in `is-linear` mode every step after
 * the current one) are `aria-disabled` but still focusable. Each change of
 * step, from the keyboard, a click or code, is announced through a polite
 * live region ("Step 2 of 4: Details") and focus stays where it was. The
 * list has no accessible name; give the page a heading above it. The
 * announcement is in English.
 *
 * Reduced motion: the halo glides to the new step with a slight spring, the
 * connector fills over 400ms, and the new panel slides in from the direction
 * of travel while fading in; under reduced motion the halo jumps, the
 * connector fills and the panel changes at once.
 *
 * @slot - The `moul-step` elements.
 * @fires stepchange - Cancelable, fired before the user, `next()`, `previous()` or `goTo()` changes the step; `detail` is `{ current, previous }`. Call `preventDefault()` to stay on the step (for validation). Not fired when `current` is set from code.
 * @csspart list - The ordered list that lays out the steps.
 * @csspart highlight - The halo that glides to the current step's indicator.
 * @csspart status - The visually hidden live region.
 */
export class MoulStepper extends LitElement {
  static override styles = stepperStyles

  static override properties = {
    current: { type: Number, reflect: true },
    orientation: { type: String, reflect: true },
    isLinear: { type: Boolean, reflect: true, attribute: 'is-linear' },
  }

  /** The zero-based index of the current step. Setting it fires no event. */
  declare current: number
  declare orientation: StepperOrientation
  /** Users can go back by clicking a step, but not ahead of the current one. */
  declare isLinear: boolean

  /** The step whose button is in the tab order. */
  private focusIndex = 0
  /** Which way the last change went, for the panel slide: 1, -1 or 0. */
  private direction = 0
  private announcement = ''
  private resizeObserver: ResizeObserver | null = null
  private listWidth = -1

  constructor() {
    super()
    this.current = 0
    this.orientation = 'horizontal'
    this.isLinear = false
  }

  /** The steps this stepper owns: its `moul-step` children. */
  public get steps(): MoulStep[] {
    return Array.from(this.children).filter(
      (el): el is MoulStep => el.localName === 'moul-step',
    )
  }

  /** Goes to the next enabled step. Returns false if there is none or a listener cancelled `stepchange`. */
  public next(): boolean {
    return this.requestStep(this.findEnabled(this.current + 1, 1))
  }

  /** Goes to the previous enabled step. Returns false if there is none or a listener cancelled `stepchange`. */
  public previous(): boolean {
    return this.requestStep(this.findEnabled(this.current - 1, -1))
  }

  /**
   * Goes to the step at `index`, even ahead of the current one in linear
   * mode. Returns false for the current step, a disabled one, an index out of
   * range, or when a listener cancelled `stepchange`.
   */
  public goTo(index: number): boolean {
    return this.requestStep(index)
  }

  /** @internal Called by a step whose button was clicked or pressed. */
  public handleStepActivate(step: MoulStep): void {
    const index = this.steps.indexOf(step)
    if (index < 0) return
    this.focusIndex = index
    if (!(this.canActivate(index) && this.requestStep(index))) this.syncSteps()
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('keydown', this.handleKeyDown)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('keydown', this.handleKeyDown)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
  }

  private findEnabled(start: number, step: 1 | -1): number {
    const steps = this.steps
    for (let i = start; i >= 0 && i < steps.length; i += step) {
      if (!steps[i].isDisabled) return i
    }
    return -1
  }

  private requestStep(index: number): boolean {
    const steps = this.steps
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= steps.length ||
      index === this.current ||
      steps[index].isDisabled
    ) {
      return false
    }
    const event = new CustomEvent<StepperChangeDetail>('stepchange', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { current: index, previous: this.current },
    })
    if (!this.dispatchEvent(event)) return false
    this.current = index
    return true
  }

  /** Whether the user may go to `index` by clicking or pressing its button. */
  private canActivate(index: number): boolean {
    const step = this.steps[index]
    return (
      step !== undefined &&
      !step.isDisabled &&
      index !== this.current &&
      (!this.isLinear || index < this.current)
    )
  }

  protected override willUpdate(changedProps: PropertyValues<this>): void {
    super.willUpdate(changedProps)
    const steps = this.steps
    if (steps.length > 0) {
      const index = Math.trunc(Number(this.current)) || 0
      const clamped = Math.min(steps.length - 1, Math.max(0, index))
      if (clamped !== this.current) this.current = clamped
    }
    this.direction = 0
    if (changedProps.has('current')) {
      this.focusIndex = this.current
      const previous = changedProps.get('current')
      if (this.hasUpdated && typeof previous === 'number') {
        const label = steps[this.current]?.label
        this.announcement = `Step ${this.current + 1} of ${steps.length}${label ? `: ${label}` : ''}`
        this.direction = Math.sign(this.current - previous)
      }
    }
  }

  protected override firstUpdated(): void {
    if (typeof ResizeObserver === 'undefined') return
    // Only a change of width re-places the halo at once: a new panel changes
    // the height, and snapping then would cut the glide short.
    this.resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0
      if (width === this.listWidth) return
      this.listWidth = width
      this.placeHighlight(true)
    })
    const list = this.listEl
    if (list) this.resizeObserver.observe(list)
  }

  protected override updated(changedProps: PropertyValues<this>): void {
    super.updated(changedProps)
    this.syncSteps()
    this.placeHighlight(changedProps.has('orientation'))
  }

  private get listEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[part~="list"]') ?? null
  }

  private syncSteps(): void {
    const steps = this.steps
    const isVertical = this.orientation === 'vertical'
    if (this.focusIndex >= steps.length) this.focusIndex = this.current
    steps.forEach((step, i) => {
      const status =
        i < this.current
          ? 'complete'
          : i === this.current
            ? 'current'
            : 'upcoming'
      if (status === 'current' && step.status !== 'current') {
        step.enterFrom = this.direction
      }
      step.index = i
      step.isLast = i === steps.length - 1
      step.orientation = isVertical ? 'vertical' : 'horizontal'
      step.status = status
      step.isReachable = this.canActivate(i)
      step.isFocusTarget = i === this.focusIndex
    })
  }

  private placeHighlight(instant: boolean): void {
    const highlight = this.shadowRoot?.querySelector<HTMLElement>(
      '[part~="highlight"]',
    )
    const list = this.listEl
    if (!highlight || !list) return
    const steps = this.steps
    const step = steps[this.current]
    // Wait for every step's render: showing one panel and hiding another moves
    // the indicators in a vertical stepper.
    Promise.all(steps.map((s) => s.updateComplete)).then(() => {
      placeIndicator(highlight, list, step?.indicatorEl ?? null, instant)
      highlight.toggleAttribute('data-invalid', step?.isInvalid ?? false)
    })
  }

  private readonly handleSlotChange = (): void => {
    this.requestUpdate()
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    const isVertical = this.orientation === 'vertical'
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight'
    const previousKey = isVertical ? 'ArrowUp' : 'ArrowLeft'
    if (![nextKey, previousKey, 'Home', 'End'].includes(e.key)) return
    const steps = this.steps
    const origin = e.composedPath()[0]
    const from = steps.findIndex((step) => step.triggerEl === origin)
    if (from < 0) return

    const last = steps.length - 1
    const to =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? last
          : e.key === nextKey
            ? from >= last
              ? 0
              : from + 1
            : from <= 0
              ? last
              : from - 1
    e.preventDefault()
    this.focusIndex = to
    this.syncSteps()
    steps[to].focus()
  }

  protected override render() {
    const count = this.steps.length
    const columns =
      count > 1 ? `repeat(${count - 1}, minmax(0, 1fr)) auto` : 'auto'
    return html`
      <ol
        part="list"
        role="list"
        style=${this.orientation === 'vertical' ? '' : `grid-template-columns: ${columns}`}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
        <div part="highlight" aria-hidden="true"></div>
      </ol>
      <div part="status" class="sr-only" role="status">${this.announcement}</div>
    `
  }
}

defineElement('moul-stepper', MoulStepper)

declare global {
  interface HTMLElementTagNameMap {
    'moul-stepper': MoulStepper
  }
}
