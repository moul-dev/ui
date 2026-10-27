import { html, LitElement, type PropertyValues } from 'lit'
import { PressController } from '../../controllers/press.controller'
import { defineElement } from '../../utils/define-element'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import type { MoulForm } from '../Form/Form'
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

  constructor() {
    super()
    this.variant = 'primary'
    this.size = 'md'
    this.type = 'button'
    this.isIcon = false
    this.isDisabled = false
    this.isPending = false

    // Press feedback is the stylesheet's :active scale; this tracks state only.
    this.pressController = new PressController(this, {
      disabled: () => this.isDisabled || this.isPending,
    })
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('click', this.handleClick)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('click', this.handleClick)
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

  /**
   * The inner `<button>` turns a pointer, touch, Enter, or Space activation
   * into exactly one `click`, so `press` comes from `click` alone. Pressing on
   * `pointerup` or `keyup` as well fired it twice per activation.
   */
  private readonly handleClick = (e: MouseEvent): void => {
    if (this.isDisabled || this.isPending) {
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
