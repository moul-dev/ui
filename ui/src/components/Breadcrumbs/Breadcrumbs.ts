import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import {
  breadcrumbItemStyles,
  breadcrumbsStyles,
} from './Breadcrumbs.styles.js'

@customElement('moul-breadcrumbs')
export class MoulBreadcrumbs extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    breadcrumbsStyles,
  ]

  override render() {
    return html`
      <nav aria-label="Breadcrumb">
        <ol class="breadcrumb">
          <slot></slot>
        </ol>
      </nav>
    `
  }
}

@customElement('moul-breadcrumb-item')
export class MoulBreadcrumbItem extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    breadcrumbItemStyles,
  ]

  @property({ type: String })
  accessor href: string | null = null

  @property({ type: Boolean, attribute: 'is-current', reflect: true })
  accessor isCurrent = false

  override render() {
    return html`
      <li class="breadcrumb-item ${this.isCurrent ? 'active' : ''}" aria-current="${this.isCurrent ? 'page' : 'false'}">
        ${
          this.href && !this.isCurrent
            ? html`<a href="${this.href}"><slot></slot></a>`
            : html`<span><slot></slot></span>`
        }
        ${!this.isCurrent ? html`<span class="separator" aria-hidden="true">/</span>` : ''}
      </li>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-breadcrumbs': MoulBreadcrumbs
    'moul-breadcrumb-item': MoulBreadcrumbItem
  }
}
