import { css } from 'lit'

export const kbdStyles = css`
  :host {
    display: inline-block;
  }
  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.15em 0.4em;
    font-family: var(--bs-font-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
    font-size: 0.85em;
    font-weight: 500;
    line-height: 1;
    color: var(--bs-body-color, #212529);
    background-color: var(--bs-tertiary-bg, #f8f9fa);
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: var(--bs-border-radius-sm, 0.25rem);
    box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.15);
  }
`
