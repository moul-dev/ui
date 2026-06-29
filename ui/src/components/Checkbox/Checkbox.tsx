'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Checkbox as AriaCheckbox,
  type CheckboxProps as AriaCheckboxProps,
} from 'react-aria-components'
import { warnMissingLabel } from '../../utils/warnMissingLabel'
import { styles } from './Checkbox.styles'
import { CheckboxGroupContext } from './context'

export interface CheckboxProps extends Omit<AriaCheckboxProps, 'style'> {
  style?: StyleXStyles
  className?: string
  variant?: 'primary' | 'secondary' | 'tertiary'
}

export const Checkbox = React.forwardRef<HTMLLabelElement, CheckboxProps>(
  function Checkbox({ style, className, children, variant, ...rest }, ref) {
    const groupContext = React.useContext(CheckboxGroupContext)
    const resolvedVariant = variant ?? groupContext?.variant ?? 'primary'

    if (process.env.NODE_ENV !== 'production') {
      warnMissingLabel('Checkbox', {
        label: rest['aria-label'],
        labelledBy: rest['aria-labelledby'],
        children: typeof children === 'function' ? undefined : children,
      })
    }

    return (
      <AriaCheckbox
        {...rest}
        ref={ref}
        className={(renderProps) => {
          const { className: stylexClass } = stylex.props(
            styles.base,
            renderProps.isDisabled && styles.isDisabled,
            renderProps.isReadOnly && styles.isReadOnly,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(renderProps) => {
          const { style: stylexStyle } = stylex.props(
            styles.base,
            renderProps.isDisabled && styles.isDisabled,
            renderProps.isReadOnly && styles.isReadOnly,
            style,
          )
          return stylexStyle
        }}
      >
        {(renderProps) => {
          const { className: indicatorClass, style: indicatorStyle } =
            stylex.props(
              styles.indicator,
              renderProps.isHovered && styles.indicatorHover,
              (renderProps.isSelected || renderProps.isIndeterminate) &&
                {
                  primary: styles.checkedPrimary,
                  secondary: styles.checkedSecondary,
                  tertiary: styles.checkedTertiary,
                }[resolvedVariant],
              renderProps.isHovered &&
                (renderProps.isSelected || renderProps.isIndeterminate) &&
                {
                  primary: styles.checkedHoverPrimary,
                  secondary: styles.checkedHoverSecondary,
                  tertiary: styles.checkedHoverTertiary,
                }[resolvedVariant],
              renderProps.isFocusVisible && styles.indicatorFocusVisible,
              renderProps.isFocusVisible &&
                {
                  primary: styles.focusPrimary,
                  secondary: styles.focusSecondary,
                  tertiary: styles.focusTertiary,
                }[resolvedVariant],
              renderProps.isInvalid && styles.indicatorInvalid,
            )

          return (
            <>
              <div className={indicatorClass} style={indicatorStyle}>
                {renderProps.isIndeterminate ? (
                  <svg
                    viewBox="0 0 18 18"
                    aria-hidden="true"
                    {...stylex.props(
                      styles.icon,
                      {
                        primary: styles.iconPrimary,
                        secondary: styles.iconSecondary,
                        tertiary: styles.iconTertiary,
                      }[resolvedVariant],
                    )}
                  >
                    <line
                      x1={3}
                      y1={9}
                      x2={15}
                      y2={9}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : renderProps.isSelected ? (
                  <svg
                    viewBox="0 0 18 18"
                    aria-hidden="true"
                    {...stylex.props(
                      styles.icon,
                      {
                        primary: styles.iconPrimary,
                        secondary: styles.iconSecondary,
                        tertiary: styles.iconTertiary,
                      }[resolvedVariant],
                    )}
                  >
                    <polyline
                      points="3 9 7 13 15 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </div>
              {children && (
                <span {...stylex.props(styles.label)}>
                  {typeof children === 'function'
                    ? children(renderProps)
                    : children}
                </span>
              )}
            </>
          )
        }}
      </AriaCheckbox>
    )
  },
)
