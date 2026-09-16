'use client'
import { Check } from '@phosphor-icons/react'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  DropIndicator as AriaDropIndicator,
  type DropIndicatorProps as AriaDropIndicatorProps,
  Header as AriaHeader,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  type ListBoxItemProps as AriaListBoxItemProps,
  ListBoxLoadMoreItem as AriaListBoxLoadMoreItem,
  type ListBoxLoadMoreItemProps as AriaListBoxLoadMoreItemProps,
  type ListBoxProps as AriaListBoxProps,
  ListBoxSection as AriaListBoxSection,
  type ListBoxSectionProps as AriaListBoxSectionProps,
  Text as AriaText,
  composeRenderProps,
  type DropTarget,
} from 'react-aria-components'
import { Spinner } from '../Spinner'
import { styles } from './ListBox.styles'

// ── Types ─────────────────────────────────────────────────────────────

export type ListBoxSize = 'sm' | 'md' | 'lg'
export type ListBoxVariant = 'bordered' | 'flat' | 'plain'
export type ListBoxLayout = 'stack' | 'grid'
export type ListBoxOrientation = 'vertical' | 'horizontal'

// ── Context ───────────────────────────────────────────────────────────

interface ListBoxContextValue {
  size: ListBoxSize
  variant: ListBoxVariant
  orientation: ListBoxOrientation
}

const ListBoxContext = React.createContext<ListBoxContextValue>({
  size: 'md',
  variant: 'bordered',
  orientation: 'vertical',
})

// ── DropIndicator Component ───────────────────────────────────────────

export interface DropIndicatorProps
  extends Omit<AriaDropIndicatorProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
}

export const DropIndicator = React.forwardRef<HTMLElement, DropIndicatorProps>(
  function DropIndicator({ style, className, ...rest }, ref) {
    const { orientation } = React.useContext(ListBoxContext)
    const orientationStyle =
      orientation === 'horizontal'
        ? styles.dropIndicatorVertical
        : styles.dropIndicatorHorizontal

    return (
      <AriaDropIndicator
        {...rest}
        ref={ref}
        className={(renderProps) => {
          const { className: stylexClass } = stylex.props(
            styles.dropIndicator,
            orientationStyle,
            renderProps.isDropTarget && styles.dropIndicatorTarget,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(renderProps) => {
          const { style: stylexStyle } = stylex.props(
            styles.dropIndicator,
            orientationStyle,
            renderProps.isDropTarget && styles.dropIndicatorTarget,
            style,
          )
          return stylexStyle || {}
        }}
      />
    )
  },
)

// ── ListBoxLoadMoreItem Component ─────────────────────────────────────

export interface ListBoxLoadMoreItemProps
  extends Omit<AriaListBoxLoadMoreItemProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
  children?: React.ReactNode
}

export const ListBoxLoadMoreItem = React.forwardRef<
  HTMLDivElement,
  ListBoxLoadMoreItemProps
>(function ListBoxLoadMoreItem({ style, className, children, ...rest }, ref) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.loadMore,
    style,
  )

  return (
    <AriaListBoxLoadMoreItem
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle || {}}
    >
      {children ?? <Spinner size="sm" aria-label="Loading more..." />}
    </AriaListBoxLoadMoreItem>
  )
})

// ── ListBoxSection Component ──────────────────────────────────────────

export interface ListBoxSectionProps<T extends object = object>
  extends Omit<AriaListBoxSectionProps<T>, 'style' | 'className'> {
  title?: string
  isSticky?: boolean
  style?: StyleXStyles
  className?: string
}

export const ListBoxSection = React.forwardRef<
  HTMLElement,
  ListBoxSectionProps<any>
>(function ListBoxSection(
  { title, isSticky = true, children, style, className, ...rest },
  ref,
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
      style={stylexStyle || {}}
    >
      {title && (
        <AriaHeader
          {...stylex.props(
            styles.sectionHeader,
            isSticky && styles.sectionHeaderSticky,
          )}
        >
          {title}
        </AriaHeader>
      )}
      {typeof children === 'function' ? (children as any) : children}
    </AriaListBoxSection>
  )
})

// ── ListBoxItem Component ─────────────────────────────────────────────

export interface ListBoxItemProps<T extends object = object>
  extends Omit<AriaListBoxItemProps<T>, 'style' | 'className'> {
  label?: React.ReactNode
  description?: React.ReactNode
  showCheckmark?: boolean
  style?: StyleXStyles
  className?: string
}

export const ListBoxItem = React.forwardRef<
  HTMLDivElement,
  ListBoxItemProps<any>
>(function ListBoxItem(
  {
    label,
    description,
    showCheckmark = false,
    children,
    style,
    className,
    textValue,
    ...rest
  },
  ref,
) {
  const { size } = React.useContext(ListBoxContext)
  const sizeSuffix = size.charAt(0).toUpperCase() + size.slice(1)
  const sizeStyle =
    styles[`item${sizeSuffix}` as 'itemSm' | 'itemMd' | 'itemLg']
  const checkIconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16

  // Derive textValue for accessibility if not explicitly provided
  const derivedTextValue =
    textValue ??
    (typeof label === 'string'
      ? label
      : typeof children === 'string'
        ? children
        : undefined)

  return (
    <AriaListBoxItem
      {...rest}
      ref={ref}
      textValue={derivedTextValue}
      className={(renderProps) => {
        const { className: stylexClass } = stylex.props(
          styles.item,
          sizeStyle,
          renderProps.isHovered && styles.itemHovered,
          renderProps.isFocused && styles.itemFocused,
          renderProps.isFocusVisible && styles.itemFocusVisible,
          renderProps.isPressed && styles.itemPressed,
          renderProps.isSelected && styles.itemSelected,
          renderProps.isSelected &&
            renderProps.isFocusVisible &&
            styles.itemSelectedFocusVisible,
          renderProps.isDisabled && styles.itemDisabled,
          renderProps.isDragging && styles.itemDragging,
          renderProps.isDropTarget && styles.itemDropTarget,
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
          renderProps.isFocusVisible && styles.itemFocusVisible,
          renderProps.isPressed && styles.itemPressed,
          renderProps.isSelected && styles.itemSelected,
          renderProps.isSelected &&
            renderProps.isFocusVisible &&
            styles.itemSelectedFocusVisible,
          renderProps.isDisabled && styles.itemDisabled,
          renderProps.isDragging && styles.itemDragging,
          renderProps.isDropTarget && styles.itemDropTarget,
          style,
        )
        return stylexStyle || {}
      }}
    >
      {composeRenderProps(children, (renderedChildren, renderProps) => {
        const hasPropsContent = label !== undefined || description !== undefined

        return (
          <>
            <div {...stylex.props(styles.itemContent)}>
              {hasPropsContent ? (
                <div {...stylex.props(styles.itemTextContainer)}>
                  {label !== undefined && (
                    <span slot="label" {...stylex.props(styles.itemLabel)}>
                      {label}
                    </span>
                  )}
                  {description !== undefined && (
                    <span
                      slot="description"
                      {...stylex.props(styles.itemDescription)}
                    >
                      {description}
                    </span>
                  )}
                  {renderedChildren}
                </div>
              ) : typeof renderedChildren === 'string' ? (
                <span slot="label" {...stylex.props(styles.itemLabel)}>
                  {renderedChildren}
                </span>
              ) : (
                renderedChildren
              )}
            </div>
            {showCheckmark && renderProps.isSelected && (
              <span {...stylex.props(styles.itemCheckmark)} aria-hidden="true">
                <Check size={checkIconSize} weight="bold" />
              </span>
            )}
          </>
        )
      })}
    </AriaListBoxItem>
  )
})

// ── ListBox Component ─────────────────────────────────────────────────

export interface ListBoxProps<T extends object = object>
  extends Omit<AriaListBoxProps<T>, 'style' | 'className'> {
  size?: ListBoxSize
  variant?: ListBoxVariant
  style?: StyleXStyles
  className?: string
  renderDropIndicator?: (target: DropTarget) => React.ReactNode
}

function ListBoxComponent<T extends object>(
  {
    size = 'md',
    variant = 'bordered',
    layout = 'stack',
    orientation = 'vertical',
    renderDropIndicator,
    children,
    style,
    className,
    ...rest
  }: ListBoxProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const sizeSuffix = size.charAt(0).toUpperCase() + size.slice(1)
  const sizeKey = `container${sizeSuffix}` as
    | 'containerSm'
    | 'containerMd'
    | 'containerLg'

  const layoutStyle =
    layout === 'grid'
      ? styles.grid
      : orientation === 'horizontal'
        ? styles.stackHorizontal
        : styles.stackVertical

  // Default drop indicator when DnD hooks are passed
  const defaultRenderDropIndicator =
    renderDropIndicator ??
    ((target: DropTarget) => <DropIndicator target={target} />)

  return (
    <ListBoxContext.Provider value={{ size, variant, orientation }}>
      <AriaListBox<T>
        {...(rest as any)}
        ref={ref}
        layout={layout}
        orientation={orientation}
        renderDropIndicator={defaultRenderDropIndicator}
        className={(renderProps) => {
          const { className: stylexClass } = stylex.props(
            styles.container,
            styles[variant],
            styles[sizeKey],
            layoutStyle,
            renderProps.isFocusVisible && styles.containerFocusVisible,
            renderProps.isDropTarget && styles.containerDropTarget,
            renderProps.isEmpty && styles.empty,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(renderProps) => {
          const { style: stylexStyle } = stylex.props(
            styles.container,
            styles[variant],
            styles[sizeKey],
            layoutStyle,
            renderProps.isFocusVisible && styles.containerFocusVisible,
            renderProps.isDropTarget && styles.containerDropTarget,
            renderProps.isEmpty && styles.empty,
            style,
          )
          return stylexStyle || {}
        }}
      >
        {children}
      </AriaListBox>
    </ListBoxContext.Provider>
  )
}

export const ListBox = React.forwardRef(ListBoxComponent) as <
  T extends object = object,
>(
  props: ListBoxProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement | null

// Re-export Text and Header for slot-based composition
export { AriaHeader as Header, AriaText as Text }
