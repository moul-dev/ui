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
  Popover as AriaPopover,
  Section as AriaSection,
  type SectionProps as AriaSectionProps,
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
}

export const ComboBoxItem = React.forwardRef<HTMLDivElement, ComboBoxItemProps>(
  function ComboBoxItem({ style, className, children, ...rest }, ref) {
    const { size } = React.useContext(ComboBoxContext)
    const sizeSuffix = size.charAt(0).toUpperCase() + size.slice(1)
    const sizeStyle =
      styles[`item${sizeSuffix}` as 'itemSm' | 'itemMd' | 'itemLg']

    return (
      <AriaListBoxItem
        {...rest}
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
  extends Omit<AriaSectionProps<any>, 'style'> {
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
    <AriaSection
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {title && (
        <AriaHeader {...stylex.props(styles.sectionHeader)}>{title}</AriaHeader>
      )}
      {typeof children === 'function' ? (children as any) : children}
    </AriaSection>
  )
})

// ── ComboBox Component ────────────────────────────────────────────────

export interface ComboBoxProps extends Omit<AriaComboBoxProps<any>, 'style'> {
  style?: StyleXStyles
  className?: string
  label?: string
  description?: string
  errorMessage?: string | ((v: ValidationResult) => string)
  placeholder?: string
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export const ComboBox = React.forwardRef<HTMLInputElement, ComboBoxProps>(
  function ComboBox(
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
      ...rest
    },
    ref,
  ) {
    const sizeSuffix = size.charAt(0).toUpperCase() + size.slice(1)

    return (
      <ComboBoxContext.Provider value={{ size }}>
        <AriaComboBox
          menuTrigger={menuTrigger}
          {...rest}
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
                    groupProps.isHovered && styles.groupHover,
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
                    groupProps.isHovered && styles.groupHover,
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
                        `input${sizeSuffix}` as
                          | 'inputSm'
                          | 'inputMd'
                          | 'inputLg'
                      ],
                    )
                    return stylexClass || ''
                  }}
                  style={() => {
                    const { style: stylexStyle } = stylex.props(
                      styles.input,
                      styles[
                        `input${sizeSuffix}` as
                          | 'inputSm'
                          | 'inputMd'
                          | 'inputLg'
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
                <AriaListBox
                  className={() => stylex.props(styles.listbox).className || ''}
                  style={() => stylex.props(styles.listbox).style || {}}
                >
                  {children}
                </AriaListBox>
              </AriaPopover>
            </>
          )}
        </AriaComboBox>
      </ComboBoxContext.Provider>
    )
  },
)
