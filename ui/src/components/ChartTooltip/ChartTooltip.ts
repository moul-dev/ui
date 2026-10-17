import { html, LitElement, type PropertyValues } from 'lit'
import { OverlayPresenceController } from '../../controllers/overlay-presence.controller'
import { defineElement } from '../../utils/define-element'
import { getChartColor } from '../ChartCommon'
import { chartTooltipStyles } from './ChartTooltip.styles'

export interface ChartTooltipPayloadEntry {
  name?: string
  label?: string
  key?: string
  value?: unknown
  rawValue?: unknown
  color?: string
  fill?: string
  stroke?: string
  payload?: Record<string, unknown>
  [key: string]: unknown
}

export interface ChartTooltipShowOptions {
  label?: string
  value?: string
  color?: string
  x?: number
  y?: number
  payload?: (ChartTooltipPayloadEntry | unknown)[]
  valueFormatter?: (value: unknown) => string
}

export class MoulChartTooltip extends LitElement {
  static override styles = chartTooltipStyles

  static override properties = {
    label: { type: String },
    value: { type: String },
    color: { type: String },
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    x: { type: Number },
    y: { type: Number },
    payload: { attribute: false },
    valueFormatter: { attribute: false },
  }

  declare label: string
  declare value: string
  declare color: string
  declare isOpen: boolean
  declare x: number
  declare y: number
  declare payload: (ChartTooltipPayloadEntry | unknown)[]
  declare valueFormatter?: (value: unknown) => string

  public overlayPresence: OverlayPresenceController

  constructor() {
    super()
    this.label = ''
    this.value = ''
    this.color = 'var(--color-chart-1)'
    this.isOpen = false
    this.x = 0
    this.y = 0
    this.payload = []
    this.valueFormatter = undefined
    this.overlayPresence = new OverlayPresenceController(this, {
      preset: 'tooltip',
      popover: () => this.popoverEl,
    })
  }

  public get popoverEl(): HTMLElement {
    return this
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (!this.hasAttribute('popover')) {
      this.setAttribute('popover', 'manual')
    }
    this.updatePosition()
  }

  public updatePosition(): void {
    this.style.left = '0px'
    this.style.top = '0px'
    this.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) translate(-50%, -100%) translateY(-8px)`
  }

  public override showPopover(): void {
    if (!this.isConnected) return
    try {
      if (!this.matches(':popover-open')) {
        super.showPopover()
      }
    } catch {
      this.setAttribute(':popover-open', '')
      this.classList.add(':popover-open')
    }
    this.isOpen = true
  }

  public override hidePopover(): void {
    if (!this.isConnected) return
    try {
      if (this.matches(':popover-open')) {
        super.hidePopover()
      }
    } catch {
      this.removeAttribute(':popover-open')
      this.classList.remove(':popover-open')
    }
    this.isOpen = false
  }

  public show(
    optionsOrX?: ChartTooltipShowOptions | number,
    y?: number,
    label?: string,
    value?: string,
    color?: string,
  ): void {
    if (typeof optionsOrX === 'object' && optionsOrX !== null) {
      this.label =
        optionsOrX.label !== undefined ? String(optionsOrX.label) : ''
      this.value =
        optionsOrX.value !== undefined ? String(optionsOrX.value) : ''
      if (optionsOrX.color !== undefined) {
        this.color = optionsOrX.color
      }
      if (optionsOrX.x !== undefined) {
        this.x = optionsOrX.x
      }
      if (optionsOrX.y !== undefined) {
        this.y = optionsOrX.y
      }
      this.payload =
        optionsOrX.payload !== undefined && Array.isArray(optionsOrX.payload)
          ? optionsOrX.payload
          : []
      if (optionsOrX.valueFormatter !== undefined) {
        this.valueFormatter = optionsOrX.valueFormatter
      }
    } else if (typeof optionsOrX === 'number') {
      this.x = optionsOrX
      this.y = y ?? 0
      this.label = label !== undefined ? String(label) : ''
      this.value = value !== undefined ? String(value) : ''
      if (color !== undefined) {
        this.color = color
      }
      this.payload = []
    } else {
      this.payload = []
    }

    this.isOpen = true
    this.updatePosition()
    this.showPopover()
    this.overlayPresence.setOpen(true)
    this.requestUpdate()
  }

  public hide(): void {
    this.isOpen = false
    this.hidePopover()
    this.overlayPresence.setOpen(false)
    this.requestUpdate()
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('x') || changedProps.has('y')) {
      this.updatePosition()
    }

    if (changedProps.has('isOpen')) {
      if (this.isOpen) {
        this.showPopover()
      } else {
        this.hidePopover()
      }
    }
  }

  private formatPayloadEntry(
    entry: unknown,
    index: number,
  ): {
    name: string
    value: string
    color: string
  } {
    if (typeof entry === 'object' && entry !== null) {
      const item = entry as Record<string, unknown>
      const name =
        typeof item.name === 'string'
          ? item.name
          : typeof item.label === 'string'
            ? item.label
            : typeof item.key === 'string'
              ? item.key
              : ''

      const rawVal = item.value !== undefined ? item.value : item.rawValue
      let formattedVal = ''
      if (rawVal !== undefined && rawVal !== null) {
        formattedVal = this.valueFormatter
          ? this.valueFormatter(rawVal)
          : String(rawVal)
      }

      const color =
        typeof item.color === 'string'
          ? item.color
          : typeof item.fill === 'string'
            ? item.fill
            : typeof item.stroke === 'string'
              ? item.stroke
              : typeof (item.payload as Record<string, unknown>)?.fill ===
                  'string'
                ? ((item.payload as Record<string, unknown>).fill as string)
                : getChartColor(index)

      return { name, value: formattedVal, color }
    }

    const formattedVal = this.valueFormatter
      ? this.valueFormatter(entry)
      : entry !== undefined && entry !== null
        ? String(entry)
        : ''

    return {
      name: '',
      value: formattedVal,
      color: getChartColor(index),
    }
  }

  protected override render() {
    const hasPayload = Array.isArray(this.payload) && this.payload.length > 0

    // Single-series rendering (no payload or empty payload) — 100% backward compatible
    if (!hasPayload) {
      return html`
        <div part="container" class="tooltip-container">
          <div part="header" class="tooltip-header">
            <span
              part="indicator"
              class="indicator"
              style="background-color: ${this.color};"
            ></span>
            <span part="label" class="label">${this.label}</span>
            <span part="value" class="value">${this.value}</span>
          </div>
          <slot></slot>
        </div>
      `
    }

    // Multi-series rendering with payload items
    const hasSingleValue = this.value !== '' && this.value !== undefined
    const hasLabel = this.label !== '' && this.label !== undefined

    return html`
      <div part="container" class="tooltip-container">
        ${
          hasSingleValue
            ? html`
              <div part="header" class="tooltip-header">
                <span
                  part="indicator"
                  class="indicator"
                  style="background-color: ${this.color};"
                ></span>
                <span part="label" class="label">${this.label}</span>
                <span part="value" class="value">${this.value}</span>
              </div>
            `
            : hasLabel
              ? html`
                <div part="header" class="tooltip-header tooltip-title">
                  <span part="title" class="title">${this.label}</span>
                </div>
              `
              : ''
        }

        <ul part="list" class="tooltip-list">
          ${this.payload.map((entry, idx) => {
            const item = this.formatPayloadEntry(entry, idx)
            return html`
              <li part="item" class="tooltip-item">
                <div class="tooltip-item-series">
                  <span
                    part="indicator"
                    class="indicator"
                    style="background-color: ${item.color};"
                  ></span>
                  ${
                    item.name
                      ? html`<span part="label" class="label">${item.name}</span>`
                      : ''
                  }
                </div>
                ${
                  item.value
                    ? html`<span part="value" class="value">${item.value}</span>`
                    : ''
                }
              </li>
            `
          })}
        </ul>
        <slot></slot>
      </div>
    `
  }
}

defineElement('moul-chart-tooltip', MoulChartTooltip)

export { MoulChartTooltip as ChartTooltip }

declare global {
  interface HTMLElementTagNameMap {
    'moul-chart-tooltip': MoulChartTooltip
  }
}
