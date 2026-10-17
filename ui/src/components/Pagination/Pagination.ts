import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { calendarNavNext, calendarNavPrev } from '../../utils/icons'
import { paginationStyles } from './Pagination.styles'

export type PaginationShape = 'square' | 'rounded' | 'pill'
export type PaginationItem = number | '...' | 'ellipsis'

export interface GeneratePaginationOptions {
  page?: number
  currentPage?: number
  totalPages: number
  siblingCount?: number
}

/**
 * Pure helper generating pagination items with ellipses.
 * Supports both positional (currentPage, totalPages, siblingCount) and object options.
 */
export function generatePagination(
  currentPageOrOptions: number | GeneratePaginationOptions,
  maybeTotalPages?: number,
  maybeSiblingCount?: number,
): (number | '...')[] {
  let page = 1
  let totalPages = 1
  let siblingCount = 1

  if (
    typeof currentPageOrOptions === 'object' &&
    currentPageOrOptions !== null
  ) {
    page = currentPageOrOptions.currentPage ?? currentPageOrOptions.page ?? 1
    totalPages = currentPageOrOptions.totalPages
    siblingCount = currentPageOrOptions.siblingCount ?? 1
  } else {
    page = Number(currentPageOrOptions) || 1
    totalPages = Number(maybeTotalPages) || 1
    siblingCount = typeof maybeSiblingCount === 'number' ? maybeSiblingCount : 1
  }

  if (totalPages <= 0) return [1]
  if (totalPages === 1) return [1]

  // Clamp current page
  const clampedPage = Math.max(1, Math.min(page, totalPages))

  // If total pages fit without ellipsis
  const totalSlots = siblingCount * 2 + 5
  if (totalPages <= totalSlots) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSiblingIndex = Math.max(clampedPage - siblingCount, 1)
  const rightSiblingIndex = Math.min(clampedPage + siblingCount, totalPages)

  const shouldShowLeftDots = leftSiblingIndex > 2
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftRange = Array.from({ length: rightSiblingIndex }, (_, i) => i + 1)
    return [...leftRange, '...', totalPages]
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightRange = Array.from(
      { length: totalPages - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i,
    )
    return [1, '...', ...rightRange]
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i,
  )
  return [1, '...', ...middleRange, '...', totalPages]
}

export class MoulPagination extends LitElement {
  static override styles = paginationStyles

  static override properties = {
    totalPages: { type: Number, reflect: true, attribute: 'total-pages' },
    currentPage: { type: Number, reflect: true, attribute: 'current-page' },
    pageSize: { type: Number, reflect: true, attribute: 'page-size' },
    shape: { type: String, reflect: true },
    siblingCount: { type: Number, reflect: true, attribute: 'sibling-count' },
  }

  declare totalPages: number
  declare currentPage: number
  declare pageSize: number
  declare shape: PaginationShape
  declare siblingCount: number

  constructor() {
    super()
    this.totalPages = 1
    this.currentPage = 1
    this.pageSize = 10
    this.shape = 'rounded'
    this.siblingCount = 1
  }

  protected override willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps)

    if (changedProps.has('totalPages') || changedProps.has('currentPage')) {
      const maxPages = Math.max(1, this.totalPages || 1)
      const clamped = Math.max(1, Math.min(this.currentPage || 1, maxPages))
      if (this.currentPage !== clamped) {
        this.currentPage = clamped
      }
    }
  }

  private setPage(newPage: number): void {
    const maxPages = Math.max(1, this.totalPages || 1)
    const clamped = Math.max(1, Math.min(newPage, maxPages))
    if (clamped === this.currentPage) return

    this.currentPage = clamped
    this.dispatchEvent(
      new CustomEvent('pagechange', {
        bubbles: true,
        composed: true,
        detail: { page: clamped },
      }),
    )
  }

  protected override render() {
    const items = generatePagination(
      this.currentPage,
      this.totalPages,
      this.siblingCount,
    )
    const isPrevDisabled = this.currentPage <= 1
    const isNextDisabled = this.currentPage >= this.totalPages

    return html`
      <nav part="base" aria-label="Pagination">
        <button
          part="button prev"
          aria-label="Previous page"
          ?disabled=${isPrevDisabled}
          aria-disabled=${isPrevDisabled ? 'true' : 'false'}
          @click=${() => this.setPage(this.currentPage - 1)}
        >
          <span class="icon">${calendarNavPrev()}</span>
        </button>

        ${items.map((item, index) => {
          if (typeof item === 'number') {
            const isCurrent = item === this.currentPage
            return html`
              <button
                key="page-${item}"
                part="page ${isCurrent ? 'page-active' : ''}"
                aria-label="Page ${item}"
                aria-current=${isCurrent ? 'page' : nothing}
                @click=${() => this.setPage(item)}
              >
                ${item}
              </button>
            `
          }
          return html`
            <span key="ellipsis-${index}" part="ellipsis" aria-hidden="true">…</span>
          `
        })}

        <button
          part="button next"
          aria-label="Next page"
          ?disabled=${isNextDisabled}
          aria-disabled=${isNextDisabled ? 'true' : 'false'}
          @click=${() => this.setPage(this.currentPage + 1)}
        >
          <span class="icon">${calendarNavNext()}</span>
        </button>
      </nav>
    `
  }
}

defineElement('moul-pagination', MoulPagination)

declare global {
  interface HTMLElementTagNameMap {
    'moul-pagination': MoulPagination
  }
}
