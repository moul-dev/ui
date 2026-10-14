import { css } from 'lit'

export const tagGroupStyles = css`
  :host {
    display: block;
  }

  .tag-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .label {
    font-size: var(--bs-body-font-size, 1rem);
    font-weight: 500;
    margin-bottom: 0.25rem;
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

export const tagStyles = css`
  :host {
    display: inline-block;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    border-radius: var(--bs-border-radius-pill, 50rem);
    font-weight: 500;
    line-height: 1;
    text-decoration: none;
    cursor: default;
    user-select: none;
    transition: all 0.15s ease-in-out;
    border: 1px solid transparent;
  }

  /* Sizes */
  .tag.sm {
    padding: 0.2rem 0.5rem;
    font-size: 0.75rem;
  }

  .tag.md {
    padding: 0.35rem 0.75rem;
    font-size: 0.875rem;
  }

  .tag.lg {
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }

  /* Variants */
  .tag.secondary {
    background-color: var(--bs-secondary-bg, #e9ecef);
    color: var(--bs-body-color, #212529);
    border-color: var(--bs-border-color, #dee2e6);
  }

  .tag.primary {
    background-color: rgba(var(--bs-primary-rgb, 13, 110, 253), 0.12);
    color: var(--bs-primary, #0d6efd);
    border-color: rgba(var(--bs-primary-rgb, 13, 110, 253), 0.25);
  }

  .tag.tertiary {
    background-color: transparent;
    color: var(--bs-secondary-color, #6c757d);
    border-color: var(--bs-border-color, #dee2e6);
  }

  /* Interactive / Selectable */
  :host([selectable]) .tag,
  :host([is-selected]) .tag {
    cursor: pointer;
  }

  :host([is-selected]) .tag.secondary {
    background-color: var(--bs-secondary, #6c757d);
    color: #fff;
    border-color: var(--bs-secondary, #6c757d);
  }

  :host([is-selected]) .tag.primary {
    background-color: var(--bs-primary, #0d6efd);
    color: #fff;
    border-color: var(--bs-primary, #0d6efd);
  }

  :host([is-selected]) .tag.tertiary {
    background-color: var(--bs-body-color, #212529);
    color: #fff;
    border-color: var(--bs-body-color, #212529);
  }

  :host([is-disabled]) {
    pointer-events: none;
    opacity: 0.65;
  }

  .btn-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    font-size: 1em;
    line-height: 1;
    color: inherit;
    cursor: pointer;
    opacity: 0.7;
    border-radius: 50%;
    transition: opacity 0.15s ease-in-out;
  }

  .btn-remove:hover {
    opacity: 1;
  }
`
