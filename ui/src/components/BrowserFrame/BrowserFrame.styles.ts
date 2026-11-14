import { css } from 'lit'

export const browserFrameStyles = css`
  :host {
    display: block;
    color: var(--color-fg);
  }

  :host([hidden]) {
    display: none;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  [part="base"] {
    overflow: hidden;
    /* Keeps composited children, such as a playing video, inside the rounded corners. */
    isolation: isolate;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-surface, 1.5rem);
    background: var(--color-surface);
    box-shadow: var(--shadow-surface);
  }

  /* The empty third column mirrors the dots, so the address sits in the middle. */
  [part="toolbar"] {
    display: grid;
    grid-template-columns: 1fr minmax(0, 4fr) 1fr;
    align-items: center;
    gap: 0.75em;
    padding: 0.625em 1em;
    border-block-end: 1px solid var(--color-border);
    background: var(--color-surface-secondary);
    color: var(--color-fg-subtle);
    font-family: var(--font-family-base, inherit);
    font-size: var(--font-size-xs, 0.75rem);
    line-height: 1.5;
    user-select: none;
  }

  .dots {
    display: flex;
    gap: 0.5em;
  }

  .dot {
    inline-size: 0.875em;
    block-size: 0.875em;
    flex: none;
    border-radius: 50%;
    background: var(--color-danger);
  }

  .dot:nth-child(2) {
    background: var(--color-warning);
  }

  .dot:nth-child(3) {
    background: var(--color-success);
  }

  [part="address"] {
    min-inline-size: 0;
    padding: 0.25em 1em;
    overflow: hidden;
    border-radius: var(--radius-full, 9999px);
    background: var(--color-surface);
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  ::slotted(img),
  ::slotted(video),
  ::slotted(iframe) {
    display: block;
    inline-size: 100%;
  }

  ::slotted(img),
  ::slotted(video) {
    block-size: auto;
  }

  ::slotted(iframe) {
    border: 0;
  }
`
