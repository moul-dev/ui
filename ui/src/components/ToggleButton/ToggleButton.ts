import { html, LitElement, type PropertyValues } from 'lit'
import { PressController } from '../../controllers/press.controller'
import { defineElement } from '../../utils/define-element'
import { toggleButtonStyles } from './ToggleButton.styles'

export type ToggleButtonSize = 'sm' | 'md' | 'lg'

export class MoulToggleButton extends LitElement {
  static override styles = toggleButtonStyles

  static override properties = {
    value: { type: String, reflect: true },
    isSelected: { type: Boolean, reflect: true, attribute: 'is-selected' },
    size: { type: String, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
  }

  declare value: string
  declare isSelected: boolean
  declare size: ToggleButtonSize
  declare isDisabled: boolean

  public pressController: PressController
  private toggleHandledInCycle = false

  constructor() {
    super()
    this.value = ''
    this.isSelected = false
    this.size = 'md'
    this.isDisabled = false

    // Press feedback is the stylesheet's :active scale; this tracks state only.
    this.pressController = new PressController(this, {
      disabled: () => this.isDisabled,
    })
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('aria-pressed', this.isSelected ? 'true' : 'false')
    this.addEventListener('pointerdown', this.handlePointerDown)
    this.addEventListener('pointerup', this.handlePointerUp)
    this.addEventListener('click', this.handleClick)
    this.addEventListener('keydown', this.handleKeyDown)
    this.addEventListener('keyup', this.handleKeyUp)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('pointerdown', this.handlePointerDown)
    this.removeEventListener('pointerup', this.handlePointerUp)
    this.removeEventListener('click', this.handleClick)
    this.removeEventListener('keydown', this.handleKeyDown)
    this.removeEventListener('keyup', this.handleKeyUp)
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    if (changedProperties.has('isSelected')) {
      this.setAttribute('aria-pressed', this.isSelected ? 'true' : 'false')
    }

    if (changedProperties.has('isDisabled')) {
      if (this.isDisabled) {
        this.setAttribute('aria-disabled', 'true')
      } else {
        this.removeAttribute('aria-disabled')
      }
    }
  }

  private readonly handlePointerDown = (e: PointerEvent): void => {
    if (this.isDisabled || e.button !== 0) return
    this.toggleHandledInCycle = false
  }

  private readonly handlePointerUp = (e: PointerEvent): void => {
    if (this.isDisabled || e.button !== 0) return
    this.toggle()
    this.toggleHandledInCycle = true
    queueMicrotask(() => {
      this.toggleHandledInCycle = false
    })
  }

  private readonly handleClick = (e: MouseEvent): void => {
    if (this.isDisabled) {
      e.preventDefault()
      e.stopImmediatePropagation()
      return
    }

    if (!this.toggleHandledInCycle) {
      this.toggle()
    }
    this.toggleHandledInCycle = false
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (this.isDisabled || e.repeat) return
    if (e.key === ' ' || e.key === 'Enter') {
      this.toggleHandledInCycle = false
    }
  }

  private readonly handleKeyUp = (e: KeyboardEvent): void => {
    if (this.isDisabled) return
    if (e.key === ' ' || e.key === 'Enter') {
      this.toggle()
      this.toggleHandledInCycle = true
      queueMicrotask(() => {
        this.toggleHandledInCycle = false
      })
    }
  }

  public toggle(): void {
    if (this.isDisabled) return

    this.isSelected = !this.isSelected
    this.setAttribute('aria-pressed', this.isSelected ? 'true' : 'false')

    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { isSelected: this.isSelected, value: this.value },
      }),
    )

    this.dispatchEvent(
      new CustomEvent('press', {
        bubbles: true,
        composed: true,
        detail: { isSelected: this.isSelected },
      }),
    )
  }

  protected override render() {
    return html`
      <button
        part="button"
        type="button"
        role="button"
        ?disabled=${this.isDisabled}
        aria-pressed=${this.isSelected ? 'true' : 'false'}
        aria-disabled=${this.isDisabled ? 'true' : 'false'}
      >
        <span part="content" class="content"><slot></slot></span>
      </button>
    `
  }
}

defineElement('moul-toggle-button', MoulToggleButton)

declare global {
  interface HTMLElementTagNameMap {
    'moul-toggle-button': MoulToggleButton
  }
}
