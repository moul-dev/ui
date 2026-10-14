import type { ReactiveController, ReactiveControllerHost } from 'lit'

let defaultLiveRegion: HTMLElement | null = null

export interface LiveRegionOptions {
  politeness?: 'polite' | 'assertive'
}

export class LiveRegionController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement
  private options: LiveRegionOptions

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: LiveRegionOptions = {},
  ) {
    this.host = host
    this.options = {
      politeness: 'polite',
      ...options,
    }
    this.host.addController(this)
  }

  hostConnected() {}
  hostDisconnected() {}

  announce(message: string, politeness = this.options.politeness || 'polite') {
    if (typeof document === 'undefined') return

    if (!defaultLiveRegion) {
      defaultLiveRegion = document.createElement('div')
      defaultLiveRegion.id = 'moul-live-region'
      defaultLiveRegion.setAttribute('aria-live', politeness)
      defaultLiveRegion.setAttribute('aria-atomic', 'true')
      Object.assign(defaultLiveRegion.style, {
        position: 'absolute',
        width: '1px',
        height: '1px',
        margin: '-1px',
        padding: '0',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        border: '0',
      })
      document.body.appendChild(defaultLiveRegion)
    }

    defaultLiveRegion.setAttribute('aria-live', politeness)
    // Clear and set to ensure screen reader triggers announcement
    defaultLiveRegion.textContent = ''
    setTimeout(() => {
      if (defaultLiveRegion) {
        defaultLiveRegion.textContent = message
      }
    }, 50)
  }
}
