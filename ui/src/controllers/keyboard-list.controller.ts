import type { ReactiveController, ReactiveControllerHost } from 'lit'

export interface KeyboardListOptions {
  wrap?: boolean
  getItems: () => HTMLElement[]
  onActiveChange?: (activeItem: HTMLElement | null, index: number) => void
  onSelect?: (activeItem: HTMLElement, index: number) => void
}

export class KeyboardListController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement
  private options: KeyboardListOptions
  activeIndex = -1

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: KeyboardListOptions,
  ) {
    this.host = host
    this.options = {
      wrap: true,
      ...options,
    }
    this.host.addController(this)
  }

  hostConnected() {}
  hostDisconnected() {}

  setActiveIndex(index: number) {
    const items = this.options
      .getItems()
      .filter((el) => !el.hasAttribute('disabled'))
    if (items.length === 0) {
      this.activeIndex = -1
      this.options.onActiveChange?.(null, -1)
      return
    }

    if (index < 0) {
      this.activeIndex = this.options.wrap ? items.length - 1 : 0
    } else if (index >= items.length) {
      this.activeIndex = this.options.wrap ? 0 : items.length - 1
    } else {
      this.activeIndex = index
    }

    const activeItem = items[this.activeIndex] || null
    if (activeItem && typeof activeItem.scrollIntoView === 'function') {
      activeItem.scrollIntoView({ block: 'nearest' })
    }
    this.options.onActiveChange?.(activeItem, this.activeIndex)
    this.host.requestUpdate()
  }

  handleKeyDown(event: KeyboardEvent): boolean {
    const items = this.options
      .getItems()
      .filter((el) => !el.hasAttribute('disabled'))
    if (items.length === 0) return false

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.setActiveIndex(this.activeIndex + 1)
      return true
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.setActiveIndex(this.activeIndex - 1)
      return true
    } else if (event.key === 'Home') {
      event.preventDefault()
      this.setActiveIndex(0)
      return true
    } else if (event.key === 'End') {
      event.preventDefault()
      this.setActiveIndex(items.length - 1)
      return true
    } else if (event.key === 'Enter') {
      if (this.activeIndex >= 0 && this.activeIndex < items.length) {
        event.preventDefault()
        this.options.onSelect?.(items[this.activeIndex], this.activeIndex)
        return true
      }
    }
    return false
  }

  reset() {
    this.activeIndex = -1
    this.options.onActiveChange?.(null, -1)
    this.host.requestUpdate()
  }
}
