import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const separatorStyles = [
  resetStyles,
  css`
    :host {
      display: block;
    }

    :host([orientation="vertical"]) {
      display: inline-block;
      height: 100%;
      align-self: stretch;
    }

    [part="separator"] {
      border: none;
      margin: 0;
      background-color: var(--color-border, #e5e7eb);
      box-sizing: border-box;
    }

    :host([orientation="horizontal"]) [part="separator"],
    :host(:not([orientation])) [part="separator"] {
      width: 100%;
      height: 1px;
    }

    :host([orientation="vertical"]) [part="separator"] {
      width: 1px;
      height: 100%;
      min-height: 1rem;
    }
  `,
]
