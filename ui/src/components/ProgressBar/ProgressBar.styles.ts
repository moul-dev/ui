import { css } from 'lit'

export const progressBarStyles = css`
  :host {
    display: block;
    width: 100%;
  }
  .progress {
    display: flex;
    height: var(--bs-progress-height, 1rem);
    overflow: hidden;
    font-size: var(--bs-progress-font-size, 0.75rem);
    background-color: var(--bs-progress-bg, #e9ecef);
    border-radius: var(--bs-progress-border-radius, 0.375rem);
  }
  .progress-bar {
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    color: var(--bs-progress-bar-color, #fff);
    text-align: center;
    white-space: nowrap;
    background-color: var(--bs-progress-bar-bg, #0d6efd);
    transition: var(--bs-progress-bar-transition, width 0.6s ease);
  }
  .progress-bar-striped {
    background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);
    background-size: var(--bs-progress-height, 1rem) var(--bs-progress-height, 1rem);
  }
  .progress-bar-animated {
    animation: 1s linear infinite progress-bar-stripes;
  }
  @keyframes progress-bar-stripes {
    0% { background-position-x: 1rem; }
  }
`
