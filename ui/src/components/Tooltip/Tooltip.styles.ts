import { css } from 'lit'

export const tooltipStyles = css`
  :host {
    display: inline-block;
    position: relative;
  }
  .tooltip {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1080;
    display: block;
    font-size: 0.8125rem;
    word-wrap: break-word;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s linear;
  }
  .tooltip.show {
    opacity: 0.9;
  }
  .tooltip-inner {
    max-width: 200px;
    padding: 0.25rem 0.5rem;
    color: var(--bs-tooltip-color, #fff);
    text-align: center;
    background-color: var(--bs-tooltip-bg, #000);
    border-radius: var(--bs-tooltip-border-radius, 0.375rem);
  }
`
