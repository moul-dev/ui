import { css } from 'lit'

export const sidebarStyles = css`
  :host {
    display: block;
    height: 100%;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    width: 260px;
    height: 100%;
    background-color: var(--bs-body-bg, #fff);
    border-right: 1px solid var(--bs-border-color, #dee2e6);
    transition: width 0.2s ease-in-out;
    box-sizing: border-box;
    overflow: hidden;
  }

  :host([collapsed]) .sidebar {
    width: 64px;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--bs-border-color, #dee2e6);
    min-height: 60px;
    box-sizing: border-box;
  }

  .sidebar-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0.75rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .sidebar-footer {
    padding: 0.75rem;
    border-top: 1px solid var(--bs-border-color, #dee2e6);
  }

  .collapse-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    color: var(--bs-secondary-color, #6c757d);
    border-radius: var(--bs-border-radius, 0.375rem);
  }

  .collapse-toggle:hover {
    background-color: var(--bs-tertiary-bg, #f8f9fa);
    color: var(--bs-body-color, #212529);
  }
`

export const sidebarItemStyles = css`
  :host {
    display: block;
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-radius: var(--bs-border-radius, 0.375rem);
    color: var(--bs-body-color, #212529);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out;
    user-select: none;
    white-space: nowrap;
    overflow: hidden;
  }

  .sidebar-item:hover {
    background-color: var(--bs-tertiary-bg, #f8f9fa);
    color: var(--bs-body-color, #212529);
  }

  :host([is-selected]) .sidebar-item {
    background-color: rgba(var(--bs-primary-rgb, 13, 110, 253), 0.1);
    color: var(--bs-primary, #0d6efd);
    font-weight: 600;
  }

  :host([is-disabled]) .sidebar-item {
    opacity: 0.5;
    pointer-events: none;
  }

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.25rem;
    font-size: 1.25rem;
  }

  .label {
    flex: 1;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  :host-context([collapsed]) .label,
  :host-context([collapsed]) .badge {
    display: none;
  }

  .badge {
    margin-left: auto;
  }
`

export const sidebarGroupStyles = css`
  :host {
    display: block;
    margin-top: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .group-header {
    display: flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--bs-secondary-color, #6c757d);
    user-select: none;
  }

  :host-context([collapsed]) .group-header {
    display: none;
  }
`

export const sidebarDividerStyles = css`
  :host {
    display: block;
    margin: 0.5rem 0;
  }

  hr {
    margin: 0;
    border: 0;
    border-top: 1px solid var(--bs-border-color, #dee2e6);
    opacity: 1;
  }
`
