import { css } from 'lit'

export const alertStyles = css`
  :host {
    display: block;
  }
  .alert {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    position: relative;
    padding: 1rem;
    border-radius: var(--bs-border-radius, 0.375rem);
    margin-bottom: 1rem;
  }
  .alert-content {
    flex: 1 1 auto;
    min-width: 0;
  }
  .alert-heading {
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }
  .alert-description {
    font-size: 0.875rem;
    opacity: 0.9;
  }
  .alert-icon {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    font-size: 1.25rem;
    line-height: 1;
  }
  .alert-actions {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  .btn-close {
    box-sizing: content-box;
    width: 1em;
    height: 1em;
    padding: 0.25em;
    color: currentColor;
    background: transparent;
    border: 0;
    border-radius: 0.375rem;
    opacity: 0.5;
    cursor: pointer;
  }
  .btn-close:hover {
    opacity: 0.75;
  }
  .alert.theme-primary, .alert.alert-primary {
    --bs-alert-bg: var(--bs-primary-bg-subtle, rgba(13, 110, 253, 0.12));
    --bs-alert-color: var(--bs-primary-fg, #0d6efd);
    --bs-alert-border-color: var(--bs-primary-border, rgba(13, 110, 253, 0.25));
    background-color: var(--bs-alert-bg);
    color: var(--bs-alert-color);
    border: 1px solid var(--bs-alert-border-color);
  }
  .alert.theme-secondary, .alert.alert-secondary {
    --bs-alert-bg: var(--bs-secondary-bg-subtle, rgba(108, 117, 125, 0.12));
    --bs-alert-color: var(--bs-secondary-fg, #6c757d);
    --bs-alert-border-color: var(--bs-secondary-border, rgba(108, 117, 125, 0.25));
    background-color: var(--bs-alert-bg);
    color: var(--bs-alert-color);
    border: 1px solid var(--bs-alert-border-color);
  }
  .alert.theme-success, .alert.alert-success {
    --bs-alert-bg: var(--bs-success-bg-subtle, rgba(25, 135, 84, 0.12));
    --bs-alert-color: var(--bs-success-fg, #198754);
    --bs-alert-border-color: var(--bs-success-border, rgba(25, 135, 84, 0.25));
    background-color: var(--bs-alert-bg);
    color: var(--bs-alert-color);
    border: 1px solid var(--bs-alert-border-color);
  }
  .alert.theme-danger, .alert.alert-danger {
    --bs-alert-bg: var(--bs-danger-bg-subtle, rgba(220, 53, 69, 0.12));
    --bs-alert-color: var(--bs-danger-fg, #dc3545);
    --bs-alert-border-color: var(--bs-danger-border, rgba(220, 53, 69, 0.25));
    background-color: var(--bs-alert-bg);
    color: var(--bs-alert-color);
    border: 1px solid var(--bs-alert-border-color);
  }
  .alert.theme-warning, .alert.alert-warning {
    --bs-alert-bg: var(--bs-warning-bg-subtle, rgba(255, 193, 7, 0.12));
    --bs-alert-color: var(--bs-warning-fg, #ffc107);
    --bs-alert-border-color: var(--bs-warning-border, rgba(255, 193, 7, 0.25));
    background-color: var(--bs-alert-bg);
    color: var(--bs-alert-color);
    border: 1px solid var(--bs-alert-border-color);
  }
  .alert.theme-info, .alert.alert-info {
    --bs-alert-bg: var(--bs-info-bg-subtle, rgba(13, 202, 240, 0.12));
    --bs-alert-color: var(--bs-info-fg, #0dcaf0);
    --bs-alert-border-color: var(--bs-info-border, rgba(13, 202, 240, 0.25));
    background-color: var(--bs-alert-bg);
    color: var(--bs-alert-color);
    border: 1px solid var(--bs-alert-border-color);
  }
`
