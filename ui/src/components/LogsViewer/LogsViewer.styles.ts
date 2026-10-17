import { type CSSResultGroup, css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const logsViewerStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
      color: var(--color-fg, #0f172a);
      font-family: var(--font-family-base, inherit);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    .container {
      display: flex;
      flex-direction: column;
      background: var(--color-bg, #ffffff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      overflow: hidden;
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
    }

    /* Toolbar */
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-2, 8px);
      padding: var(--spacing-2, 8px) var(--spacing-3, 12px);
      background: var(--color-bg-subtle, #f8fafc);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
      user-select: none;
    }

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 8px);
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 8px;
      width: 14px;
      height: 14px;
      color: var(--color-fg-subtle, #64748b);
      pointer-events: none;
    }

    .search-input {
      height: 28px;
      padding: 0 28px 0 28px;
      font-size: 0.75rem;
      border: 1px solid var(--color-border, #cbd5e1);
      border-radius: var(--radius-sm, 4px);
      background: var(--color-bg, #ffffff);
      color: var(--color-fg, #0f172a);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      min-width: 160px;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--color-border-focus, #3b82f6);
      box-shadow: 0 0 0 1px var(--color-border-focus, #3b82f6);
    }

    .search-clear-btn {
      position: absolute;
      right: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--color-fg-subtle, #64748b);
      cursor: pointer;
      border-radius: 50%;
    }

    .search-clear-btn:hover {
      color: var(--color-fg, #0f172a);
    }

    /* Filter pills group */
    .filter-group {
      position: relative;
      display: inline-flex;
      align-items: center;
      background: var(--color-bg, #ffffff);
      border: 1px solid var(--color-border, #cbd5e1);
      border-radius: var(--radius-md, 6px);
      padding: 2px;
      gap: 2px;
    }

    .filter-indicator {
      position: absolute;
      top: 2px;
      bottom: 2px;
      background: var(--color-bg-subtle, #f1f5f9);
      border: 1px solid var(--color-border, #cbd5e1);
      border-radius: var(--radius-sm, 4px);
      pointer-events: none;
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      z-index: 0;
    }

    .filter-pill {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 8px;
      height: 24px;
      border: none;
      background: transparent;
      color: var(--color-fg-subtle, #64748b);
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: var(--radius-sm, 4px);
      cursor: pointer;
      transition: color 0.15s ease;
    }

    .filter-pill:hover {
      color: var(--color-fg, #0f172a);
    }

    .filter-pill[aria-pressed='true'],
    .filter-pill.active {
      color: var(--color-fg, #0f172a);
      font-weight: 700;
    }

    /* Counts and toolbar buttons */
    .counts-badge {
      font-size: 0.6875rem;
      font-variant-numeric: tabular-nums;
      color: var(--color-fg-subtle, #64748b);
      padding: 2px 6px;
      background: var(--color-bg, #ffffff);
      border: 1px solid var(--color-border-subtle, #e2e8f0);
      border-radius: var(--radius-sm, 4px);
    }

    .tool-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      padding: 0 8px;
      font-size: 0.6875rem;
      font-weight: 500;
      border: 1px solid var(--color-border, #cbd5e1);
      border-radius: var(--radius-sm, 4px);
      background: var(--color-bg, #ffffff);
      color: var(--color-fg-subtle, #475569);
      cursor: pointer;
      gap: 4px;
      transition: all 0.15s ease;
    }

    .tool-btn:hover {
      background: var(--color-bg-subtle, #f1f5f9);
      color: var(--color-fg, #0f172a);
    }

    .tool-btn[aria-pressed='true'],
    .tool-btn.active {
      background: var(--color-primary-100, #dbeafe);
      border-color: var(--color-primary-300, #93c5fd);
      color: var(--color-primary-700, #1d4ed8);
    }

    .tool-btn svg {
      width: 14px;
      height: 14px;
    }

    /* Logs viewport */
    .scroll-container {
      position: relative;
      overflow-y: auto;
      overflow-x: auto;
      max-height: var(--logs-max-height, 600px);
      background: var(--color-bg, #ffffff);
      font-family: var(--font-family-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
      font-size: 0.75rem;
      line-height: 1.5;
    }

    .logs-table {
      display: table;
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
    }

    .row {
      display: table-row;
      border-bottom: 1px solid var(--color-border-subtle, #f1f5f9);
      cursor: pointer;
      transition: background-color 0.1s ease;
    }

    .row:hover {
      background-color: var(--color-bg-subtle, #f8fafc);
    }

    .row.selected {
      background-color: var(--color-primary-50, rgba(59, 130, 246, 0.08));
    }

    .row.compact .cell {
      padding-top: 1px;
      padding-bottom: 1px;
    }

    /* Cells */
    .cell {
      display: table-cell;
      padding: 3px 8px;
      vertical-align: top;
      white-space: nowrap;
    }

    .cell-line {
      width: 44px;
      min-width: 44px;
      text-align: right;
      color: var(--color-fg-subtle, #94a3b8);
      user-select: none;
      font-variant-numeric: tabular-nums;
    }

    .cell-time {
      width: 170px;
      min-width: 170px;
      color: var(--color-fg-subtle, #64748b);
      font-variant-numeric: tabular-nums;
    }

    .cell-level {
      width: 60px;
      min-width: 60px;
    }

    .level-badge {
      display: inline-block;
      min-width: 48px;
      text-align: center;
      padding: 1px 4px;
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-radius: var(--radius-sm, 3px);
      line-height: 1.2;
    }

    .level-badge.level-info {
      background: var(--color-primary-100, #dbeafe);
      color: var(--color-primary-700, #1d4ed8);
    }

    .level-badge.level-warn {
      background: var(--color-alert-bg-warning, #fef3c7);
      color: var(--color-warning-700, #b45309);
    }

    .level-badge.level-error,
    .level-badge.level-fatal {
      background: var(--color-alert-bg-error, #fee2e2);
      color: var(--color-error-700, #b91c1c);
    }

    .level-badge.level-debug,
    .level-badge.level-trace {
      background: var(--color-neutral-100, #f1f5f9);
      color: var(--color-neutral-700, #475569);
    }

    .cell-message {
      width: 100%;
      word-break: break-word;
      color: var(--color-fg, #0f172a);
    }

    .wrap-lines .cell-message {
      white-space: pre-wrap;
    }

    .no-wrap .cell-message {
      white-space: pre;
    }

    /* Attribute chips */
    .attribute-chip {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      margin: 1px 4px 1px 0;
      padding: 0 4px;
      font-size: 0.6875rem;
      border-radius: var(--radius-sm, 3px);
      background: var(--color-bg-subtle, #f1f5f9);
      border: 1px solid var(--color-border-subtle, #e2e8f0);
      color: var(--color-fg-subtle, #475569);
      vertical-align: middle;
      line-height: 1.4;
    }

    .attribute-key {
      font-weight: 600;
      color: var(--color-fg-subtle, #64748b);
    }

    .attribute-val {
      color: var(--color-fg, #1e293b);
    }

    /* Highlight */
    mark.highlight,
    .highlight {
      background-color: var(--color-warning-200, #fde68a);
      color: inherit;
      padding: 0 2px;
      border-radius: 2px;
    }

    /* Empty state */
    .empty-state {
      padding: var(--spacing-8, 32px);
      text-align: center;
      color: var(--color-fg-subtle, #64748b);
      font-style: italic;
    }

    /* Inspector drawer / panel */
    .inspector {
      border-top: 1px solid var(--color-border, #e2e8f0);
      background: var(--color-bg-subtle, #f8fafc);
      padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
      animation: inspectorEnter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
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
      margin-bottom: var(--spacing-2, 8px);
    }

    .inspector-title {
      font-weight: 600;
      font-size: 0.8125rem;
      color: var(--color-fg, #0f172a);
    }

    .inspector-close-btn {
      border: none;
      background: transparent;
      color: var(--color-fg-subtle, #64748b);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      border-radius: var(--radius-sm, 4px);
    }

    .inspector-close-btn:hover {
      color: var(--color-fg, #0f172a);
      background: var(--color-border-subtle, #e2e8f0);
    }

    .inspector-attrs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-2, 8px);
      margin-bottom: var(--spacing-3, 12px);
    }

    .inspector-attr-row {
      display: flex;
      flex-direction: column;
      font-size: 0.6875rem;
      padding: 4px 8px;
      background: var(--color-bg, #ffffff);
      border: 1px solid var(--color-border-subtle, #e2e8f0);
      border-radius: var(--radius-sm, 4px);
      font-family: var(--font-family-mono, monospace);
    }

    .inspector-raw {
      position: relative;
      background: var(--color-bg, #ffffff);
      border: 1px solid var(--color-border-subtle, #e2e8f0);
      border-radius: var(--radius-sm, 4px);
      padding: 8px;
      font-family: var(--font-family-mono, monospace);
      font-size: 0.6875rem;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
  `,
]
