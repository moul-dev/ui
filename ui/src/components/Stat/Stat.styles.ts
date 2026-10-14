import { css } from 'lit'

export const statStyles = css`
  :host {
    display: block;
  }
  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 1rem;
    background-color: var(--bs-card-bg, #fff);
    border: var(--bs-card-border-width, 1px) solid var(--bs-card-border-color, rgba(0, 0, 0, 0.175));
    border-radius: var(--bs-card-border-radius, 0.375rem);
  }
  .stat-label {
    font-size: 0.875rem;
    color: var(--bs-secondary-color, #6c757d);
    font-weight: 500;
  }
  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.2;
    color: var(--bs-emphasis-color, #000);
  }
  .stat-trend {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .trend-up { color: var(--bs-success, #198754); }
  .trend-down { color: var(--bs-danger, #dc3545); }
  .trend-neutral { color: var(--bs-secondary-color, #6c757d); }
`
