'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  RadioGroup as AriaRadioGroup,
  Radio as AriaRadio,
  type RadioGroupProps as AriaRadioGroupProps,
  type RadioProps as AriaRadioProps,
  type ValidationResult,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './RadioGroup.styles'
import { Label } from '../Label'
import { Description } from '../Description'
import { FieldError } from '../FieldError'
import { warnMissingLabel } from '../../utils/warnMissingLabel'

// ── Radio Component ───────────────────────────────────────────────────

export interface RadioProps extends Omit<AriaRadioProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const Radio = React.forwardRef<HTMLLabelElement, RadioProps>(
  function Radio({ style, className, children, ...rest }, ref) {
    if (process.env.NODE_ENV !== 'production') {
      warnMissingLabel('Radio', {
        label: rest['aria-label'],
        labelledBy: rest['aria-labelledby'],
        children: typeof children === 'function' ? undefined : children,
      })
    }

    return (
      <AriaRadio
        {...rest}
        ref={ref}
        className={(renderProps) => {
          const { className: stylexClass } = stylex.props(
            styles.radioBase,
            renderProps.isDisabled && styles.radioDisabled,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(renderProps) => {
          const { style: stylexStyle } = stylex.props(
            styles.radioBase,
            renderProps.isDisabled && styles.radioDisabled,
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
              renderProps.isFocusVisible && styles.indicatorFocusVisible,
              renderProps.isInvalid && styles.indicatorInvalid,
            )

          return (
            <>
              <div className={indicatorClass} style={indicatorStyle}>
                {renderProps.isSelected && (
                  <div {...stylex.props(styles.dot)} />
                )}
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
      </AriaRadio>
    )
  },
)

// ── RadioGroup Component ──────────────────────────────────────────────

export interface RadioGroupProps extends Omit<AriaRadioGroupProps, 'style'> {
  style?: StyleXStyles
  className?: string
  label?: string
  description?: string
  errorMessage?: string | ((v: ValidationResult) => string)
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  function RadioGroup(
    { style, className, label, description, errorMessage, children, ...rest },
    ref,
  ) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.groupBase,
      style,
    )
    return (
      <AriaRadioGroup
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {(values) => (
          <>
            {label && <Label>{label}</Label>}
            <div {...stylex.props(styles.group)}>
              {typeof children === 'function' ? children(values) : children}
            </div>
            {description && <Description>{description}</Description>}
            <FieldError errorMessage={errorMessage} />
          </>
        )}
      </AriaRadioGroup>
    )
  },
)
