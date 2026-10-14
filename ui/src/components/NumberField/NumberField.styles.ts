import { css } from 'lit'

export const numberFieldStyles = css`
  :host {
    display: block;
    width: 100%;
  }
  .input-group {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    width: 100%;
  }
  .form-control {
    position: relative;
    flex: 1 1 auto;
    width: 1%;
    min-width: 0;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    text-align: center;
    color: var(--bs-body-color, #212529);
    background-color: var(--bs-body-bg, #fff);
    border: var(--bs-border-width, 1px) solid var(--bs-border-color, #dee2e6);
  }
  .form-control:focus {
    z-index: 3;
    outline: 0;
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }
  .btn-step {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--bs-body-color, #212529);
    background-color: var(--bs-tertiary-bg, #f8f9fa);
    border: 1px solid var(--bs-border-color, #dee2e6);
    cursor: pointer;
    user-select: none;
    transition: background-color .15s ease-in-out;
  }
  .btn-step:hover:not(:disabled) {
    background-color: var(--bs-secondary-bg, #e9ecef);
  }
  .btn-step:first-child {
    border-top-left-radius: var(--bs-border-radius, 0.375rem);
    border-bottom-left-radius: var(--bs-border-radius, 0.375rem);
    border-right: 0;
  }
  .btn-step:last-child {
    border-top-right-radius: var(--bs-border-radius, 0.375rem);
    border-bottom-right-radius: var(--bs-border-radius, 0.375rem);
    border-left: 0;
  }
  .btn-step:disabled {
    pointer-events: none;
    opacity: 0.5;
  }
`
