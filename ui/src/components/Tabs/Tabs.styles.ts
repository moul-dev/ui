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
      gap: var(--spacing-1, 0.25rem);
      border-bottom: 1px solid var(--color-border-subtle, #e5e7eb);
      overflow-x: auto;
      scrollbar-width: none;
    }

    [part~="tablist"]::-webkit-scrollbar {
      display: none;
    }

    :host([orientation="vertical"]) [part~="tablist"] {
      flex-direction: column;
      border-bottom: none;
      border-inline-end: 1px solid var(--color-border-subtle, #e5e7eb);
    }

    /* Pill: an iOS segmented control — recessed track, floating glass thumb */
    :host([variant="pill"]) [part~="tablist"] {
      background-color: var(--color-fill-track);
      border-radius: var(--radius-full, 9999px);
      padding: 3px;
      border: none;
      gap: 0;
      width: fit-content;
      max-width: 100%;
    }

    :host([variant="pill"][orientation="vertical"]) [part~="tablist"] {
      border-radius: var(--radius-md, 0.75rem);
    }

    :host([variant="enclosed"]) [part~="tablist"] {
      gap: var(--spacing-1, 0.25rem);
    }

    [part~="indicator"] {
      position: absolute;
      top: 0;
      left: 0;
      z-index: -1;
      pointer-events: none;
      opacity: 0;
      transition:
        translate var(--duration-slow, 420ms) var(--ease-spring, ease),
        width var(--duration-slow, 420ms) var(--ease-spring, ease),
        height var(--duration-slow, 420ms) var(--ease-spring, ease),
        opacity var(--duration-fast, 140ms) ease;
    }

    [part~="indicator"][data-visible] {
      opacity: 1;
    }

    /* Line: a 2px underline drawn along the bottom edge of the active tab */
    :host(:not([variant])) [part~="indicator"]::after,
    :host([variant="line"]) [part~="indicator"]::after {
      content: "";
      position: absolute;
      inset: auto var(--spacing-2, 0.5rem) -1px;
      height: 2px;
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-primary-500, #4f46e5);
    }

    :host([orientation="vertical"]:not([variant="pill"])) [part~="indicator"]::after {
      inset: var(--spacing-1, 0.25rem) -1px var(--spacing-1, 0.25rem) auto;
      width: 2px;
      height: auto;
    }

    :host([variant="pill"]) [part~="indicator"] {
      background-color: light-dark(oklch(1 0 0), oklch(0.36 0 0));
      border-radius: inherit;
      box-shadow:
        var(--glass-highlight),
        0 0 0 0.5px var(--glass-edge),
        0 3px 8px -2px light-dark(oklch(0 0 0 / 0.14), oklch(0 0 0 / 0.5));
    }

    :host([variant="pill"]:not([orientation="vertical"])) [part~="indicator"] {
      border-radius: var(--radius-full, 9999px);
    }

    :host([variant="pill"][orientation="vertical"]) [part~="indicator"] {
      border-radius: calc(var(--radius-md, 0.75rem) - 3px);
    }

    :host([variant="enclosed"]) [part~="indicator"] {
      background-color: var(--color-bg, #fff);
      border: 1px solid var(--color-border-subtle, #e5e7eb);
      border-bottom-color: transparent;
      border-radius: var(--radius-sm, 0.375rem) var(--radius-sm, 0.375rem) 0 0;
      margin-bottom: -1px;
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
    }

    [part~="base"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-2, 0.5rem) var(--spacing-4, 1rem);
      font-family: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: 500;
      color: var(--color-fg-subtle, #6b7280);
      background: transparent;
      border: none;
      cursor: pointer;
      user-select: none;
      outline: none;
      border-radius: var(--radius-full, 9999px);
      transition: color var(--duration-base, 240ms) ease, background-color var(--duration-fast, 140ms) ease;
      white-space: nowrap;
      width: 100%;
    }

    [part~="base"]:hover:not(:disabled) {
      color: var(--color-fg, #111827);
    }

    :host(:not([is-selected])) [part~="base"]:hover:not(:disabled) {
      background-color: var(--color-fill-hover);
    }

    :host([data-variant="pill"]) [part~="base"] {
      padding: 0.375rem var(--spacing-4, 1rem);
    }

    :host([data-variant="pill"]:not([is-selected])) [part~="base"]:hover:not(:disabled) {
      background-color: transparent;
      color: var(--color-fg, #111827);
    }

    :host([aria-selected="true"]) [part~="base"],
    :host([is-selected]) [part~="base"] {
      color: var(--color-fg, #111827);
    }

    :host([is-disabled]) [part~="base"],
    [part~="base"]:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }

    :host(:focus-visible) {
      outline: none;
    }

    :host(:focus-visible) [part~="base"] {
      box-shadow: var(--focus-ring);
    }
  `,
]

export const tabPanelStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      padding: var(--spacing-4, 1rem) 0;
      color: var(--color-fg, #111827);
      outline: none;
    }

    :host([hidden]),
    [hidden] {
      display: none !important;
    }

    :host(:focus-visible) {
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: 2px;
    }
  `,
]
