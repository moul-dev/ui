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
      border-radius: var(--radius-lg, 1.25rem);
      overflow: hidden;
      box-sizing: border-box;
      position: relative;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      transition:
        box-shadow var(--duration-base, 240ms) ease,
        background-color var(--duration-base, 240ms) ease;
    }

    /* Body copy stays neutral on bordered and glass surfaces; the tone shows in the frame */
    :host([variant="bordered"]),
    :host([variant="glass"]) {
      color: var(--color-fg);
    }

    :host([is-interactive]) {
      cursor: pointer;
      user-select: none;
    }

    :host([is-interactive]:hover) {
      box-shadow: var(--shadow-lg);
    }

    :host([is-interactive]:focus-visible) {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    /* Named slots collapse to nothing when empty, so only real content takes space */
    [part~="header"],
    [part~="body"],
    [part~="content"],
    [part~="footer"] {
      display: block;
    }

    [part~="body"],
    [part~="content"] {
      flex: 1 1 auto;
    }

    ::slotted([slot="header"]:not(moul-card-header)) {
      display: block;
      padding: var(--spacing-5, 1.25rem) var(--spacing-5, 1.25rem) 0;
      font-weight: 600;
    }

    ::slotted([slot="body"]:not(moul-card-body)) {
      display: block;
      padding: var(--spacing-4, 1rem) var(--spacing-5, 1.25rem);
    }

    ::slotted([slot="footer"]:not(moul-card-footer)) {
      display: block;
      padding: 0 var(--spacing-5, 1.25rem) var(--spacing-5, 1.25rem);
    }
  `,
]

/** Header / body / footer sections: padding only — they inherit the card's surface. */
export const cardSectionStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      padding: var(--spacing-3, 0.75rem) var(--spacing-5, 1.25rem);
      color: inherit;
      font-size: inherit;
      line-height: inherit;
    }

    :host(:first-child) {
      padding-top: var(--spacing-5, 1.25rem);
    }

    :host(:last-child) {
      padding-bottom: var(--spacing-5, 1.25rem);
    }

    :host([data-section="header"]) {
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
      font-weight: 600;
    }

    :host([data-section="body"]) {
      color: color-mix(in oklch, currentColor 78%, transparent);
    }

    :host([data-section="footer"]) {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
    }
  `,
]
