import { css } from 'lit'

export const percentageStyles = css`
  :host {
    display: block;
  }
  .progress {
    display: flex;
    height: 0.5rem;
    overflow: hidden;
    background-color: var(--bs-secondary-bg, #e9ecef);
    border-radius: var(--bs-border-radius-pill, 50rem);
  }
  .progress-bar {
    display: flex;
    flex-direction: column;
    justify-content: center;
    background-color: var(--bs-primary, #0d6efd);
    transition: width 0.4s ease;
  }
  .circle-container {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .circle-svg {
    transform: rotate(-90deg);
  }
  .circle-bg {
    fill: none;
    stroke: var(--bs-secondary-bg, #e9ecef);
  }
  .circle-progress {
    fill: none;
    stroke: var(--bs-primary, #0d6efd);
    stroke-linecap: round;
    transition: stroke-dashoffset 0.4s ease;
  }
  .circle-label {
    position: absolute;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--bs-emphasis-color, inherit);
  }
`
