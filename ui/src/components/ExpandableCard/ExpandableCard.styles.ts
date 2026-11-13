import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const expandableCardStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      position: relative;
      --_open-width: var(--expandable-card-width, 40rem);
    }

    :host([hidden]) {
      display: none;
    }

    :host([size="sm"]) {
      --_open-width: var(--expandable-card-width, 28rem);
    }

    :host([size="lg"]) {
      --_open-width: var(--expandable-card-width, 56rem);
    }

    /*
     * The panel is a <dialog> that stays in the page while closed. Undo the
     * user-agent dialog box (absolute, centred, bordered, display: none) so it
     * lays out as an ordinary card.
     */
    [part~="base"] {
      position: relative;
      inset: auto;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      width: 100%;
      height: auto;
      max-width: none;
      max-height: none;
      margin: 0;
      padding: 0;
      border: none;
      overflow: hidden;
      border-radius: var(--radius-surface, 1.5rem);
      background-color: var(--color-surface);
      color: var(--color-fg);
      box-shadow: var(--shadow-surface);
      font: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      text-align: start;
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      transition:
        box-shadow var(--duration-base, 250ms) var(--ease-out, ease-out),
        translate var(--duration-base, 250ms) var(--ease-out, ease-out),
        scale var(--duration-fast, 150ms) var(--ease-out, ease-out),
        background-color var(--duration-base, 250ms) var(--ease-smooth, ease);
    }

    [part~="base"]:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    /* Lift only under a real cursor: touch fires hover on tap and would leave it raised */
    @media (hover: hover) and (pointer: fine) {
      [part~="base"]:not([open]):hover {
        box-shadow: var(--shadow-overlay);
        translate: 0 -2px;
      }
    }

    [part~="base"]:not([open]):active {
      scale: 0.985;
    }

    /* Open: a centred dialog in the top layer, as tall as its content up to 85% of the viewport */
    [part~="base"][open] {
      position: fixed;
      inset: 0;
      margin: auto;
      width: min(var(--_open-width), calc(100% - 2rem));
      height: fit-content;
      max-height: min(85vh, calc(100% - 2rem));
      background-color: var(--color-bg-elevated);
      box-shadow: var(--shadow-overlay);
      cursor: auto;
      user-select: text;
    }

    [part~="base"]::backdrop {
      background-color: var(--color-overlay);
      transition: opacity var(--duration-base, 250ms) var(--ease-out, ease-out);
    }

    [part~="base"][open]::backdrop {
      animation: moul-expandable-card-backdrop-in var(--duration-base, 250ms)
        var(--ease-out, ease-out);
    }

    [part~="base"][data-phase="closing"]::backdrop {
      opacity: 0;
    }

    @keyframes moul-expandable-card-backdrop-in {
      from {
        opacity: 0;
      }
    }

    [part~="media"] {
      flex: none;
      overflow: hidden;
    }

    [part~="media"]:not(:has(> slot:has-slotted)) {
      display: none;
    }

    ::slotted([slot="media"]) {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: var(--expandable-card-media-ratio, 16 / 9);
      object-fit: cover;
    }

    [part~="content"] {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2, 0.5rem);
      min-height: 0;
      padding: var(--spacing-4, 1rem);
      color: var(--color-muted);
    }

    [part~="base"][open] [part~="content"] {
      flex: 1 1 auto;
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      scrollbar-color: var(--color-scrollbar-thumb) transparent;
    }

    /* While the box morphs, nothing scrolls: the content is clipped to it */
    [part~="base"][data-phase="opening"] [part~="content"],
    [part~="base"][data-phase="closing"] [part~="content"] {
      overflow: hidden;
    }

    ::slotted(:is(h1, h2, h3, h4, h5, h6)) {
      margin: 0;
      color: var(--color-fg);
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
      font-weight: var(--font-weight-semibold, 600);
    }

    [part~="details"] {
      display: none;
      flex-direction: column;
      gap: var(--spacing-3, 0.75rem);
      padding-top: var(--spacing-2, 0.5rem);
      color: var(--color-fg);
    }

    [part~="base"][open] [part~="details"] {
      display: flex;
    }

    [part~="close-button"] {
      display: none;
      position: absolute;
      top: var(--spacing-3, 0.75rem);
      right: var(--spacing-3, 0.75rem);
      z-index: 1;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: none;
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-bg-elevated);
      color: var(--color-fg);
      box-shadow: var(--shadow-surface);
      cursor: pointer;
      transition: background-color var(--duration-fast, 150ms)
        var(--ease-out, ease-out);
    }

    [part~="base"][open] [part~="close-button"] {
      display: inline-flex;
    }

    [part~="close-button"]:hover {
      background-color: var(--color-surface-secondary, var(--color-surface));
    }

    [part~="close-button"]:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    [part~="close-button"] svg {
      width: 1rem;
      height: 1rem;
    }

    [part~="placeholder"] {
      display: none;
    }

    /* Holds the card's place in the page while the panel is in the top layer */
    [part~="base"][open] + [part~="placeholder"] {
      display: block;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="base"],
      [part~="close-button"],
      [part~="base"]::backdrop {
        transition: none;
      }

      [part~="base"][open]::backdrop {
        animation: none;
      }

      [part~="base"]:not([open]):hover,
      [part~="base"]:not([open]):active {
        translate: none;
        scale: none;
      }
    }
  `,
]
