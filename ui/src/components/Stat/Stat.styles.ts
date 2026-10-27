import { type CSSResultGroup, css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const statStyles: CSSResultGroup = [
  resetStyles,
  semanticToneStyles,
  css`
    /* Presented as a card surface: muted label, bold value, edge-to-edge sparkline */
    :host {
      display: flex;
      flex-direction: column;
      padding: var(--_stat-pad);
      border-radius: var(--radius-surface, 1.5rem);
      font-family: var(--font-family-base, inherit);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-fg, inherit);
      min-width: 180px;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      isolation: isolate;
      --_stat-pad: var(--spacing-5, 1.25rem);
      /* Secondary copy; variants swap it for a tint of their own text color */
      --_stat-muted: var(--color-muted);
      /* Sparkline color; the color attribute overrides it */
      --_stat-chart: var(--_tone-solid-bg);
      /* Ring that lifts the scrub dot off the line */
      --_stat-ring: var(--color-surface);
      transition:
        background-color var(--duration-fast, 150ms) var(--ease-smooth, ease),
        border-color var(--duration-fast, 150ms) var(--ease-smooth, ease),
        box-shadow var(--duration-fast, 150ms) var(--ease-smooth, ease);
    }

    :host(:not([variant])) {
      background-color: var(--color-surface);
      color: var(--color-fg);
      border: none;
      box-shadow: var(--shadow-surface);
    }

    /* Tinted variants draw the sparkline in their own text color */
    :host([variant]) {
      --_stat-muted: color-mix(in oklch, currentColor 78%, transparent);
      --_stat-chart: currentColor;
    }

    :host([variant="solid"]),
    :host([variant="shadow"]) {
      --_stat-ring: var(--_tone-solid-bg);
    }

    /* Bordered and glass keep neutral copy; the tone shows in the frame and chart */
    :host([variant="bordered"]),
    :host([variant="glass"]) {
      color: var(--color-fg);
      --_stat-muted: var(--color-muted);
      --_stat-chart: var(--_tone-solid-bg);
    }

    .header {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      min-height: 1.5rem;
    }

    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--_stat-muted);
      flex-shrink: 0;
    }

    .label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--_stat-muted);
    }

    .body {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      margin-top: var(--spacing-2, 0.5rem);
    }

    /* Affixes share the value's type so "$45,896" and "3.26%" read as one figure */
    .value-row {
      display: flex;
      align-items: baseline;
      font-size: var(--font-size-4xl, 2.25rem);
      line-height: 1.1;
      font-weight: var(--font-weight-bold, 700);
      letter-spacing: -0.035em;
      font-variant-numeric: tabular-nums;
      color: inherit;
    }

    .prefix,
    .suffix {
      white-space: pre;
    }

    .value {
      color: inherit;
    }

    /* Holds its line even when empty, so scrub labels don't shift the card */
    .description {
      min-height: var(--line-height-sm, 1.25rem);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--_stat-muted);
    }

    .footer {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-2, 0.5rem);
      margin-top: var(--spacing-3, 0.75rem);
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--_stat-muted);
    }

    /* Delta pill: soft sentiment fill, solid triangle */
    .trend-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3125rem;
      flex-shrink: 0;
      margin-inline-start: auto;
      padding-block: 0.125rem;
      padding-inline: var(--spacing-2, 0.5rem);
      border-radius: var(--radius-full, 9999px);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .trend-badge.is-positive {
      background-color: var(--color-success-soft);
      color: var(--color-success-soft-fg);
    }

    .trend-badge.is-negative {
      background-color: var(--color-danger-soft);
      color: var(--color-danger-soft-fg);
    }

    .trend-badge.is-neutral {
      background-color: var(--color-default-soft);
      color: var(--color-default-fg);
    }

    /* On solid fills the pill becomes a translucent wash; the triangle carries direction */
    :host([variant="solid"]) .trend-badge,
    :host([variant="shadow"]) .trend-badge {
      background-color: color-mix(in oklch, currentColor 16%, transparent);
      color: inherit;
    }

    .trend-icon {
      width: 0.5rem;
      height: 0.5rem;
      fill: currentColor;
      stroke: currentColor;
      stroke-width: 1;
      stroke-linejoin: round;
    }

    /* Edge to edge: cancels the card padding on the sides and bottom */
    .sparkline {
      margin-top: auto;
      margin-inline: calc(var(--_stat-pad) * -1);
      margin-bottom: calc(var(--_stat-pad) * -1);
      padding-top: var(--spacing-5, 1.25rem);
      color: var(--_stat-chart);
      outline: none;
      /* Horizontal drags scrub; vertical ones still scroll the page */
      touch-action: pan-y;
      user-select: none;
      -webkit-user-select: none;
    }

    /* Keyboard focus on the sparkline rings the whole card */
    .focus-ring {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      box-shadow: inset 0 0 0 2px var(--color-focus);
      opacity: 0;
      pointer-events: none;
    }

    .sparkline:focus-visible + .focus-ring {
      opacity: 1;
    }

    .sparkline-svg,
    .sparkline-guide,
    .sparkline-dot {
      pointer-events: none;
    }

    .sparkline-plot {
      position: relative;
      height: 4rem;
      /* Room for the end dots, so they never sit on the clipped edges */
      --_spark-inset: 0.75rem;
    }

    .sparkline-svg {
      position: absolute;
      top: 0;
      left: var(--_spark-inset);
      width: calc(100% - 2 * var(--_spark-inset));
      height: 100%;
      overflow: visible;
    }

    .sparkline-line {
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }

    .sparkline-stop-start {
      stop-color: light-dark(
        color-mix(in oklch, currentColor 28%, transparent),
        color-mix(in oklch, currentColor 34%, transparent)
      );
    }

    .sparkline-stop-end {
      stop-color: color-mix(in oklch, currentColor 0%, transparent);
    }

    /* Dashed guide under the scrubbed point; reaches up into the gap above the plot.
       Positions use physical sides: time runs left to right in every writing direction. */
    .sparkline-guide {
      position: absolute;
      top: calc(var(--spacing-5, 1.25rem) * -1);
      bottom: 0;
      width: 1px;
      translate: -50% 0;
      background-image: repeating-linear-gradient(
        to bottom,
        color-mix(in oklch, var(--_stat-muted) 60%, transparent) 0 3px,
        transparent 3px 7px
      );
      opacity: 0;
      transition: opacity var(--duration-fast, 150ms) var(--ease-smooth, ease);
    }

    .sparkline[data-active] .sparkline-guide {
      opacity: 1;
    }

    /* At rest it marks the latest point with a halo; while scrubbing it gains a ring */
    .sparkline-dot {
      position: absolute;
      width: 0.5rem;
      height: 0.5rem;
      translate: -50% -50%;
      border-radius: var(--radius-full, 9999px);
      background-color: currentColor;
      box-shadow: 0 0 0 0.25rem color-mix(in oklch, currentColor 22%, transparent);
      transition:
        width var(--duration-fast, 150ms) var(--ease-smooth, ease),
        height var(--duration-fast, 150ms) var(--ease-smooth, ease),
        box-shadow var(--duration-fast, 150ms) var(--ease-smooth, ease);
    }

    .sparkline[data-active] .sparkline-dot {
      width: 0.625rem;
      height: 0.625rem;
      box-shadow: 0 0 0 2px var(--_stat-ring);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      :host,
      .sparkline-guide,
      .sparkline-dot {
        transition: none;
      }
    }
  `,
]
