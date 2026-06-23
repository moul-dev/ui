'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  ComboBox as AriaComboBox,
  Input as AriaInput,
  Button as AriaButton,
  Group as AriaGroup,
  Popover as AriaPopover,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  Section as AriaSection,
  Header as AriaHeader,
  type ComboBoxProps as AriaComboBoxProps,
  type ListBoxItemProps as AriaListBoxItemProps,
  type SectionProps as AriaSectionProps,
  type ValidationResult,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './ComboBox.styles'
import { Label } from '../Label'
import { Description } from '../Description'
import { FieldError } from '../FieldError'

// ── ComboBoxItem Component ────────────────────────────────────────────

export interface ComboBoxItemProps extends Omit<AriaListBoxItemProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const ComboBoxItem = React.forwardRef<HTMLDivElement, ComboBoxItemProps>(
  function ComboBoxItem({ style, className, children, ...rest }, ref) {
    return (
      <AriaListBoxItem
        {...rest}
        ref={ref}
        className={(renderProps) => {
          const { className: stylexClass } = stylex.props(
            styles.item,
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
}

export const ComboBox = React.forwardRef<HTMLInputElement, ComboBoxProps>(
  function ComboBox(
    {
      variant = 'primary',
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
    return (
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
                className={() => stylex.props(styles.input).className || ''}
                style={() => stylex.props(styles.input).style || {}}
              />
              <AriaButton
                className={(triggerProps) => {
                  const { className: stylexClass } = stylex.props(
                    styles.trigger,
                    triggerProps.isDisabled && styles.triggerDisabled,
                  )
                  return stylexClass || ''
                }}
                style={(triggerProps) => {
                  const { style: stylexStyle } = stylex.props(
                    styles.trigger,
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
                const { className: stylexClass } = stylex.props(styles.popover)
                return stylexClass || ''
              }}
              style={(_) => {
                const { style: stylexStyle } = stylex.props(styles.popover)
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
    )
  },
)
