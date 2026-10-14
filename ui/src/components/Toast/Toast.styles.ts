import { css } from 'lit'

export const toastStyles = css`
  :host {
    display: block;
  }
  .toast {
    position: relative;
    width: 350px;
    max-width: 100%;
    font-size: 0.875rem;
    pointer-events: auto;
    background-color: var(--bs-body-bg, #fff);
    background-clip: padding-box;
    border: var(--bs-border-width, 1px) solid var(--bs-border-color, rgba(0, 0, 0, 0.175));
    border-radius: var(--bs-border-radius, 0.375rem);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    margin-bottom: 0.75rem;
    overflow: hidden;
  }
  .toast-header {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    color: var(--bs-secondary-color, #6c757d);
    background-color: var(--bs-tertiary-bg, rgba(0, 0, 0, 0.03));
    border-bottom: var(--bs-border-width, 1px) solid var(--bs-border-color, rgba(0, 0, 0, 0.175));
  }
  .toast-title {
    margin-right: auto;
    font-weight: 600;
    color: var(--bs-emphasis-color, #000);
  }
  .toast-body {
    padding: 0.75rem;
    word-wrap: break-word;
    color: var(--bs-body-color, #212529);
  }
  .btn-close {
    box-sizing: content-box;
    width: 1em;
    height: 1em;
    padding: 0.25em;
    color: inherit;
    background: transparent;
    border: 0;
    border-radius: 0.375rem;
    opacity: 0.5;
    cursor: pointer;
  }
  .btn-close:hover {
    opacity: 0.75;
  }
`

export const toastContainerStyles = css`
  :host {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 1090;
    pointer-events: none;
    display: flex;
    flex-direction: column-reverse;
  }
`
