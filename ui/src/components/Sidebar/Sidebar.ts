import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import {
  sidebarDividerStyles,
  sidebarGroupStyles,
  sidebarItemStyles,
  sidebarStyles,
} from './Sidebar.styles.js'

@customElement('moul-sidebar-divider')
export class MoulSidebarDivider extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    sidebarDividerStyles,
  ]

  override render() {
    return html`<hr />`
  }
}

@customElement('moul-sidebar-group')
export class MoulSidebarGroup extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    sidebarGroupStyles,
  ]

  @property({ type: String })
  accessor label = ''

  override render() {
    return html`
      <div>
        ${this.label ? html`<div class="group-header">${this.label}</div>` : ''}
        <slot></slot>
      </div>
    `
  }
}

@customElement('moul-sidebar-item')
export class MoulSidebarItem extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    sidebarItemStyles,
  ]

  @property({ type: String })
  accessor href = ''

  @property({ type: String })
  accessor value = ''

  @property({ type: Boolean, attribute: 'is-selected', reflect: true })
  accessor isSelected = false

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  private handleClick() {
    if (this.isDisabled) return
    this.dispatchEvent(
      new CustomEvent('moul-sidebar-select', {
        detail: { value: this.value || this.href },
        bubbles: true,
        composed: true,
      }),
    )
  }

  override render() {
    const inner = html`
      <span class="icon"><slot name="icon"></slot></span>
      <span class="label"><slot></slot></span>
      <span class="badge"><slot name="badge"></slot></span>
    `

    if (this.href) {
      return html`
        <a href="${this.href}" class="sidebar-item" @click=${this.handleClick}>
          ${inner}
        </a>
      `
    }

    return html`
      <div class="sidebar-item" role="button" tabindex="0" @click=${this.handleClick}>
        ${inner}
      </div>
    `
  }
}

@customElement('moul-sidebar')
export class MoulSidebar extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    sidebarStyles,
  ]

  @property({ type: Boolean, reflect: true })
  accessor collapsed = false

  @property({ type: String, attribute: 'selected-key' })
  accessor selectedKey = ''

  @property({ type: Boolean, attribute: 'show-collapse-toggle' })
  accessor showCollapseToggle = false

  public toggleCollapse() {
    this.collapsed = !this.collapsed
    this.dispatchEvent(
      new CustomEvent('moul-sidebar-collapse', {
        detail: { collapsed: this.collapsed },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private handleSelect = (e: Event) => {
    const customEvent = e as CustomEvent<{ value: string }>
    this.selectedKey = customEvent.detail.value
    this.dispatchEvent(
      new CustomEvent('moul-selection-change', {
        detail: { selectedKey: this.selectedKey },
        bubbles: true,
        composed: true,
      }),
    )
    this.updateActiveItems()
  }

  private updateActiveItems() {
    const items = Array.from(
      this.querySelectorAll('moul-sidebar-item'),
    ) as MoulSidebarItem[]
    items.forEach((item) => {
      const key = item.value || item.href
      if (this.selectedKey) {
        item.isSelected = key === this.selectedKey
      }
    })
  }

  override firstUpdated() {
    this.addEventListener('moul-sidebar-select', this.handleSelect)
    this.updateActiveItems()
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('selectedKey')) {
      this.updateActiveItems()
    }
  }

  override render() {
    return html`
      <aside class="sidebar">
        <div class="sidebar-header">
          <slot name="header"></slot>
          ${
            this.showCollapseToggle
              ? html`
            <button
              type="button"
              class="collapse-toggle"
              aria-label="${this.collapsed ? 'Expand sidebar' : 'Collapse sidebar'}"
              @click=${this.toggleCollapse}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="${this.collapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6'}" />
              </svg>
            </button>
          `
              : ''
          }
        </div>
        <div class="sidebar-body">
          <slot></slot>
        </div>
        <div class="sidebar-footer">
          <slot name="footer"></slot>
        </div>
      </aside>
    `
  }
}
