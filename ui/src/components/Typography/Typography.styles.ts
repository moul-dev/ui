import { css } from 'lit'

export const typographyStyles = css`
  :host {
    display: block;
  }
  .h1 { font-size: calc(1.375rem + 1.5vw); font-weight: 500; line-height: 1.2; margin-bottom: 0.5rem; }
  .h2 { font-size: calc(1.325rem + 0.9vw); font-weight: 500; line-height: 1.2; margin-bottom: 0.5rem; }
  .h3 { font-size: calc(1.3rem + 0.6vw); font-weight: 500; line-height: 1.2; margin-bottom: 0.5rem; }
  .h4 { font-size: calc(1.275rem + 0.3vw); font-weight: 500; line-height: 1.2; margin-bottom: 0.5rem; }
  .h5 { font-size: 1.25rem; font-weight: 500; line-height: 1.2; margin-bottom: 0.5rem; }
  .h6 { font-size: 1rem; font-weight: 500; line-height: 1.2; margin-bottom: 0.5rem; }
  .lead { font-size: 1.25rem; font-weight: 300; margin-bottom: 1rem; }
  .body { font-size: 1rem; line-height: 1.5; margin-bottom: 1rem; }
  .small { font-size: 0.875em; }
  .muted { color: var(--bs-secondary-color, #6c757d); }
`
