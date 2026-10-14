import type { ReactiveController, ReactiveControllerHost } from 'lit'

export interface RovingTabindexOptions {
  orientation?: 'horizontal' | 'vertical' | 'both'
  wrap?: boolean
  getItems: () => HTMLElement[]
  onSelect?: (element: HTMLElement) => void
}

export class RovingTabindexController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement
  private options: RovingTabindexOptions
  activeIndex = 0

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: RovingTabindexOptions,
  ) {
    this.host = host
    this.options = {
      orientation: 'horizontal',
      wrap: true,
      ...options,
    }
    this.host.addController(this)
  }

  hostConnected() {
    this.host.addEventListener('keydown', this.handleKeyDown)
    // Synchronize initial tabindices
    requestAnimationFrame(() => this.updateTabIndices())
  }

  hostDisconnected() {
    this.host.removeEventListener('keydown', this.handleKeyDown)
  }

  updateTabIndices() {
    const items = this.options.getItems()
    if (items.length === 0) return

    if (this.activeIndex >= items.length) {
      this.activeIndex = 0
    }

    items.forEach((item, index) => {
      item.tabIndex = index === this.activeIndex ? 0 : -1
    })
  }

  setActiveIndex(index: number, focus = true) {
    const items = this.options.getItems()
    if (index < 0 || index >= items.length) return

    this.activeIndex = index
    this.updateTabIndices()

    if (focus && items[index]) {
      items[index].focus()
    }

    this.options.onSelect?.(items[index])
    this.host.requestUpdate()
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    const items = this.options
      .getItems()
      .filter((el) => !el.hasAttribute('disabled'))
    if (items.length === 0) return

    const isHorizontal =
      this.options.orientation === 'horizontal' ||
      this.options.orientation === 'both'
    const isVertical =
      this.options.orientation === 'vertical' ||
      this.options.orientation === 'both'

    let newIndex = this.activeIndex

    if (
      (isHorizontal && event.key === 'ArrowRight') ||
      (isVertical && event.key === 'ArrowDown')
    ) {
      event.preventDefault()
      newIndex = this.activeIndex + 1
      if (newIndex >= items.length) {
        newIndex = this.options.wrap ? 0 : items.length - 1
      }
    } else if (
      (isHorizontal && event.key === 'ArrowLeft') ||
      (isVertical && event.key === 'ArrowUp')
    ) {
      event.preventDefault()
      newIndex = this.activeIndex - 1
      if (newIndex < 0) {
        newIndex = this.options.wrap ? items.length - 1 : 0
      }
    } else if (event.key === 'Home') {
      event.preventDefault()
      newIndex = 0
    } else if (event.key === 'End') {
      event.preventDefault()
      newIndex = items.length - 1
    } else {
      return
    }

    this.setActiveIndex(newIndex, true)
  }
}
