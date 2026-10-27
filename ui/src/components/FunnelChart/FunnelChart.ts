import { html, LitElement, nothing, type PropertyValues, svg } from 'lit'
import { LayoutIndicatorController } from '../../controllers/layout-indicator.controller'
import { defineElement } from '../../utils/define-element'
import {
  CHART_EASE,
  prefersReducedMotion,
  stagger,
  subtleAnimate,
} from '../../utils/motion'
import { type FunnelStage, placeHoverCard } from '../ChartCommon'
import { funnelChartStyles } from './FunnelChart.styles'

export interface FunnelChartProps {
  data?: FunnelStage[]
  summaryLabel?: string
  hideSummary?: boolean
  valueFormatter?: (value: number) => string
}

interface StageModel {
  stage: FunnelStage
  value: number
  /** Share of the first stage, 0–1. */
  ofFirst: number
  /** Share of the previous stage, 0–1 (1 for the first stage). */
  ofPrevious: number
  /** People lost since the previous stage. */
  dropOff: number
  color: string
}

/** Height of the neck drawn between two bars, in px (matches `--_neck-h`). */
const NECK_HEIGHT = 28
/** Fallback bar height before the first measurement (matches `--_bar-h`). */
const BAR_HEIGHT = 30
const MINUS = '−'

/**
 * Ordered stages drawn as centered bars, each sized against the first, joined
 * by necks that narrow into the next stage and labeled with the step's drop-off.
 * A summary above calls out overall conversion and the steepest step.
 *
 * @slot empty - Shown when `data` is empty.
 * @fires point-hover - A stage is hovered; `detail.point` is the stage.
 * @fires point-leave - The pointer left the stage.
 * @csspart base - The wrapper around the summary and stages.
 * @csspart summary - Overall conversion and the biggest drop.
 * @csspart conversion - The overall conversion figure.
 * @csspart biggest-drop - The "Biggest drop" line.
 * @csspart stages - The list of stages.
 * @csspart stage - Each stage row.
 * @csspart stage-label - Each stage's name.
 * @csspart bar - Each stage's bar.
 * @csspart drop - The drop-off pill between two stages.
 * @csspart tooltip - The hover readout.
 * @csspart empty - The empty state wrapper.
 */
export class MoulFunnelChart extends LitElement {
  static override styles = funnelChartStyles

  static override properties = {
    data: { attribute: false },
    summaryLabel: { type: String, attribute: 'summary-label' },
    hideSummary: { type: Boolean, reflect: true, attribute: 'hide-summary' },
    valueFormatter: { attribute: false },
    activeIndex: { state: true },
  }

  declare data: FunnelStage[]
  /** Text after the overall conversion figure. */
  declare summaryLabel: string
  declare hideSummary: boolean
  declare valueFormatter?: (value: number) => string
  private declare activeIndex: number

  public layoutController: LayoutIndicatorController
  private barHeight = BAR_HEIGHT
  /** Keeps the readout's text while it fades out. */
  private lastShown = -1
  /** Charts fade in once; later data updates (often live) re-render in place. */
  private hasPlayedEntrance = false

  constructor() {
    super()
    this.data = []
    this.summaryLabel = 'overall conversion'
    this.hideSummary = false
    this.valueFormatter = undefined
    this.activeIndex = -1
    this.layoutController = new LayoutIndicatorController(this, {
      observeDimensions: true,
    })
  }

  private get locale(): string | undefined {
    const lang = this.closest('[lang]')?.getAttribute('lang')
    if (!lang) return undefined
    try {
      return Intl.getCanonicalLocales(lang)[0]
    } catch {
      return undefined
    }
  }

  private formatValue(value: number): string {
    return this.valueFormatter
      ? this.valueFormatter(value)
      : new Intl.NumberFormat(this.locale).format(value)
  }

  /** One decimal under 10% ("8.7%", "2.9%"), whole percents above ("33%"). */
  private formatPercent(ratio: number, precise = false): string {
    const digits = precise || Math.abs(ratio) < 0.1 ? 1 : 0
    return new Intl.NumberFormat(this.locale, {
      style: 'percent',
      maximumFractionDigits: digits,
    }).format(ratio)
  }

  private get stages(): StageModel[] {
    const items = Array.isArray(this.data) ? this.data : []
    const values = items.map((item) => {
      const value = Number(item?.value)
      return Number.isFinite(value) && value > 0 ? value : 0
    })
    const first = values[0] ?? 0
    const last = Math.max(items.length - 1, 1)

    return items.map((stage, index) => {
      const value = values[index]
      const previous = index === 0 ? value : values[index - 1]
      // Ordinal ramp: the stage's position picks its step between the two ends.
      const share = Math.round((index / last) * 100)
      return {
        stage,
        value,
        ofFirst: first > 0 ? Math.min(value / first, 1) : 0,
        ofPrevious: previous > 0 ? value / previous : 0,
        dropOff: Math.max(previous - value, 0),
        color:
          stage?.color ||
          `color-mix(in oklch, var(--_to) ${share}%, var(--_from))`,
      }
    })
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)

    const bar = this.renderRoot.querySelector<HTMLElement>('.bar')
    if (bar && bar.offsetHeight > 0 && bar.offsetHeight !== this.barHeight) {
      // The necks must meet the bars' real minimum width.
      this.barHeight = bar.offsetHeight
      this.requestUpdate()
    }

    if (changed.has('data')) this.animateStages()
    if (this.activeIndex >= 0) this.positionHoverCard()
  }

  private animateStages(): void {
    if (this.hasPlayedEntrance || prefersReducedMotion()) return
    const bars = this.renderRoot.querySelectorAll<HTMLElement>('.bar')
    if (bars.length === 0) return
    this.hasPlayedEntrance = true
    subtleAnimate(
      bars,
      { opacity: [0, 1], transform: ['scaleX(0.4)', 'scaleX(1)'] },
      { duration: 0.5, ease: CHART_EASE, delay: stagger(0.06) },
    )
    const necks = this.renderRoot.querySelectorAll<Element>('.neck, .drop')
    if (necks.length > 0) {
      subtleAnimate(
        necks,
        { opacity: [0, 1] },
        {
          duration: 0.4,
          ease: CHART_EASE,
          delay: stagger(0.03, { startDelay: 0.2 }),
        },
      )
    }
  }

  private positionHoverCard(): void {
    const card = this.renderRoot.querySelector<HTMLElement>('.hover-card')
    const frame = this.renderRoot.querySelector<HTMLElement>('.frame')
    const bar = this.renderRoot.querySelector<HTMLElement>(
      `.stage[data-index="${this.activeIndex}"] .bar`,
    )
    if (card && frame && bar) {
      placeHoverCard(card, frame, bar.getBoundingClientRect())
    }
  }

  private handleStageEnter(index: number, stage: StageModel): void {
    if (index === this.activeIndex) return
    this.activeIndex = index
    this.lastShown = index

    const bar = this.renderRoot.querySelector<HTMLElement>(
      `.stage[data-index="${index}"] .bar`,
    )
    const rect = bar?.getBoundingClientRect()
    const box = this.getBoundingClientRect()
    this.dispatchEvent(
      new CustomEvent('point-hover', {
        bubbles: true,
        composed: true,
        detail: {
          point: stage.stage,
          value: stage.value,
          label: stage.stage.label,
          x: rect ? Math.round(rect.left + rect.width / 2 - box.left) : 0,
          y: rect ? Math.round(rect.top - box.top) : 0,
        },
      }),
    )
  }

  private handleStageLeave(): void {
    if (this.activeIndex < 0) return
    this.activeIndex = -1
    this.dispatchEvent(
      new CustomEvent('point-leave', { bubbles: true, composed: true }),
    )
  }

  /** Bar width in px, mirroring the CSS `max(var(--_bar-h), var(--_w))`. */
  private barWidth(trackWidth: number, ratio: number): number {
    return Math.min(Math.max(this.barHeight, trackWidth * ratio), trackWidth)
  }

  private renderNeck(
    width: number,
    top: StageModel,
    bottom: StageModel,
    index: number,
  ) {
    const from = this.barWidth(width, top.ofFirst)
    const to = this.barWidth(width, bottom.ofFirst)
    // Start inside the bar's rounded corners so the neck reads as its continuation.
    const inset = Math.min(this.barHeight * 0.25, from / 4)
    const l0 = (width - from) / 2 + inset
    const r0 = (width + from) / 2 - inset
    const l1 = (width - to) / 2
    const r1 = (width + to) / 2
    const h = NECK_HEIGHT
    const k = h * 0.55
    const d = `M${l0},0 L${r0},0 C${r0},${k} ${r1},${h - k} ${r1},${h} L${l1},${h} C${l1},${h - k} ${l0},${k} ${l0},0 Z`
    const id = `neck-fade-${index}`

    return html`
      <div class="connector" aria-hidden="true">
        <svg
          class="neck"
          viewBox="0 0 ${width} ${h}"
          preserveAspectRatio="none"
          focusable="false"
        >
          ${svg`
            <defs>
              <linearGradient id=${id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style="stop-color: ${top.color}; stop-opacity: var(--_fade-top)" />
                <stop offset="1" style="stop-color: ${top.color}; stop-opacity: var(--_fade-bottom)" />
              </linearGradient>
            </defs>
            <path d=${d} fill="url(#${id})" />
          `}
        </svg>
        <span part="drop" class="drop">${MINUS}${this.formatPercent(1 - bottom.ofPrevious)}</span>
      </div>
    `
  }

  private renderSummary(stages: StageModel[]) {
    const last = stages[stages.length - 1]
    let steepest = -1
    for (let i = 1; i < stages.length; i++) {
      if (
        stages[i].dropOff > 0 &&
        (steepest < 0 || stages[i].ofPrevious <= stages[steepest].ofPrevious)
      ) {
        steepest = i
      }
    }

    return html`
      <div part="summary" class="summary">
        <p class="headline">
          <span part="conversion" class="conversion">${this.formatPercent(last.ofFirst)}</span>
          <span class="conversion-label">${this.summaryLabel}</span>
        </p>
        ${
          steepest > 0
            ? html`<p part="biggest-drop" class="biggest-drop">
                Biggest drop: ${stages[steepest - 1].stage.label} → ${stages[steepest].stage.label}
                <span class="drop-value">${MINUS}${this.formatPercent(1 - stages[steepest].ofPrevious)}</span>
              </p>`
            : nothing
        }
      </div>
    `
  }

  private renderHoverCard(stages: StageModel[]) {
    const shown = this.activeIndex >= 0
    const stage = stages[shown ? this.activeIndex : this.lastShown]
    const previous = stages[(shown ? this.activeIndex : this.lastShown) - 1]

    return html`
      <div part="tooltip" class="hover-card" aria-hidden="true" ?data-open=${shown && !!stage}>
        ${
          stage
            ? html`
              <span class="hover-card-value">${this.formatValue(stage.value)}</span>
              <span class="hover-card-label">${stage.stage.label}</span>
              ${
                previous
                  ? html`
                    <span class="hover-card-row">
                      From ${previous.stage.label}
                      <strong>${this.formatPercent(stage.ofPrevious, true)}</strong>
                    </span>
                    <span class="hover-card-row">
                      Dropped off
                      <strong>${this.formatValue(stage.dropOff)}</strong>
                    </span>
                  `
                  : nothing
              }
            `
            : nothing
        }
      </div>
    `
  }

  protected override render() {
    const stages = this.stages
    if (stages.length === 0) {
      return html`
        <div part="empty" class="empty-state">
          <slot name="empty">
            <p class="empty-message">No data available</p>
          </slot>
        </div>
      `
    }

    const width =
      this.layoutController.width > 0 ? this.layoutController.width : 600

    return html`
      <div part="base" class="frame">
        ${this.hideSummary ? nothing : this.renderSummary(stages)}
        <ol part="stages" class="stages" @pointerleave=${this.handleStageLeave}>
          ${stages.map((stage, index) => {
            const next = stages[index + 1]
            const state =
              this.activeIndex < 0
                ? ''
                : index === this.activeIndex
                  ? 'is-active'
                  : 'is-dimmed'
            return html`
              <li
                part="stage"
                class="stage ${state}"
                data-index=${index}
                style="--_color: ${stage.color}; --_w: ${stage.ofFirst * 100}%"
                @pointerenter=${() => this.handleStageEnter(index, stage)}
              >
                <div class="stage-header">
                  <span part="stage-label" class="stage-label">${stage.stage.label}</span>
                  <span class="stage-value">
                    <span class="stage-count">${this.formatValue(stage.value)}</span>
                    <span class="stage-sep" aria-hidden="true">·</span>
                    <span class="stage-percent">${this.formatPercent(stage.ofFirst)}</span>
                    ${
                      index > 0
                        ? html`<span class="sr-only">
                            , ${this.formatPercent(1 - stage.ofPrevious)} drop-off from the previous step
                          </span>`
                        : nothing
                    }
                  </span>
                </div>
                <div class="track"><div part="bar" class="bar"></div></div>
                ${next ? this.renderNeck(width, stage, next, index) : nothing}
              </li>
            `
          })}
        </ol>
        ${this.renderHoverCard(stages)}
      </div>
    `
  }
}

defineElement('moul-funnel-chart', MoulFunnelChart)

export { MoulFunnelChart as FunnelChart }

declare global {
  interface HTMLElementTagNameMap {
    'moul-funnel-chart': MoulFunnelChart
  }
}
