import { html, LitElement, type PropertyValues } from 'lit'
import { PressController } from '../../controllers/press.controller'
import { defineElement } from '../../utils/define-element'
import { tabStyles } from './Tabs.styles'

/**
 * One tab in a `moul-tabs` strip; its `key` names the `moul-tab-panel` it
 * shows, and `is-disabled` takes it out of the rotation.
 *
 * Keyboard and screen readers: the host is the focus target, with
 * `role="tab"`, `aria-selected`, `aria-disabled` when disabled, and
 * `tabindex="0"` only while selected (`-1` otherwise). The parent `moul-tabs`
 * handles the arrow keys, Home and End. The slotted label is drawn inside an
 * inner `<button>` that is `aria-hidden` and out of the tab order, so screen
 * readers may not take the tab's name from it; an `aria-label` on the host
 * names it reliably.
 *
 * Reduced motion: the tab does not move (the sliding indicator belongs to
 * `moul-tabs`); its label colour, hover opacity and focus ring fade over
 * 150ms, and change at once under reduced motion.
 */
export class MoulTab extends LitElement {
  static override styles = tabStyles

  static override properties = {
    key: { type: String, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isSelected: { type: Boolean, reflect: true, attribute: 'is-selected' },
  }

  declare key: string
  declare isDisabled: boolean
  declare isSelected: boolean

  public pressController: PressController

  constructor() {
    super()
    this.key = ''
    this.isDisabled = false
    this.isSelected = false

    // No press scale: the selection indicator gliding over is the feedback.
    this.pressController = new PressController(this, {
      disabled: () => this.isDisabled,
    })
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'tab')
    this.updateAriaAttributes()
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)
    if (changedProps.has('isSelected') || changedProps.has('isDisabled')) {
      this.updateAriaAttributes()
    }
  }

  private updateAriaAttributes(): void {
    this.setAttribute('aria-selected', this.isSelected ? 'true' : 'false')
    this.setAttribute(
      'tabindex',
      this.isSelected && !this.isDisabled ? '0' : '-1',
    )
    if (this.isDisabled) {
      this.setAttribute('aria-disabled', 'true')
    } else {
      this.removeAttribute('aria-disabled')
    }
  }

  protected override render() {
    return html`
      <button
        part="base"
        type="button"
        ?disabled=${this.isDisabled}
        tabindex="-1"
        aria-hidden="true"
      >
        <slot></slot>
      </button>
    `
  }
}

defineElement('moul-tab', MoulTab)

declare global {
  interface HTMLElementTagNameMap {
    'moul-tab': MoulTab
  }
}
