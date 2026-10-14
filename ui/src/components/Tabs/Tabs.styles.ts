import { css } from 'lit'

export const tabsStyles = css`
  :host {
    display: block;
  }

  .tabs-container {
    display: flex;
  }

  .tabs-container.horizontal {
    flex-direction: column;
  }

  .tabs-container.vertical {
    flex-direction: row;
    gap: 1.5rem;
  }

  .tab-list {
    display: flex;
    margin: 0;
    padding: 0;
    list-style: none;
    border-bottom: 1px solid var(--bs-border-color, #dee2e6);
  }

  .tabs-container.vertical .tab-list {
    flex-direction: column;
    border-bottom: none;
    border-right: 1px solid var(--bs-border-color, #dee2e6);
  }

  .tab-list.pills {
    border-bottom: none;
    gap: 0.25rem;
  }

  .tab-panels {
    flex: 1;
    padding-top: 1rem;
  }

  .tabs-container.vertical .tab-panels {
    padding-top: 0;
  }
`

export const tabStyles = css`
  :host {
    display: inline-block;
  }

  .tab-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: var(--bs-body-font-size, 1rem);
    font-weight: 500;
    color: var(--bs-secondary-color, #6c757d);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    margin-bottom: -1px;
    transition: color 0.15s ease-in-out, border-color 0.15s ease-in-out;
  }

  .tab-button:hover:not(:disabled) {
    color: var(--bs-body-color, #212529);
  }

  :host([is-selected]) .tab-button {
    color: var(--bs-primary, #0d6efd);
    border-bottom-color: var(--bs-primary, #0d6efd);
  }

  /* Pills variant */
  :host-context([variant="pills"]) .tab-button {
    border-bottom: none;
    border-radius: var(--bs-border-radius, 0.375rem);
    margin-bottom: 0;
  }

  :host-context([variant="pills"]):host([is-selected]) .tab-button {
    background-color: var(--bs-primary, #0d6efd);
    color: #fff;
  }

  :host([is-disabled]) .tab-button {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const tabPanelStyles = css`
  :host {
    display: none;
  }

  :host([is-selected]) {
    display: block;
  }
`
