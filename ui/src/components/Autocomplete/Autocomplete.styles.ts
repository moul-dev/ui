import { css } from 'lit'
import {
  comboboxItemStyles,
  comboboxSectionStyles,
  comboboxStyles,
} from '../ComboBox/ComboBox.styles.js'

export const autocompleteStyles = css`
  ${comboboxStyles}
  .spinner-wrapper {
    position: absolute;
    right: 0.75rem;
    display: inline-flex;
    align-items: center;
  }
  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spinner-border .75s linear infinite;
    color: var(--bs-secondary-color, #6c757d);
  }
  @keyframes spinner-border {
    to { transform: rotate(360deg); }
  }
`

export const autocompleteItemStyles = comboboxItemStyles
export const autocompleteSectionStyles = comboboxSectionStyles
