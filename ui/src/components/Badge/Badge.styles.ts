import { css } from 'lit'

export const badgeStyles = css`
  :host {
    display: inline-block;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    font-weight: 600;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
    vertical-align: baseline;
    border-radius: var(--bs-border-radius, 0.375rem);
    padding: 0.35em 0.65em;
    font-size: 0.75em;
  }
  .badge.sm {
    font-size: 0.65em;
    padding: 0.25em 0.5em;
  }
  .badge.md {
    font-size: 0.75em;
    padding: 0.35em 0.65em;
  }
  .badge.lg {
    font-size: 0.875em;
    padding: 0.45em 0.8em;
  }
  .rounded-pill {
    border-radius: var(--bs-border-radius-pill, 50rem);
  }
  .badge-dot {
    display: inline-block;
    width: 0.45em;
    height: 0.45em;
    border-radius: 50%;
    background-color: currentColor;
    opacity: 0.85;
  }
  .badge.theme-primary, .badge.text-bg-primary {
    --bs-badge-bg: var(--bs-primary-bg, var(--bs-primary-base, #0d6efd));
    --bs-badge-color: var(--bs-primary-contrast, #fff);
    background-color: var(--bs-badge-bg);
    color: var(--bs-badge-color);
  }
  .badge.theme-secondary, .badge.text-bg-secondary {
    --bs-badge-bg: var(--bs-secondary-bg, #6c757d);
    --bs-badge-color: var(--bs-secondary-contrast, #fff);
    background-color: var(--bs-badge-bg);
    color: var(--bs-badge-color);
  }
  .badge.theme-success, .badge.text-bg-success {
    --bs-badge-bg: var(--bs-success-bg, #198754);
    --bs-badge-color: var(--bs-success-contrast, #fff);
    background-color: var(--bs-badge-bg);
    color: var(--bs-badge-color);
  }
  .badge.theme-danger, .badge.text-bg-danger {
    --bs-badge-bg: var(--bs-danger-bg, #dc3545);
    --bs-badge-color: var(--bs-danger-contrast, #fff);
    background-color: var(--bs-badge-bg);
    color: var(--bs-badge-color);
  }
  .badge.theme-warning, .badge.text-bg-warning {
    --bs-badge-bg: var(--bs-warning-bg, #ffc107);
    --bs-badge-color: var(--bs-warning-contrast, #000);
    background-color: var(--bs-badge-bg);
    color: var(--bs-badge-color);
  }
  .badge.theme-info, .badge.text-bg-info {
    --bs-badge-bg: var(--bs-info-bg, #0dcaf0);
    --bs-badge-color: var(--bs-info-contrast, #000);
    background-color: var(--bs-badge-bg);
    color: var(--bs-badge-color);
  }
`
