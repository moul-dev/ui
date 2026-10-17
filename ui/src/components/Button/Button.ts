import { html, LitElement, type PropertyValues } from 'lit'
import { PressController } from '../../controllers/press.controller'
import { defineElement } from '../../utils/define-element'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import '../Spinner/Spinner'
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

export class MoulButton extends LitElement {
  static override styles = buttonStyles

  static override properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    type: { type: String, reflect: true },
    isIcon: { type: Boolean, reflect: true, attribute: 'is-icon' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isPending: { type: Boolean, reflect: true, attribute: 'is-pending' },
  }

  declare variant: ButtonVariant
  declare size: ButtonSize
  declare type: ButtonType
  declare isIcon: boolean
  declare isDisabled: boolean
  declare isPending: boolean

  public pressController: PressController
  private pressHandledInCycle = false

  constructor() {
    super()
    this.variant = 'primary'
    this.size = 'md'
    this.type = 'button'
    this.isIcon = false
    this.isDisabled = false
    this.isPending = false

    this.pressController = new PressController(this, {
      scaleOnPress: 0.97,
      disabled: () => this.isDisabled || this.isPending,
    })
  }

  public override connectedCallback(): void {
    super.connectedCallback()
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

    if (changedProperties.has('isPending')) {
      if (this.isPending) {
        this.setAttribute('aria-busy', 'true')
      } else {
        this.removeAttribute('aria-busy')
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

  private readonly handlePointerDown = (e: PointerEvent): void => {
    if (this.isDisabled || this.isPending || e.button !== 0) return
    this.pressHandledInCycle = false
  }

  private readonly handlePointerUp = (e: PointerEvent): void => {
    if (this.isDisabled || this.isPending || e.button !== 0) return
    this.dispatchPressEvent(e)
    this.pressHandledInCycle = true
    queueMicrotask(() => {
      this.pressHandledInCycle = false
    })
  }

  private readonly handleClick = (e: MouseEvent): void => {
    if (this.isDisabled || this.isPending) {
      e.preventDefault()
      e.stopImmediatePropagation()
      return
    }

    if (!this.pressHandledInCycle) {
      this.dispatchPressEvent(e)
    }
    this.pressHandledInCycle = false
    this.handleFormIntegration()
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (this.isDisabled || this.isPending || e.repeat) return
    if (e.key === ' ' || e.key === 'Enter') {
      this.pressHandledInCycle = false
    }
  }

  private readonly handleKeyUp = (e: KeyboardEvent): void => {
    if (this.isDisabled || this.isPending) return
    if (e.key === ' ' || e.key === 'Enter') {
      this.dispatchPressEvent(e)
      this.pressHandledInCycle = true
      this.handleFormIntegration()
      queueMicrotask(() => {
        this.pressHandledInCycle = false
      })
    }
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
    const form = this.closest('form')
    if (!form) return

    if (this.type === 'submit') {
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit()
      } else {
        form.submit()
      }
    } else if (this.type === 'reset') {
      form.reset()
    }
  }

  protected override render() {
    return html`
      <button
        part="button"
        type=${this.type}
        ?disabled=${this.isDisabled}
        aria-busy=${this.isPending ? 'true' : 'false'}
        aria-disabled=${this.isDisabled ? 'true' : 'false'}
      >
        ${
          this.isPending
            ? html`<moul-spinner size="sm" part="spinner" class="spinner"></moul-spinner>`
            : ''
        }
        <slot name="prefix" part="prefix"></slot>
        <span part="content" class="content"><slot></slot></span>
        <slot name="suffix" part="suffix"></slot>
      </button>
    `
  }
}

defineElement('moul-button', MoulButton)

declare global {
  interface HTMLElementTagNameMap {
    'moul-button': MoulButton
  }
}
