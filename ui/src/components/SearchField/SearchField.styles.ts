import { css } from 'lit'

export const searchFieldStyles = css`
  :host {
    display: block;
    width: 100%;
  }
  .search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .search-icon {
    position: absolute;
    left: 0.75rem;
    color: var(--bs-secondary-color, #6c757d);
    pointer-events: none;
    display: inline-flex;
    align-items: center;
  }
  .form-control {
    display: block;
    width: 100%;
    padding: 0.375rem 2.25rem 0.375rem 2.25rem;
    font-size: 1rem;
    line-height: 1.5;
    color: var(--bs-body-color, #212529);
    background-color: var(--bs-body-bg, #fff);
    border: var(--bs-border-width, 1px) solid var(--bs-border-color, #dee2e6);
    border-radius: var(--bs-border-radius, 0.375rem);
    transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
  }
  .form-control:focus {
    color: var(--bs-body-color, #212529);
    background-color: var(--bs-body-bg, #fff);
    border-color: #86b7fe;
    outline: 0;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }
  .clear-btn {
    position: absolute;
    right: 0.5rem;
    background: transparent;
    border: 0;
    padding: 0.25rem;
    color: var(--bs-secondary-color, #6c757d);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    border-radius: 50%;
  }
  .clear-btn:hover {
    color: var(--bs-body-color, #212529);
  }
`
