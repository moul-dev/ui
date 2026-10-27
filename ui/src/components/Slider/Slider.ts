import { html, LitElement, type PropertyValues } from 'lit'
import { FormInternalsController } from '../../controllers/form-internals.controller'
import { defineElement } from '../../utils/define-element'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import { sliderStyles } from './Slider.styles'

export class MoulSlider extends LitElement {
  static override styles = sliderStyles
  static readonly formAssociated = true

  static override properties = {
    name: { type: String, reflect: true },
    min: { type: Number, reflect: true },
    max: { type: Number, reflect: true },
    step: { type: Number, reflect: true },
    value: { type: Number, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    label: { type: String, reflect: true },
    showOutput: { type: Boolean, reflect: true, attribute: 'show-output' },
  }

  declare name: string
  declare min: number
  declare max: number
  declare step: number
  declare value: number
  declare isDisabled: boolean
  declare label: string
  declare showOutput: boolean

  public internalsController: FormInternalsController
  private isDragging = false

  constructor() {
    super()
    this.name = ''
    this.min = 0
    this.max = 100
    this.step = 1
    this.value = 0
    this.isDisabled = false
    this.label = ''
    this.showOutput = true

    this.internalsController = new FormInternalsController(this)
  }

  public get thumbElement(): HTMLElement | null {
    return this.renderRoot?.querySelector('[part="thumb"]') ?? null
  }

  public get trackElement(): HTMLElement | null {
    return this.renderRoot?.querySelector('[part="track"]') ?? null
  }

  public override focus(options?: FocusOptions): void {
    this.thumbElement?.focus(options)
  }

  public override blur(): void {
    this.thumbElement?.blur()
  }

  public checkValidity(): boolean {
    return this.internalsController.checkValidity()
  }

  public reportValidity(): boolean {
    return this.internalsController.reportValidity()
  }

  public get validity(): ValidityState | null {
    return this.internalsController.validity
  }

  public get validationMessage(): string {
    return this.internalsController.validationMessage
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (
      changedProperties.has('value') ||
      changedProperties.has('min') ||
      changedProperties.has('max')
    ) {
      this.value = this.clampAndSnap(this.value)
      this.internalsController.setValue(String(this.value))
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    const hasLabel = Boolean(
      this.label ||
        this.getAttribute('aria-label') ||
        this.getAttribute('aria-labelledby') ||
        this.querySelector('[slot="label"]'),
    )
    warnMissingLabel(this, 'slider', hasLabel)
  }

  public reset(): void {
    const defaultVal = (this as any).defaultValue
    this.value =
      typeof defaultVal === 'number'
        ? defaultVal
        : typeof this.min === 'number'
          ? this.min
          : 0
    this.internalsController.setValue(String(this.value))
    this.requestUpdate()
  }

  private clampAndSnap(val: number): number {
    const min = typeof this.min === 'number' ? this.min : 0
    const max = typeof this.max === 'number' ? this.max : 100
    const step = typeof this.step === 'number' && this.step > 0 ? this.step : 1

    const clamped = Math.min(Math.max(val, min), max)
    const steps = Math.round((clamped - min) / step)
    const snapped = Math.min(Math.max(min + steps * step, min), max)
    return Number(snapped.toFixed(6))
  }

  private setValueFromPosition(clientX: number): void {
    const track = this.trackElement
    if (!track) return

    const rect = track.getBoundingClientRect()
    const width = rect.width
    if (width <= 0) return

    const offset = Math.min(Math.max(clientX - rect.left, 0), width)
    const percentage = offset / width
    const rawVal = this.min + percentage * (this.max - this.min)
    const nextVal = this.clampAndSnap(rawVal)

    if (this.value !== nextVal) {
      this.value = nextVal
      this.internalsController.setValue(String(this.value))

      this.dispatchEvent(
        new CustomEvent('input', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      )
    }
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (this.isDisabled) return
    this.isDragging = true
    const target = event.currentTarget as HTMLElement
    target.setPointerCapture?.(event.pointerId)

    this.setValueFromPosition(event.clientX)
    this.focus()
  }

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.isDragging || this.isDisabled) return
    this.setValueFromPosition(event.clientX)
  }

  private handlePointerUp = (event: PointerEvent): void => {
    if (!this.isDragging) return
    this.isDragging = false
    const target = event.currentTarget as HTMLElement
    try {
      target.releasePointerCapture?.(event.pointerId)
    } catch {
      // ignore
    }

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.isDisabled) return

    let nextVal = this.value
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      nextVal = this.clampAndSnap(this.value + (this.step || 1))
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      nextVal = this.clampAndSnap(this.value - (this.step || 1))
    } else if (event.key === 'Home') {
      event.preventDefault()
      nextVal = this.min
    } else if (event.key === 'End') {
      event.preventDefault()
      nextVal = this.max
    } else {
      return
    }

    if (this.value !== nextVal) {
      this.value = nextVal
      this.internalsController.setValue(String(this.value))

      this.dispatchEvent(
        new CustomEvent('input', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      )
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      )
    }
  }

  protected override render() {
    const range = this.max - this.min || 1
    const percentage = Math.max(
      0,
      Math.min(100, ((this.value - this.min) / range) * 100),
    )

    return html`
      <div part="base">
        <div part="header">
          <label part="label">
            <slot name="label">${this.label}</slot>
          </label>
          ${
            this.showOutput
              ? html`<output part="output" aria-live="off">${this.value}</output>`
              : ''
          }
        </div>

        <div
          part="track-container"
          @pointerdown=${this.handlePointerDown}
          @pointermove=${this.handlePointerMove}
          @pointerup=${this.handlePointerUp}
          @pointercancel=${this.handlePointerUp}
        >
          <div part="track">
            <div part="fill" style="width: ${percentage}%"></div>
            <div
              part="thumb"
              role="slider"
              tabindex=${this.isDisabled ? '-1' : '0'}
              style="left: ${percentage}%"
              aria-valuemin=${this.min}
              aria-valuemax=${this.max}
              aria-valuenow=${this.value}
              aria-label=${this.label || 'Slider'}
              @keydown=${this.handleKeyDown}
            ></div>
          </div>
        </div>
      </div>
    `
  }
}

defineElement('moul-slider', MoulSlider)

declare global {
  interface HTMLElementTagNameMap {
    'moul-slider': MoulSlider
  }
}
