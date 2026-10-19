import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const formStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
    }

    [part~='base'] {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4, 1rem);
      width: 100%;
    }
  `,
]
