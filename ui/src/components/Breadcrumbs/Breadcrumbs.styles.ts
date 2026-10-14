import { css } from 'lit'

export const breadcrumbsStyles = css`
  :host {
    display: block;
  }
  .breadcrumb {
    display: flex;
    flex-wrap: wrap;
    padding: 0;
    margin: 0;
    list-style: none;
    gap: 0.5rem;
    align-items: center;
  }
`

export const breadcrumbItemStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
  }
  .breadcrumb-item {
    display: inline-flex;
    align-items: center;
    color: var(--bs-secondary-color, #6c757d);
    font-size: 0.875rem;
  }
  .breadcrumb-item.active {
    color: var(--bs-emphasis-color, #000);
    font-weight: 500;
  }
  a {
    color: var(--bs-link-color, #0d6efd);
    text-decoration: none;
  }
  a:hover {
    color: var(--bs-link-hover-color, #0a58ca);
    text-decoration: underline;
  }
  .separator {
    margin-inline-start: 0.5rem;
    color: var(--bs-secondary-color, #6c757d);
    user-select: none;
  }
`
