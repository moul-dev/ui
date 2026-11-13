import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const notificationBellStyles = [
  resetStyles,
  css`
    :host {
      display: inline-block;
      vertical-align: middle;
    }

    :host([hidden]) {
      display: none;
    }

    /* An icon-only ghost button */
    [part~='button'] {
      position: relative;
      display: inline-grid;
      place-items: center;
      width: var(--notification-bell-size, 2.5rem);
      height: var(--notification-bell-size, 2.5rem);
      padding: 0;
      border: 0;
      border-radius: var(--radius-full, 9999px);
      background-color: transparent;
      color: var(--color-fg);
      font: inherit;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background-color 150ms var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      [part~='button']:hover {
        background-color: var(--color-default);
      }
    }

    :host([is-open]) [part~='button'] {
      background-color: var(--color-default);
    }

    [part~='button']:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    [part~='icon'] {
      display: inline-flex;
      width: 1.25rem;
      height: 1.25rem;
    }

    [part~='icon'] svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      /* Swings from the loop at its top */
      transform-origin: 50% 8%;
    }

    [part~='icon'][data-swinging] svg {
      animation: moul-bell-swing 800ms var(--ease-out, ease-out);
    }

    [part~='icon'][data-swinging] .clapper {
      animation: moul-bell-clapper 800ms var(--ease-out, ease-out);
    }

    @keyframes moul-bell-swing {
      15% {
        rotate: 16deg;
      }
      32% {
        rotate: -12deg;
      }
      48% {
        rotate: 8deg;
      }
      64% {
        rotate: -4deg;
      }
      80% {
        rotate: 1.5deg;
      }
    }

    /* The clapper trails the bell, so it reads as a ring rather than a tilt. */
    @keyframes moul-bell-clapper {
      22% {
        translate: -1.5px 0;
      }
      40% {
        translate: 1.5px 0;
      }
      56% {
        translate: -1px 0;
      }
      72% {
        translate: 0.5px 0;
      }
    }

    [part~='badge'] {
      position: absolute;
      top: 0.125rem;
      inset-inline-end: 0;
      pointer-events: none;
    }

    /* The top-layer shell: positioned from script, transparent around the panel */
    [part~='popover'] {
      position: fixed;
      inset: auto;
      margin: 0;
      padding: 0;
      border: 0;
      overflow: visible;
      background: transparent;
      color: var(--color-fg);
      z-index: var(--z-popover, 1000);
    }

    [part~='popover']:not(:popover-open):not(.\\:popover-open) {
      display: none;
    }

    [part~='panel'] {
      display: flex;
      flex-direction: column;
      width: min(var(--notification-bell-width, 22rem), calc(100vw - 1rem));
      max-height: min(32rem, var(--_available, 80vh));
      border-radius: var(--radius-surface, 1.5rem);
      background-color: var(--color-bg-elevated);
      box-shadow: var(--shadow-overlay);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      outline: none;
      overflow: hidden;
    }

    [part~='header'] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-2, 0.5rem);
      padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
      border-bottom: 1px solid var(--color-border-subtle);
    }

    [part~='title'] {
      font-weight: var(--font-weight-semibold, 600);
    }

    [part~='body'] {
      flex: 1 1 auto;
      min-height: 0;
      padding: var(--spacing-2, 0.5rem);
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      scrollbar-color: var(--color-scrollbar-thumb) transparent;
    }

    [part~='list'] {
      --animated-list-gap: var(--spacing-1, 0.25rem);
    }

    [part~='empty'] {
      padding: var(--spacing-6, 1.5rem) var(--spacing-4, 1rem);
      text-align: center;
      color: var(--color-fg-subtle);
    }

    [part~='empty'][hidden] {
      display: none;
    }

    [part~='footer'] {
      padding: var(--spacing-2, 0.5rem) var(--spacing-4, 1rem);
      border-top: 1px solid var(--color-border-subtle);
    }

    [part~='footer'][hidden] {
      display: none;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~='button'] {
        transition: none;
      }

      [part~='icon'][data-swinging] svg,
      [part~='icon'][data-swinging] .clapper {
        animation: none;
      }
    }
  `,
]
