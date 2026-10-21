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
      gap: var(--spacing-1, 0.25rem);
      width: 100%;
    }

    /* Rows follow HeroUI list-box-item: min-h-9, px-2 py-1.5, rounded. */
    .item {
      display: grid;
      grid-template-columns: minmax(100px, 1.5fr) 2fr minmax(60px, auto);
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
      min-height: 2.25rem;
      padding: 0.375rem var(--spacing-2, 0.5rem);
      border-radius: var(--radius-xl, 0.75rem);
      outline: none;
      transition:
        background-color var(--duration-fast, 150ms) var(--ease-smooth, ease),
        transform 250ms var(--ease-out, ease-out),
        box-shadow var(--duration-fast, 150ms) var(--ease-out, ease-out);
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      box-sizing: border-box;
    }

    :host([show-rank]) .item,
    .item.has-rank {
      grid-template-columns: 2rem minmax(100px, 1.5fr) 2fr minmax(60px, auto);
    }

    .item:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .item--interactive {
      cursor: pointer;
    }

    @media (hover: hover) {
      .item--interactive:hover {
        background-color: var(--color-default, oklch(0.94 0.001 286.375));
      }
    }

    .item--interactive:active {
      transform: scale(0.98);
    }

    /* Rank: a small default-tone chip. */
    .rank {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: var(--line-height-xs, 1rem);
      color: var(--color-muted, #71717a);
      text-align: center;
      font-variant-numeric: tabular-nums;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      justify-self: center;
      box-sizing: border-box;
      min-width: 1.5rem;
      height: 1.5rem;
      padding-inline: var(--spacing-1, 0.25rem);
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-default, oklch(0.94 0.001 286.375));
    }

    .label {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-fg, inherit);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Track and fill follow HeroUI meter: h-2, rounded-sm, default track. */
    .track {
      height: 0.5rem;
      background-color: var(--color-default, oklch(0.94 0.001 286.375));
      border-radius: var(--radius-sm, 0.25rem);
      width: 100%;
      overflow: hidden;
      position: relative;
    }

    .bar {
      height: 100%;
      border-radius: inherit;
      transition: width 300ms var(--ease-out, ease-out);
      min-width: 0;
      background-color: var(--color-chart-1);
    }

    .value {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: var(--line-height-sm, 1.25rem);
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
      color: var(--color-muted, #71717a);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      padding: var(--spacing-4, 1rem);
      text-align: center;
    }

    .empty-message {
      margin: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .item,
      .bar {
        transition: none;
      }

      .item--interactive:active {
        transform: none;
      }
    }
  `,
]

export const styles = topListStyles
export default topListStyles
