import { css } from 'lit'

export const popoverStyles = css`
  :host {
    display: inline-block;
    position: relative;
  }
  .popover-container {
    display: inline-block;
  }
  .popover {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1060;
    display: block;
    max-width: 276px;
    font-family: inherit;
    font-size: 0.875rem;
    word-wrap: break-word;
    background-color: var(--bs-popover-bg, #fff);
    background-clip: padding-box;
    border: var(--bs-popover-border-width, 1px) solid var(--bs-popover-border-color, rgba(0, 0, 0, 0.175));
    border-radius: var(--bs-popover-border-radius, 0.5rem);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    padding: 0.75rem 1rem;
  }
  .popover:not(.show) {
    display: none;
  }
`
