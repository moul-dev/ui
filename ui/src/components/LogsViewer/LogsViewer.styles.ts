import { type CSSResultGroup, css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const logsViewerStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
      color: var(--color-fg, #18181b);
      font-family: var(--font-family-base, inherit);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    /* HeroUI card surface: white fill lifted by a soft shadow, no border. */
    .container {
      display: flex;
      flex-direction: column;
      background-color: var(--color-surface, #ffffff);
      border-radius: var(--radius-surface, 1.5rem);
      overflow: hidden;
      box-shadow: var(--shadow-surface, 0 1px 2px 0 rgba(0, 0, 0, 0.06));
    }

    /* Toolbar */
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-2, 0.5rem);
      padding: var(--spacing-3, 0.75rem);
      border-bottom: 1px solid var(--color-separator, #e4e4e7);
      user-select: none;
    }

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      flex-wrap: wrap;
    }

    /* Search: HeroUI secondary search field (default fill, no shadow, used inside surfaces). */
    .search-box {
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      inset-inline-start: var(--spacing-3, 0.75rem);
      width: 1rem;
      height: 1rem;
      color: var(--color-field-placeholder, #71717a);
      pointer-events: none;
    }

    .search-input {
      height: 2rem;
      min-width: 10rem;
      padding-block: 0;
      padding-inline: 2.25rem 2rem;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      border: none;
      border-radius: var(--radius-field, 0.75rem);
      background-color: var(--color-default, #f4f4f5);
      color: var(--color-field-fg, #18181b);
      outline: none;
      transition:
        background-color var(--duration-fast, 150ms) var(--ease-smooth, ease),
        box-shadow var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    .search-input::placeholder {
      color: var(--color-field-placeholder, #71717a);
    }

    @media (hover: hover) {
      .search-input:hover:not(:focus) {
        background-color: var(--color-default-hover, #e4e4e7);
      }
    }

    .search-input:focus,
    .search-input:focus-visible {
      outline: none;
      background-color: var(--color-default, #f4f4f5);
      box-shadow: var(--focus-ring-field);
    }

    .search-clear-btn {
      position: absolute;
      inset-inline-end: var(--spacing-2, 0.5rem);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--color-muted, #71717a);
      font-size: var(--font-size-xs, 0.75rem);
      cursor: pointer;
      border-radius: var(--radius-full, 9999px);
      transition:
        background-color var(--duration-fast, 150ms) var(--ease-smooth, ease),
        color var(--duration-fast, 150ms) var(--ease-smooth, ease);
    }

    @media (hover: hover) {
      .search-clear-btn:hover {
        background-color: var(--color-default-hover, #e4e4e7);
        color: var(--color-fg, #18181b);
      }
    }

    .search-clear-btn:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    /* Level filter: HeroUI tabs (default track, raised segment indicator). */
    .filter-group {
      position: relative;
      isolation: isolate;
      display: inline-flex;
      align-items: center;
      background-color: var(--color-default, #f4f4f5);
      border-radius: var(--radius-3xl, 1.5rem);
      padding: 0.125rem;
      gap: 0;
    }

    .filter-indicator {
      position: absolute;
      top: 0.125rem;
      bottom: 0.125rem;
      background-color: var(--color-segment, #ffffff);
      border-radius: var(--radius-3xl, 1.5rem);
      pointer-events: none;
      box-shadow: var(--shadow-surface, 0 1px 2px 0 rgba(0, 0, 0, 0.06));
      z-index: 0;
    }

    .filter-pill {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 1.75rem;
      padding: 0 var(--spacing-3, 0.75rem);
      border: none;
      background: transparent;
      color: var(--color-muted, #71717a);
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: var(--line-height-xs, 1rem);
      text-transform: capitalize;
      border-radius: var(--radius-3xl, 1.5rem);
      cursor: pointer;
      outline: none;
      transition:
        color var(--duration-fast, 150ms) var(--ease-smooth, ease),
        opacity var(--duration-fast, 150ms) var(--ease-smooth, ease),
        box-shadow var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      .filter-pill:not([aria-pressed='true']):not(.active):hover {
        opacity: 0.7;
      }
    }

    .filter-pill[aria-pressed='true'],
    .filter-pill.active {
      color: var(--color-fg, #18181b);
    }

    .filter-pill:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    /* Counts: HeroUI default chip. */
    .counts-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem var(--spacing-2, 0.5rem);
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: 1.25rem;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      color: var(--color-muted, #71717a);
      background-color: var(--color-default, #f4f4f5);
      border-radius: var(--radius-2xl, 1rem);
    }

    /* Toolbar buttons: HeroUI ghost buttons (sm); pressed toggles use accent-soft. */
    .tool-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-1, 0.25rem);
      height: 2rem;
      min-width: 2rem;
      padding: 0 var(--spacing-2, 0.5rem);
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: 1;
      border: none;
      border-radius: var(--radius-3xl, 1.5rem);
      background-color: transparent;
      color: var(--color-default-fg, #18181b);
      cursor: pointer;
      outline: none;
      transform-origin: center;
      transition:
        transform var(--duration-fast, 150ms) var(--ease-out, ease-out),
        background-color 100ms var(--ease-out, ease-out),
        box-shadow 100ms var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      .tool-btn:hover {
        background-color: var(--color-default, #f4f4f5);
      }
    }

    .tool-btn:active {
      background-color: var(--color-default-hover, #e4e4e7);
      transform: scale(var(--press-scale, 0.97));
    }

    .tool-btn[aria-pressed='true'],
    .tool-btn.active {
      background-color: var(--color-accent-soft);
      color: var(--color-accent-soft-fg);
    }

    @media (hover: hover) {
      .tool-btn[aria-pressed='true']:hover,
      .tool-btn.active:hover {
        background-color: var(--color-accent-soft-hover);
      }
    }

    .tool-btn:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .tool-btn svg {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }

    /* Logs viewport */
    .scroll-container {
      position: relative;
      overflow-y: auto;
      overflow-x: auto;
      max-height: var(--logs-max-height, 600px);
      background-color: var(--color-surface, #ffffff);
      font-family: var(--font-family-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: 1.5;
      scrollbar-width: thin;
      scrollbar-color: var(--color-scrollbar-thumb) transparent;
    }

    .logs-table {
      display: table;
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
    }

    /* Rows: HeroUI table rows with separator dividers. */
    .row {
      display: table-row;
      border-bottom: 1px solid var(--color-separator, #e4e4e7);
      cursor: pointer;
      transition: background-color 100ms var(--ease-out, ease-out);
    }

    .row:last-child {
      border-bottom-color: transparent;
    }

    @media (hover: hover) {
      .row:hover {
        background-color: var(--color-default-soft, rgba(244, 244, 245, 0.5));
      }
    }

    .row.selected {
      background-color: var(--color-accent-soft);
    }

    @media (hover: hover) {
      .row.selected:hover {
        background-color: var(--color-accent-soft-hover);
      }
    }

    /* Inset ring so the scroll viewport never clips it. */
    .row:focus-visible {
      outline: 2px solid var(--color-focus, #3b82f6);
      outline-offset: -2px;
    }

    .row.compact .cell {
      padding-top: 0.125rem;
      padding-bottom: 0.125rem;
    }

    /* Cells */
    .cell {
      display: table-cell;
      padding: 0.375rem var(--spacing-2, 0.5rem);
      vertical-align: top;
      white-space: nowrap;
    }

    .cell:first-child {
      padding-inline-start: var(--spacing-3, 0.75rem);
    }

    .cell:last-child {
      padding-inline-end: var(--spacing-3, 0.75rem);
    }

    .cell-line {
      width: 44px;
      min-width: 44px;
      text-align: right;
      color: var(--color-muted, #71717a);
      user-select: none;
      font-variant-numeric: tabular-nums;
    }

    .cell-time {
      width: 170px;
      min-width: 170px;
      color: var(--color-muted, #71717a);
      font-variant-numeric: tabular-nums;
    }

    .cell-level {
      width: 4rem;
      min-width: 4rem;
    }

    /* Level badges: HeroUI soft chips (sm), sized to the log line box. */
    .level-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 3rem;
      padding: 0 var(--spacing-2, 0.5rem);
      font-family: var(--font-family-base, inherit);
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: inherit;
      white-space: nowrap;
      border-radius: var(--radius-2xl, 1rem);
      background-color: var(--color-default, #f4f4f5);
      color: var(--color-default-fg, #18181b);
    }

    .level-badge.level-info {
      background-color: var(--color-accent-soft);
      color: var(--color-accent-soft-fg);
    }

    .level-badge.level-warn {
      background-color: var(--color-warning-soft);
      color: var(--color-warning-soft-fg);
    }

    .level-badge.level-error {
      background-color: var(--color-danger-soft);
      color: var(--color-danger-soft-fg);
    }

    /* Fatal escalates to the solid danger chip. */
    .level-badge.level-fatal {
      background-color: var(--color-danger);
      color: var(--color-danger-fg);
    }

    .level-badge.level-debug,
    .level-badge.level-trace {
      background-color: var(--color-default, #f4f4f5);
      color: var(--color-muted, #71717a);
    }

    .cell-message {
      width: 100%;
      word-break: break-word;
      color: var(--color-fg, #18181b);
    }

    /* Preserve whitespace in the log text only — not the template's own indentation */
    .wrap-lines .cell-message {
      white-space: normal;
    }

    .no-wrap .cell-message {
      white-space: nowrap;
    }

    .wrap-lines .cell-message > .message-text {
      white-space: pre-wrap;
    }

    .no-wrap .cell-message > .message-text {
      white-space: pre;
    }

    /* Attribute chips: HeroUI default chips (sm). */
    .attribute-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.125rem;
      margin: 1px var(--spacing-1, 0.25rem) 1px 0;
      padding: 0 0.375rem;
      font-size: 0.6875rem;
      border-radius: var(--radius-2xl, 1rem);
      background-color: var(--color-default, #f4f4f5);
      color: var(--color-muted, #71717a);
      vertical-align: middle;
      line-height: 1.4;
    }

    .attribute-key {
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-muted, #71717a);
    }

    /* Keep "key=" whole when a long value wraps inside the chip. */
    .attribute-chip > .attribute-key {
      flex-shrink: 0;
      white-space: nowrap;
    }

    .attribute-val {
      color: var(--color-fg, #18181b);
    }

    /* Highlight */
    mark.highlight,
    .highlight {
      background-color: color-mix(
        in oklab,
        var(--color-warning, #f5a524) 35%,
        transparent
      );
      color: inherit;
      padding: 0 2px;
      border-radius: var(--radius-xs, 2px);
    }

    /* Empty state */
    .empty-state {
      padding: var(--spacing-8, 2rem);
      text-align: center;
      font-family: var(--font-family-base, inherit);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-muted, #71717a);
    }

    /* Inspector panel: secondary surface with white tiles, like HeroUI's primary table. */
    .inspector {
      border-top: 1px solid var(--color-separator, #e4e4e7);
      background-color: var(--color-surface-secondary, #f4f4f5);
      padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem) var(--spacing-4, 1rem);
      animation: inspectorEnter 200ms var(--ease-out, ease-out);
    }

    @keyframes inspectorEnter {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .inspector-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing-2, 0.5rem);
    }

    .inspector-title {
      font-weight: var(--font-weight-medium, 500);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-md, 1.5rem);
      color: var(--color-fg, #18181b);
    }

    .inspector-close-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--color-muted, #71717a);
      cursor: pointer;
      border-radius: var(--radius-full, 9999px);
      outline: none;
      transition:
        background-color 100ms var(--ease-out, ease-out),
        color 100ms var(--ease-out, ease-out),
        box-shadow 100ms var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      .inspector-close-btn:hover {
        color: var(--color-fg, #18181b);
        background-color: var(--color-default, #f4f4f5);
      }
    }

    .inspector-close-btn:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .inspector-attrs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-2, 0.5rem);
      margin-bottom: var(--spacing-3, 0.75rem);
    }

    .inspector-attr-row {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      background-color: var(--color-surface, #ffffff);
      border-radius: var(--radius-xl, 0.75rem);
      box-shadow: var(--shadow-surface, 0 1px 2px 0 rgba(0, 0, 0, 0.06));
      font-family: var(--font-family-mono, monospace);
    }

    .inspector-raw {
      position: relative;
      background-color: var(--color-surface, #ffffff);
      border-radius: var(--radius-xl, 0.75rem);
      box-shadow: var(--shadow-surface, 0 1px 2px 0 rgba(0, 0, 0, 0.06));
      padding: var(--spacing-3, 0.75rem);
      font-family: var(--font-family-mono, monospace);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: 1.5;
      overflow-x: auto;
      white-space: normal;
      word-break: break-all;
      scrollbar-width: thin;
      scrollbar-color: var(--color-scrollbar-thumb) transparent;
    }

    /* Preserve whitespace in the raw line only — not the template's own indentation */
    .inspector-raw > code {
      font-family: inherit;
      white-space: pre-wrap;
    }

    @media (prefers-reduced-motion: reduce) {
      .search-input,
      .search-clear-btn,
      .filter-pill,
      .tool-btn,
      .row,
      .inspector-close-btn {
        transition: none;
      }

      .tool-btn:active {
        transform: none;
      }

      .inspector {
        animation: none;
      }
    }
  `,
]
