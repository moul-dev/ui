import { html, LitElement, type PropertyValues } from 'lit'
import { FormInternalsController } from '../../controllers/form-internals.controller'
import { defineElement } from '../../utils/define-element'
import { SPRING_SNAPPY, subtleAnimate } from '../../utils/motion'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import { switchStyles } from './Switch.styles'

export type SwitchSize = 'sm' | 'md' | 'lg'

export class MoulSwitch extends LitElement {
  static override styles = switchStyles
  static readonly formAssociated = true

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: String, reflect: true },
    isChecked: { type: Boolean, reflect: true, attribute: 'is-checked' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    label: { type: String, reflect: true },
    size: { type: String, reflect: true },
  }

  declare name: string
  declare value: string
  declare isChecked: boolean
  declare isDisabled: boolean
  declare label: string
  declare size: SwitchSize

  public internalsController: FormInternalsController

  constructor() {
    super()
    this.name = ''
    this.value = 'on'
    this.isChecked = false
    this.isDisabled = false
    this.label = ''
    this.size = 'md'

    this.internalsController = new FormInternalsController(this)
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('tabindex', this.isDisabled ? '-1' : '0')
    this.addEventListener('click', this.handleClick)
    this.addEventListener('keydown', this.handleKeyDown)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('click', this.handleClick)
    this.removeEventListener('keydown', this.handleKeyDown)
  }

  public toggle(): void {
    if (this.isDisabled) return

    this.isChecked = !this.isChecked
    this.syncFormValue()

    const thumb = this.renderRoot?.querySelector(
      '[part="thumb"]',
    ) as HTMLElement | null
    if (thumb) {
      subtleAnimate(thumb, { scaleX: [1.08, 1] }, SPRING_SNAPPY)
    }

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: {
          isChecked: this.isChecked,
          value: this.value,
        },
        bubbles: true,
        composed: true,
      }),
    )
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    if (changedProperties.has('isChecked') || changedProperties.has('value')) {
      this.syncFormValue()
    }

    if (changedProperties.has('isDisabled')) {
      this.setAttribute('tabindex', this.isDisabled ? '-1' : '0')
      if (this.isDisabled) {
        this.setAttribute('aria-disabled', 'true')
      } else {
        this.removeAttribute('aria-disabled')
      }
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    const hasLabel = Boolean(
      this.label ||
        this.getAttribute('aria-label') ||
        this.getAttribute('aria-labelledby') ||
        this.textContent?.trim(),
    )
    warnMissingLabel(this, 'switch', hasLabel)

    this.setAttribute('role', 'switch')
    this.setAttribute('aria-checked', this.isChecked ? 'true' : 'false')
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

  private syncFormValue(): void {
    this.internalsController.setValue(this.isChecked ? this.value : null)
  }

  private handleClick = (event: MouseEvent): void => {
    event.preventDefault()
    this.toggle()
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      this.toggle()
    }
  }

  protected override render() {
    return html`
      <div part="base" ?data-disabled=${this.isDisabled}>
        <span part="track">
          <span part="thumb"></span>
        </span>
        <span part="label">
          <slot>${this.label}</slot>
        </span>
      </div>
    `
  }
}

defineElement('moul-switch', MoulSwitch)

declare global {
  interface HTMLElementTagNameMap {
    'moul-switch': MoulSwitch
  }
}
