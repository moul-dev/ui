'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Button as AriaButton,
  Header as AriaHeader,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  type ListBoxItemProps as AriaListBoxItemProps,
  Popover as AriaPopover,
  type PopoverProps as AriaPopoverProps,
  Section as AriaSection,
  type SectionProps as AriaSectionProps,
  Select as AriaSelect,
  type SelectProps as AriaSelectProps,
  SelectValue as AriaSelectValue,
  type ValidationResult,
} from 'react-aria-components'
import { Description } from '../Description'
import { FieldError } from '../FieldError'
import { Label } from '../Label'
import { styles } from './Select.styles'

// ── SelectValue Component ─────────────────────────────────────────────

export const SelectValue = AriaSelectValue

// ── SelectPopover Component ───────────────────────────────────────────

export interface SelectPopoverProps extends Omit<AriaPopoverProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const SelectPopover = React.forwardRef<HTMLElement, SelectPopoverProps>(
  function SelectPopover({ style, className, children, ...rest }, ref) {
    return (
      <AriaPopover
        {...rest}
        ref={ref}
        className={(_) => {
          const { className: stylexClass } = stylex.props(styles.popover, style)
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(_) => {
          const { style: stylexStyle } = stylex.props(styles.popover, style)
          return stylexStyle
        }}
      >
        {children}
      </AriaPopover>
    )
  },
)

// ── SelectItem Component ──────────────────────────────────────────────

export interface SelectItemProps extends Omit<AriaListBoxItemProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  function SelectItem({ style, className, children, ...rest }, ref) {
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

// ── SelectSection Component ───────────────────────────────────────────

export interface SelectSectionProps
  extends Omit<AriaSectionProps<any>, 'style'> {
  title?: string
  style?: StyleXStyles
  className?: string
}

export const SelectSection = React.forwardRef<
  HTMLDivElement,
  SelectSectionProps
>(function SelectSection({ title, children, style, className, ...rest }, ref) {
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

// ── Select Component ──────────────────────────────────────────────────

export interface SelectProps extends Omit<AriaSelectProps<any>, 'style'> {
  style?: StyleXStyles
  className?: string
  label?: string
  description?: string
  errorMessage?: string | ((v: ValidationResult) => string)
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  function Select(
    {
      style,
      className,
      label,
      description,
      errorMessage,
      placeholder,
      children,
      size = 'md',
      ...rest
    },
    ref,
  ) {
    return (
      <AriaSelect
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
        {({ isInvalid }) => (
          <>
            {label && <Label>{label}</Label>}
            <AriaButton
              ref={ref}
              className={(renderProps) => {
                const { className: stylexClass } = stylex.props(
                  styles.trigger,
                  styles[size],
                  isInvalid && styles.triggerInvalid,
                  renderProps.isDisabled && styles.triggerDisabled,
                  style,
                )
                return stylexClass || ''
              }}
              style={(renderProps) => {
                const { style: stylexStyle } = stylex.props(
                  styles.trigger,
                  styles[size],
                  isInvalid && styles.triggerInvalid,
                  renderProps.isDisabled && styles.triggerDisabled,
                  style,
                )
                return stylexStyle || {}
              }}
            >
              <SelectValue>
                {({ selectedText, isPlaceholder }) =>
                  isPlaceholder
                    ? (placeholder ?? 'Select an item')
                    : selectedText
                }
              </SelectValue>
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
            {description && <Description>{description}</Description>}
            <FieldError errorMessage={errorMessage} />
            <SelectPopover>
              <AriaListBox
                className={() => stylex.props(styles.listbox).className || ''}
                style={() => stylex.props(styles.listbox).style || {}}
              >
                {children}
              </AriaListBox>
            </SelectPopover>
          </>
        )}
      </AriaSelect>
    )
  },
)
