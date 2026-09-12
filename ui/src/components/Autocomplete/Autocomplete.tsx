'use client'

import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Autocomplete as AriaAutocomplete,
  type AutocompleteProps as AriaAutocompleteProps,
  Header as AriaHeader,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  type ListBoxItemProps as AriaListBoxItemProps,
  type ListBoxProps as AriaListBoxProps,
  ListBoxSection as AriaListBoxSection,
  type ListBoxSectionProps as AriaListBoxSectionProps,
  Popover as AriaPopover,
  type PopoverProps as AriaPopoverProps,
  useFilter,
} from 'react-aria-components'
import { Kbd } from '../Kbd'
import { styles } from './Autocomplete.styles'

// ── Types ─────────────────────────────────────────────────────────────

export type AutocompleteSize = 'sm' | 'md' | 'lg'
export type AutocompleteMode = 'client' | 'async'

// ── Context ───────────────────────────────────────────────────────────

interface AutocompleteContextValue {
  size: AutocompleteSize
  containerRef: React.RefObject<Element | null>
}

const AutocompleteInnerContext = React.createContext<AutocompleteContextValue>({
  size: 'md',
  containerRef: { current: null },
})

export const useAutocompleteInnerContext = () =>
  React.useContext(AutocompleteInnerContext)

export type { Filter } from 'react-aria-components'
// Re-export RAC context hooks & types
export {
  AutocompleteContext,
  AutocompleteStateContext,
  useFilter,
} from 'react-aria-components'

// ── Autocomplete Empty State ──────────────────────────────────────────

export interface AutocompleteEmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
  children?: React.ReactNode
}

export const AutocompleteEmptyState = React.forwardRef<
  HTMLDivElement,
  AutocompleteEmptyStateProps
>(function AutocompleteEmptyState(
  { style, className, children, ...rest },
  ref,
) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.empty,
    style,
  )
  return (
    <div
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children ?? 'No results found.'}
    </div>
  )
})

// ── Autocomplete Item ─────────────────────────────────────────────────

export interface AutocompleteItemProps
  extends Omit<AriaListBoxItemProps, 'style' | 'children'> {
  style?: StyleXStyles
  className?: string
  description?: string
  icon?: React.ReactNode
  shortcut?: string | React.ReactNode
  showCheckmark?: boolean
  children?:
    | React.ReactNode
    | ((values: {
        isHovered: boolean
        isFocused: boolean
        isSelected: boolean
        isDisabled: boolean
      }) => React.ReactNode)
}

export const AutocompleteItem = React.forwardRef<
  HTMLDivElement,
  AutocompleteItemProps
>(function AutocompleteItem(
  {
    style,
    className,
    description,
    icon,
    shortcut,
    showCheckmark = true,
    textValue,
    children,
    ...rest
  },
  ref,
) {
  const { size } = useAutocompleteInnerContext()
  const sizeSuffix = size.charAt(0).toUpperCase() + size.slice(1)
  const sizeStyle =
    styles[`item${sizeSuffix}` as 'itemSm' | 'itemMd' | 'itemLg']
  const iconSizeStyle =
    styles[
      `itemIcon${sizeSuffix}` as 'itemIconSm' | 'itemIconMd' | 'itemIconLg'
    ]

  const resolvedTextValue =
    textValue ?? (typeof children === 'string' ? children : undefined)

  return (
    <AriaListBoxItem
      {...rest}
      ref={ref}
      textValue={resolvedTextValue}
      className={(renderProps) => {
        const { className: stylexClass } = stylex.props(
          styles.item,
          sizeStyle,
          renderProps.isHovered && styles.itemHovered,
          renderProps.isFocused && styles.itemFocused,
          renderProps.isSelected && styles.itemSelected,
          renderProps.isDisabled && styles.itemDisabled,
          style,
        )
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={(renderProps) => {
        const { style: stylexStyle } = stylex.props(
          styles.item,
          sizeStyle,
          renderProps.isHovered && styles.itemHovered,
          renderProps.isFocused && styles.itemFocused,
          renderProps.isSelected && styles.itemSelected,
          renderProps.isDisabled && styles.itemDisabled,
          style,
        )
        return stylexStyle
      }}
    >
      {(renderProps) => {
        if (typeof children === 'function') {
          return children(renderProps)
        }

        return (
          <>
            {icon && (
              <span {...stylex.props(styles.itemIcon, iconSizeStyle)}>
                {icon}
              </span>
            )}
            <div {...stylex.props(styles.itemContent)}>
              <span {...stylex.props(styles.itemLabel)}>{children}</span>
              {description && (
                <span {...stylex.props(styles.itemDescription)}>
                  {description}
                </span>
              )}
            </div>
            {(shortcut || (showCheckmark && renderProps.isSelected)) && (
              <span {...stylex.props(styles.itemEnd)}>
                {typeof shortcut === 'string' ? (
                  <Kbd>{shortcut}</Kbd>
                ) : (
                  shortcut
                )}
                {showCheckmark && renderProps.isSelected && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    {...stylex.props(styles.checkIcon)}
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
            )}
          </>
        )
      }}
    </AriaListBoxItem>
  )
})

// ── Autocomplete Section ──────────────────────────────────────────────

export interface AutocompleteSectionProps<T = object>
  extends Omit<AriaListBoxSectionProps<T>, 'style'> {
  title?: string
  style?: StyleXStyles
  className?: string
}

export const AutocompleteSection = React.forwardRef(
  function AutocompleteSection<T extends object>(
    { title, children, style, className, ...rest }: AutocompleteSectionProps<T>,
    ref: React.ForwardedRef<HTMLElement>,
  ) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.section,
      style,
    )

    return (
      <AriaListBoxSection
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {title && (
          <AriaHeader {...stylex.props(styles.sectionHeader)}>
            {title}
          </AriaHeader>
        )}
        {typeof children === 'function' ? (children as any) : children}
      </AriaListBoxSection>
    )
  },
) as <T extends object>(
  props: AutocompleteSectionProps<T> & {
    ref?: React.ForwardedRef<HTMLElement>
  },
) => React.ReactElement

// ── Autocomplete List ─────────────────────────────────────────────────

export interface AutocompleteListProps<T>
  extends Omit<AriaListBoxProps<T>, 'style'> {
  size?: AutocompleteSize
  variant?: 'bordered' | 'borderless'
  style?: StyleXStyles
  className?: string
}

export const AutocompleteList = React.forwardRef(function AutocompleteList<
  T extends object,
>(
  {
    size: propSize,
    variant = 'bordered',
    style,
    className,
    renderEmptyState,
    children,
    ...rest
  }: AutocompleteListProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const context = useAutocompleteInnerContext()
  const size = propSize ?? context.size
  const sizeSuffix = size.charAt(0).toUpperCase() + size.slice(1)
  const sizeStyle =
    styles[`list${sizeSuffix}` as 'listSm' | 'listMd' | 'listLg']
  const borderlessStyle = variant === 'borderless' && styles.listBorderless

  return (
    <AriaListBox
      {...rest}
      ref={ref}
      renderEmptyState={renderEmptyState ?? (() => <AutocompleteEmptyState />)}
      className={(_) => {
        const { className: stylexClass } = stylex.props(
          styles.list,
          sizeStyle,
          borderlessStyle,
          style,
        )
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={(_) => {
        const { style: stylexStyle } = stylex.props(
          styles.list,
          sizeStyle,
          borderlessStyle,
          style,
        )
        return stylexStyle
      }}
    >
      {children}
    </AriaListBox>
  )
}) as <T extends object>(
  props: AutocompleteListProps<T> & {
    ref?: React.ForwardedRef<HTMLDivElement>
  },
) => React.ReactElement

// ── Autocomplete Popover ──────────────────────────────────────────────

export interface AutocompletePopoverProps
  extends Omit<AriaPopoverProps, 'style' | 'className'> {
  size?: AutocompleteSize
  style?: StyleXStyles
  className?: string
  triggerRef?: React.RefObject<Element | null>
}

export const AutocompletePopover = React.forwardRef<
  HTMLElement,
  AutocompletePopoverProps
>(function AutocompletePopover(
  {
    size: propSize,
    triggerRef: propTriggerRef,
    style,
    className,
    children,
    ...rest
  },
  ref,
) {
  const context = useAutocompleteInnerContext()
  const size = propSize ?? context.size
  const sizeSuffix = size.charAt(0).toUpperCase() + size.slice(1)
  const sizeStyle =
    styles[`popover${sizeSuffix}` as 'popoverSm' | 'popoverMd' | 'popoverLg']

  const fallbackRef = React.useRef<Element | null>(null)
  const effectiveTriggerRef =
    propTriggerRef ?? context.containerRef ?? fallbackRef

  return (
    <AriaPopover
      triggerRef={effectiveTriggerRef as any}
      {...rest}
      ref={ref}
      className={(_) => {
        const { className: stylexClass } = stylex.props(
          styles.popover,
          sizeStyle,
          style,
        )
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={(_) => {
        const { style: stylexStyle } = stylex.props(
          styles.popover,
          sizeStyle,
          style,
        )
        return stylexStyle ?? {}
      }}
    >
      {children}
    </AriaPopover>
  )
})

// ── Autocomplete Root Component ───────────────────────────────────────

export interface AutocompleteProps<T = object>
  extends Omit<AriaAutocompleteProps<T>, 'filter' | 'children'> {
  /**
   * Filter function used to match items against the input.
   * If not provided, a case-insensitive 'contains' filter is applied by default.
   * Pass `null` or set `mode="async"` to disable client-side filtering for remote/async lists.
   */
  filter?:
    | ((textValue: string, inputValue: string, node?: any) => boolean)
    | null
  /**
   * Operating mode:
   * - `'client'`: uses client-side filtering (default)
   * - `'async'`: bypasses local filtering to allow server/API search
   * @default 'client'
   */
  mode?: AutocompleteMode
  /**
   * Component size inherited by children (list, items, popover).
   * @default 'md'
   */
  size?: AutocompleteSize
  /**
   * If true, `<Autocomplete>` will not render a container `<div>` DOM element,
   * behaving as a pure transparent context coordinator.
   * @default false
   */
  headless?: boolean
  /** StyleX override styles for the container */
  style?: StyleXStyles
  /** Custom CSS class names for the container */
  className?: string
  /** Children elements (input + collection) */
  children?: React.ReactNode
}

export const Autocomplete = React.forwardRef(function Autocomplete<
  T extends object,
>(
  {
    filter,
    mode = 'client',
    size = 'md',
    headless = false,
    style,
    className,
    children,
    ...rest
  }: AutocompleteProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const { contains } = useFilter({ sensitivity: 'base' })

  // Determine effective filter function
  const filterFn = React.useMemo(() => {
    if (mode === 'async' || filter === null) {
      return undefined
    }
    return filter ?? contains
  }, [mode, filter, contains])

  const internalRef = React.useRef<HTMLDivElement | null>(null)
  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      internalRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    },
    [ref],
  )

  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.container,
    style,
  )

  const content = headless ? (
    children
  ) : (
    <div
      ref={setRef}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children}
    </div>
  )

  return (
    <AutocompleteInnerContext.Provider
      value={{ size, containerRef: internalRef }}
    >
      <AriaAutocomplete {...rest} filter={filterFn}>
        {content}
      </AriaAutocomplete>
    </AutocompleteInnerContext.Provider>
  )
}) as <T extends object>(
  props: AutocompleteProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement
