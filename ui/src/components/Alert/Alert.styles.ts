import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const alertStyles = [
  resetStyles,
  semanticToneStyles,
  css`
    :host {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
      border-radius: var(--radius-surface, 1.5rem);
      width: 100%;
      box-sizing: border-box;
      position: relative;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    /* Default: a plain surface; only the indicator and title carry the tone */
    :host(:not([variant])) {
      background-color: var(--color-surface);
      color: var(--color-fg);
      border: none;
      box-shadow: var(--shadow-surface);
    }

    :host(:not([variant])) [part~="icon"],
    :host(:not([variant])) [part~="title"],
    :host(:not([variant])) ::slotted([slot="title"]) {
      color: var(--_tone-soft-fg);
    }

    :host(:not([variant])) [part~="description"] {
      color: var(--color-muted);
    }

    [part~="base"] {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: var(--spacing-4, 1rem);
      width: 100%;
    }

    /* 1rem glyph in a 1.5rem box, so it centers on the title's first line */
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
      flex: 1 1 auto;
      min-width: 0;
    }

    [part~="title"],
    ::slotted([slot="title"]) {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: var(--line-height-md, 1.5rem);
    }

    [part~="description"] {
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    /* On tinted variants the description is a softer shade of the variant's text color */
    :host([variant]) [part~="description"] {
      color: color-mix(in oklch, currentColor 85%, transparent);
    }

    [part~="actions"] {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      flex-shrink: 0;
      margin-inline-start: auto;
    }

    /* Close button: quiet neutral circle */
    .dismiss-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      padding: var(--spacing-1, 0.25rem);
      border: none;
      border-radius: var(--radius-xl, 0.75rem);
      background-color: var(--color-default);
      color: var(--color-muted);
      cursor: pointer;
      transition:
        transform 250ms var(--ease-out, ease-out),
        color 150ms var(--ease-out, ease-out),
        background-color 100ms var(--ease-out, ease-out),
        box-shadow 150ms var(--ease-out, ease-out);
    }

    :host([variant]) .dismiss-button {
      background-color: transparent;
      color: currentColor;
    }

    @media (hover: hover) {
      .dismiss-button:hover {
        background-color: var(--color-default-hover);
      }

      :host([variant]) .dismiss-button:hover {
        background-color: color-mix(in oklch, currentColor 12%, transparent);
      }
    }

    .dismiss-button:active {
      transform: scale(0.93);
    }

    .dismiss-button:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .dismiss-button svg {
      width: 1rem;
      height: 1rem;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .dismiss-button {
        transition: none;
      }

      .dismiss-button:active {
        transform: none;
      }
    }
  `,
]
