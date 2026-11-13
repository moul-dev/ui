import { html, LitElement, nothing } from 'lit'
import { defineElement } from '../../utils/define-element'
import { breadcrumbItemStyles } from './Breadcrumbs.styles'

/**
 * One step in a `moul-breadcrumbs` trail: a link when it has an `href`, plain
 * text when it is the current page (`is-current`), followed by a separator.
 *
 * Keyboard and screen readers: with an `href` and no `is-current` it renders a
 * native `<a>` inside an `<li>`, so Tab focuses it and Enter follows it;
 * otherwise it is plain text and not focusable, and `is-current` adds
 * `aria-current="page"`. The name is the slotted text; the separator is
 * `aria-hidden`.
 *
 * Reduced motion: nothing moves; the link's colour and focus-ring fades are
 * switched off under reduced motion.
 */
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
