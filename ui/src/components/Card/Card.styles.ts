import { css } from 'lit'

export const cardStyles = css`
  :host {
    display: block;
  }
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-color: var(--bs-card-bg, var(--bs-bg-body, #fff));
    background-clip: border-box;
    border: var(--bs-card-border-width, 1px) solid var(--bs-card-border-color, var(--bs-border-color, rgba(0, 0, 0, 0.175)));
    border-radius: var(--bs-card-border-radius, var(--bs-border-radius, 0.375rem));
    overflow: hidden;
  }
  .card.interactive {
    cursor: pointer;
    transition: transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }
  .card.interactive:hover {
    transform: translateY(-2px);
    box-shadow: var(--bs-box-shadow, 0 0.5rem 1rem rgba(0, 0, 0, 0.15));
  }
  .card-header {
    padding: var(--bs-card-cap-padding-y, 0.75rem) var(--bs-card-cap-padding-x, 1rem);
    margin-bottom: 0;
    color: var(--bs-card-cap-color, inherit);
    background-color: var(--bs-card-cap-bg, var(--bs-bg-2, rgba(0, 0, 0, 0.03)));
    border-bottom: var(--bs-card-border-width, 1px) solid var(--bs-card-border-color, var(--bs-border-color, rgba(0, 0, 0, 0.175)));
    font-weight: 600;
  }
  .card-body {
    flex: 1 1 auto;
    padding: var(--bs-card-spacer-y, 1rem) var(--bs-card-spacer-x, 1rem);
    color: var(--bs-card-color, inherit);
  }
  .card-footer {
    padding: var(--bs-card-cap-padding-y, 0.75rem) var(--bs-card-cap-padding-x, 1rem);
    color: var(--bs-card-cap-color, inherit);
    background-color: var(--bs-card-cap-bg, var(--bs-bg-2, rgba(0, 0, 0, 0.03)));
    border-top: var(--bs-card-border-width, 1px) solid var(--bs-card-border-color, var(--bs-border-color, rgba(0, 0, 0, 0.175)));
  }
  .d-none {
    display: none !important;
  }
`
