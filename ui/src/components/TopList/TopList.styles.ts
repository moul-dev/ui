import { css } from 'lit'

export const topListStyles = css`
  :host {
    display: block;
  }
  .list-group {
    display: flex;
    flex-direction: column;
    padding-left: 0;
    margin-bottom: 0;
    border-radius: var(--bs-border-radius, 0.375rem);
    border: var(--bs-border-width, 1px) solid var(--bs-border-color, #dee2e6);
    overflow: hidden;
  }
  .list-group-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    color: var(--bs-body-color, #212529);
    background-color: var(--bs-body-bg, #fff);
    border-bottom: var(--bs-border-width, 1px) solid var(--bs-border-color, #dee2e6);
  }
  .list-group-item:last-child {
    border-bottom: 0;
  }
  .rank {
    font-weight: 700;
    width: 2rem;
    color: var(--bs-secondary-color, #6c757d);
  }
  .title {
    flex: 1 1 auto;
    font-weight: 500;
  }
  .value {
    font-weight: 600;
    color: var(--bs-emphasis-color, inherit);
  }
`
