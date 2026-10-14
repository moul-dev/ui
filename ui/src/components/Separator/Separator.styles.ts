import { css } from 'lit'

export const separatorStyles = css`
  :host {
    display: block;
  }
  :host([orientation="vertical"]) {
    display: inline-block;
    height: 100%;
    min-height: 1em;
    vertical-align: middle;
  }
  hr {
    margin: 1rem 0;
    color: inherit;
    border: 0;
    border-top: var(--bs-border-width, 1px) solid var(--bs-border-color, #dee2e6);
    opacity: 0.25;
  }
  .vr {
    display: inline-block;
    align-self: stretch;
    width: var(--bs-border-width, 1px);
    min-height: 1em;
    background-color: var(--bs-border-color, #dee2e6);
    opacity: 0.25;
    margin: 0 0.5rem;
  }
`
