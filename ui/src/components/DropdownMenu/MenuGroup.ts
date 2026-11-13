import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { menuGroupStyles } from './DropdownMenu.styles'

/**
 * A labelled section of a `<moul-dropdown-menu>`, with a small heading above
 * its `<moul-menu-item>`s. Radio items inside a group are exclusive within
 * that group only, so one menu can hold several independent radio sets.
 *
 * Keyboard and screen readers: the group takes no focus; the arrow keys move
 * through its items as if it were not there. The host gets `role="group"` and,
 * from `label`, an `aria-label`; the visible heading is hidden from screen
 * readers so the name is not read twice.
 *
 * Reduced motion: nothing in the group moves on its own; the menu's open and
 * close motion covers it.
 *
 * @slot - The group's `<moul-menu-item>`s.
 * @csspart label - The visible heading.
 * @csspart items - The wrapper around the items.
 */
export class MoulMenuGroup extends LitElement {
  static override styles = menuGroupStyles

  static override properties = {
    label: { type: String, reflect: true },
  }

  declare label: string

  constructor() {
    super()
    this.label = ''
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'group')
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('label')) {
      if (this.label) this.setAttribute('aria-label', this.label)
      else this.removeAttribute('aria-label')
    }
  }

  protected override render() {
    return html`
      ${
        this.label
          ? html`<div part="label" aria-hidden="true">${this.label}</div>`
          : nothing
      }
      <div part="items"><slot></slot></div>
    `
  }
}

defineElement('moul-menu-group', MoulMenuGroup)

declare global {
  interface HTMLElementTagNameMap {
    'moul-menu-group': MoulMenuGroup
  }
}
