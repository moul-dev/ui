import { css } from 'lit'

export const emptyStateStyles = css`
  :host {
    display: block;
  }
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 3rem 1.5rem;
    gap: 1rem;
    color: var(--bs-secondary-color, #6c757d);
  }
  .empty-state-icon {
    font-size: 3rem;
    line-height: 1;
    color: var(--bs-secondary-color, #6c757d);
  }
  .empty-state-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--bs-emphasis-color, #000);
    margin: 0;
  }
  .empty-state-description {
    font-size: 0.875rem;
    max-width: 28rem;
    margin: 0;
  }
  .empty-state-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  :host([variant='card']) .empty-state {
    background-color: var(--bs-card-bg, var(--bs-body-bg, #fff));
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: var(--bs-border-radius-lg, 0.5rem);
  }
  :host([variant='dashed']) .empty-state {
    border: 2px dashed var(--bs-border-color, #dee2e6);
    border-radius: var(--bs-border-radius-lg, 0.5rem);
    background-color: color-mix(in oklch, currentColor 2%, transparent);
  }
`
