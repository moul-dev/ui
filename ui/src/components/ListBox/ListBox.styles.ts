import { css } from 'lit'

export const listboxStyles = css`
  :host {
    display: block;
    width: 100%;
  }
  .listbox {
    display: flex;
    flex-direction: column;
    padding: 0.25rem 0;
    margin: 0;
    list-style: none;
    background-color: var(--bs-body-bg, #fff);
    border: var(--bs-border-width, 1px) solid var(--bs-border-color, #dee2e6);
    border-radius: var(--bs-border-radius, 0.375rem);
    max-height: 18rem;
    overflow-y: auto;
    outline: 0;
  }
`

export const listboxItemStyles = css`
  :host {
    display: block;
  }
  .listbox-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.375rem 0.75rem;
    font-size: 0.9375rem;
    color: var(--bs-body-color, #212529);
    cursor: pointer;
    user-select: none;
    transition: background-color .1s ease-in-out;
  }
  .listbox-item:hover,
  .listbox-item.active {
    background-color: var(--bs-tertiary-bg, #f8f9fa);
  }
  .listbox-item.selected {
    background-color: rgba(13, 110, 253, 0.1);
    color: var(--bs-primary, #0d6efd);
    font-weight: 500;
  }
  .listbox-item.disabled {
    pointer-events: none;
    opacity: 0.5;
    cursor: not-allowed;
  }
  .check-icon {
    margin-left: auto;
    color: var(--bs-primary, #0d6efd);
  }
`

export const listboxSectionStyles = css`
  :host {
    display: block;
  }
  .section-header {
    padding: 0.5rem 0.75rem 0.25rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--bs-secondary-color, #6c757d);
    letter-spacing: 0.05em;
  }
`
