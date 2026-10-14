import { css } from 'lit'

export const modalStyles = css`
  :host {
    display: contents;
  }
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1050;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    display: none;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    overflow-x: hidden;
    overflow-y: auto;
  }
  .modal-backdrop.show {
    display: flex;
  }
  .modal-dialog {
    position: relative;
    width: 100%;
    margin: auto;
    pointer-events: auto;
    max-width: 500px;
  }
  .modal-sm { max-width: 300px; }
  .modal-lg { max-width: 800px; }
  .modal-xl { max-width: 1140px; }
  .modal-fullscreen {
    max-width: none;
    width: 100vw;
    height: 100vh;
    margin: 0;
  }
  .modal-content {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    color: var(--bs-modal-color, inherit);
    pointer-events: auto;
    background-color: var(--bs-modal-bg, #fff);
    background-clip: padding-box;
    border: var(--bs-modal-border-width, 1px) solid var(--bs-modal-border-color, rgba(0, 0, 0, 0.175));
    border-radius: var(--bs-modal-border-radius, 0.5rem);
    outline: 0;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  }
  .modal-header {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    padding: var(--bs-modal-header-padding, 1rem);
    border-bottom: var(--bs-modal-header-border-width, 1px) solid var(--bs-modal-header-border-color, #dee2e6);
  }
  .modal-title {
    margin-bottom: 0;
    line-height: 1.5;
    font-size: 1.25rem;
    font-weight: 500;
  }
  .modal-body {
    position: relative;
    flex: 1 1 auto;
    padding: var(--bs-modal-padding, 1rem);
  }
  .modal-footer {
    display: flex;
    flex-wrap: wrap;
    flex-shrink: 0;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: calc(var(--bs-modal-padding, 1rem) * 0.75);
    border-top: var(--bs-modal-footer-border-width, 1px) solid var(--bs-modal-footer-border-color, #dee2e6);
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
