import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { logsViewerStyles } from './LogsViewer.styles.js'

export interface LogEntry {
  id?: string | number
  timestamp?: string
  level?: 'info' | 'warn' | 'error' | 'debug'
  message: string
}

@customElement('moul-logs-viewer')
export class MoulLogsViewer extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    logsViewerStyles,
  ]

  @property({ type: Array })
  accessor logs: (LogEntry | string)[] = []

  override render() {
    return html`
      <div class="logs-container" role="region" aria-label="Logs">
        ${
          this.logs.length > 0
            ? this.logs.map((entry, idx) => {
                const isString = typeof entry === 'string'
                const message = isString ? entry : entry.message
                const level =
                  !isString && entry.level ? `level-${entry.level}` : ''
                const timestamp =
                  !isString && entry.timestamp ? `${entry.timestamp} ` : ''

                return html`
                <div class="log-line">
                  <span class="line-number">${idx + 1}</span>
                  <span class="log-text ${level}">${timestamp}${message}</span>
                </div>
              `
              })
            : html`<slot></slot>`
        }
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-logs-viewer': MoulLogsViewer
  }
}
