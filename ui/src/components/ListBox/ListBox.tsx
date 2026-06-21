'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  Section as AriaSection,
  Header as AriaHeader,
  type ListBoxProps as AriaListBoxProps,
  type ListBoxItemProps as AriaListBoxItemProps,
  type SectionProps as AriaSectionProps,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './ListBox.styles'

// ── ListBox Component ────────────────────────────────────────────────

export interface ListBoxProps<T> extends Omit<AriaListBoxProps<T>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const ListBox = React.forwardRef<HTMLDivElement, ListBoxProps<any>>(
  function ListBox({ style, className, children, ...rest }, ref) {
    return (
      <AriaListBox
        {...rest}
        ref={ref}
        className={() => {
          const { className: stylexClass } = stylex.props(styles.listbox, style)
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={() => {
          const { style: stylexStyle } = stylex.props(styles.listbox, style)
          return stylexStyle || {}
        }}
      >
        {children}
      </AriaListBox>
    )
  },
)

// ── ListBoxItem Component ─────────────────────────────────────────────

export interface ListBoxItemProps extends Omit<AriaListBoxItemProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const ListBoxItem = React.forwardRef<HTMLDivElement, ListBoxItemProps>(
  function ListBoxItem({ style, className, children, ...rest }, ref) {
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
          return stylexStyle || {}
        }}
      >
        {children}
      </AriaListBoxItem>
    )
  },
)

// ── ListBoxSection Component ──────────────────────────────────────────

export interface ListBoxSectionProps
  extends Omit<AriaSectionProps<any>, 'style'> {
  title?: string
  style?: StyleXStyles
  className?: string
}

export const ListBoxSection = React.forwardRef<
  HTMLDivElement,
  ListBoxSectionProps
>(function ListBoxSection({ title, children, style, className, ...rest }, ref) {
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
