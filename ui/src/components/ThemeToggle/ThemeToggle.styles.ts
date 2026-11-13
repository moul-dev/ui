import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const themeToggleStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    .icon {
      width: 1rem;
      height: 1rem;
    }

    :host([size="lg"]) .icon {
      width: 1.25rem;
      height: 1.25rem;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
  `,
]
