import { type CSSResultGroup, css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const topListStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
    }

    .container {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 0.75rem);
    }

    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 0.75rem);
      width: 100%;
    }

    .item {
      display: grid;
      grid-template-columns: minmax(100px, 1.5fr) 2fr minmax(60px, auto);
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
      padding: var(--spacing-1, 0.25rem) var(--spacing-2, 0.5rem);
      border-radius: var(--radius-md, 0.75rem);
      transition: background-color 150ms ease, transform 150ms ease;
      user-select: none;
      box-sizing: border-box;
    }

    :host([show-rank]) .item,
    .item.has-rank {
      grid-template-columns: 2rem minmax(100px, 1.5fr) 2fr minmax(60px, auto);
    }

    .item--interactive {
      cursor: pointer;
    }

    .item--interactive:hover {
      background-color: var(--color-bg-subtle, oklch(0.97 0 0));
    }

    .item--interactive:active {
      transform: scale(0.995);
      background-color: var(--color-neutral-200, oklch(0.92 0 0));
    }

    .item--interactive:focus-visible {
      outline: 2px solid var(--color-border-focus);
      outline-offset: 2px;
    }

    .rank {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-fg-subtle, oklch(0.42 0 0));
      text-align: center;
      font-variant-numeric: tabular-nums;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.5rem;
      height: 1.5rem;
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-bg-subtle, oklch(0.97 0 0));
    }

    .label {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-fg, inherit);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .track {
      height: 6px;
      background-color: var(--color-neutral-200, oklch(0.92 0 0));
      border-radius: var(--radius-full, 9999px);
      width: 100%;
      overflow: hidden;
      position: relative;
    }

    .bar {
      height: 100%;
      border-radius: var(--radius-full, 9999px);
      transition: width 350ms cubic-bezier(0.22, 1, 0.36, 1);
      min-width: 0;
      background-color: var(--color-chart-1);
    }

    .value {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-fg, inherit);
      text-align: end;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 120px;
      color: var(--color-fg-subtle, oklch(0.42 0 0));
      font-size: var(--font-size-sm, 0.875rem);
      padding: var(--spacing-4, 1rem);
      text-align: center;
    }

    .empty-message {
      margin: 0;
    }
  `,
]

export const styles = topListStyles
export default topListStyles
