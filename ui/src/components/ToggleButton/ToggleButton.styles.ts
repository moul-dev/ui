import { css } from 'lit'

export const toggleButtonStyles = css`
  :host {
    display: inline-block;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.5;
    text-align: center;
    vertical-align: middle;
    cursor: pointer;
    user-select: none;
    border: 1px solid var(--bs-border-color, #dee2e6);
    background-color: var(--bs-bg-body, transparent);
    color: var(--bs-fg-body, inherit);
    border-top-left-radius: var(--bs-border-top-left-radius, var(--bs-border-radius, 0.375rem));
    border-bottom-left-radius: var(--bs-border-bottom-left-radius, var(--bs-border-radius, 0.375rem));
    border-top-right-radius: var(--bs-border-top-right-radius, var(--bs-border-radius, 0.375rem));
    border-bottom-right-radius: var(--bs-border-bottom-right-radius, var(--bs-border-radius, 0.375rem));
    transition: all .15s ease-in-out;
  }
  .btn:hover:not(:disabled) {
    background-color: var(--bs-bg-subtle, rgba(255, 255, 255, 0.05));
  }
  .btn.active {
    background-color: var(--bs-primary-bg, var(--bs-primary-base, #0d6efd));
    border-color: var(--bs-primary-border, var(--bs-primary-base, #0d6efd));
    color: var(--bs-primary-contrast, #fff);
  }
  .btn:disabled {
    pointer-events: none;
    opacity: 0.5;
    cursor: not-allowed;
  }
`
