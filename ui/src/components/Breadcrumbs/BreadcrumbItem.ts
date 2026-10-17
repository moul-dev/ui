import { html, LitElement, nothing } from 'lit'
import { defineElement } from '../../utils/define-element'
import { breadcrumbItemStyles } from './Breadcrumbs.styles'

export class MoulBreadcrumbItem extends LitElement {
  static override styles = breadcrumbItemStyles

  static override properties = {
    href: { type: String, reflect: true },
    isCurrent: { type: Boolean, reflect: true, attribute: 'is-current' },
    separator: { type: String },
  }

  declare href: string
  declare isCurrent: boolean
  declare separator: string

  constructor() {
    super()
    this.href = ''
    this.isCurrent = false
    this.separator = ''
  }

  protected override render() {
    return html`
      <li part="item">
        ${
          this.href && !this.isCurrent
            ? html`<a part="link" href=${this.href}><slot></slot></a>`
            : html`<span part="text" aria-current=${this.isCurrent ? 'page' : nothing}><slot></slot></span>`
        }
        <span part="separator" aria-hidden="true">
          <slot name="separator">${this.separator || '/'}</slot>
        </span>
      </li>
    `
  }
}

defineElement('moul-breadcrumb-item', MoulBreadcrumbItem)

declare global {
  interface HTMLElementTagNameMap {
    'moul-breadcrumb-item': MoulBreadcrumbItem
  }
}
