import { css } from 'lit'

export const logsViewerStyles = css`
  :host {
    display: block;
    width: 100%;
  }
  .logs-container {
    background-color: #0d1117;
    color: #c9d1d9;
    font-family: var(--bs-font-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
    font-size: 0.8125rem;
    line-height: 1.5;
    border-radius: var(--bs-border-radius, 0.375rem);
    border: 1px solid #30363d;
    overflow: auto;
    max-height: 24rem;
    padding: 0.75rem 0;
  }
  .log-line {
    display: flex;
    padding: 0.1rem 1rem;
    white-space: pre-wrap;
    word-break: break-all;
  }
  .log-line:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  .line-number {
    color: #484f58;
    user-select: none;
    text-align: right;
    min-width: 2.5rem;
    padding-right: 1rem;
  }
  .log-text {
    flex: 1 1 auto;
  }
  .level-info { color: #58a6ff; }
  .level-warn { color: #d29922; }
  .level-error { color: #f85149; }
  .level-debug { color: #8b949e; }
`
