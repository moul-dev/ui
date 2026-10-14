import { css } from 'lit'

export const toggleButtonGroupStyles = css`
  :host {
    display: inline-flex;
  }
  .btn-group {
    position: relative;
    display: inline-flex;
    vertical-align: middle;
  }
  ::slotted(moul-toggle-button:not(:first-child)) {
    margin-left: -1px;
    --bs-border-top-left-radius: 0;
    --bs-border-bottom-left-radius: 0;
  }
  ::slotted(moul-toggle-button:not(:last-child)) {
    --bs-border-top-right-radius: 0;
    --bs-border-bottom-right-radius: 0;
  }
`
