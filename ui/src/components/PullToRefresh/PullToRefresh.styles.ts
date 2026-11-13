import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const pullToRefreshStyles = [
  resetStyles,
  css`
    :host {
      position: relative;
      display: block;
      overflow: hidden;
      isolation: isolate;
    }

    :host([hidden]) {
      display: none;
    }

    /* Fills the gap the pull opens above the content, its icon and text centred in it. */
    .indicator {
      position: absolute;
      inset-inline: 0;
      top: 0;
      height: max(0px, var(--_pull-y, 0px));
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-2, 0.5rem);
      color: var(--color-muted);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      pointer-events: none;
      transition: color var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    .indicator[data-armed],
    .indicator[data-phase="refreshing"],
    .indicator[data-phase="done"] {
      color: var(--color-fg);
    }

    .arrow {
      display: inline-grid;
      width: 1.25rem;
      height: 1.25rem;
      rotate: calc(var(--_pull-progress, 0) * 180deg);
      opacity: calc(0.35 + var(--_pull-progress, 0) * 0.65);
    }

    .arrow svg {
      width: 100%;
      height: 100%;
    }

    .scroller {
      position: relative;
      height: 100%;
      max-height: inherit;
      overflow: auto;
      overscroll-behavior-y: contain;
      translate: 0 var(--_pull-y, 0px);
      /* Pans stay with the browser; a pull cancels them from touchmove. */
      touch-action: manipulation;
    }

    .scroller[data-dragging] {
      user-select: none;
      -webkit-user-select: none;
    }

    /* Hidden until focused, like a skip link. */
    .refresh-button {
      position: absolute;
      top: var(--spacing-2, 0.5rem);
      left: 50%;
      z-index: 1;
      translate: -50% 0;
      padding: var(--spacing-1, 0.25rem) var(--spacing-3, 0.75rem);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-bg-elevated);
      color: var(--color-fg);
      font: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      box-shadow: var(--shadow-md);
      cursor: pointer;
    }

    .refresh-button:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring), var(--shadow-md);
    }

    .refresh-button:not(:focus),
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .indicator {
        transition: none;
      }
    }
  `,
]
