/**
 * Moul UI - 10-Element Sidebar Compound Element Suite
 *
 * Implements Lit custom elements with @lit/context propagation,
 * pure CSS grid height collapse, FLIP active indicator animation,
 * and collapsed icon-only tooltip preview mode.
 */

import { ContextConsumer, ContextProvider } from '@lit/context'
import {
  html,
  LitElement,
  nothing,
  type PropertyValues,
  svg,
  type TemplateResult,
} from 'lit'
import '../Avatar/Avatar'
import '../Tooltip/Tooltip'
import { defineElement } from '../../utils/define-element'
import {
  animateActiveIndicator,
  SPRING_SNAPPY,
  subtleAnimate,
} from '../../utils/motion'
import { sidebarContext } from './Sidebar.context'
import {
  sidebarAsideStyles,
  sidebarBrandStyles,
  sidebarDividerStyles,
  sidebarFooterStyles,
  sidebarGroupStyles,
  sidebarHeaderStyles,
  sidebarItemStyles,
  sidebarMainStyles,
  sidebarStyles,
  sidebarUserStyles,
} from './Sidebar.styles'
import type { SidebarContextValue, SidebarLayout } from './Sidebar.types'

const chevronLeftIcon = (): TemplateResult => svg`
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
`

const chevronRightIcon = (): TemplateResult => svg`
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
`

// ── 1. MoulSidebar (moul-sidebar) ────────────────────────────────────

export class MoulSidebar extends LitElement {
  static override styles = sidebarStyles

  static override properties = {
    layout: { type: String, reflect: true },
    dense: { type: Boolean, reflect: true },
    collapsed: { type: Boolean, reflect: true },
    selectedKey: { type: String, reflect: true, attribute: 'selected-key' },
  }

  declare layout: SidebarLayout
  declare dense: boolean
  declare collapsed: boolean
  declare selectedKey: string

  private contextProvider: ContextProvider<typeof sidebarContext>
  private previousActiveRect: DOMRect | null = null

  constructor() {
    super()
    this.layout = 'sidebar-framed'
    this.dense = false
    this.collapsed = false
    this.selectedKey = ''

    this.contextProvider = new ContextProvider(this, {
      context: sidebarContext,
      initialValue: this.computeContextValue(),
    })
  }

  private computeContextValue(): SidebarContextValue {
    return {
      layout: (this.layout as SidebarLayout) || 'sidebar-framed',
      dense: this.dense,
      collapsed: this.collapsed,
      selectedKey: this.selectedKey,
      previousActiveRect: this.previousActiveRect,
      onSelect: (key: string) => this.selectItem(key),
      selectItem: (key: string) => this.selectItem(key),
      toggleCollapse: () => this.toggleCollapse(),
    }
  }

  public selectItem(key: string): void {
    if (this.selectedKey === key) return

    // Capture previous active rect for FLIP motion animation
    const currentActive = this.querySelector<MoulSidebarItem>(
      `moul-sidebar-item[key="${this.selectedKey}"], moul-sidebar-item[id="${this.selectedKey}"], moul-sidebar-item[is-selected]`,
    )
    this.previousActiveRect = currentActive?.getBoundingClientRect() ?? null

    this.selectedKey = key
    this.dispatchEvent(
      new CustomEvent('selectionchange', {
        bubbles: true,
        composed: true,
        detail: { selectedKey: key },
      }),
    )
    this.contextProvider.setValue(this.computeContextValue())
  }

  public toggleCollapse(): void {
    this.collapsed = !this.collapsed
    this.dispatchEvent(
      new CustomEvent('collapsechange', {
        bubbles: true,
        composed: true,
        detail: { collapsed: this.collapsed },
      }),
    )
    this.contextProvider.setValue(this.computeContextValue())
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)
    if (
      changedProps.has('layout') ||
      changedProps.has('dense') ||
      changedProps.has('collapsed') ||
      changedProps.has('selectedKey')
    ) {
      this.contextProvider.setValue(this.computeContextValue())
    }
  }

  protected override render(): TemplateResult {
    return html`<slot></slot>`
  }
}

// ── 2. MoulSidebarAside (moul-sidebar-aside) ──────────────────────────

export class MoulSidebarAside extends LitElement {
  static override styles = sidebarAsideStyles

  static override properties = {
    ariaLabel: { type: String, attribute: 'aria-label', reflect: true },
    showCollapseToggle: {
      type: Boolean,
      attribute: 'show-collapse-toggle',
      reflect: true,
    },
    dense: { type: Boolean, reflect: true },
    collapsed: { type: Boolean, reflect: true },
    layout: { type: String, reflect: true },
  }

  declare ariaLabel: string
  declare showCollapseToggle: boolean
  declare dense: boolean
  declare collapsed: boolean
  declare layout: string

  private sidebarConsumer = new ContextConsumer(this, {
    context: sidebarContext,
    subscribe: true,
    callback: (value) => {
      if (value) {
        this.collapsed = value.collapsed
        this.dense = value.dense
        this.layout = value.layout
        this.requestUpdate()
      }
    },
  })

  constructor() {
    super()
    this.ariaLabel = 'Main Navigation'
    this.showCollapseToggle = false
    this.dense = false
    this.collapsed = false
    this.layout = 'sidebar-framed'
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (this.sidebarConsumer.value) {
      this.collapsed = this.sidebarConsumer.value.collapsed
      this.dense = this.sidebarConsumer.value.dense
      this.layout = this.sidebarConsumer.value.layout
    }
  }

  private handleToggleClick = (): void => {
    this.sidebarConsumer.value?.toggleCollapse?.()
  }

  protected override render(): TemplateResult {
    return html`
      <aside
        part="aside"
        class="aside"
        role="complementary"
        aria-label=${this.ariaLabel || 'Main Navigation'}
      >
        <slot></slot>
        ${
          this.showCollapseToggle
            ? html`
              <button
                type="button"
                class="toggle-button"
                part="toggle-button"
                aria-label=${
                  this.collapsed ? 'Expand sidebar' : 'Collapse sidebar'
                }
                @click=${this.handleToggleClick}
              >
                ${this.collapsed ? chevronRightIcon() : chevronLeftIcon()}
              </button>
            `
            : ''
        }
      </aside>
    `
  }
}

// ── 3. MoulSidebarMain (moul-sidebar-main) ────────────────────────────

export class MoulSidebarMain extends LitElement {
  static override styles = sidebarMainStyles

  static override properties = {
    layout: { type: String, reflect: true },
  }

  declare layout: string

  private sidebarConsumer = new ContextConsumer(this, {
    context: sidebarContext,
    subscribe: true,
    callback: (value) => {
      if (value) {
        this.layout = value.layout
        this.requestUpdate()
      }
    },
  })

  constructor() {
    super()
    this.layout = 'sidebar-framed'
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (this.sidebarConsumer.value) {
      this.layout = this.sidebarConsumer.value.layout
    }
  }

  protected override render(): TemplateResult {
    return html`
      <main part="main" class="main" role="main">
        <slot></slot>
      </main>
    `
  }
}

// ── 4. MoulSidebarHeader (moul-sidebar-header) ────────────────────────

export class MoulSidebarHeader extends LitElement {
  static override styles = sidebarHeaderStyles

  static override properties = {
    dense: { type: Boolean, reflect: true },
    collapsed: { type: Boolean, reflect: true },
  }

  declare dense: boolean
  declare collapsed: boolean

  private sidebarConsumer = new ContextConsumer(this, {
    context: sidebarContext,
    subscribe: true,
    callback: (value) => {
      if (value) {
        this.dense = value.dense
        this.collapsed = value.collapsed
        this.requestUpdate()
      }
    },
  })

  constructor() {
    super()
    this.dense = false
    this.collapsed = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (this.sidebarConsumer.value) {
      this.dense = this.sidebarConsumer.value.dense
      this.collapsed = this.sidebarConsumer.value.collapsed
    }
  }

  protected override render(): TemplateResult {
    return html`
      <header part="header" class="header">
        <slot></slot>
      </header>
    `
  }
}

// ── 5. MoulSidebarBrand (moul-sidebar-brand) ──────────────────────────

export class MoulSidebarBrand extends LitElement {
  static override styles = sidebarBrandStyles

  static override properties = {
    logo: { type: String, reflect: true },
    title: { type: String, reflect: true },
    subtitle: { type: String, reflect: true },
    href: { type: String, reflect: true },
    dense: { type: Boolean, reflect: true },
    collapsed: { type: Boolean, reflect: true },
  }

  declare logo: string
  declare title: string
  declare subtitle: string
  declare href: string
  declare dense: boolean
  declare collapsed: boolean

  private sidebarConsumer = new ContextConsumer(this, {
    context: sidebarContext,
    subscribe: true,
    callback: (value) => {
      if (value) {
        this.dense = value.dense
        this.collapsed = value.collapsed
        this.requestUpdate()
      }
    },
  })

  constructor() {
    super()
    this.logo = ''
    this.title = ''
    this.subtitle = ''
    this.href = ''
    this.dense = false
    this.collapsed = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (this.sidebarConsumer.value) {
      this.dense = this.sidebarConsumer.value.dense
      this.collapsed = this.sidebarConsumer.value.collapsed
    }
  }

  protected override render(): TemplateResult {
    const brandContent = html`
      <div class="brand-logo" part="logo">
        <slot name="logo">
          ${this.logo ? html`<img src=${this.logo} alt="" />` : ''}
        </slot>
      </div>
      <div class="brand-info" part="info">
        <span class="brand-title" part="title">
          <slot name="title">${this.title}</slot>
        </span>
        ${
          this.subtitle
            ? html`
              <span class="brand-subtitle" part="subtitle">
                <slot name="subtitle">${this.subtitle}</slot>
              </span>
            `
            : ''
        }
      </div>
      <slot></slot>
    `

    if (this.href) {
      return html`
        <a href=${this.href} class="brand-link" part="link">
          ${brandContent}
        </a>
      `
    }

    return brandContent
  }
}

// ── 6. MoulSidebarGroup (moul-sidebar-group) ──────────────────────────

export class MoulSidebarGroup extends LitElement {
  static override styles = sidebarGroupStyles

  static override properties = {
    label: { type: String, reflect: true },
    collapsible: { type: Boolean, reflect: true },
    collapsed: { type: Boolean, reflect: true },
    dense: { type: Boolean, reflect: true },
    collapsedSidebar: {
      type: Boolean,
      attribute: 'collapsed-sidebar',
      reflect: true,
    },
  }

  declare label: string
  declare collapsible: boolean
  declare collapsed: boolean
  declare dense: boolean
  declare collapsedSidebar: boolean

  get title(): string {
    return this.label
  }

  set title(val: string) {
    this.label = val
  }

  private sidebarConsumer = new ContextConsumer(this, {
    context: sidebarContext,
    subscribe: true,
    callback: (value) => {
      if (value) {
        this.dense = value.dense
        this.collapsedSidebar = value.collapsed
        this.requestUpdate()
      }
    },
  })

  constructor() {
    super()
    this.label = ''
    this.collapsible = true
    this.collapsed = false
    this.dense = false
    this.collapsedSidebar = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (this.sidebarConsumer.value) {
      this.dense = this.sidebarConsumer.value.dense
      this.collapsedSidebar = this.sidebarConsumer.value.collapsed
    }
  }

  public toggleCollapse = (): void => {
    if (!this.collapsible) return
    this.collapsed = !this.collapsed
    this.dispatchEvent(
      new CustomEvent('collapsechange', {
        bubbles: true,
        composed: true,
        detail: { collapsed: this.collapsed },
      }),
    )
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault()
      this.toggleCollapse()
    }
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)
    if (
      changedProps.has('collapsed') &&
      changedProps.get('collapsed') !== undefined
    ) {
      const chevron = this.shadowRoot?.querySelector<SVGElement>('.chevron')
      if (chevron) {
        try {
          subtleAnimate(
            chevron,
            { rotate: this.collapsed ? -90 : 0 },
            SPRING_SNAPPY,
          )
        } catch {
          // Gracefully fallback
        }
      }
    }
  }

  protected override render(): TemplateResult {
    return html`
      ${
        this.label && !this.collapsedSidebar
          ? html`
            <button
              type="button"
              part="group-header"
              class="group-header"
              aria-expanded=${!this.collapsed}
              @click=${this.toggleCollapse}
              @keydown=${this.handleKeyDown}
            >
              <span part="group-title" class="group-title">${this.label}</span>
              ${
                this.collapsible
                  ? html`
                    <svg
                      part="chevron"
                      class="chevron ${this.collapsed ? 'is-collapsed' : ''}"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  `
                  : ''
              }
            </button>
          `
          : ''
      }
      <div
        class="group-items ${this.collapsed ? 'collapsed' : 'expanded'}"
        part="items"
      >
        <div class="group-items-inner" part="items-inner">
          <slot></slot>
        </div>
      </div>
    `
  }
}

// ── 7. MoulSidebarItem (moul-sidebar-item) ────────────────────────────

export class MoulSidebarItem extends LitElement {
  static override styles = sidebarItemStyles

  static override properties = {
    key: { type: String, reflect: true },
    id: { type: String, reflect: true },
    href: { type: String, reflect: true },
    label: { type: String, reflect: true },
    badge: { type: String, reflect: true },
    isDisabled: { type: Boolean, attribute: 'is-disabled', reflect: true },
    isSelected: { type: Boolean, attribute: 'is-selected', reflect: true },
    dense: { type: Boolean, reflect: true },
    collapsed: { type: Boolean, reflect: true },
  }

  declare key: string
  declare id: string
  declare href: string
  declare label: string
  declare badge: string
  declare isDisabled: boolean
  declare isSelected: boolean
  declare dense: boolean
  declare collapsed: boolean

  private sidebarConsumer = new ContextConsumer(this, {
    context: sidebarContext,
    subscribe: true,
    callback: (value) => {
      if (value) {
        this.collapsed = value.collapsed
        this.dense = value.dense
        const itemKey = this.key || this.id
        if (itemKey) {
          this.isSelected = value.selectedKey === itemKey
        }
        this.requestUpdate()
      }
    },
  })

  constructor() {
    super()
    this.key = ''
    this.id = ''
    this.href = ''
    this.label = ''
    this.badge = ''
    this.isDisabled = false
    this.isSelected = false
    this.dense = false
    this.collapsed = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (this.sidebarConsumer.value) {
      this.collapsed = this.sidebarConsumer.value.collapsed
      this.dense = this.sidebarConsumer.value.dense
      const itemKey = this.key || this.id
      if (itemKey) {
        this.isSelected = this.sidebarConsumer.value.selectedKey === itemKey
      }
    }
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('isSelected') && this.isSelected) {
      const indicator =
        this.shadowRoot?.querySelector<HTMLElement>('[part="indicator"]')
      const prevRect = this.sidebarConsumer.value?.previousActiveRect
      if (indicator && prevRect) {
        const nextRect = this.getBoundingClientRect()
        if (nextRect.width > 0 && nextRect.height > 0) {
          try {
            animateActiveIndicator(indicator, prevRect, nextRect)
          } catch {
            // Gracefully ignore animation failures in happy-dom
          }
        }
      }
    }
  }

  private handleClick = (e: MouseEvent): void => {
    if (this.isDisabled) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    const itemKey = this.key || this.id
    if (itemKey) {
      this.dispatchEvent(
        new CustomEvent('selectionchange', {
          bubbles: false,
          composed: true,
          detail: { selectedKey: itemKey },
        }),
      )
      this.sidebarConsumer.value?.onSelect?.(itemKey)
      this.sidebarConsumer.value?.selectItem?.(itemKey)
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault()
      this.handleClick(e as unknown as MouseEvent)
    }
  }

  protected override render(): TemplateResult {
    const itemContent = this.href
      ? html`
        <a
          href=${this.href}
          part="item"
          class="item"
          aria-current=${this.isSelected ? 'page' : nothing}
          @click=${this.handleClick}
          @keydown=${this.handleKeyDown}
        >
          ${
            this.isSelected
              ? html`<span class="indicator" part="indicator"></span>`
              : ''
          }
          <span class="icon" part="icon"><slot name="icon"></slot></span>
          ${
            !this.collapsed
              ? html`
                <span class="label" part="label">
                  ${this.label}<slot></slot>
                </span>
              `
              : ''
          }
          ${
            !this.collapsed && this.badge
              ? html`<span class="badge" part="badge">${this.badge}</span>`
              : ''
          }
        </a>
      `
      : html`
        <button
          type="button"
          part="item"
          class="item"
          aria-selected=${this.isSelected ? 'true' : 'false'}
          ?disabled=${this.isDisabled}
          @click=${this.handleClick}
          @keydown=${this.handleKeyDown}
        >
          ${
            this.isSelected
              ? html`<span class="indicator" part="indicator"></span>`
              : ''
          }
          <span class="icon" part="icon"><slot name="icon"></slot></span>
          ${
            !this.collapsed
              ? html`
                <span class="label" part="label">
                  ${this.label}<slot></slot>
                </span>
              `
              : ''
          }
          ${
            !this.collapsed && this.badge
              ? html`<span class="badge" part="badge">${this.badge}</span>`
              : ''
          }
        </button>
      `

    if (this.collapsed) {
      const tooltipText = this.label || this.textContent?.trim() || ''
      if (tooltipText) {
        return html`
          <moul-tooltip content=${tooltipText} placement="right" delay="200">
            ${itemContent}
          </moul-tooltip>
        `
      }
    }

    return itemContent
  }
}

// ── 8. MoulSidebarDivider (moul-sidebar-divider) ──────────────────────

export class MoulSidebarDivider extends LitElement {
  static override styles = sidebarDividerStyles

  static override properties = {
    dense: { type: Boolean, reflect: true },
    collapsed: { type: Boolean, reflect: true },
  }

  declare dense: boolean
  declare collapsed: boolean

  private sidebarConsumer = new ContextConsumer(this, {
    context: sidebarContext,
    subscribe: true,
    callback: (value) => {
      if (value) {
        this.dense = value.dense
        this.collapsed = value.collapsed
        this.requestUpdate()
      }
    },
  })

  constructor() {
    super()
    this.dense = false
    this.collapsed = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'separator')
    this.setAttribute('aria-orientation', 'horizontal')
    if (this.sidebarConsumer.value) {
      this.dense = this.sidebarConsumer.value.dense
      this.collapsed = this.sidebarConsumer.value.collapsed
    }
  }

  protected override render(): TemplateResult {
    return html``
  }
}

// ── 9. MoulSidebarFooter (moul-sidebar-footer) ────────────────────────

export class MoulSidebarFooter extends LitElement {
  static override styles = sidebarFooterStyles

  static override properties = {
    dense: { type: Boolean, reflect: true },
    collapsed: { type: Boolean, reflect: true },
    showBorder: { type: Boolean, attribute: 'show-border', reflect: true },
  }

  declare dense: boolean
  declare collapsed: boolean
  declare showBorder: boolean

  private sidebarConsumer = new ContextConsumer(this, {
    context: sidebarContext,
    subscribe: true,
    callback: (value) => {
      if (value) {
        this.dense = value.dense
        this.collapsed = value.collapsed
        this.requestUpdate()
      }
    },
  })

  constructor() {
    super()
    this.dense = false
    this.collapsed = false
    this.showBorder = true
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (this.sidebarConsumer.value) {
      this.dense = this.sidebarConsumer.value.dense
      this.collapsed = this.sidebarConsumer.value.collapsed
    }
  }

  protected override render(): TemplateResult {
    return html`
      <footer part="footer" class="footer">
        <slot></slot>
      </footer>
    `
  }
}

// ── 10. MoulSidebarUser (moul-sidebar-user) ───────────────────────────

export class MoulSidebarUser extends LitElement {
  static override styles = sidebarUserStyles

  static override properties = {
    name: { type: String, reflect: true },
    email: { type: String, reflect: true },
    avatarSrc: { type: String, attribute: 'avatar-src', reflect: true },
    status: { type: String, reflect: true },
    dense: { type: Boolean, reflect: true },
    collapsed: { type: Boolean, reflect: true },
  }

  declare name: string
  declare email: string
  declare avatarSrc: string
  declare status: string
  declare dense: boolean
  declare collapsed: boolean

  get description(): string {
    return this.email
  }

  set description(val: string) {
    this.email = val
  }

  private sidebarConsumer = new ContextConsumer(this, {
    context: sidebarContext,
    subscribe: true,
    callback: (value) => {
      if (value) {
        this.dense = value.dense
        this.collapsed = value.collapsed
        this.requestUpdate()
      }
    },
  })

  constructor() {
    super()
    this.name = ''
    this.email = ''
    this.avatarSrc = ''
    this.status = ''
    this.dense = false
    this.collapsed = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (this.sidebarConsumer.value) {
      this.dense = this.sidebarConsumer.value.dense
      this.collapsed = this.sidebarConsumer.value.collapsed
    }
  }

  protected override render(): TemplateResult {
    const userContent = html`
      <div class="user-avatar" part="avatar">
        <slot name="avatar">
          <moul-avatar
            src=${this.avatarSrc}
            name=${this.name}
            status=${this.status || ''}
            size=${this.dense ? 'sm' : 'md'}
          ></moul-avatar>
        </slot>
      </div>
      ${
        !this.collapsed
          ? html`
            <div class="user-info" part="info">
              <span class="user-name" part="name">
                <slot name="name">${this.name}</slot>
              </span>
              ${
                this.email
                  ? html`
                    <span class="user-email" part="email">
                      <slot name="email">${this.email}</slot>
                    </span>
                  `
                  : ''
              }
            </div>
            <div class="user-action" part="action">
              <slot name="action"></slot>
            </div>
            <slot></slot>
          `
          : ''
      }
    `

    if (this.collapsed) {
      const tooltipLabel = this.name
        ? this.email
          ? `${this.name} • ${this.email}`
          : this.name
        : this.email || ''
      if (tooltipLabel) {
        return html`
          <moul-tooltip content=${tooltipLabel} placement="right" delay="200">
            ${userContent}
          </moul-tooltip>
        `
      }
    }

    return userContent
  }
}

// ── Idempotent Registration & Custom Elements Registry ───────────────

defineElement('moul-sidebar', MoulSidebar)
defineElement('moul-sidebar-aside', MoulSidebarAside)
defineElement('moul-sidebar-main', MoulSidebarMain)
defineElement('moul-sidebar-header', MoulSidebarHeader)
defineElement('moul-sidebar-brand', MoulSidebarBrand)
defineElement('moul-sidebar-group', MoulSidebarGroup)
defineElement('moul-sidebar-item', MoulSidebarItem)
defineElement('moul-sidebar-divider', MoulSidebarDivider)
defineElement('moul-sidebar-footer', MoulSidebarFooter)
defineElement('moul-sidebar-user', MoulSidebarUser)

declare global {
  interface HTMLElementTagNameMap {
    'moul-sidebar': MoulSidebar
    'moul-sidebar-aside': MoulSidebarAside
    'moul-sidebar-main': MoulSidebarMain
    'moul-sidebar-header': MoulSidebarHeader
    'moul-sidebar-brand': MoulSidebarBrand
    'moul-sidebar-group': MoulSidebarGroup
    'moul-sidebar-item': MoulSidebarItem
    'moul-sidebar-divider': MoulSidebarDivider
    'moul-sidebar-footer': MoulSidebarFooter
    'moul-sidebar-user': MoulSidebarUser
  }
}
