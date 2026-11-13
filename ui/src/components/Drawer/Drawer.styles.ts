import { css } from 'lit'
import { overlayStyles } from '../../styles/overlay.styles'
import { resetStyles } from '../../styles/reset.styles'

export const drawerStyles = [
  resetStyles,
  css`
    :host {
      display: contents;
      --_radius: min(2rem, var(--radius-2xl, 1rem));
      --_slide-from: 100% 0;
    }

    dialog {
      padding: 0;
      border: none;
      background: transparent;
      /*
       * clip, not hidden: a hidden box is still a scroll container, so focusing
       * a control in a panel that is mid-slide scrolled the dialog toward it and
       * the panel overshot as that scroll unwound (right and bottom placements).
       */
      overflow: clip;
      margin: 0;
      width: 100vw;
      height: 100vh;
      max-width: 100vw;
      max-height: 100vh;
      position: fixed;
      inset: 0;
      display: flex;
      z-index: var(--z-modal, 1300);
    }

    dialog:not([open]) {
      display: none;
    }

    :host([placement="right"]:not([is-sheet])) dialog {
      justify-content: flex-end;
      align-items: stretch;
    }

    :host([placement="left"]:not([is-sheet])) dialog {
      justify-content: flex-start;
      align-items: stretch;
    }

    :host([placement="top"]:not([is-sheet])) dialog {
      justify-content: stretch;
      align-items: flex-start;
    }

    :host([placement="bottom"]:not([is-sheet])) dialog {
      justify-content: stretch;
      align-items: flex-end;
    }

    /* Panel surface (fill, shadow) comes from the shared overlay styles */
    [part~="base"] {
      position: relative;
      display: flex;
      flex-direction: column;
      padding: var(--spacing-6, 1.5rem);
      overflow: hidden;
      outline: none;
    }

    /*
     * Edge-attached sheet: only the corners facing the content are rounded.
     * These selectors outrank the shared [part~="base"] radius that follows.
     */
    :host([placement="right"]:not([is-sheet])) [part~="base"] {
      border-radius: var(--_radius) 0 0 var(--_radius);
    }

    :host([placement="left"]:not([is-sheet])) [part~="base"] {
      border-radius: 0 var(--_radius) var(--_radius) 0;
    }

    :host([placement="top"]:not([is-sheet])) [part~="base"] {
      border-radius: 0 0 var(--_radius) var(--_radius);
    }

    :host([placement="bottom"]:not([is-sheet])) [part~="base"] {
      border-radius: var(--_radius) var(--_radius) 0 0;
    }

    /* Horizontal placements (left & right) */
    :host([placement="left"]:not([is-sheet])) [part~="base"],
    :host([placement="right"]:not([is-sheet])) [part~="base"] {
      height: 100%;
      max-width: 85vw;
    }

    :host([placement="left"][size="sm"]:not([is-sheet])) [part~="base"],
    :host([placement="right"][size="sm"]:not([is-sheet])) [part~="base"] {
      width: 20rem;
    }

    :host([placement="left"][size="md"]:not([is-sheet])) [part~="base"],
    :host([placement="right"][size="md"]:not([is-sheet])) [part~="base"] {
      width: 24rem;
    }

    :host([placement="left"][size="lg"]:not([is-sheet])) [part~="base"],
    :host([placement="right"][size="lg"]:not([is-sheet])) [part~="base"] {
      width: 32rem;
    }

    /* Vertical placements (top & bottom) */
    :host([placement="top"]:not([is-sheet])) [part~="base"],
    :host([placement="bottom"]:not([is-sheet])) [part~="base"] {
      width: 100%;
      max-height: 85vh;
    }

    :host([placement="top"][size="sm"]:not([is-sheet])) [part~="base"],
    :host([placement="bottom"][size="sm"]:not([is-sheet])) [part~="base"] {
      height: 16rem;
    }

    :host([placement="top"][size="md"]:not([is-sheet])) [part~="base"],
    :host([placement="bottom"][size="md"]:not([is-sheet])) [part~="base"] {
      height: 24rem;
    }

    :host([placement="top"][size="lg"]:not([is-sheet])) [part~="base"],
    :host([placement="bottom"][size="lg"]:not([is-sheet])) [part~="base"] {
      height: 32rem;
    }

    /* Bottom placement grip, drawn only (a sheet renders a real handle) */
    :host([placement="bottom"]:not([is-sheet])) [part~="base"] {
      padding-top: var(--spacing-2, 0.5rem);
    }

    :host([placement="bottom"]:not([is-sheet])) [part~="base"]::before {
      content: "";
      flex-shrink: 0;
      align-self: center;
      width: 2.25rem;
      height: 0.25rem;
      margin-bottom: var(--spacing-2, 0.5rem);
      border-radius: var(--radius-xs, 0.125rem);
      background-color: var(--color-separator);
    }

    /*
     * Sheet (is-sheet), whatever placement says: attached to the bottom, as
     * tall as its content up to 90% of the viewport, clear of the home
     * indicator, and moved by the drag offset the drag controller writes on
     * the dialog.
     */
    :host([is-sheet]) {
      --_slide-from: 0 100%;
    }

    :host([is-sheet]) dialog {
      justify-content: stretch;
      align-items: flex-end;
    }

    :host([is-sheet]) [part~="base"] {
      width: 100%;
      max-height: 90vh;
      max-height: 90dvh;
      padding-top: 0;
      padding-bottom: calc(
        var(--spacing-6, 1.5rem) + env(safe-area-inset-bottom, 0px)
      );
      border-radius: var(--_radius) var(--_radius) 0 0;
      translate: 0 var(--_drag-y, 0px);
      /* The body is a scroll container, so it still pans its own content */
      touch-action: none;
    }

    [part~="handle"] {
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      padding-block: var(--spacing-2, 0.5rem);
      cursor: grab;
      touch-action: none;
    }

    [part~="handle"]::before {
      content: "";
      width: 2.25rem;
      height: 0.25rem;
      border-radius: var(--radius-xs, 0.125rem);
      background-color: var(--color-separator);
    }

    dialog[data-dragging] [part~="handle"] {
      cursor: grabbing;
    }

    /* The backdrop clears as the sheet is dragged down its own height */
    :host([is-sheet]) dialog::backdrop {
      opacity: calc(1 - var(--_sheet-progress, 0));
      transition: opacity 300ms
        var(--ease-out-fluid, cubic-bezier(0.32, 0.72, 0, 1));
    }

    :host([is-sheet]) dialog[data-dragging]::backdrop {
      transition: none;
    }

    [part~="header"] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-3, 0.75rem);
      flex-shrink: 0;
      margin-bottom: var(--spacing-2, 0.5rem);
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-fg);
    }

    /* Headings slotted into the header take its type instead of UA heading styles */
    ::slotted([slot="header"]) {
      margin: 0;
      font-size: inherit;
      font-weight: inherit;
      line-height: inherit;
    }

    [part~="body"] {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      scrollbar-color: var(--color-scrollbar-thumb) transparent;
      /* Room for focus rings of controls inside the scroll area */
      margin-inline: -3px;
      padding: 3px;
      color: var(--color-muted);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    [part~="footer"] {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--spacing-2, 0.5rem);
      flex-shrink: 0;
      margin-top: var(--spacing-5, 1.25rem);
    }

    /* Collapse sections with nothing slotted, where :has-slotted is supported */
    [part~="header"]:not(:has(> slot:has-slotted)),
    [part~="footer"]:not(:has(> slot:has-slotted)) {
      display: none;
    }

    /* Slide in from (and back out to) the attached edge */
    :host([placement="left"]:not([is-sheet])) {
      --_slide-from: -100% 0;
    }

    :host([placement="top"]:not([is-sheet])) {
      --_slide-from: 0 -100%;
    }

    :host([placement="bottom"]:not([is-sheet])) {
      --_slide-from: 0 100%;
    }

    dialog[open] [part~="base"] {
      animation: moul-drawer-in 250ms
        var(--ease-out-fluid, cubic-bezier(0.32, 0.72, 0, 1));
    }

    :host(:not([is-open])) dialog[open] [part~="base"] {
      animation: moul-drawer-out 200ms
        var(--ease-out-fluid, cubic-bezier(0.32, 0.72, 0, 1)) forwards;
      pointer-events: none;
    }

    :host dialog[open]::backdrop {
      animation-duration: 250ms;
      animation-timing-function: var(
        --ease-out-fluid,
        cubic-bezier(0.32, 0.72, 0, 1)
      );
    }

    :host(:not([is-open])) dialog[open]::backdrop {
      animation: moul-drawer-backdrop-out 200ms
        var(--ease-out-fluid, cubic-bezier(0.32, 0.72, 0, 1)) forwards;
    }

    @keyframes moul-drawer-in {
      from {
        translate: var(--_slide-from);
      }
    }

    @keyframes moul-drawer-out {
      to {
        translate: var(--_slide-from);
      }
    }

    @keyframes moul-drawer-backdrop-out {
      to {
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      dialog[open] [part~="base"],
      :host(:not([is-open])) dialog[open] [part~="base"],
      :host(:not([is-open])) dialog[open]::backdrop {
        animation: none;
      }

      :host([is-sheet]) dialog::backdrop {
        transition: none;
      }
    }
  `,
  overlayStyles,
]
