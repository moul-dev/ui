import { type CSSResultGroup, css } from 'lit'
import { chartHoverCardStyles } from '../../styles/chart-hover-card.styles'
import { resetStyles } from '../../styles/reset.styles'

export const heatmapChartStyles: CSSResultGroup = [
  resetStyles,
  chartHoverCardStyles,
  css`
    :host {
      display: block;
      position: relative;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--font-family-base, inherit);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-fg, inherit);
      /* Ramp hue; each level mixes more of it into the empty-cell track */
      --_heat: var(--color-chart-sequential, oklch(0.76 0.15 163));
      --_heat-0: var(--color-default, oklch(0.94 0.001 286.375));
      --_gap: 3px;
      --_cell-min: 0.625rem;
      --_cell-max: 1.75rem;
      --_stagger: 6ms;
      /* Day-label column, fixed so the cell size can be solved in CSS */
      --_gutter: 2.25rem;
      --_gutter-gap: var(--spacing-2, 0.5rem);
      --_label-row: var(--line-height-xs, 1rem);
    }

    :host([mode="hour"]) {
      --_gap: 4px;
      --_cell-max: 2rem;
      --_stagger: 12ms;
    }

    .frame {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 0.75rem);
    }

    [part~="summary"],
    .summary {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--spacing-1, 0.25rem) var(--spacing-4, 1rem);
    }

    .summary p {
      margin: 0;
    }

    [part~="total"],
    .total {
      font-weight: var(--font-weight-medium, 500);
      font-variant-numeric: tabular-nums;
    }

    [part~="peak"],
    .peak {
      color: var(--color-muted);
      font-variant-numeric: tabular-nums;
    }

    /* Cells fill the width until they hit --_cell-min, then the grid scrolls */
    .plot {
      container-type: inline-size;
    }

    .plot-body {
      display: flex;
      gap: var(--_gutter-gap);
      --_cell: clamp(
        var(--_cell-min),
        (
            100cqi - var(--_gutter) - var(--_gutter-gap) - (var(--_cols) - 1) *
              var(--_gap)
          ) /
          var(--_cols),
        var(--_cell-max)
      );
    }

    .days,
    .grid {
      display: grid;
      grid-template-rows: var(--_label-row) repeat(7, var(--_cell));
      row-gap: var(--_gap);
    }

    .days {
      flex: none;
      width: var(--_gutter);
    }

    .row-label,
    .col-label {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--_label-row);
      color: var(--color-muted);
      white-space: nowrap;
      user-select: none;
    }

    .row-label {
      align-self: center;
    }

    .col-label {
      grid-row: 1;
    }

    /* Padding gives focus rings room; overflow-x also clips vertically */
    [part~="scroller"],
    .scroller {
      flex: 1;
      min-width: 0;
      padding: 3px;
      margin: -3px;
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scrollbar-width: thin;
      scrollbar-color: var(--color-scrollbar-thumb) transparent;
    }

    .scroller[data-clipped] {
      mask-image: linear-gradient(to right, transparent, #000 var(--spacing-6, 1.5rem));
    }

    .grid {
      grid-template-columns: repeat(var(--_cols), var(--_cell));
      column-gap: var(--_gap);
      width: max-content;
    }

    .row {
      display: contents;
    }

    [part~="cell"],
    .cell {
      position: relative;
      border-radius: min(25%, var(--radius-sm, 0.25rem));
      background-color: var(--_heat-0);
      outline: none;
      transition: box-shadow var(--duration-fast, 150ms) var(--ease-out, ease-out);
      animation: heat-in 420ms var(--ease-out, ease-out) both;
      animation-delay: calc(var(--_c, 0) * var(--_stagger));
    }

    .cell[data-level="1"],
    .swatch[data-level="1"] {
      background-color: color-mix(in oklab, var(--_heat) 30%, var(--_heat-0));
    }

    .cell[data-level="2"],
    .swatch[data-level="2"] {
      background-color: color-mix(in oklab, var(--_heat) 55%, var(--_heat-0));
    }

    .cell[data-level="3"],
    .swatch[data-level="3"] {
      background-color: color-mix(in oklab, var(--_heat) 80%, var(--_heat-0));
    }

    .cell[data-level="4"],
    .swatch[data-level="4"] {
      background-color: var(--_heat);
    }

    .cell:hover {
      box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--color-fg) 55%, transparent);
    }

    .cell:focus-visible {
      z-index: 1;
      box-shadow:
        0 0 0 1px var(--color-surface, var(--color-bg)),
        0 0 0 3px var(--color-focus);
    }

    @keyframes heat-in {
      from {
        opacity: 0;
        scale: 0.6;
      }
    }

    [part~="legend"],
    .legend {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--spacing-2, 0.5rem);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      color: var(--color-muted);
      user-select: none;
    }

    .legend-scale {
      display: inline-flex;
      gap: 3px;
    }

    .swatch {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: var(--radius-xs, 0.125rem);
      background-color: var(--_heat-0);
    }

    @media (prefers-reduced-motion: reduce) {
      .cell {
        animation: none;
        transition: none;
      }
    }
  `,
]

export const styles = heatmapChartStyles
export default heatmapChartStyles
