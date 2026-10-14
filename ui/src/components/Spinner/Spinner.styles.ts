import { css } from 'lit'

export const spinnerStyles = css`
  :host {
    display: inline-flex;
    vertical-align: -0.125em;
  }
  .spinner-border {
    display: inline-block;
    width: 2rem;
    height: 2rem;
    vertical-align: -0.125em;
    border: 0.25em solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: 0.75s linear infinite spinner-border;
  }
  .spinner-border-sm {
    width: 1rem;
    height: 1rem;
    border-width: 0.2em;
  }
  .spinner-grow {
    display: inline-block;
    width: 2rem;
    height: 2rem;
    vertical-align: -0.125em;
    background-color: currentColor;
    border-radius: 50%;
    opacity: 0;
    animation: 0.75s linear infinite spinner-grow;
  }
  .spinner-grow-sm {
    width: 1rem;
    height: 1rem;
  }
  @keyframes spinner-border {
    to { transform: rotate(360deg); }
  }
  @keyframes spinner-grow {
    0% { transform: scale(0); }
    50% { opacity: 1; transform: none; }
  }
  .visually-hidden {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }
`
