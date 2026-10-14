import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { paginationStyles } from './Pagination.styles.js'

export function generatePagination({
  page,
  totalPages,
  siblingCount = 1,
}: {
  page: number
  totalPages: number
  siblingCount?: number
}): (number | 'ellipsis-start' | 'ellipsis-end')[] {
  const totalPageNumbers = siblingCount * 2 + 5

  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSiblingIndex = Math.max(page - siblingCount, 1)
  const rightSiblingIndex = Math.min(page + siblingCount, totalPages)

  const shouldShowLeftDots = leftSiblingIndex > 2
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1)
    return [...leftRange, 'ellipsis-end', totalPages]
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1,
    )
    return [1, 'ellipsis-start', ...rightRange]
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i,
    )
    return [1, 'ellipsis-start', ...middleRange, 'ellipsis-end', totalPages]
  }

  return []
}

@customElement('moul-pagination')
export class MoulPagination extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    paginationStyles,
  ]

  @property({ type: Number })
  accessor page = 1

  @property({ type: Number, attribute: 'total-pages' })
  accessor totalPages = 1

  @property({ type: Number, attribute: 'sibling-count' })
  accessor siblingCount = 1

  @property({ type: String })
  accessor size: 'sm' | 'md' | 'lg' = 'md'

  @property({ type: String })
  accessor shape: 'rounded' | 'circle' = 'rounded'

  @property({ type: Boolean, attribute: 'show-controls' })
  accessor showControls = true

  @property({ type: Boolean, attribute: 'show-first-last' })
  accessor showFirstLast = false

  @property({ type: Boolean, attribute: 'is-disabled' })
  accessor isDisabled = false

  private setPage(p: number) {
    if (this.isDisabled) return
    const targetPage = Math.max(1, Math.min(p, this.totalPages))
    if (targetPage !== this.page) {
      this.page = targetPage
      this.dispatchEvent(
        new CustomEvent('moul-page-change', {
          detail: { page: this.page },
          bubbles: true,
          composed: true,
        }),
      )
    }
  }

  override render() {
    const items = generatePagination({
      page: this.page,
      totalPages: this.totalPages,
      siblingCount: this.siblingCount,
    })

    const isFirst = this.page <= 1
    const isLast = this.page >= this.totalPages

    return html`
      <nav aria-label="Pagination">
        <ul class="pagination ${this.size} ${this.shape}">
          ${
            this.showFirstLast
              ? html`
            <li class="page-item ${isFirst || this.isDisabled ? 'disabled' : ''}">
              <button
                type="button"
                class="page-link"
                aria-label="First page"
                ?disabled=${isFirst || this.isDisabled}
                @click=${() => this.setPage(1)}
              >&laquo;</button>
            </li>
          `
              : ''
          }

          ${
            this.showControls
              ? html`
            <li class="page-item ${isFirst || this.isDisabled ? 'disabled' : ''}">
              <button
                type="button"
                class="page-link"
                aria-label="Previous page"
                ?disabled=${isFirst || this.isDisabled}
                @click=${() => this.setPage(this.page - 1)}
              >&lsaquo;</button>
            </li>
          `
              : ''
          }

          ${items.map((item) => {
            if (typeof item === 'string') {
              return html`
                <li class="page-item disabled">
                  <span class="ellipsis">&hellip;</span>
                </li>
              `
            }
            const isActive = item === this.page
            return html`
              <li class="page-item ${isActive ? 'active' : ''} ${this.isDisabled ? 'disabled' : ''}">
                <button
                  type="button"
                  class="page-link"
                  aria-current=${isActive ? 'page' : 'false'}
                  ?disabled=${this.isDisabled}
                  @click=${() => this.setPage(item)}
                >${item}</button>
              </li>
            `
          })}

          ${
            this.showControls
              ? html`
            <li class="page-item ${isLast || this.isDisabled ? 'disabled' : ''}">
              <button
                type="button"
                class="page-link"
                aria-label="Next page"
                ?disabled=${isLast || this.isDisabled}
                @click=${() => this.setPage(this.page + 1)}
              >&rsaquo;</button>
            </li>
          `
              : ''
          }

          ${
            this.showFirstLast
              ? html`
            <li class="page-item ${isLast || this.isDisabled ? 'disabled' : ''}">
              <button
                type="button"
                class="page-link"
                aria-label="Last page"
                ?disabled=${isLast || this.isDisabled}
                @click=${() => this.setPage(this.totalPages)}
              >&raquo;</button>
            </li>
          `
              : ''
          }
        </ul>
      </nav>
    `
  }
}
