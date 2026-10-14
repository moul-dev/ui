import { css } from 'lit'

export const commandPaletteStyles = css`
  :host {
    display: none;
  }

  :host([is-open]) {
    display: block;
  }

  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1055;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
    backdrop-filter: blur(2px);
  }

  .palette-dialog {
    width: 100%;
    max-width: 640px;
    background-color: var(--bs-body-bg, #fff);
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: var(--bs-border-radius-lg, 0.5rem);
    box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .palette-header {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--bs-border-color, #dee2e6);
    gap: 0.75rem;
  }

  .palette-search-icon {
    color: var(--bs-secondary-color, #6c757d);
    display: flex;
    align-items: center;
  }

  .palette-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 1.125rem;
    background: transparent;
    color: var(--bs-body-color, #212529);
  }

  .palette-body {
    max-height: 380px;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .palette-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    color: var(--bs-secondary-color, #6c757d);
    border-top: 1px solid var(--bs-border-color, #dee2e6);
    background-color: var(--bs-tertiary-bg, #f8f9fa);
  }

  .empty-state {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--bs-secondary-color, #6c757d);
    font-size: 0.875rem;
  }
`

export const commandPaletteItemStyles = css`
  :host {
    display: block;
  }

  .palette-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    border-radius: var(--bs-border-radius, 0.375rem);
    font-size: 0.875rem;
    color: var(--bs-body-color, #212529);
    cursor: pointer;
    user-select: none;
    transition: background-color 0.1s ease-in-out;
  }

  .palette-item:hover,
  :host([is-active]) .palette-item {
    background-color: var(--bs-tertiary-bg, #f8f9fa);
    color: var(--bs-primary, #0d6efd);
  }

  :host([is-disabled]) .palette-item {
    opacity: 0.5;
    pointer-events: none;
  }
`

export const commandPaletteSectionStyles = css`
  :host {
    display: block;
    margin-bottom: 0.5rem;
  }

  .section-heading {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--bs-secondary-color, #6c757d);
  }
`
