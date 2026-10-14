import { css } from 'lit'

export const fieldErrorStyles = css`
  :host {
    display: block;
    margin-top: 0.25rem;
  }
  .invalid-feedback {
    display: block;
    width: 100%;
    font-size: 0.875em;
    color: var(--bs-form-invalid-color, #dc3545);
  }
`
