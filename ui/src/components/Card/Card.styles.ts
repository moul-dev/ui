import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const cardStyles = [
  resetStyles,
  semanticToneStyles,
  css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 0.75rem);
      padding: var(--spacing-4, 1rem);
      border-radius: var(--radius-surface, 1.5rem);
      overflow: visible;
      box-sizing: border-box;
      position: relative;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      /* Secondary copy in sections; variants swap it for a tint of their own text color */
      --_card-muted: var(--color-muted);
      transition:
        box-shadow var(--duration-base, 250ms) var(--ease-smooth, ease),
        background-color var(--duration-base, 250ms) var(--ease-smooth, ease);
    }

    /* Default: a white surface lifted by a soft shadow, no border */
    :host(:not([variant])) {
      background-color: var(--color-surface);
      color: var(--color-fg);
      border: none;
      box-shadow: var(--shadow-surface);
    }

    :host([variant]) {
      --_card-muted: color-mix(in oklch, currentColor 78%, transparent);
    }

    /* Body copy stays neutral on bordered and glass surfaces; the tone shows in the frame */
    :host([variant="bordered"]),
    :host([variant="glass"]) {
      color: var(--color-fg);
      --_card-muted: var(--color-muted);
    }

    :host([is-interactive]) {
      cursor: pointer;
      user-select: none;
    }

    @media (hover: hover) {
      :host([is-interactive]:hover) {
        box-shadow: var(--shadow-overlay);
      }
    }

    :host([is-interactive]:focus-visible) {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    /* Slots generate no box, so empty ones add no gap and sections are the flex items */
    [part~="header"],
    [part~="body"],
    [part~="content"],
    [part~="footer"] {
      display: contents;
    }

    ::slotted([slot="body"]),
    ::slotted(moul-card-body) {
      flex: 1 1 auto;
    }

    ::slotted([slot="header"]:not(moul-card-header)) {
      display: block;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-md, 1.5rem);
      font-weight: var(--font-weight-medium, 500);
    }

    ::slotted([slot="body"]:not(moul-card-body)) {
      display: block;
      color: var(--_card-muted);
    }

    ::slotted([slot="footer"]:not(moul-card-footer)) {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        transition: none;
      }
    }
  `,
]

/** Header / body / footer sections: layout only — the card owns padding and gaps. */
export const cardSectionStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      padding: 0;
      color: inherit;
      font-size: inherit;
      line-height: inherit;
    }

    /* Title row (block, so inline markup in the title keeps flowing) */
    :host([data-section="header"]) {
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-md, 1.5rem);
      font-weight: var(--font-weight-medium, 500);
    }

    /* Description / content */
    :host([data-section="body"]) {
      flex: 1 1 auto;
      color: var(--_card-muted, var(--color-muted));
    }

    :host([data-section="footer"]) {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
    }
  `,
]
