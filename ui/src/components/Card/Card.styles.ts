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
      border-radius: var(--radius-lg, 0.75rem);
      overflow: hidden;
      box-sizing: border-box;
      position: relative;
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    }

    :host([is-interactive]) {
      cursor: pointer;
      user-select: none;
    }

    :host([is-interactive]:focus-visible) {
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: 2px;
    }

    [part="header"] {
      display: block;
      padding: var(--spacing-4, 1rem);
      border-bottom: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.06));
    }

    [part="body"],
    [part="content"] {
      display: block;
      padding: var(--spacing-4, 1rem);
      flex: 1 1 auto;
    }

    [part="footer"] {
      display: block;
      padding: var(--spacing-4, 1rem);
      border-top: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.06));
    }

    /* Subcomponent styles */
    moul-card-header,
    [slot="header"] {
      display: block;
      padding: var(--spacing-4, 1rem);
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: 600;
    }

    moul-card-body,
    [slot="body"] {
      display: block;
      padding: var(--spacing-4, 1rem);
      flex: 1 1 auto;
    }

    moul-card-footer,
    [slot="footer"] {
      display: block;
      padding: var(--spacing-4, 1rem);
    }
  `,
]
