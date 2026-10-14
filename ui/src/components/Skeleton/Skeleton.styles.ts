import { css } from 'lit'

export const skeletonStyles = css`
  :host {
    display: block;
  }
  .placeholder {
    display: inline-block;
    min-height: 1em;
    vertical-align: middle;
    cursor: wait;
    background-color: currentColor;
    opacity: 0.15;
    border-radius: var(--bs-border-radius, 0.375rem);
    width: 100%;
  }
  .placeholder-glow .placeholder {
    animation: placeholder-glow 2s ease-in-out infinite;
  }
  @keyframes placeholder-glow {
    50% { opacity: 0.3; }
  }
  .circular {
    border-radius: 50%;
  }
`
