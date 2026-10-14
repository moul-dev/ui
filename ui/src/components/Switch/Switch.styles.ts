import { css } from 'lit'

export const switchStyles = css`
  :host {
    display: inline-block;
  }
  .form-check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 1.5rem;
    margin-bottom: 0.125rem;
    cursor: pointer;
  }
  .form-switch .form-check-input {
    width: 2em;
    height: 1.15em;
    margin-top: 0;
    vertical-align: top;
    background-color: var(--bs-secondary-bg, #dee2e6);
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='rgba%280, 0, 0, 0.25%29'/%3e%3c/svg%3e");
    background-position: left center;
    background-repeat: no-repeat;
    border: var(--bs-border-width, 1px) solid var(--bs-border-color, rgba(0, 0, 0, 0.25));
    border-radius: 2em;
    appearance: none;
    cursor: pointer;
    transition: background-position .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out;
  }
  .form-switch .form-check-input:checked {
    background-position: right center;
    background-color: var(--bs-primary, #0d6efd);
    border-color: var(--bs-primary, #0d6efd);
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23fff'/%3e%3c/svg%3e");
  }
  .form-switch .form-check-input:disabled {
    pointer-events: none;
    opacity: 0.5;
    cursor: not-allowed;
  }
  .form-check-label {
    user-select: none;
    font-size: 0.9375rem;
    color: var(--bs-body-color, #212529);
  }
`
