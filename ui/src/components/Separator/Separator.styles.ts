import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const separatorStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      flex-shrink: 0;
    }

    :host([orientation="vertical"]) {
      display: inline-block;
      height: 100%;
      align-self: stretch;
    }

    [part~="separator"] {
      flex-shrink: 0;
      border: none;
      margin: 0;
      border-radius: var(--radius-sm, 0.25rem);
      background-color: var(--color-separator);
      box-sizing: border-box;
    }

    :host([orientation="horizontal"]) [part~="separator"],
    :host(:not([orientation])) [part~="separator"] {
      width: 100%;
      height: 1px;
    }

    :host([orientation="vertical"]) [part~="separator"] {
      width: 1px;
      height: 100%;
      min-height: 0.5rem;
    }
  `,
]
