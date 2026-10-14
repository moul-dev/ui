import { css } from 'lit'

export const avatarStyles = css`
  :host {
    display: inline-block;
  }
  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border-radius: 50%;
    overflow: hidden;
    background-color: var(--bs-secondary-bg, #e9ecef);
    color: var(--bs-secondary-color, #6c757d);
    font-weight: 600;
    user-select: none;
    vertical-align: middle;
  }
  .avatar-sm { width: 2rem; height: 2rem; font-size: 0.75rem; }
  .avatar-md { width: 2.5rem; height: 2.5rem; font-size: 0.875rem; }
  .avatar-lg { width: 3rem; height: 3rem; font-size: 1.125rem; }
  .avatar-xl { width: 4rem; height: 4rem; font-size: 1.5rem; }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .avatar-square {
    border-radius: var(--bs-border-radius, 0.375rem);
  }
`

export const avatarGroupStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
  }
  ::slotted(moul-avatar) {
    margin-inline-end: -0.75rem;
    border: 2px solid var(--bs-body-bg, #ffffff);
    border-radius: 50%;
  }
`
