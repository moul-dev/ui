import { css } from 'lit'

export const labelStyles = css`
  :host {
    display: block;
    margin-bottom: 0.5rem;
  }
  label {
    display: inline-block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--bs-body-color, #212529);
  }
  .required-star {
    color: var(--bs-danger, #dc3545);
    margin-left: 0.25rem;
  }
`
