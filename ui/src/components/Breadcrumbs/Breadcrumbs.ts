import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import type { MoulBreadcrumbItem } from './BreadcrumbItem'
import { breadcrumbsStyles } from './Breadcrumbs.styles'

export class MoulBreadcrumbs extends LitElement {
  static override styles = breadcrumbsStyles

  static override properties = {
    separator: { type: String, reflect: true },
  }

  declare separator: string

  constructor() {
    super()
    this.separator = '/'
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)
    if (changedProps.has('separator')) {
      this.syncSeparatorToChildren()
    }
  }

  private handleSlotChange(): void {
    this.syncSeparatorToChildren()
  }

  private syncSeparatorToChildren(): void {
    const items = Array.from(
      this.querySelectorAll<MoulBreadcrumbItem>('moul-breadcrumb-item'),
    )
    for (const item of items) {
      if (!item.hasAttribute('separator') || item.separator === '') {
        item.separator = this.separator
      }
    }
  }

  protected override render() {
    return html`
      <nav part="base" aria-label="Breadcrumb">
        <ol part="list">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </ol>
      </nav>
    `
  }
}

defineElement('moul-breadcrumbs', MoulBreadcrumbs)

declare global {
  interface HTMLElementTagNameMap {
    'moul-breadcrumbs': MoulBreadcrumbs
  }
}
