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

    [part="base"] {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    :host([orientation="vertical"]) [part="base"] {
      flex-direction: row;
      gap: var(--spacing-4, 1rem);
    }

    [part="tablist"] {
      display: flex;
      flex-direction: row;
      position: relative;
      border-bottom: 1px solid var(--color-border, #e5e7eb);
      overflow-x: auto;
      scrollbar-width: none;
    }

    [part="tablist"]::-webkit-scrollbar {
      display: none;
    }

    :host([orientation="vertical"]) [part="tablist"] {
      flex-direction: column;
      border-bottom: none;
      border-right: 1px solid var(--color-border, #e5e7eb);
    }

    :host([variant="pill"]) [part="tablist"] {
      background-color: var(--color-bg-subtle, #f3f4f6);
      border-radius: var(--radius-full, 9999px);
      padding: var(--spacing-1, 0.25rem);
      border: none;
      gap: var(--spacing-1, 0.25rem);
      width: fit-content;
    }

    :host([variant="enclosed"]) [part="tablist"] {
      border-bottom: 1px solid var(--color-border, #e5e7eb);
      gap: var(--spacing-1, 0.25rem);
    }

    [part="indicator"] {
      position: absolute;
      bottom: 0;
      height: 2px;
      background-color: var(--color-primary-500, #4f46e5);
      pointer-events: none;
      border-radius: var(--radius-full, 9999px);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    :host([orientation="vertical"]) [part="indicator"] {
      right: 0;
      bottom: auto;
      width: 2px;
      height: 100%;
    }

    :host([variant="pill"]) [part="indicator"] {
      inset: 0;
      height: 100%;
      background-color: var(--color-bg-elevated, #ffffff);
      border-radius: var(--radius-full, 9999px);
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
      z-index: 0;
    }

    [part="panels"] {
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

    [part="base"] {
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
      border-radius: var(--radius-md, 0.375rem);
      transition: color 0.15s ease, background-color 0.15s ease;
      white-space: nowrap;
    }

    [part="base"]:hover:not(:disabled) {
      color: var(--color-fg, #111827);
    }

    :host([aria-selected="true"]) [part="base"],
    :host([is-selected]) [part="base"] {
      color: var(--color-primary-600, #4f46e5);
      font-weight: 600;
    }

    :host([is-disabled]) [part="base"],
    [part="base"]:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }

    [part="base"]:focus-visible {
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: -2px;
      border-radius: var(--radius-sm, 0.25rem);
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
