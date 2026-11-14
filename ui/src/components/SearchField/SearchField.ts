import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { FormInternalsController } from '../../controllers/form-internals.controller'
import { defineElement } from '../../utils/define-element'
import { clear, search } from '../../utils/icons'
import {
  findImplicitSubmissionForm,
  isImplicitSubmissionKey,
  submitOnEnter,
} from '../../utils/implicit-submission'
import { EASE_OUT, subtleAnimate } from '../../utils/motion'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import { searchFieldStyles } from './SearchField.styles'

/**
 * A form-associated search input inside a `<search>` landmark, with a search
 * icon, a clear button that appears once there is text, and an optional
 * label, description and error message. Outside a form, `Enter` fires the
 * field's own `submit` event with the query in `detail.value`.
 *
 * Keyboard and screen readers: focus goes to a native `<input type="search">`
 * inside a `<search role="search">` wrapper; the clear button is click-only
 * (`tabindex="-1"`, labelled "Clear search"). `Escape` clears a non-empty
 * value and fires `clear`, `input` and `change`; `Enter` submits the
 * enclosing `<form>` or `<moul-form>` as a native input would, or fires
 * `submit` when there is no form. The input is named by a `<label for>`
 * holding the `label` attribute or `label` slot, `aria-describedby` points at
 * the `description` and `error-message` text when they are set, and
 * `aria-invalid` is true while an `is-required` field is empty.
 *
 * With `is-expandable` the field starts as a round search button that
 * springs open into the full field when pressed, for a navbar or a toolbar
 * with little room. It closes again when focus leaves it while it is empty,
 * or on `Escape` with no text. A field that has a value starts open.
 *
 * Expanding: the collapsed button (part `expand-button`) is a native button
 * named by `label` (else the host's `aria-label`, else "Search") with
 * `aria-expanded` and `aria-controls` pointing at the input; `Enter` or
 * `Space` on it opens the field and moves focus into the input. `Escape` in
 * an empty open field closes it and returns focus to the button. While
 * expandable, the visible label is hidden but still names the input.
 *
 * Reduced motion: the clear button appears without its small scale-up and
 * does not shrink when pressed, the error message appears in place instead
 * of sliding down, an expandable field opens and closes without its width
 * animation, and hover and focus colours change without fading.
 *
 * @fires expandchange - An expandable field opened or closed after a press, a key or focus leaving it. `detail.isExpanded` is the new state.
 *
 * @csspart expand-button - The round search button of an `is-expandable` field, which opens it.
 *
 * @cssprop --search-field-expanded-width - The width an `is-expandable` field opens to. Defaults to `16rem`.
 */
export class MoulSearchField extends LitElement {
  static override styles = searchFieldStyles
  static readonly formAssociated = true

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: String, reflect: true },
    placeholder: { type: String, reflect: true },
    label: { type: String, reflect: true },
    description: { type: String, reflect: true },
    errorMessage: { type: String, reflect: true, attribute: 'error-message' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isRequired: { type: Boolean, reflect: true, attribute: 'is-required' },
    isReadonly: { type: Boolean, reflect: true, attribute: 'is-readonly' },
    isExpandable: {
      type: Boolean,
      reflect: true,
      attribute: 'is-expandable',
    },
    isExpanded: { type: Boolean, reflect: true, attribute: 'is-expanded' },
  }

  declare name: string
  declare value: string
  declare placeholder: string
  declare label: string
  declare description: string
  declare errorMessage: string
  declare isDisabled: boolean
  declare isRequired: boolean
  declare isReadonly: boolean
  /** Start as a round search button that opens into the full field when pressed. */
  declare isExpandable: boolean
  /** Whether an `is-expandable` field is open. Setting it opens or closes the field without an event. */
  declare isExpanded: boolean

  public internalsController: FormInternalsController
  private wasClearVisible = false
  private collapseTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    super()
    this.name = ''
    this.value = ''
    this.placeholder = 'Search...'
    this.label = ''
    this.description = ''
    this.errorMessage = ''
    this.isDisabled = false
    this.isRequired = false
    this.isReadonly = false
    this.isExpandable = false
    this.isExpanded = false

    this.internalsController = new FormInternalsController(this)
  }

  public get inputElement(): HTMLInputElement | null {
    return this.renderRoot?.querySelector('input') ?? null
  }

  public override focus(options?: FocusOptions): void {
    this.inputElement?.focus(options)
  }

  public override blur(): void {
    this.inputElement?.blur()
  }

  public get expandButton(): HTMLButtonElement | null {
    return this.renderRoot?.querySelector('[part~="expand-button"]') ?? null
  }

  public select(): void {
    this.inputElement?.select()
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

  public clear(): void {
    if (this.isDisabled || this.isReadonly) return
    this.value = ''
    this.syncFormValueAndValidity()

    this.dispatchEvent(
      new CustomEvent('clear', {
        bubbles: true,
        composed: true,
      }),
    )
    this.dispatchEvent(
      new Event('input', {
        bubbles: true,
        composed: true,
      }),
    )
    this.dispatchEvent(
      new Event('change', {
        bubbles: true,
        composed: true,
      }),
    )
    this.focus()
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('focusout', this.handleFocusOut)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('focusout', this.handleFocusOut)
    if (this.collapseTimer) clearTimeout(this.collapseTimer)
    this.collapseTimer = null
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties)

    // Text in a closed field would be hidden, so a field with a value is open.
    if (
      (changedProperties.has('value') ||
        changedProperties.has('isExpandable')) &&
      this.isExpandable &&
      this.value &&
      !this.isExpanded
    ) {
      this.isExpanded = true
    }

    if (
      changedProperties.has('value') ||
      changedProperties.has('isRequired') ||
      changedProperties.has('errorMessage')
    ) {
      this.syncFormValueAndValidity()
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
    warnMissingLabel(this, 'search field', hasLabel)

    const isClearVisible = Boolean(
      this.value && !this.isDisabled && !this.isReadonly,
    )
    if (isClearVisible && !this.wasClearVisible) {
      const clearBtn = this.renderRoot?.querySelector(
        '[part="clear-btn"]',
      ) as HTMLElement | null
      if (clearBtn) {
        subtleAnimate(
          clearBtn,
          { transform: ['scale(0.9)', 'scale(1)'], opacity: [0, 1] },
          { duration: 0.15, ease: EASE_OUT },
        )
      }
    }
    this.wasClearVisible = isClearVisible

    if (changedProperties.has('errorMessage') && this.errorMessage) {
      const errorEl = this.renderRoot?.querySelector(
        '[part="error"]',
      ) as HTMLElement | null
      if (errorEl) {
        subtleAnimate(
          errorEl,
          {
            transform: ['translateY(-4px)', 'translateY(0px)'],
            opacity: [0, 1],
          },
          { duration: 0.2, ease: EASE_OUT },
        )
      }
    }
  }

  /** Opens an `is-expandable` field and moves focus into the input. */
  private async expand(): Promise<void> {
    if (!this.isExpandable || this.isDisabled) return
    if (!this.isExpanded) {
      this.isExpanded = true
      this.dispatchExpandChange()
      await this.updateComplete
    }
    this.inputElement?.focus()
  }

  /** Closes an empty `is-expandable` field; `returnFocus` moves focus to its button so it is not lost. */
  private async collapse(returnFocus: boolean): Promise<void> {
    if (!this.isExpandable || !this.isExpanded) return
    this.isExpanded = false
    this.dispatchExpandChange()
    await this.updateComplete
    if (returnFocus) this.expandButton?.focus()
  }

  private dispatchExpandChange(): void {
    this.dispatchEvent(
      new CustomEvent('expandchange', {
        detail: { isExpanded: this.isExpanded },
        bubbles: true,
        composed: true,
      }),
    )
  }

  /** Focus that leaves an empty open field closes it; checked a task later, once focus has landed. */
  private readonly handleFocusOut = (): void => {
    if (!this.isExpandable || !this.isExpanded) return
    if (this.collapseTimer) clearTimeout(this.collapseTimer)
    this.collapseTimer = setTimeout(() => {
      this.collapseTimer = null
      const hasFocus = Boolean(this.shadowRoot?.activeElement)
      if (!hasFocus && !this.value) void this.collapse(false)
    })
  }

  private readonly handleExpandClick = (): void => {
    void this.expand()
  }

  private syncFormValueAndValidity(): void {
    this.internalsController.setValue(this.value || null)

    if (this.isRequired && !this.value) {
      const msg = this.errorMessage || 'This field is required.'
      this.internalsController.setValidity({ valueMissing: true }, msg)
      this.setAttribute('is-invalid', '')
    } else {
      this.internalsController.setValidity({})
      this.removeAttribute('is-invalid')
    }
  }

  private handleInput = (event: Event): void => {
    const input = event.target as HTMLInputElement
    this.value = input.value
    this.syncFormValueAndValidity()

    this.dispatchEvent(
      new Event('input', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleChange = (_event: Event): void => {
    this.dispatchEvent(
      new Event('change', {
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (isImplicitSubmissionKey(event)) {
      const form = findImplicitSubmissionForm(
        this,
        this.internalsController.form,
      )
      if (form) {
        // Inside a form, Enter submits the form like a native search input.
        // A bubbling `submit` from here would also reach the form's own
        // submit listeners, so the field's event is reserved for standalone use.
        submitOnEnter(event, form)
      } else {
        this.dispatchEvent(
          new CustomEvent('submit', {
            detail: { value: this.value },
            bubbles: true,
            composed: true,
          }),
        )
      }
    } else if (event.key === 'Escape') {
      if (this.value) {
        event.preventDefault()
        this.clear()
      } else if (this.isExpandable && this.isExpanded) {
        event.preventDefault()
        void this.collapse(true)
      }
    }
  }

  protected override render() {
    const isInvalid = this.hasAttribute('is-invalid')
    const isCollapsed = this.isExpandable && !this.isExpanded
    const showClear = Boolean(
      this.value && !this.isDisabled && !this.isReadonly && !isCollapsed,
    )
    // An expandable field hides its visible label, so a host aria-label
    // still names the input when no label is given.
    const hasLabel = Boolean(this.label || this.querySelector('[slot="label"]'))
    const fallbackName = this.getAttribute('aria-label') || 'Search'
    const inputName = this.isExpandable && !hasLabel ? fallbackName : nothing
    const describedBy = [
      this.description ? 'description' : '',
      this.errorMessage ? 'error' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return html`
      <div part="base">
        <label part="label" for="input">
          <slot name="label">${this.label}</slot>
        </label>

        <search part="search" role="search">
          <div
            part="input-container"
            ?data-invalid=${isInvalid}
            ?data-disabled=${this.isDisabled}
          >
            ${
              this.isExpandable
                ? html`<button
                    type="button"
                    part="expand-button"
                    aria-label=${this.label || fallbackName}
                    aria-expanded=${this.isExpanded ? 'true' : 'false'}
                    aria-controls="input"
                    tabindex=${this.isExpanded ? '-1' : '0'}
                    ?disabled=${this.isDisabled}
                    @click=${this.handleExpandClick}
                  >
                    <span part="search-icon">${search()}</span>
                  </button>`
                : html`<span part="search-icon">${search()}</span>`
            }

            <input
              id="input"
              part="input"
              type="search"
              placeholder=${this.placeholder}
              .value=${this.value}
              ?disabled=${this.isDisabled}
              ?required=${this.isRequired}
              ?readonly=${this.isReadonly}
              aria-invalid=${isInvalid ? 'true' : 'false'}
              aria-label=${inputName}
              tabindex=${isCollapsed ? '-1' : nothing}
              aria-describedby=${describedBy || nothing}
              @input=${this.handleInput}
              @change=${this.handleChange}
              @keydown=${this.handleKeyDown}
            />

            ${
              showClear
                ? html`
                  <button
                    type="button"
                    part="clear-btn"
                    aria-label="Clear search"
                    tabindex="-1"
                    @click=${this.clear}
                  >
                    ${clear()}
                  </button>
                `
                : ''
            }
          </div>
        </search>

        ${
          this.description
            ? html`<div id="description" part="description"><slot name="description">${this.description}</slot></div>`
            : html`<slot name="description"></slot>`
        }
        ${
          this.errorMessage
            ? html`<div id="error" part="error"><slot name="error">${this.errorMessage}</slot></div>`
            : html`<slot name="error"></slot>`
        }
      </div>
    `
  }
}

defineElement('moul-search-field', MoulSearchField)

declare global {
  interface HTMLElementTagNameMap {
    'moul-search-field': MoulSearchField
  }
}
