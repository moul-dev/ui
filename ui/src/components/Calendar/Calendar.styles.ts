import { css } from 'lit'

export const calendarStyles = css`
  :host {
    display: inline-block;
  }

  .calendar-container {
    display: inline-block;
    background-color: var(--bs-body-bg, #fff);
    border: 1px solid var(--bs-border-color, #dee2e6);
    border-radius: var(--bs-border-radius, 0.375rem);
    padding: 0.5rem;
  }
`
