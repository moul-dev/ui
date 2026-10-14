import { css } from 'lit'

export const paginationStyles = css`
  :host {
    display: inline-block;
  }

  .pagination {
    display: flex;
    padding-left: 0;
    list-style: none;
    margin: 0;
    gap: 0.25rem;
  }

  .page-item {
    display: inline-block;
  }

  .page-link {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2.25rem;
    height: 2.25rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--bs-body-color, #212529);
    text-decoration: none;
    background-color: var(--bs-body-bg, #fff);
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: var(--bs-border-radius, 0.375rem);
    cursor: pointer;
    user-select: none;
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
  }

  .page-link:hover:not(:disabled) {
    background-color: var(--bs-tertiary-bg, #f8f9fa);
    border-color: var(--bs-border-color, #dee2e6);
  }

  .page-item.active .page-link {
    z-index: 3;
    color: #fff;
    background-color: var(--bs-primary, #0d6efd);
    border-color: var(--bs-primary, #0d6efd);
  }

  .page-item.disabled .page-link {
    color: var(--bs-secondary-color, #6c757d);
    pointer-events: none;
    background-color: var(--bs-secondary-bg, #e9ecef);
    border-color: var(--bs-border-color, #dee2e6);
    opacity: 0.65;
  }

  .pagination.sm .page-link {
    min-width: 1.75rem;
    height: 1.75rem;
    padding: 0.2rem 0.5rem;
    font-size: 0.75rem;
  }

  .pagination.lg .page-link {
    min-width: 2.75rem;
    height: 2.75rem;
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }

  .pagination.circle .page-link {
    border-radius: 50%;
  }

  .ellipsis {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2.25rem;
    height: 2.25rem;
    color: var(--bs-secondary-color, #6c757d);
  }
`
