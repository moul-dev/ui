'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from 'react-aria-components'
import { styles } from './Pagination.styles'

export type PaginationVariant = 'primary' | 'outline' | 'ghost' | 'subtle'
export type PaginationSize = 'sm' | 'md' | 'lg'
export type PaginationShape = 'rounded' | 'circle' | 'square'

// ── Pagination Helper ────────────────────────────────────────────────

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

  return Array.from({ length: totalPages }, (_, i) => i + 1)
}

// ── Icons ────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronRight = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const ChevronFirst = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="11 17 6 12 11 7" />
    <polyline points="18 17 13 12 18 7" />
  </svg>
)

const ChevronLast = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="13 17 18 12 13 7" />
    <polyline points="6 17 11 12 6 7" />
  </svg>
)

// ── Context ──────────────────────────────────────────────────────────

interface PaginationContextValue {
  page: number
  totalPages: number
  size: PaginationSize
  variant: PaginationVariant
  shape: PaginationShape
  onChange?: (page: number) => void
}

const PaginationContext = React.createContext<PaginationContextValue>({
  page: 1,
  totalPages: 1,
  size: 'md',
  variant: 'outline',
  shape: 'rounded',
})

// ── PaginationContent ────────────────────────────────────────────────

export interface PaginationContentProps
  extends Omit<React.HTMLAttributes<HTMLUListElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const PaginationContent = React.forwardRef<
  HTMLUListElement,
  PaginationContentProps
>(function PaginationContent({ style, className, children, ...rest }, ref) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.content,
    style,
  )
  return (
    <ul
      {...rest}
      ref={ref}
      role="list"
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children}
    </ul>
  )
})

PaginationContent.displayName = 'PaginationContent'

// ── PaginationItem ───────────────────────────────────────────────────

export interface PaginationItemProps
  extends Omit<React.HTMLAttributes<HTMLLIElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const PaginationItem = React.forwardRef<
  HTMLLIElement,
  PaginationItemProps
>(function PaginationItem({ style, className, children, ...rest }, ref) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.item,
    style,
  )
  return (
    <li
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children}
    </li>
  )
})

PaginationItem.displayName = 'PaginationItem'

// ── PaginationLink ───────────────────────────────────────────────────

export interface PaginationLinkProps
  extends Omit<AriaButtonProps, 'style' | 'children'> {
  page?: number
  isActive?: boolean
  isDisabled?: boolean
  size?: PaginationSize
  variant?: PaginationVariant
  shape?: PaginationShape
  style?: StyleXStyles
  className?: string
  children?: React.ReactNode
}

export const PaginationLink = React.forwardRef<
  HTMLButtonElement,
  PaginationLinkProps
>(function PaginationLink(
  {
    page,
    isActive: propIsActive,
    isDisabled: propIsDisabled,
    size: propSize,
    variant: propVariant,
    shape: propShape,
    onPress,
    style,
    className,
    children,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const context = React.useContext(PaginationContext)
  const size = propSize ?? context.size
  const variant = propVariant ?? context.variant
  const shape = propShape ?? context.shape
  const isActive = propIsActive ?? (page !== undefined && page === context.page)
  const isDisabled = propIsDisabled ?? false

  const sizeSuffix = size.charAt(0).toUpperCase() + size.slice(1)
  const shapeSuffix = shape.charAt(0).toUpperCase() + shape.slice(1)
  const variantSuffix = variant.charAt(0).toUpperCase() + variant.slice(1)

  const sizeStyle =
    styles[`link${sizeSuffix}` as 'linkSm' | 'linkMd' | 'linkLg']
  const shapeStyle =
    styles[
      `shape${shapeSuffix}` as 'shapeRounded' | 'shapeCircle' | 'shapeSquare'
    ]
  const variantStyle =
    styles[
      `variant${variantSuffix}` as
        | 'variantGhost'
        | 'variantOutline'
        | 'variantSubtle'
    ]

  const handlePress = (e: any) => {
    if (isDisabled) return
    if (onPress) onPress(e)
    if (page !== undefined && context.onChange) {
      context.onChange(page)
    }
  }

  return (
    <AriaButton
      {...rest}
      ref={ref}
      isDisabled={isDisabled}
      aria-current={isActive ? 'page' : undefined}
      aria-label={
        ariaLabel ?? (page !== undefined ? `Page ${page}` : undefined)
      }
      onPress={handlePress}
      className={(renderProps) => {
        const { className: stylexClass } = stylex.props(
          styles.link,
          sizeStyle,
          shapeStyle,
          variantStyle,
          renderProps.isHovered && !isActive && styles.linkHover,
          renderProps.isFocusVisible && styles.linkFocus,
          isActive &&
            (variant === 'outline'
              ? styles.linkActiveOutline
              : styles.linkActive),
          isDisabled && styles.linkDisabled,
          style,
        )
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={(renderProps) => {
        const { style: stylexStyle } = stylex.props(
          styles.link,
          sizeStyle,
          shapeStyle,
          variantStyle,
          renderProps.isHovered && !isActive && styles.linkHover,
          renderProps.isFocusVisible && styles.linkFocus,
          isActive &&
            (variant === 'outline'
              ? styles.linkActiveOutline
              : styles.linkActive),
          isDisabled && styles.linkDisabled,
          style,
        )
        return stylexStyle || {}
      }}
    >
      {children ?? (page !== undefined ? page : null)}
    </AriaButton>
  )
})

PaginationLink.displayName = 'PaginationLink'

// ── PaginationPrevious ───────────────────────────────────────────────

export interface PaginationPreviousProps extends PaginationLinkProps {
  showText?: boolean
}

export const PaginationPrevious = React.forwardRef<
  HTMLButtonElement,
  PaginationPreviousProps
>(function PaginationPrevious({ showText = false, children, ...props }, ref) {
  const context = React.useContext(PaginationContext)
  const isDisabled = props.isDisabled ?? context.page <= 1

  return (
    <PaginationLink
      {...props}
      ref={ref}
      isDisabled={isDisabled}
      aria-label={props['aria-label'] ?? 'Previous page'}
      onPress={() => {
        if (!isDisabled && context.onChange) {
          context.onChange(context.page - 1)
        }
      }}
    >
      {children ?? (
        <span {...stylex.props(styles.navButtonText)}>
          <ChevronLeft />
          {showText && <span>Previous</span>}
        </span>
      )}
    </PaginationLink>
  )
})

PaginationPrevious.displayName = 'PaginationPrevious'

// ── PaginationNext ───────────────────────────────────────────────────

export interface PaginationNextProps extends PaginationLinkProps {
  showText?: boolean
}

export const PaginationNext = React.forwardRef<
  HTMLButtonElement,
  PaginationNextProps
>(function PaginationNext({ showText = false, children, ...props }, ref) {
  const context = React.useContext(PaginationContext)
  const isDisabled = props.isDisabled ?? context.page >= context.totalPages

  return (
    <PaginationLink
      {...props}
      ref={ref}
      isDisabled={isDisabled}
      aria-label={props['aria-label'] ?? 'Next page'}
      onPress={() => {
        if (!isDisabled && context.onChange) {
          context.onChange(context.page + 1)
        }
      }}
    >
      {children ?? (
        <span {...stylex.props(styles.navButtonText)}>
          {showText && <span>Next</span>}
          <ChevronRight />
        </span>
      )}
    </PaginationLink>
  )
})

PaginationNext.displayName = 'PaginationNext'

// ── PaginationFirst ──────────────────────────────────────────────────

export const PaginationFirst = React.forwardRef<
  HTMLButtonElement,
  PaginationLinkProps
>(function PaginationFirst(props, ref) {
  const context = React.useContext(PaginationContext)
  const isDisabled = props.isDisabled ?? context.page <= 1

  return (
    <PaginationLink
      {...props}
      ref={ref}
      isDisabled={isDisabled}
      aria-label={props['aria-label'] ?? 'First page'}
      onPress={() => {
        if (!isDisabled && context.onChange) {
          context.onChange(1)
        }
      }}
    >
      {props.children ?? <ChevronFirst />}
    </PaginationLink>
  )
})

PaginationFirst.displayName = 'PaginationFirst'

// ── PaginationLast ───────────────────────────────────────────────────

export const PaginationLast = React.forwardRef<
  HTMLButtonElement,
  PaginationLinkProps
>(function PaginationLast(props, ref) {
  const context = React.useContext(PaginationContext)
  const isDisabled = props.isDisabled ?? context.page >= context.totalPages

  return (
    <PaginationLink
      {...props}
      ref={ref}
      isDisabled={isDisabled}
      aria-label={props['aria-label'] ?? 'Last page'}
      onPress={() => {
        if (!isDisabled && context.onChange) {
          context.onChange(context.totalPages)
        }
      }}
    >
      {props.children ?? <ChevronLast />}
    </PaginationLink>
  )
})

PaginationLast.displayName = 'PaginationLast'

// ── PaginationEllipsis ───────────────────────────────────────────────

export interface PaginationEllipsisProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const PaginationEllipsis = React.forwardRef<
  HTMLSpanElement,
  PaginationEllipsisProps
>(function PaginationEllipsis({ style, className, ...rest }, ref) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.ellipsis,
    style,
  )
  return (
    <span
      {...rest}
      ref={ref}
      aria-hidden="true"
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      &#8230;
    </span>
  )
})

PaginationEllipsis.displayName = 'PaginationEllipsis'

// ── PaginationSummary ────────────────────────────────────────────────

export interface PaginationSummaryProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'style' | 'children'> {
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
  style?: StyleXStyles
  className?: string
  children?:
    | React.ReactNode
    | ((info: {
        start: number
        end: number
        total: number
        page: number
        totalPages: number
      }) => React.ReactNode)
}

export const PaginationSummary = React.forwardRef<
  HTMLSpanElement,
  PaginationSummaryProps
>(function PaginationSummary(
  {
    total: propTotal,
    page: propPage,
    pageSize: propPageSize = 10,
    totalPages: propTotalPages,
    children,
    style,
    className,
    ...rest
  },
  ref,
) {
  const context = React.useContext(PaginationContext)
  const page = propPage ?? context.page
  const totalPages = propTotalPages ?? context.totalPages
  const total = propTotal ?? totalPages * propPageSize

  const start = total === 0 ? 0 : (page - 1) * propPageSize + 1
  const end = Math.min(page * propPageSize, total)

  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.summary,
    style,
  )

  const content =
    typeof children === 'function'
      ? children({ start, end, total, page, totalPages })
      : (children ?? `Showing ${start}–${end} of ${total}`)

  return (
    <span
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {content}
    </span>
  )
})

PaginationSummary.displayName = 'PaginationSummary'

// ── PaginationPageSize ───────────────────────────────────────────────

export interface PaginationPageSizeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'onChange'> {
  pageSize?: number
  pageSizeOptions?: number[]
  onChange?: (pageSize: number) => void
  label?: string
  style?: StyleXStyles
  className?: string
}

export const PaginationPageSize = React.forwardRef<
  HTMLDivElement,
  PaginationPageSizeProps
>(function PaginationPageSize(
  {
    pageSize = 10,
    pageSizeOptions = [10, 20, 50, 100],
    onChange,
    label = 'Rows per page:',
    style,
    className,
    ...rest
  },
  ref,
) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.pageSizeContainer,
    style,
  )

  return (
    <div
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {label && <span>{label}</span>}
      <select
        value={pageSize}
        onChange={(e) => onChange?.(Number(e.target.value))}
        aria-label="Rows per page"
        {...stylex.props(styles.pageSizeSelect)}
      >
        {pageSizeOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
})

PaginationPageSize.displayName = 'PaginationPageSize'

// ── Pagination (Root) ────────────────────────────────────────────────

export interface PaginationProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'style' | 'onChange'> {
  page?: number
  defaultPage?: number
  totalPages?: number
  total?: number
  pageSize?: number
  defaultPageSize?: number
  pageSizeOptions?: number[]
  siblingCount?: number
  showPageSize?: boolean
  showSummary?: boolean
  showFirstLast?: boolean
  showPrevNext?: boolean
  showNavText?: boolean
  size?: PaginationSize
  variant?: PaginationVariant
  shape?: PaginationShape
  onChange?: (page: number) => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  summary?:
    | React.ReactNode
    | ((info: {
        start: number
        end: number
        total: number
        page: number
        totalPages: number
      }) => React.ReactNode)
  style?: StyleXStyles
  className?: string
  children?: React.ReactNode
}

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  function Pagination(
    {
      page: controlledPage,
      defaultPage = 1,
      totalPages: propTotalPages,
      total,
      pageSize: controlledPageSize,
      defaultPageSize = 10,
      pageSizeOptions = [10, 20, 50, 100],
      siblingCount = 1,
      showPageSize = false,
      showSummary = false,
      showFirstLast = false,
      showPrevNext = true,
      showNavText = false,
      size = 'md',
      variant = 'outline',
      shape = 'rounded',
      onChange,
      onPageChange,
      onPageSizeChange,
      summary,
      style,
      className,
      children,
      'aria-label': ariaLabel = 'Pagination',
      ...rest
    },
    ref,
  ) {
    const isPageControlled = controlledPage !== undefined
    const [uncontrolledPage, setUncontrolledPage] = React.useState(defaultPage)
    const currentPage = isPageControlled ? controlledPage : uncontrolledPage

    const isPageSizeControlled = controlledPageSize !== undefined
    const [uncontrolledPageSize, setUncontrolledPageSize] =
      React.useState(defaultPageSize)
    const currentPageSize = isPageSizeControlled
      ? controlledPageSize
      : uncontrolledPageSize

    const computedTotalPages =
      propTotalPages ??
      (total !== undefined
        ? Math.max(1, Math.ceil(total / currentPageSize))
        : 1)

    const handlePageChange = (newPage: number) => {
      const clamped = Math.max(1, Math.min(newPage, computedTotalPages))
      if (!isPageControlled) {
        setUncontrolledPage(clamped)
      }
      onChange?.(clamped)
      onPageChange?.(clamped)
    }

    const handlePageSizeChange = (newSize: number) => {
      if (!isPageControlled) {
        setUncontrolledPageSize(newSize)
      }
      onPageSizeChange?.(newSize)
      // Reset to page 1 if current page would be out of bounds
      if (total !== undefined) {
        const newTotalPages = Math.max(1, Math.ceil(total / newSize))
        if (currentPage > newTotalPages) {
          handlePageChange(1)
        }
      }
    }

    const contextValue: PaginationContextValue = {
      page: currentPage,
      totalPages: computedTotalPages,
      size,
      variant,
      shape,
      onChange: handlePageChange,
    }

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.root,
      style,
    )

    if (children) {
      return (
        <PaginationContext.Provider value={contextValue}>
          <nav
            {...rest}
            ref={ref}
            role="navigation"
            aria-label={ariaLabel}
            className={[stylexClass, className].filter(Boolean).join(' ')}
            style={stylexStyle}
          >
            {children}
          </nav>
        </PaginationContext.Provider>
      )
    }

    const paginationItems = generatePagination({
      page: currentPage,
      totalPages: computedTotalPages,
      siblingCount,
    })

    return (
      <PaginationContext.Provider value={contextValue}>
        <nav
          {...rest}
          ref={ref}
          role="navigation"
          aria-label={ariaLabel}
          className={[stylexClass, className].filter(Boolean).join(' ')}
          style={stylexStyle}
        >
          {showSummary && (
            <PaginationSummary
              total={total}
              page={currentPage}
              pageSize={currentPageSize}
              totalPages={computedTotalPages}
            >
              {summary}
            </PaginationSummary>
          )}

          <PaginationContent>
            {showFirstLast && (
              <PaginationItem>
                <PaginationFirst />
              </PaginationItem>
            )}

            {showPrevNext && (
              <PaginationItem>
                <PaginationPrevious showText={showNavText} />
              </PaginationItem>
            )}

            {paginationItems.map((item, index) => {
              if (item === 'ellipsis-start' || item === 'ellipsis-end') {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }
              return (
                <PaginationItem key={item}>
                  <PaginationLink
                    page={item}
                    isActive={item === currentPage}
                    onPress={() => handlePageChange(item)}
                  />
                </PaginationItem>
              )
            })}

            {showPrevNext && (
              <PaginationItem>
                <PaginationNext showText={showNavText} />
              </PaginationItem>
            )}

            {showFirstLast && (
              <PaginationItem>
                <PaginationLast />
              </PaginationItem>
            )}
          </PaginationContent>

          {showPageSize && (
            <PaginationPageSize
              pageSize={currentPageSize}
              pageSizeOptions={pageSizeOptions}
              onChange={handlePageSizeChange}
            />
          )}
        </nav>
      </PaginationContext.Provider>
    )
  },
)

Pagination.displayName = 'Pagination'
