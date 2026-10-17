import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { animateActiveIndicator } from '../../utils/motion'
import type { MoulToggleButton } from '../ToggleButton/ToggleButton'
import { toggleButtonGroupStyles } from './ToggleButtonGroup.styles'

export type ToggleButtonGroupOrientation = 'horizontal' | 'vertical'

export class MoulToggleButtonGroup extends LitElement {
  static override styles = toggleButtonGroupStyles

  static override properties = {
    selectedKey: { type: String, reflect: true, attribute: 'selected-key' },
    orientation: { type: String, reflect: true },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
  }

  declare selectedKey: string
  declare orientation: ToggleButtonGroupOrientation
  declare isDisabled: boolean

  private previousSelectedButton: MoulToggleButton | null = null

  constructor() {
    super()
    this.selectedKey = ''
    this.orientation = 'horizontal'
    this.isDisabled = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'group')
    }
    this.setAttribute('aria-orientation', this.orientation)
    this.addEventListener('keydown', this.handleKeyDown)
    this.addEventListener('change', this.handleChildChange)
    this.addEventListener('press', this.handleChildPress)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('keydown', this.handleKeyDown)
    this.removeEventListener('change', this.handleChildChange)
    this.removeEventListener('press', this.handleChildPress)
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties)

    if (changedProperties.has('orientation')) {
      this.setAttribute('aria-orientation', this.orientation)
    }

    if (changedProperties.has('selectedKey')) {
      this.syncSelection()
    }

    if (changedProperties.has('isDisabled')) {
      this.syncDisabledState()
    }
  }

  protected override firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties)
    this.syncSelection()
  }

  public getItems(): MoulToggleButton[] {
    const direct = Array.from(
      this.querySelectorAll<MoulToggleButton>('moul-toggle-button'),
    )
    if (direct.length > 0) return direct

    const slot = this.shadowRoot?.querySelector('slot')
    const elements = slot
      ? slot.assignedElements({ flatten: true })
      : Array.from(this.children)

    return elements.filter(
      (el): el is MoulToggleButton =>
        el.tagName.toLowerCase() === 'moul-toggle-button',
    )
  }

  public getSelectedButton(): MoulToggleButton | null {
    const items = this.getItems()
    if (this.selectedKey) {
      const match = items.find((item) => item.value === this.selectedKey)
      if (match) return match
    }
    return items.find((item) => item.isSelected) ?? null
  }

  private syncSelection(): void {
    const items = this.getItems()
    if (items.length === 0) return

    let selectedItem: MoulToggleButton | null = null

    items.forEach((item) => {
      const shouldSelect = Boolean(
        this.selectedKey && item.value === this.selectedKey,
      )
      item.isSelected = shouldSelect
      if (shouldSelect) {
        selectedItem = item
      }
    })

    this.updateRovingTabindex(selectedItem)
    this.updateIndicator(this.previousSelectedButton, selectedItem)
    this.previousSelectedButton = selectedItem
  }

  private syncDisabledState(): void {
    const items = this.getItems()
    items.forEach((item) => {
      item.isDisabled = this.isDisabled
    })
  }

  private updateRovingTabindex(activeItem?: MoulToggleButton | null): void {
    const items = this.getItems()
    if (items.length === 0) return

    let target = activeItem
    if (!target) {
      target = items.find((item) => !item.isDisabled) ?? items[0]
    }

    items.forEach((item) => {
      if (item === target) {
        item.setAttribute('tabindex', '0')
      } else {
        item.setAttribute('tabindex', '-1')
      }
    })
  }

  private focusItem(item: MoulToggleButton): void {
    this.updateRovingTabindex(item)
    item.focus()
  }

  private readonly handleSlotChange = (): void => {
    this.syncSelection()
    this.syncDisabledState()
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (this.isDisabled) return

    const items = this.getItems().filter((item) => !item.isDisabled)
    if (items.length === 0) return

    const activeIndex = items.findIndex(
      (item) => item === e.target || item.contains(e.target as Node),
    )
    if (activeIndex === -1) return

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        e.preventDefault()
        const nextIndex = (activeIndex + 1) % items.length
        this.focusItem(items[nextIndex])
        break
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        e.preventDefault()
        const prevIndex = (activeIndex - 1 + items.length) % items.length
        this.focusItem(items[prevIndex])
        break
      }
      case 'Home': {
        e.preventDefault()
        this.focusItem(items[0])
        break
      }
      case 'End': {
        e.preventDefault()
        this.focusItem(items[items.length - 1])
        break
      }
    }
  }

  private readonly handleChildChange = (e: Event): void => {
    const target = e.target as MoulToggleButton
    if (target?.tagName?.toLowerCase() !== 'moul-toggle-button') return

    e.stopPropagation()
    this.handleSelectionFromChild(target)
  }

  private readonly handleChildPress = (e: Event): void => {
    const target = e.target as MoulToggleButton
    if (target?.tagName?.toLowerCase() !== 'moul-toggle-button') return

    e.stopPropagation()
    if (target.value !== this.selectedKey) {
      this.handleSelectionFromChild(target)
    }
  }

  private handleSelectionFromChild(target: MoulToggleButton): void {
    const prevSelected = this.previousSelectedButton
    const nextKey = target.value

    this.selectedKey = nextKey

    const items = this.getItems()
    items.forEach((item) => {
      item.isSelected = item === target
    })

    this.updateRovingTabindex(target)
    this.updateIndicator(prevSelected, target)
    this.previousSelectedButton = target

    this.dispatchEvent(
      new CustomEvent('selectionchange', {
        bubbles: true,
        composed: true,
        detail: { selectedKey: this.selectedKey },
      }),
    )
  }

  private updateIndicator(
    prev: MoulToggleButton | null,
    next: MoulToggleButton | null,
  ): void {
    const indicator = this.shadowRoot?.querySelector(
      '.active-indicator',
    ) as HTMLElement | null
    if (!indicator) return

    if (!next) {
      indicator.classList.remove('is-visible')
      return
    }

    try {
      const nextRect = next.getBoundingClientRect()
      const groupRect = this.getBoundingClientRect()

      if (nextRect.width > 0 && nextRect.height > 0) {
        indicator.classList.add('is-visible')
        indicator.style.width = `${nextRect.width}px`
        indicator.style.height = `${nextRect.height}px`
        indicator.style.transform = `translate(${nextRect.left - groupRect.left}px, ${nextRect.top - groupRect.top}px)`

        if (prev) {
          const prevRect = prev.getBoundingClientRect()
          if (prevRect.width > 0 && prevRect.height > 0) {
            animateActiveIndicator(indicator, prevRect, nextRect)
          }
        }
      }
    } catch {
      // In headless test environments where getBoundingClientRect is 0, ignore gracefully
    }
  }

  protected override render() {
    return html`
      <div part="base">
        <div part="indicator" class="active-indicator"></div>
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `
  }
}

defineElement('moul-toggle-button-group', MoulToggleButtonGroup)

declare global {
  interface HTMLElementTagNameMap {
    'moul-toggle-button-group': MoulToggleButtonGroup
  }
}
