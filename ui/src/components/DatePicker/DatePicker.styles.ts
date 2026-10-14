import { css } from 'lit'

export const datePickerStyles = css`
  :host {
    display: inline-block;
    width: 100%;
  }

  .date-picker-container {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    position: relative;
  }

  .label {
    font-size: var(--bs-body-font-size, 1rem);
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .form-control {
    width: 100%;
    padding-right: 2.25rem;
  }

  .calendar-icon {
    position: absolute;
    right: 0.75rem;
    pointer-events: none;
    color: var(--bs-secondary-color, #6c757d);
    display: flex;
    align-items: center;
  }

  .description {
    font-size: 0.875rem;
    color: var(--bs-secondary-color, #6c757d);
  }

  .error-message {
    font-size: 0.875rem;
    color: var(--bs-danger, #dc3545);
  }
`
