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

    /* Slotted fieldsets lose the browser's groove frame, after HeroUI, and keep
       the form's field rhythm; page styles still win over these defaults. */
    ::slotted(fieldset) {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4, 1rem);
      min-width: 0;
      margin: 0;
      /* A legend renders above the flex flow, so the top inset is its only gap */
      padding: var(--spacing-2, 0.5rem) 0 0;
      border: none;
    }
  `,
]
