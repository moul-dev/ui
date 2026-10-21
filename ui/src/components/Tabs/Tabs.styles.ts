import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const tabsStyles = [
  resetStyles,
  css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    :host([orientation="vertical"]) {
      flex-direction: row;
      gap: var(--spacing-4, 1rem);
    }

    [part~="base"] {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    :host([orientation="vertical"]) [part~="base"] {
      flex-direction: row;
      gap: var(--spacing-4, 1rem);
    }

    [part~="tablist"] {
      display: flex;
      flex-direction: row;
      position: relative;
      isolation: isolate;
      overflow-x: auto;
      scrollbar-width: none;
    }

    [part~="tablist"]::-webkit-scrollbar {
      display: none;
    }

    /* A scroll container's automatic min-size is 0; keep the panels from crushing it */
    :host([orientation="vertical"]) [part~="tablist"] {
      flex-direction: column;
      flex-shrink: 0;
    }

    /* Line: a hairline under the strip; the active tab carries a 2px accent underline */
    :host(:not([variant])) [part~="tablist"],
    :host([variant="line"]) [part~="tablist"] {
      border-bottom: 1px solid var(--color-border);
    }

    :host([orientation="vertical"]:not([variant])) [part~="tablist"],
    :host([orientation="vertical"][variant="line"]) [part~="tablist"] {
      border-bottom: none;
      border-inline-end: 1px solid var(--color-border);
    }

    /* Pill: a segmented control — a soft track, the active tab rides a raised segment */
    :host([variant="pill"]) [part~="tablist"] {
      padding: var(--spacing-1, 0.25rem);
      border-radius: calc(var(--radius-base, 0.5rem) * 2.5);
      background-color: var(--color-default);
    }

    :host([variant="pill"]:not([orientation="vertical"])) ::slotted([slot="tab"]) {
      flex: 1 1 0;
    }

    :host([variant="pill"][orientation="vertical"]) [part~="tablist"] {
      gap: var(--spacing-1, 0.25rem);
    }

    :host([variant="pill"][orientation="vertical"]) ::slotted([slot="tab"]) {
      min-width: 5rem;
    }

    /* Enclosed: folder tabs; the active one opens onto the content below */
    :host([variant="enclosed"]) [part~="tablist"] {
      gap: var(--spacing-1, 0.25rem);
      box-shadow: inset 0 -1px 0 var(--color-border);
    }

    :host([variant="enclosed"][orientation="vertical"]) [part~="tablist"] {
      box-shadow: inset -1px 0 0 var(--color-border);
    }

    [part~="indicator"] {
      position: absolute;
      top: 0;
      left: 0;
      z-index: -1;
      pointer-events: none;
      opacity: 0;
      transition:
        translate 250ms var(--ease-out-fluid, ease-out),
        width 250ms var(--ease-out-fluid, ease-out),
        height 250ms var(--ease-out-fluid, ease-out),
        opacity var(--duration-fast, 150ms) var(--ease-smooth, ease);
    }

    [part~="indicator"][data-visible] {
      opacity: 1;
    }

    :host(:not([variant])) [part~="indicator"]::after,
    :host([variant="line"]) [part~="indicator"]::after {
      content: "";
      position: absolute;
      inset: auto 0 0;
      height: 2px;
      background-color: var(--color-accent);
    }

    :host([orientation="vertical"]:not([variant])) [part~="indicator"]::after,
    :host([orientation="vertical"][variant="line"]) [part~="indicator"]::after {
      inset-block: 0;
      inset-inline: auto 0;
      width: 2px;
      height: auto;
    }

    :host([variant="pill"]) [part~="indicator"] {
      border-radius: var(--radius-3xl, 1.5rem);
      background-color: var(--color-segment);
      box-shadow: var(--shadow-surface);
    }

    :host([variant="enclosed"]) [part~="indicator"] {
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-bottom-color: transparent;
      border-radius: var(--radius-xl, 0.75rem) var(--radius-xl, 0.75rem) 0 0;
    }

    :host([variant="enclosed"][orientation="vertical"]) [part~="indicator"] {
      border-bottom-color: var(--color-border);
      border-right-color: transparent;
      border-radius: var(--radius-xl, 0.75rem) 0 0 var(--radius-xl, 0.75rem);
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="indicator"] {
        transition: none;
      }
    }

    [part~="panels"] {
      display: block;
      width: 100%;
      position: relative;
    }
  `,
]

export const tabStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      position: relative;
      z-index: 1;
      -webkit-tap-highlight-color: transparent;
    }

    [part~="base"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 2rem;
      padding: 0 var(--spacing-4, 1rem);
      font-family: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-muted);
      text-align: center;
      white-space: nowrap;
      background: transparent;
      border: none;
      border-radius: 0;
      outline: none;
      cursor: pointer;
      user-select: none;
      transition:
        color 150ms var(--ease-smooth, ease),
        background-color 150ms var(--ease-smooth, ease),
        box-shadow 150ms var(--ease-out, ease-out),
        opacity 150ms var(--ease-smooth, ease);
    }

    :host([data-variant="pill"]) [part~="base"] {
      border-radius: var(--radius-3xl, 1.5rem);
    }

    :host([data-variant="enclosed"]) [part~="base"] {
      border-radius: var(--radius-xl, 0.75rem) var(--radius-xl, 0.75rem) 0 0;
    }

    :host([aria-selected="true"]) [part~="base"],
    :host([is-selected]) [part~="base"] {
      color: var(--color-fg);
    }

    @media (hover: hover) {
      :host(:not([is-selected])) [part~="base"]:hover:not(:disabled) {
        opacity: 0.7;
      }
    }

    :host([is-disabled]) [part~="base"],
    [part~="base"]:disabled {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
      pointer-events: none;
    }

    :host(:focus-visible) {
      outline: none;
    }

    :host(:focus-visible) [part~="base"] {
      box-shadow: var(--focus-ring);
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="base"] {
        transition: none;
      }
    }
  `,
]

export const tabPanelStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      padding: var(--spacing-4, 1rem) 0;
      color: var(--color-fg);
      border-radius: var(--radius-xl, 0.75rem);
      outline: none;
    }

    :host([hidden]),
    [hidden] {
      display: none !important;
    }

    :host(:focus-visible) {
      outline: none;
      box-shadow: var(--focus-ring);
    }
  `,
]
