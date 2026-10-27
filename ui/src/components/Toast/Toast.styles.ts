import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const toastStyles = [
  resetStyles,
  semanticToneStyles,
  css`
    :host {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
      border-radius: var(--radius-surface, 1.5rem);
      width: min(380px, calc(100vw - 2rem));
      box-sizing: border-box;
      /* Floating: every variant keeps a lift unless it brings its own shadow */
      box-shadow: var(--shadow-overlay);
      pointer-events: auto;
      font-family: var(--font-family-base, inherit);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      position: relative;
    }

    /* Default: a plain surface; the title (and status indicators) carry the tone */
    :host(:not([variant])) {
      background-color: var(--color-surface);
      color: var(--color-fg);
      border: none;
    }

    :host(:not([variant])) [part~="title"],
    :host(:not([variant])) ::slotted([slot="title"]) {
      color: var(--_tone-soft-fg);
    }

    :host(:not([variant])[tone="success"]) [part~="icon"],
    :host(:not([variant])[tone="warning"]) [part~="icon"],
    :host(:not([variant])[tone="error"]) [part~="icon"] {
      color: var(--_tone-soft-fg);
    }

    :host(:not([variant])) [part~="description"] {
      color: var(--color-muted);
    }

    /* On tinted variants the description is a softer shade of the variant's text color */
    :host([variant]) [part~="description"] {
      color: color-mix(in oklch, currentColor 85%, transparent);
    }

    /* Opt-in glass: notifications float over arbitrary content, so use the thick material */
    :host([variant="glass"]) {
      color: var(--color-fg);
      background-color: color-mix(in oklch, var(--_tone-soft-bg) 22%, var(--glass-bg-thick));
    }

    :host([variant="glass"]) [part~="icon"] {
      color: var(--_tone-solid-bg);
    }

    [part~="base"] {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 0.375rem;
      width: 100%;
    }

    /* 1rem glyph in a 1.5rem box */
    [part~="icon"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-sizing: content-box;
      width: 1rem;
      height: 1rem;
      padding: var(--spacing-1, 0.25rem);
      user-select: none;
    }

    [part~="icon"] svg,
    ::slotted([slot="icon"]) {
      width: 1rem;
      height: 1rem;
    }

    [part~="content"] {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      align-self: center;
      flex: 1 1 auto;
      min-width: 0;
    }

    [part~="title"],
    ::slotted([slot="title"]) {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: var(--line-height-sm, 1.25rem);
    }

    [part~="description"] {
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    [part~="actions"] {
      display: inline-flex;
      align-items: center;
      align-self: center;
      gap: var(--spacing-2, 0.5rem);
      flex-shrink: 0;
      margin-inline-start: auto;
    }

    /* Close button: a small bordered disc on the top-end corner, revealed on hover or focus */
    .dismiss-button {
      position: absolute;
      top: calc(-1 * var(--spacing-1, 0.25rem));
      inset-inline-end: calc(-1 * var(--spacing-1, 0.25rem));
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      padding: 0;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-bg-elevated);
      color: var(--color-muted);
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transition:
        opacity 150ms var(--ease-smooth, ease),
        background-color 100ms var(--ease-out, ease-out);
    }

    :host(:hover) .dismiss-button,
    :host(:focus-within) .dismiss-button {
      opacity: 1;
      pointer-events: auto;
    }

    /* No hover on touch screens: keep the close button visible */
    @media (hover: none) {
      .dismiss-button {
        opacity: 1;
        pointer-events: auto;
      }
    }

    @media (hover: hover) {
      .dismiss-button:hover {
        background-color: var(--color-default);
      }
    }

    .dismiss-button:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .dismiss-button svg {
      width: 0.75rem;
      height: 0.75rem;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .dismiss-button {
        transition: none;
      }
    }
  `,
]

export const toastRegionStyles = [
  resetStyles,
  css`
    :host {
      position: fixed;
      inset: auto;
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      overflow: visible;
      color: inherit;
      z-index: var(--z-toast, 1700);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 0.75rem);
      pointer-events: none;
      box-sizing: border-box;
      max-width: calc(100vw - 2rem);
      max-height: calc(100vh - 2rem);
      --_edge: var(--spacing-4, 1rem);
    }

    /* Popover UA styles hide closed popovers; keep the fallback stack visible */
    :host(:not([popover])) {
      display: flex;
    }

    :host([popover]:not(:popover-open)) {
      display: none;
    }

    /* Bottom stacks grow upward from the edge, newest nearest the edge */
    :host(:not([placement])),
    :host([placement^="bottom"]) {
      bottom: var(--_edge);
      justify-content: flex-end;
    }

    /* Top stacks grow downward, newest nearest the edge */
    :host([placement^="top"]) {
      top: var(--_edge);
      flex-direction: column-reverse;
      justify-content: flex-end;
    }

    :host(:not([placement])),
    :host([placement$="end"]) {
      right: var(--_edge);
      align-items: flex-end;
    }

    :host([placement$="start"]) {
      left: var(--_edge);
      align-items: flex-start;
    }

    /* translate (not margin:auto) so page-level resets can't de-center the stack */
    :host([placement$="center"]) {
      left: 50%;
      translate: -50% 0;
      align-items: center;
    }
  `,
]
