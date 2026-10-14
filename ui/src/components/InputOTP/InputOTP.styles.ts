import { css } from 'lit'

export const inputOTPStyles = css`
  :host {
    display: inline-block;
  }

  .container {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .label {
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .otp-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
  }

  .slot {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: var(--bs-border-radius, 0.375rem);
    background-color: var(--bs-body-bg, #fff);
    font-weight: 600;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    text-align: center;
    font-family: monospace;
    user-select: none;
  }

  .slot.sm {
    width: 2rem;
    height: 2.25rem;
    font-size: 1rem;
  }

  .slot.md {
    width: 2.5rem;
    height: 3rem;
    font-size: 1.25rem;
  }

  .slot.lg {
    width: 3rem;
    height: 3.5rem;
    font-size: 1.5rem;
  }

  .slot.active {
    border-color: var(--bs-primary, #0d6efd);
    box-shadow: 0 0 0 0.25rem rgba(var(--bs-primary-rgb, 13, 110, 253), 0.25);
  }

  .slot.invalid {
    border-color: var(--bs-danger, #dc3545);
  }

  .slot.disabled {
    background-color: var(--bs-secondary-bg, #e9ecef);
    opacity: 0.65;
    cursor: not-allowed;
  }

  .hidden-input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    left: -9999px;
  }

  .separator {
    color: var(--bs-secondary-color, #6c757d);
    font-weight: 700;
  }

  .description {
    font-size: 0.875rem;
    color: var(--bs-secondary-color, #6c757d);
  }

  .error-message {
    font-size: 0.875rem;
    color: var(--bs-danger, #dc3545);
  }
`
