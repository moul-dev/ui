import { css } from 'lit'

export const selectStyles = css`
  :host {
    display: block;
    width: 100%;
    position: relative;
  }
  .form-select {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.375rem 2.25rem 0.375rem 0.75rem;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    color: var(--bs-body-color, #212529);
    background-color: var(--bs-body-bg, #fff);
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 16px 12px;
    border: var(--bs-border-width, 1px) solid var(--bs-border-color, #dee2e6);
    border-radius: var(--bs-border-radius, 0.375rem);
    transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
    cursor: pointer;
    user-select: none;
    text-align: left;
  }
  .form-select:focus {
    border-color: #86b7fe;
    outline: 0;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }
  .form-select:disabled {
    background-color: var(--bs-secondary-bg, #e9ecef);
    opacity: 1;
    cursor: not-allowed;
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
`

export const selectItemStyles = css`
  :host {
    display: block;
  }
  .select-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.375rem 0.75rem;
    font-size: 0.9375rem;
    color: var(--bs-body-color, #212529);
    cursor: pointer;
    user-select: none;
  }
  .select-item:hover,
  .select-item.active {
    background-color: var(--bs-tertiary-bg, #f8f9fa);
  }
  .select-item.selected {
    background-color: rgba(13, 110, 253, 0.1);
    color: var(--bs-primary, #0d6efd);
    font-weight: 500;
  }
  .select-item.disabled {
    pointer-events: none;
    opacity: 0.5;
  }
`

export const selectSectionStyles = css`
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
