import { css } from 'lit'

export const checkboxGroupStyles = css`
  :host {
    display: block;
  }
  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  :host([orientation="horizontal"]) .checkbox-group {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1rem;
  }
`
