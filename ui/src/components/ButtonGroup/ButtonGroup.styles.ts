import { css } from 'lit'

export const buttonGroupStyles = css`
  :host {
    display: inline-flex;
  }
  .btn-group {
    position: relative;
    display: inline-flex;
    vertical-align: middle;
  }
  :host([orientation="vertical"]) .btn-group {
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  }
  ::slotted(moul-button:not(:first-child)) {
    margin-left: -1px;
    --bs-border-top-left-radius: 0;
    --bs-border-bottom-left-radius: 0;
  }
  ::slotted(moul-button:not(:last-child)) {
    --bs-border-top-right-radius: 0;
    --bs-border-bottom-right-radius: 0;
  }
  :host([orientation="vertical"]) ::slotted(moul-button:not(:first-child)) {
    margin-left: 0;
    margin-top: -1px;
    --bs-border-top-left-radius: 0;
    --bs-border-top-right-radius: 0;
  }
  :host([orientation="vertical"]) ::slotted(moul-button:not(:last-child)) {
    --bs-border-bottom-left-radius: 0;
    --bs-border-bottom-right-radius: 0;
  }
`
