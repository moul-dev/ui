import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { tabPanelStyles, tabStyles, tabsStyles } from './Tabs.styles.js'

@customElement('moul-tab')
export class MoulTab extends MoulBase {
  static override styles: CSSResultOrNative[] = [...MoulBase.styles, tabStyles]

  @property({ type: String })
  accessor value = ''

  @property({ type: Boolean, attribute: 'is-selected', reflect: true })
  accessor isSelected = false

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  private handleClick() {
    if (this.isDisabled) return
    this.dispatchEvent(
      new CustomEvent('moul-tab-select', {
        detail: { value: this.value || this.id },
        bubbles: true,
        composed: true,
      }),
    )
  }

  override render() {
    return html`
      <button
        type="button"
        role="tab"
        class="tab-button"
        aria-selected="${this.isSelected ? 'true' : 'false'}"
        ?disabled=${this.isDisabled}
        @click=${this.handleClick}
      >
        <slot></slot>
      </button>
    `
  }
}

@customElement('moul-tab-panel')
export class MoulTabPanel extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    tabPanelStyles,
  ]

  @property({ type: String })
  accessor value = ''

  @property({ type: Boolean, attribute: 'is-selected', reflect: true })
  accessor isSelected = false

  override render() {
    return html`
      <div role="tabpanel" tabindex="0">
        <slot></slot>
      </div>
    `
  }
}

@customElement('moul-tabs')
export class MoulTabs extends MoulBase {
  static override styles: CSSResultOrNative[] = [...MoulBase.styles, tabsStyles]

  @property({ type: String, attribute: 'selected-key', reflect: true })
  accessor selectedKey = ''

  @property({ type: String })
  accessor orientation: 'horizontal' | 'vertical' = 'horizontal'

  @property({ type: String, reflect: true })
  accessor variant: 'primary' | 'pills' = 'primary'

  private handleTabSelect = (e: Event) => {
    const customEvent = e as CustomEvent<{ value: string }>
    const key = customEvent.detail.value
    this.selectedKey = key
    this.dispatchEvent(
      new CustomEvent('moul-selection-change', {
        detail: { selectedKey: key },
        bubbles: true,
        composed: true,
      }),
    )
    this.updateActiveTabs()
  }

  private updateActiveTabs() {
    const tabs = Array.from(this.querySelectorAll('moul-tab')) as MoulTab[]
    const panels = Array.from(
      this.querySelectorAll('moul-tab-panel'),
    ) as MoulTabPanel[]

    if (!this.selectedKey && tabs.length > 0) {
      this.selectedKey = tabs[0].value || tabs[0].id
    }

    tabs.forEach((tab) => {
      const key = tab.value || tab.id
      tab.isSelected = key === this.selectedKey
    })

    panels.forEach((panel) => {
      const key = panel.value || panel.id
      panel.isSelected = key === this.selectedKey
    })
  }

  override firstUpdated() {
    this.addEventListener('moul-tab-select', this.handleTabSelect)
    this.updateActiveTabs()
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('selectedKey')) {
      this.updateActiveTabs()
    }
  }

  private handleSlotChange() {
    this.updateActiveTabs()
  }

  override render() {
    return html`
      <div class="tabs-container ${this.orientation}">
        <div class="tab-list ${this.variant}" role="tablist" aria-orientation="${this.orientation}">
          <slot name="tab" @slotchange=${this.handleSlotChange}></slot>
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="tab-panels">
          <slot name="panel"></slot>
        </div>
      </div>
    `
  }
}
