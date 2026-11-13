import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

const srOnly = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`

export const stepperStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
      container: moul-stepper / inline-size;
    }

    [part~="list"] {
      position: relative;
      isolation: isolate;
      display: flex;
      flex-direction: column;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    /*
     * Horizontal: the steps share one grid. Every moul-step spans both rows
     * and lays its header into its own column of row 1 and its panel across
     * row 2 (subgrid), so the current panel sits under the whole strip.
     */
    :host(:not([orientation="vertical"])) [part~="list"] {
      display: grid;
      grid-template-rows: auto auto;
      column-gap: var(--spacing-3, 0.75rem);
      row-gap: var(--spacing-5, 1.25rem);
    }

    /* A soft halo that glides to the current step's indicator */
    [part~="highlight"] {
      --_halo: var(--color-accent);
      position: absolute;
      top: 0;
      left: 0;
      z-index: 0;
      pointer-events: none;
      border-radius: var(--radius-full, 9999px);
      box-shadow: 0 0 0 4px color-mix(in oklch, var(--_halo) 22%, transparent);
      opacity: 0;
      transition:
        translate var(--duration-slow, 400ms) var(--ease-spring, ease-out),
        width var(--duration-slow, 400ms) var(--ease-spring, ease-out),
        height var(--duration-slow, 400ms) var(--ease-spring, ease-out),
        opacity var(--duration-fast, 150ms) var(--ease-smooth, ease);
    }

    [part~="highlight"][data-visible] {
      opacity: 1;
    }

    [part~="highlight"][data-invalid] {
      --_halo: var(--color-danger);
    }

    .sr-only {
      ${srOnly}
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="highlight"] {
        transition: none;
      }
    }
  `,
]

export const stepStyles = [
  resetStyles,
  css`
    :host {
      --_indicator-size: 2rem;
      display: block;
      position: relative;
      z-index: 1;
      min-width: 0;
    }

    :host([data-orientation="horizontal"]) {
      grid-column: 1 / -1;
      grid-row: 1 / span 2;
      display: grid;
      grid-template-columns: subgrid;
      grid-template-rows: subgrid;
      /* The steps overlap; only their header and panel take the pointer */
      pointer-events: none;
    }

    :host([data-entering]) {
      overflow: clip;
    }

    .item {
      display: flex;
      align-items: center;
      min-width: 0;
      pointer-events: auto;
    }

    :host([data-orientation="horizontal"]) .item {
      grid-row: 1;
    }

    [part~="trigger"] {
      display: flex;
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
      min-width: 0;
      padding: 0;
      color: inherit;
      text-align: start;
      background: transparent;
      border: none;
      border-radius: var(--radius-xl, 0.75rem);
      cursor: pointer;
    }

    [part~="trigger"][aria-current],
    [part~="trigger"][aria-disabled="true"] {
      cursor: default;
    }

    :host([is-disabled]) [part~="trigger"] {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    [part~="indicator"] {
      display: inline-grid;
      place-items: center;
      flex-shrink: 0;
      width: var(--_indicator-size);
      height: var(--_indicator-size);
      border-radius: var(--radius-full, 9999px);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: 1;
      font-weight: var(--font-weight-semibold, 600);
      font-variant-numeric: tabular-nums;
      background-color: var(--color-default);
      color: var(--color-muted);
      transition:
        background-color var(--duration-base, 250ms) var(--ease-smooth, ease),
        color var(--duration-base, 250ms) var(--ease-smooth, ease);
    }

    [part~="indicator"] svg,
    ::slotted([slot="icon"]) {
      width: 1rem;
      height: 1rem;
    }

    @media (hover: hover) {
      [part~="trigger"]:not([aria-current]):not([aria-disabled]):hover
        [part~="indicator"] {
        background-color: var(--color-default-hover);
      }
    }

    :host([data-status="complete"]) [part~="indicator"] {
      background-color: var(--color-accent-soft);
      color: var(--color-accent-soft-fg);
    }

    :host([data-status="current"]) [part~="indicator"] {
      background-color: var(--color-accent);
      color: var(--color-accent-fg);
    }

    :host([is-invalid]) [part~="indicator"] {
      background-color: var(--color-danger-soft);
      color: var(--color-danger-soft-fg);
    }

    :host([is-invalid][data-status="current"]) [part~="indicator"] {
      background-color: var(--color-danger);
      color: var(--color-danger-fg);
    }

    .text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    [part~="label"],
    [part~="description"] {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    [part~="label"] {
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-muted);
      transition: color var(--duration-base, 250ms) var(--ease-smooth, ease);
    }

    :host([data-status="current"]) [part~="label"],
    :host([data-status="complete"]) [part~="label"] {
      color: var(--color-fg);
    }

    :host([is-invalid]) [part~="label"] {
      color: var(--color-danger-soft-fg);
    }

    :host([data-orientation="vertical"]) [part~="label"],
    :host([data-orientation="vertical"]) [part~="description"] {
      white-space: normal;
    }

    [part~="description"] {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      color: var(--color-muted);
    }

    /* The track between this step and the next; it fills once this step is done */
    [part~="connector"] {
      position: relative;
      flex: 1;
      min-width: var(--spacing-4, 1rem);
      height: 2px;
      margin-inline-start: var(--spacing-3, 0.75rem);
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-border);
      overflow: hidden;
    }

    [part~="connector-fill"] {
      position: absolute;
      inset: 0;
      background-color: var(--color-accent);
      transform-origin: left center;
      scale: 0 1;
      transition: scale var(--duration-slow, 400ms) var(--ease-out, ease-out);
    }

    :host(:dir(rtl)) [part~="connector-fill"] {
      transform-origin: right center;
    }

    :host([data-status="complete"]) [part~="connector-fill"] {
      scale: 1 1;
    }

    [part~="panel"] {
      min-width: 0;
      pointer-events: auto;
    }

    :host([data-orientation="horizontal"]) [part~="panel"] {
      grid-row: 2;
      grid-column: 1 / -1;
    }

    /* Vertical: each panel opens under its own header, beside the connector */
    :host([data-orientation="vertical"]) {
      padding-bottom: var(--spacing-4, 1rem);
    }

    :host([data-orientation="vertical"]:last-of-type) {
      padding-bottom: 0;
    }

    :host([data-orientation="vertical"]) [part~="connector"] {
      position: absolute;
      inset-inline-start: calc(var(--_indicator-size) / 2 - 1px);
      top: calc(var(--_indicator-size) + var(--spacing-2, 0.5rem));
      bottom: var(--spacing-2, 0.5rem);
      width: 2px;
      height: auto;
      min-width: 0;
      margin: 0;
    }

    :host([data-orientation="vertical"]) [part~="connector-fill"] {
      transform-origin: center top;
      scale: 1 0;
    }

    :host([data-orientation="vertical"][data-status="complete"])
      [part~="connector-fill"] {
      scale: 1 1;
    }

    :host([data-orientation="vertical"]) [part~="panel"] {
      padding-top: var(--spacing-3, 0.75rem);
      padding-inline-start: calc(var(--_indicator-size) + var(--spacing-3, 0.75rem));
    }

    /* Narrow strips keep only the current step's text on screen */
    @container moul-stepper (max-width: 32rem) {
      :host([data-orientation="horizontal"]:not([data-status="current"])) .text {
        ${srOnly}
      }
    }

    .sr-only {
      ${srOnly}
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="indicator"],
      [part~="label"],
      [part~="connector-fill"] {
        transition: none;
      }
    }
  `,
]
