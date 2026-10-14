import { css } from 'lit'

export const comboboxStyles = css`
  :host {
    display: block;
    width: 100%;
    position: relative;
  }
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .form-control {
    display: block;
    width: 100%;
    padding: 0.375rem 2.25rem 0.375rem 0.75rem;
    font-size: 1rem;
    color: var(--bs-body-color, #212529);
    background-color: var(--bs-body-bg, #fff);
    border: var(--bs-border-width, 1px) solid var(--bs-border-color, #dee2e6);
    border-radius: var(--bs-border-radius, 0.375rem);
    transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
  }
  .form-control:focus {
    border-color: #86b7fe;
    outline: 0;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }
  .toggle-btn {
    position: absolute;
    right: 0.75rem;
    background: transparent;
    border: 0;
    padding: 0;
    color: var(--bs-secondary-color, #6c757d);
    cursor: pointer;
    font-size: 0.75rem;
  }
  .popover-menu {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1050;
    background-color: var(--bs-body-bg, #fff);
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: var(--bs-border-radius, 0.375rem);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    max-height: 16rem;
    overflow-y: auto;
    display: none;
  }
  .popover-menu.show {
    display: block;
  }
  .empty-state {
    padding: 0.75rem;
    color: var(--bs-secondary-color, #6c757d);
    text-align: center;
    font-size: 0.875rem;
  }
`

export const comboboxItemStyles = css`
  :host {
    display: block;
  }
  .combobox-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.375rem 0.75rem;
    font-size: 0.9375rem;
    color: var(--bs-body-color, #212529);
    cursor: pointer;
    user-select: none;
  }
  .combobox-item:hover,
  .combobox-item.active {
    background-color: var(--bs-tertiary-bg, #f8f9fa);
  }
  .combobox-item.selected {
    background-color: rgba(13, 110, 253, 0.1);
    color: var(--bs-primary, #0d6efd);
    font-weight: 500;
  }
  .combobox-item.hidden {
    display: none !important;
  }
`

export const comboboxSectionStyles = css`
  :host {
    display: block;
  }
  .section-title {
    padding: 0.5rem 0.75rem 0.25rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--bs-secondary-color, #6c757d);
  }
`
