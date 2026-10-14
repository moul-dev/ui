import { css } from 'lit'

export const checkboxStyles = css`
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
  .form-check-input {
    width: 1.15em;
    height: 1.15em;
    margin-top: 0;
    vertical-align: top;
    background-color: var(--bs-body-bg, #fff);
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    border: var(--bs-border-width, 1px) solid var(--bs-border-color, rgba(0, 0, 0, 0.25));
    border-radius: 0.25em;
    appearance: none;
    cursor: pointer;
    transition: background-color .15s ease-in-out, background-position .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out;
  }
  .form-check-input:checked {
    background-color: var(--bs-primary, #0d6efd);
    border-color: var(--bs-primary, #0d6efd);
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m6 10 3 3 6-6'/%3e%3c/svg%3e");
  }
  .form-check-input:indeterminate {
    background-color: var(--bs-primary, #0d6efd);
    border-color: var(--bs-primary, #0d6efd);
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10h8'/%3e%3c/svg%3e");
  }
  .form-check-input:disabled {
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
