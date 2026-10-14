import { css } from 'lit'

export const linkStyles = css`
  :host {
    display: inline;
  }
  a {
    color: var(--bs-link-color, #0d6efd);
    text-decoration: underline;
    transition: color 0.15s ease-in-out;
    cursor: pointer;
  }
  a:hover {
    color: var(--bs-link-hover-color, #0a58ca);
  }
  :host([is-quiet]) a {
    text-decoration: none;
  }
  :host([is-quiet]) a:hover {
    text-decoration: underline;
  }
  .link-secondary { color: var(--bs-secondary, #6c757d); }
  .link-success { color: var(--bs-success, #198754); }
  .link-danger { color: var(--bs-danger, #dc3545); }
  .link-warning { color: var(--bs-warning, #ffc107); }
  .link-info { color: var(--bs-info, #0dcaf0); }
  .link-light { color: var(--bs-light, #f8f9fa); }
  .link-dark { color: var(--bs-dark, #212529); }
`
