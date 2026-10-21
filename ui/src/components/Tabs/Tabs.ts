import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { placeIndicator } from '../../utils/motion'
import type { MoulTab } from './Tab'
import type { MoulTabPanel } from './TabPanel'
import { tabsStyles } from './Tabs.styles'

export type TabsOrientation = 'horizontal' | 'vertical'
export type TabsVariant = 'line' | 'pill' | 'enclosed'

export class MoulTabs extends LitElement {
  static override styles = tabsStyles

  static override properties = {
    selectedKey: { type: String, reflect: true, attribute: 'selected-key' },
    orientation: { type: String, reflect: true },
    variant: { type: String, reflect: true },
  }

  declare selectedKey: string
  declare orientation: TabsOrientation
  declare variant: TabsVariant

  private resizeObserver: ResizeObserver | null = null

  constructor() {
    super()
    this.selectedKey = ''
    this.orientation = 'horizontal'
    this.variant = 'pill'
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'tablist')
    this.setAttribute('aria-orientation', this.orientation)

    this.addEventListener('click', this.handleTabClick)
    this.addEventListener('keydown', this.handleKeyDown)
    this.distributeTabsAndPanels()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('click', this.handleTabClick)
    this.removeEventListener('keydown', this.handleKeyDown)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
  }

  protected override firstUpdated(): void {
    // Re-measure when the tab strip reflows (web fonts landing, container resizes).
    if (typeof ResizeObserver === 'undefined') return
    this.resizeObserver = new ResizeObserver(() => this.updateIndicator(true))
    const tablist = this.shadowRoot?.querySelector('[part="tablist"]')
    if (tablist) this.resizeObserver.observe(tablist)
    for (const tab of this.getTabs()) this.resizeObserver.observe(tab)
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('orientation')) {
      this.setAttribute('aria-orientation', this.orientation)
    }

    if (changedProps.has('selectedKey') || changedProps.has('variant')) {
      this.syncSelection()
    }
  }

  private distributeTabsAndPanels(): void {
    const tabs = Array.from(this.querySelectorAll<MoulTab>('moul-tab'))
    for (const tab of tabs) {
      if (!tab.hasAttribute('slot')) {
        tab.setAttribute('slot', 'tab')
      }
    }
  }

  private handleSlotChange(): void {
    this.distributeTabsAndPanels()
    this.syncSelection()
  }

  private getTabs(): MoulTab[] {
    return Array.from(this.querySelectorAll<MoulTab>('moul-tab'))
  }

  private getPanels(): MoulTabPanel[] {
    return Array.from(this.querySelectorAll<MoulTabPanel>('moul-tab-panel'))
  }

  private syncSelection(): void {
    const tabs = this.getTabs()
    const panels = this.getPanels()

    if (tabs.length === 0) return

    // Find enabled tabs
    const enabledTabs = tabs.filter((t) => !t.isDisabled)
    if (enabledTabs.length === 0) return

    // Validate selectedKey
    const matchesCurrent = enabledTabs.some((t) => t.key === this.selectedKey)
    if (!matchesCurrent) {
      this.selectedKey = enabledTabs[0].key
    }

    for (const tab of tabs) {
      tab.isSelected = tab.key === this.selectedKey
      tab.dataset.variant = this.variant
    }

    for (const panel of panels) {
      if (panel.key === this.selectedKey) {
        panel.reveal()
      } else {
        panel.hide()
      }
    }

    this.updateIndicator()
  }

  private updateIndicator(instant = false): void {
    const indicator =
      this.shadowRoot?.querySelector<HTMLElement>('[part="indicator"]')
    const tablist =
      this.shadowRoot?.querySelector<HTMLElement>('[part="tablist"]')
    if (!indicator || !tablist) return
    const activeTab =
      this.getTabs().find((t) => t.key === this.selectedKey) ?? null
    // Wait for the selected tab's own render so its box reflects the final label.
    const place = () => placeIndicator(indicator, tablist, activeTab, instant)
    if (activeTab) activeTab.updateComplete.then(place)
    else place()
  }

  private readonly handleTabClick = (e: MouseEvent): void => {
    const target = (e.target as HTMLElement).closest(
      'moul-tab',
    ) as MoulTab | null
    if (!target || target.isDisabled) return

    if (target.key && target.key !== this.selectedKey) {
      this.selectedKey = target.key
      this.dispatchEvent(
        new CustomEvent('selectionchange', {
          bubbles: true,
          composed: true,
          detail: { selectedKey: this.selectedKey },
        }),
      )
    }
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    const enabledTabs = this.getTabs().filter((t) => !t.isDisabled)
    if (enabledTabs.length === 0) return

    const currentIndex = enabledTabs.findIndex(
      (t) => t.key === this.selectedKey,
    )
    let nextIndex = -1

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        nextIndex = (currentIndex + 1) % enabledTabs.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = enabledTabs.length - 1
        break
      default:
        return
    }

    if (nextIndex >= 0 && nextIndex !== currentIndex) {
      const nextTab = enabledTabs[nextIndex]
      this.selectedKey = nextTab.key
      nextTab.focus()
      this.dispatchEvent(
        new CustomEvent('selectionchange', {
          bubbles: true,
          composed: true,
          detail: { selectedKey: this.selectedKey },
        }),
      )
    }
  }

  protected override render() {
    return html`
      <div part="base">
        <div part="tablist" class="tablist">
          <slot name="tab" @slotchange=${this.handleSlotChange}></slot>
          <div part="indicator" class="indicator"></div>
        </div>
        <div part="panels" class="panels">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
      </div>
    `
  }
}

defineElement('moul-tabs', MoulTabs)

declare global {
  interface HTMLElementTagNameMap {
    'moul-tabs': MoulTabs
  }
}
