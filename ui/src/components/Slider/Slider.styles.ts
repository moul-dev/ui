import { css } from 'lit'

export const sliderStyles = css`
  :host {
    display: block;
    width: 100%;
  }
  .form-range {
    width: 100%;
    height: 1.5rem;
    padding: 0;
    background-color: transparent;
    appearance: none;
    cursor: pointer;
  }
  .form-range:focus {
    outline: 0;
  }
  .form-range::-webkit-slider-thumb {
    width: 1rem;
    height: 1rem;
    margin-top: -0.25rem;
    background-color: var(--bs-primary, #0d6efd);
    border: 0;
    border-radius: 1rem;
    appearance: none;
    transition: background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out;
  }
  .form-range::-webkit-slider-runnable-track {
    width: 100%;
    height: 0.5rem;
    color: transparent;
    cursor: pointer;
    background-color: var(--bs-secondary-bg, #dee2e6);
    border-color: transparent;
    border-radius: 1rem;
  }
  .form-range:disabled {
    pointer-events: none;
    opacity: 0.5;
    cursor: not-allowed;
  }
`
