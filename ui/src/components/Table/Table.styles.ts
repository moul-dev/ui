import { css } from 'lit'

export const tableStyles = css`
  :host {
    display: block;
    width: 100%;
    overflow-x: auto;
  }

  .table-responsive {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  table {
    width: 100%;
    margin-bottom: 1rem;
    vertical-align: top;
    border-color: var(--bs-border-color, #dee2e6);
    caption-side: bottom;
    border-collapse: collapse;
  }

  ::slotted(table) {
    width: 100%;
    margin-bottom: 1rem;
    border-color: var(--bs-border-color, #dee2e6);
  }
`
