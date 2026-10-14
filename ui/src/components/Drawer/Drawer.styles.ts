import { css } from 'lit'

export const drawerStyles = css`
  :host {
    display: contents;
  }
  .offcanvas-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1040;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    display: none;
  }
  .offcanvas-backdrop.show {
    display: block;
  }
  .offcanvas {
    position: fixed;
    bottom: 0;
    z-index: 1045;
    display: flex;
    flex-direction: column;
    max-width: 100%;
    color: var(--bs-offcanvas-color, inherit);
    visibility: hidden;
    background-color: var(--bs-offcanvas-bg, #fff);
    background-clip: padding-box;
    outline: 0;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    transition: transform 0.3s ease-in-out;
  }
  .offcanvas.show {
    visibility: visible;
    transform: none !important;
  }
  .offcanvas-start {
    top: 0;
    left: 0;
    width: var(--bs-offcanvas-width, 400px);
    border-right: var(--bs-offcanvas-border-width, 1px) solid var(--bs-offcanvas-border-color, rgba(0, 0, 0, 0.175));
    transform: translateX(-100%);
  }
  .offcanvas-end {
    top: 0;
    right: 0;
    width: var(--bs-offcanvas-width, 400px);
    border-left: var(--bs-offcanvas-border-width, 1px) solid var(--bs-offcanvas-border-color, rgba(0, 0, 0, 0.175));
    transform: translateX(100%);
  }
  .offcanvas-top {
    top: 0;
    right: 0;
    left: 0;
    height: var(--bs-offcanvas-height, 30vh);
    max-height: 100%;
    border-bottom: var(--bs-offcanvas-border-width, 1px) solid var(--bs-offcanvas-border-color, rgba(0, 0, 0, 0.175));
    transform: translateY(-100%);
  }
  .offcanvas-bottom {
    right: 0;
    left: 0;
    height: var(--bs-offcanvas-height, 30vh);
    max-height: 100%;
    border-top: var(--bs-offcanvas-border-width, 1px) solid var(--bs-offcanvas-border-color, rgba(0, 0, 0, 0.175));
    transform: translateY(100%);
  }
  .offcanvas-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--bs-offcanvas-padding-y, 1rem) var(--bs-offcanvas-padding-x, 1rem);
    border-bottom: 1px solid var(--bs-border-color, #dee2e6);
  }
  .offcanvas-title {
    margin-bottom: 0;
    line-height: 1.5;
    font-size: 1.25rem;
    font-weight: 500;
  }
  .offcanvas-body {
    flex-grow: 1;
    padding: var(--bs-offcanvas-padding-y, 1rem) var(--bs-offcanvas-padding-x, 1rem);
    overflow-y: auto;
  }
  .offcanvas-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: var(--bs-offcanvas-padding-y, 1rem) var(--bs-offcanvas-padding-x, 1rem);
    border-top: 1px solid var(--bs-border-color, #dee2e6);
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
