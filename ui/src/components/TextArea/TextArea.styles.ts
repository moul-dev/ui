import { css } from 'lit'

export const textAreaStyles = css`
  :host {
    display: block;
    width: 100%;
  }
  .form-control {
    display: block;
    width: 100%;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    color: var(--bs-body-color, #212529);
    background-color: var(--bs-body-bg, #fff);
    border: var(--bs-border-width, 1px) solid var(--bs-border-color, #dee2e6);
    border-radius: var(--bs-border-radius, 0.375rem);
    resize: vertical;
    transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
  }
  .form-control:focus {
    color: var(--bs-body-color, #212529);
    background-color: var(--bs-body-bg, #fff);
    border-color: #86b7fe;
    outline: 0;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }
  .form-control:disabled {
    background-color: var(--bs-secondary-bg, #e9ecef);
    opacity: 1;
    cursor: not-allowed;
  }
  .form-control.is-invalid {
    border-color: var(--bs-form-invalid-border-color, #dc3545);
  }
  .form-control.is-invalid:focus {
    box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
  }
`
