import type { Placement } from '@floating-ui/dom'
import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { FloatingUIController } from '../../controllers/floating-ui.controller.js'
import { HoverController } from '../../controllers/hover.controller.js'
import { MoulBase } from '../../shared/base.js'
import { tooltipStyles } from './Tooltip.styles.js'

@customElement('moul-tooltip')
export class MoulTooltip extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    tooltipStyles,
  ]

  private floating = new FloatingUIController(this, {
    placement: 'top',
    offset: 6,
  })
  private hover = new HoverController(this, {
    openDelay: 300,
    closeDelay: 100,
    onHoverChange: (isHovered) => {
      this.isOpen = isHovered
    },
  })

  @property({ type: String })
  accessor content = ''

  @property({ type: String, reflect: true })
  accessor placement: Placement = 'top'

  @property({ type: Boolean, attribute: 'is-open', reflect: true })
  accessor isOpen = false

  override firstUpdated() {
    this.hover.attach(this)
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('placement')) {
      this.floating.options.placement = this.placement
    }
    if (changedProperties.has('isOpen')) {
      if (this.isOpen) {
        const trigger = this.shadowRoot!.querySelector<HTMLElement>('.trigger')!
        const tooltip = this.shadowRoot!.querySelector<HTMLElement>('.tooltip')!
        this.floating.start(trigger, tooltip)
      } else {
        this.floating.stop()
      }
    }
  }

  override render() {
    return html`
      <div class="trigger">
        <slot></slot>
      </div>
      <div class="tooltip ${this.isOpen ? 'show' : ''}" role="tooltip">
        <div class="tooltip-inner">
          <slot name="content">${this.content}</slot>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-tooltip': MoulTooltip
  }
}
