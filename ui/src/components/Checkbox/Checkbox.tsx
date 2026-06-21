'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  Checkbox as AriaCheckbox,
  type CheckboxProps as AriaCheckboxProps,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './Checkbox.styles'
import { warnMissingLabel } from '../../utils/warnMissingLabel'

export interface CheckboxProps extends Omit<AriaCheckboxProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const Checkbox = React.forwardRef<HTMLLabelElement, CheckboxProps>(
  function Checkbox({ style, className, children, ...rest }, ref) {
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
              renderProps.isSelected && styles.indicatorChecked,
              renderProps.isIndeterminate && styles.indicatorIndeterminate,
              renderProps.isFocusVisible && styles.indicatorFocusVisible,
              renderProps.isInvalid && styles.indicatorInvalid,
            )

          return (
            <>
              <div className={indicatorClass} style={indicatorStyle}>
                {renderProps.isIndeterminate ? (
                  <svg
                    viewBox="0 0 18 18"
                    aria-hidden="true"
                    {...stylex.props(styles.icon)}
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
                    {...stylex.props(styles.icon)}
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
