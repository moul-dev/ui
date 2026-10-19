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
      gap: var(--spacing-3, 0.75rem);
      padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
      border-radius: var(--radius-lg, 1.25rem);
      width: min(380px, calc(100vw - 2rem));
      box-sizing: border-box;
      box-shadow: var(--shadow-lg);
      pointer-events: auto;
      font-family: var(--font-family-base, inherit);
      position: relative;
    }

    /* Notifications float over arbitrary content: use the thick material for legibility */
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
      gap: var(--spacing-3, 0.75rem);
      width: 100%;
    }

    [part~="icon"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 1.25rem;
      height: 1.25rem;
      margin-top: 0.125rem;
    }

    [part~="icon"] svg {
      width: 100%;
      height: 100%;
    }

    [part~="content"] {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.125rem);
      flex: 1 1 auto;
      min-width: 0;
    }

    [part~="title"] {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: 600;
      line-height: var(--line-height-sm, 1.25rem);
    }

    [part~="description"] {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      opacity: 0.9;
    }

    [part~="actions"] {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      flex-shrink: 0;
      margin-inline-start: auto;
    }

    .dismiss-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      padding: 0;
      border: none;
      background: transparent;
      color: currentColor;
      border-radius: var(--radius-sm, 0.25rem);
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.15s ease;
    }

    .dismiss-button:hover {
      opacity: 1;
    }

    .dismiss-button:focus-visible {
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: 2px;
      opacity: 1;
    }

    .dismiss-button svg {
      width: 0.875rem;
      height: 0.875rem;
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
      gap: var(--spacing-2, 0.5rem);
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
