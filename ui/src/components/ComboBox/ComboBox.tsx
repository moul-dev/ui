'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Button as AriaButton,
  ComboBox as AriaComboBox,
  type ComboBoxProps as AriaComboBoxProps,
  Group as AriaGroup,
  Header as AriaHeader,
  Input as AriaInput,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  type ListBoxItemProps as AriaListBoxItemProps,
  ListBoxSection as AriaListBoxSection,
  type ListBoxSectionProps as AriaListBoxSectionProps,
  Popover as AriaPopover,
  ComboBoxStateContext,
  type Key,
  type ListBoxRenderProps,
  type ValidationResult,
} from 'react-aria-components'
import { Description } from '../Description'
import { FieldError } from '../FieldError'
import { Label } from '../Label'
import { styles } from './ComboBox.styles'

// ── ComboBoxContext ───────────────────────────────────────────────────

const ComboBoxContext = React.createContext<{ size: 'sm' | 'md' | 'lg' }>({
  size: 'md',
})

// ── ComboBoxItem Component ────────────────────────────────────────────

export interface ComboBoxItemProps extends Omit<AriaListBoxItemProps, 'style'> {
  style?: StyleXStyles
  className?: string
  /** Handler that is called when the item is activated. When set, the item acts as an action item and bypasses selection. */
  onAction?: () => void
}

export const ComboBoxItem = React.forwardRef<HTMLDivElement, ComboBoxItemProps>(
  function ComboBoxItem(
    { style, className, children, onAction, ...rest },
    ref,
  ) {
    const { size } = React.useContext(ComboBoxContext)
    const sizeSuffix = size.charAt(0).toUpperCase() + size.slice(1)
    const sizeStyle =
      styles[`item${sizeSuffix}` as 'itemSm' | 'itemMd' | 'itemLg']

    return (
      <AriaListBoxItem
        {...rest}
        onAction={onAction}
        ref={ref}
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
        {children}
      </AriaListBoxItem>
    )
  },
)

// ── ComboBoxSection Component ──────────────────────────────────────────

export interface ComboBoxSectionProps
  extends Omit<AriaListBoxSectionProps<any>, 'style'> {
  title?: string
  style?: StyleXStyles
  className?: string
}

export const ComboBoxSection = React.forwardRef<
  HTMLDivElement,
  ComboBoxSectionProps
>(function ComboBoxSection(
  { title, children, style, className, ...rest },
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
      style={stylexStyle}
    >
      {title && (
        <AriaHeader {...stylex.props(styles.sectionHeader)}>{title}</AriaHeader>
      )}
      {typeof children === 'function' ? (children as any) : children}
    </AriaListBoxSection>
  )
})

// ── ComboBox Component ────────────────────────────────────────────────

interface ComboBoxListBoxContentProps<T> {
  children?: React.ReactNode | ((item: T) => React.ReactNode)
  items?: Iterable<T>
  onAction?: (key: Key) => void
  renderEmptyState?: (props: ListBoxRenderProps) => React.ReactNode
}

function ComboBoxListBoxContent<T extends object>({
  children,
  items,
  onAction,
  renderEmptyState,
}: ComboBoxListBoxContentProps<T>) {
  const state = React.useContext(ComboBoxStateContext)

  const handleAction = onAction
    ? (key: Key) => {
        onAction(key)
        const item = state?.collection?.getItem(key)
        const hasItemAction = Boolean((item?.props as any)?.onAction)
        if (!hasItemAction && state) {
          state.setSelectedKey(key)
        }
        state?.close()
      }
    : undefined

  return (
    <AriaListBox<T>
      items={items}
      onAction={handleAction}
      renderEmptyState={renderEmptyState}
      className={() => stylex.props(styles.listbox).className || ''}
      style={() => stylex.props(styles.listbox).style || {}}
    >
      {children}
    </AriaListBox>
  )
}

export interface ComboBoxProps<T extends object = object>
  extends Omit<AriaComboBoxProps<T>, 'style' | 'children'> {
  style?: StyleXStyles
  className?: string
  label?: string
  description?: string
  errorMessage?: string | ((v: ValidationResult) => string)
  placeholder?: string
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  /** Handler that is called when any item in the ComboBox is activated. Selection and input text are preserved. */
  onAction?: (key: Key) => void
  /** Provides content to display when there are no items in the list. */
  renderEmptyState?: (props: ListBoxRenderProps) => React.ReactNode
  /** Whether the combo box allows the menu to be open when the collection is empty. */
  allowsEmptyCollection?: boolean
  children?: React.ReactNode | ((item: T) => React.ReactNode)
}

function ComboBoxComponent<T extends object>(
  {
    variant = 'primary',
    size = 'md',
    style,
    className,
    label,
    description,
    errorMessage,
    placeholder,
    children,
    menuTrigger = 'focus',
    allowsEmptyCollection,
    items,
    onAction,
    renderEmptyState,
    ...rest
  }: ComboBoxProps<T>,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const sizeSuffix = size.charAt(0).toUpperCase() + size.slice(1)

  return (
    <ComboBoxContext.Provider value={{ size }}>
      <AriaComboBox
        menuTrigger={menuTrigger}
        allowsEmptyCollection={allowsEmptyCollection}
        items={items}
        {...(rest as any)}
        className={(_) => {
          const { className: stylexClass } = stylex.props(styles.container)
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(_) => {
          const { style: stylexStyle } = stylex.props(styles.container)
          return stylexStyle
        }}
      >
        {() => (
          <>
            {label && <Label>{label}</Label>}
            <AriaGroup
              className={(groupProps) => {
                const { className: stylexClass } = stylex.props(
                  styles.group,
                  styles[
                    `group${sizeSuffix}` as 'groupSm' | 'groupMd' | 'groupLg'
                  ],
                  styles[variant],
                  groupProps.isHovered &&
                    !groupProps.isFocusWithin &&
                    styles.groupHover,
                  groupProps.isFocusWithin && styles.groupFocused,
                  groupProps.isInvalid && styles.groupInvalid,
                  groupProps.isInvalid &&
                    groupProps.isFocusWithin &&
                    styles.groupFocusedInvalid,
                  groupProps.isDisabled && styles.groupDisabled,
                  style,
                )
                return stylexClass || ''
              }}
              style={(groupProps) => {
                const { style: stylexStyle } = stylex.props(
                  styles.group,
                  styles[
                    `group${sizeSuffix}` as 'groupSm' | 'groupMd' | 'groupLg'
                  ],
                  styles[variant],
                  groupProps.isHovered &&
                    !groupProps.isFocusWithin &&
                    styles.groupHover,
                  groupProps.isFocusWithin && styles.groupFocused,
                  groupProps.isInvalid && styles.groupInvalid,
                  groupProps.isInvalid &&
                    groupProps.isFocusWithin &&
                    styles.groupFocusedInvalid,
                  groupProps.isDisabled && styles.groupDisabled,
                  style,
                )
                return stylexStyle || {}
              }}
            >
              <AriaInput
                ref={ref}
                placeholder={placeholder}
                className={() => {
                  const { className: stylexClass } = stylex.props(
                    styles.input,
                    styles[
                      `input${sizeSuffix}` as 'inputSm' | 'inputMd' | 'inputLg'
                    ],
                  )
                  return stylexClass || ''
                }}
                style={() => {
                  const { style: stylexStyle } = stylex.props(
                    styles.input,
                    styles[
                      `input${sizeSuffix}` as 'inputSm' | 'inputMd' | 'inputLg'
                    ],
                  )
                  return stylexStyle || {}
                }}
              />
              <AriaButton
                className={(triggerProps) => {
                  const { className: stylexClass } = stylex.props(
                    styles.trigger,
                    styles[
                      `trigger${sizeSuffix}` as
                        | 'triggerSm'
                        | 'triggerMd'
                        | 'triggerLg'
                    ],
                    triggerProps.isDisabled && styles.triggerDisabled,
                  )
                  return stylexClass || ''
                }}
                style={(triggerProps) => {
                  const { style: stylexStyle } = stylex.props(
                    styles.trigger,
                    styles[
                      `trigger${sizeSuffix}` as
                        | 'triggerSm'
                        | 'triggerMd'
                        | 'triggerLg'
                    ],
                    triggerProps.isDisabled && styles.triggerDisabled,
                  )
                  return stylexStyle || {}
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  {...stylex.props(styles.chevron)}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </AriaButton>
            </AriaGroup>
            {description && <Description>{description}</Description>}
            <FieldError errorMessage={errorMessage} />
            <AriaPopover
              className={(_) => {
                const { className: stylexClass } = stylex.props(
                  styles.popover,
                  styles[
                    `popover${sizeSuffix}` as
                      | 'popoverSm'
                      | 'popoverMd'
                      | 'popoverLg'
                  ],
                )
                return stylexClass || ''
              }}
              style={(_) => {
                const { style: stylexStyle } = stylex.props(
                  styles.popover,
                  styles[
                    `popover${sizeSuffix}` as
                      | 'popoverSm'
                      | 'popoverMd'
                      | 'popoverLg'
                  ],
                )
                return stylexStyle || {}
              }}
            >
              <ComboBoxListBoxContent
                items={items}
                onAction={onAction}
                renderEmptyState={renderEmptyState}
              >
                {children}
              </ComboBoxListBoxContent>
            </AriaPopover>
          </>
        )}
      </AriaComboBox>
    </ComboBoxContext.Provider>
  )
}

export const ComboBox = React.forwardRef(ComboBoxComponent) as <
  T extends object = object,
>(
  props: ComboBoxProps<T> & { ref?: React.ForwardedRef<HTMLInputElement> },
) => React.ReactElement | null
