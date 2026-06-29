'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Button as AriaButton,
  Tag as AriaTag,
  TagGroup as AriaTagGroup,
  type TagGroupProps as AriaTagGroupProps,
  type TagProps as AriaTagProps,
  TagList,
  type TagListProps,
  type ValidationResult,
} from 'react-aria-components'
import { Description } from '../Description'
import { Label } from '../Label'
import { styles } from './TagGroup.styles'

export type TagSize = 'sm' | 'md' | 'lg'
export type TagVariant = 'primary' | 'secondary' | 'tertiary'

interface TagGroupContextValue {
  size?: TagSize
  variant?: TagVariant
  isDisabled?: boolean
}

const TagGroupContext = React.createContext<TagGroupContextValue | null>(null)

export interface TagGroupProps<T>
  extends Omit<AriaTagGroupProps, 'style' | 'children'> {
  label?: string
  description?: string
  errorMessage?: string | ((v: ValidationResult) => string)
  isInvalid?: boolean
  isDisabled?: boolean
  size?: TagSize
  variant?: TagVariant
  style?: StyleXStyles
  className?: string
  items?: Iterable<T>
  renderEmptyState?: TagListProps<T>['renderEmptyState']
  children?: TagListProps<T>['children']
}

export function TagGroup<T>({
  label,
  description,
  errorMessage,
  isInvalid,
  isDisabled,
  size = 'md',
  variant = 'secondary',
  items,
  children,
  renderEmptyState,
  style,
  className,
  ...props
}: TagGroupProps<T>) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.container,
    style,
  )
  return (
    <TagGroupContext.Provider value={{ size, variant, isDisabled }}>
      <AriaTagGroup
        {...props}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {label && <Label>{label}</Label>}
        <TagList
          items={items}
          renderEmptyState={renderEmptyState}
          className={(_) => {
            const { className: stylexClass } = stylex.props(styles.list)
            return stylexClass || ''
          }}
          style={(_) => {
            const { style: stylexStyle } = stylex.props(styles.list)
            return stylexStyle || {}
          }}
        >
          {children}
        </TagList>
        {description && <Description>{description}</Description>}
        {isInvalid && errorMessage && (
          <span role="alert" {...stylex.props(styles.errorMessage)}>
            {typeof errorMessage === 'function'
              ? errorMessage({
                  isInvalid: true,
                  validationErrors: [],
                  validationDetails: {} as any,
                })
              : errorMessage}
          </span>
        )}
      </AriaTagGroup>
    </TagGroupContext.Provider>
  )
}

export interface TagProps extends Omit<AriaTagProps, 'style'> {
  size?: TagSize
  variant?: TagVariant
  style?: StyleXStyles
  className?: string
}

export const Tag = React.forwardRef<HTMLDivElement, TagProps>(function Tag(
  { style, className, children, isDisabled, size, variant, ...rest },
  ref,
) {
  const groupContext = React.useContext(TagGroupContext)
  const resolvedSize = size ?? groupContext?.size ?? 'md'
  const resolvedVariant = variant ?? groupContext?.variant ?? 'secondary'
  const resolvedDisabled = isDisabled || groupContext?.isDisabled
  const textValue = typeof children === 'string' ? children : undefined

  return (
    <AriaTag
      textValue={textValue}
      isDisabled={resolvedDisabled}
      {...rest}
      ref={ref}
      className={(renderProps) => {
        const { className: styleClass } = stylex.props(
          styles.tag,
          styles[resolvedSize],
          renderProps.allowsRemoving &&
            {
              sm: styles.tagWithRemoveSm,
              md: styles.tagWithRemoveMd,
              lg: styles.tagWithRemoveLg,
            }[resolvedSize],
          !!rest.href && styles.tagLink,
          {
            primary: styles.variantPrimary,
            secondary: styles.variantSecondary,
            tertiary: styles.variantTertiary,
          }[resolvedVariant],
          renderProps.isHovered &&
            {
              primary: styles.variantPrimaryHovered,
              secondary: styles.variantSecondaryHovered,
              tertiary: styles.variantTertiaryHovered,
            }[resolvedVariant],
          renderProps.isSelected &&
            {
              primary: styles.variantPrimarySelected,
              secondary: styles.variantSecondarySelected,
              tertiary: styles.variantTertiarySelected,
            }[resolvedVariant],
          renderProps.isSelected &&
            renderProps.isHovered &&
            {
              primary: styles.variantPrimarySelectedHovered,
              secondary: styles.variantSecondarySelectedHovered,
              tertiary: styles.variantTertiarySelectedHovered,
            }[resolvedVariant],
          renderProps.isFocused && styles.tagFocused,
          renderProps.isFocusVisible && styles.tagFocusVisible,
          renderProps.isPressed && styles.tagPressed,
          renderProps.isDisabled && styles.tagDisabled,
          style,
        )
        return [styleClass, className].filter(Boolean).join(' ')
      }}
      style={(renderProps) => {
        const { style: styleStyle } = stylex.props(
          styles.tag,
          styles[resolvedSize],
          renderProps.allowsRemoving &&
            {
              sm: styles.tagWithRemoveSm,
              md: styles.tagWithRemoveMd,
              lg: styles.tagWithRemoveLg,
            }[resolvedSize],
          !!rest.href && styles.tagLink,
          {
            primary: styles.variantPrimary,
            secondary: styles.variantSecondary,
            tertiary: styles.variantTertiary,
          }[resolvedVariant],
          renderProps.isHovered &&
            {
              primary: styles.variantPrimaryHovered,
              secondary: styles.variantSecondaryHovered,
              tertiary: styles.variantTertiaryHovered,
            }[resolvedVariant],
          renderProps.isSelected &&
            {
              primary: styles.variantPrimarySelected,
              secondary: styles.variantSecondarySelected,
              tertiary: styles.variantTertiarySelected,
            }[resolvedVariant],
          renderProps.isSelected &&
            renderProps.isHovered &&
            {
              primary: styles.variantPrimarySelectedHovered,
              secondary: styles.variantSecondarySelectedHovered,
              tertiary: styles.variantTertiarySelectedHovered,
            }[resolvedVariant],
          renderProps.isFocused && styles.tagFocused,
          renderProps.isFocusVisible && styles.tagFocusVisible,
          renderProps.isPressed && styles.tagPressed,
          renderProps.isDisabled && styles.tagDisabled,
          style,
        )
        return styleStyle || {}
      }}
    >
      {(renderProps) => (
        <>
          {typeof children === 'function' ? children(renderProps) : children}
          {renderProps.allowsRemoving && (
            <AriaButton
              slot="remove"
              className={(btnProps) => {
                const { className: btnClass } = stylex.props(
                  styles.removeButton,
                  {
                    sm: styles.removeButtonSm,
                    md: styles.removeButtonMd,
                    lg: styles.removeButtonLg,
                  }[resolvedSize],
                  btnProps.isHovered &&
                    {
                      primary: renderProps.isSelected
                        ? styles.removeHoverPrimarySelected
                        : styles.removeHoverPrimary,
                      secondary: renderProps.isSelected
                        ? styles.removeHoverSecondarySelected
                        : styles.removeHoverSecondary,
                      tertiary: renderProps.isSelected
                        ? styles.removeHoverTertiarySelected
                        : styles.removeHoverTertiary,
                    }[resolvedVariant],
                  btnProps.isPressed && styles.removeButtonPressed,
                  btnProps.isFocusVisible && styles.removeButtonFocused,
                )
                return btnClass || ''
              }}
              style={(btnProps) => {
                const { style: btnStyle } = stylex.props(
                  styles.removeButton,
                  {
                    sm: styles.removeButtonSm,
                    md: styles.removeButtonMd,
                    lg: styles.removeButtonLg,
                  }[resolvedSize],
                  btnProps.isHovered &&
                    {
                      primary: renderProps.isSelected
                        ? styles.removeHoverPrimarySelected
                        : styles.removeHoverPrimary,
                      secondary: renderProps.isSelected
                        ? styles.removeHoverSecondarySelected
                        : styles.removeHoverSecondary,
                      tertiary: renderProps.isSelected
                        ? styles.removeHoverTertiarySelected
                        : styles.removeHoverTertiary,
                    }[resolvedVariant],
                  btnProps.isPressed && styles.removeButtonPressed,
                  btnProps.isFocusVisible && styles.removeButtonFocused,
                )
                return btnStyle || {}
              }}
            >
              ✕
            </AriaButton>
          )}
        </>
      )}
    </AriaTag>
  )
})
