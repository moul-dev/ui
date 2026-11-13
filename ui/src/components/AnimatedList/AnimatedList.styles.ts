import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const animatedListStyles = [
  resetStyles,
  css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    [part~='base'] {
      display: flex;
      flex-direction: column;
      gap: var(--animated-list-gap, var(--spacing-3, 0.75rem));
    }

    /* Arrivals, departures and glides run from script, which skips them under reduced motion. */
  `,
]
