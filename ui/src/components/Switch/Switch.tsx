'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Switch as AriaSwitch,
  type SwitchProps as AriaSwitchProps,
} from 'react-aria-components'
import { warnMissingLabel } from '../../utils/warnMissingLabel'
import { styles } from './Switch.styles'

export interface SwitchProps extends Omit<AriaSwitchProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const Switch = React.forwardRef<HTMLLabelElement, SwitchProps>(
  function Switch({ style, className, children, ...rest }, ref) {
    if (process.env.NODE_ENV !== 'production') {
      warnMissingLabel('Switch', {
        label: rest['aria-label'],
        labelledBy: rest['aria-labelledby'],
        children: typeof children === 'function' ? undefined : children,
      })
    }

    return (
      <AriaSwitch
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
          const { className: trackClass, style: trackStyle } = stylex.props(
            styles.track,
            renderProps.isSelected && styles.trackChecked,
            renderProps.isHovered && styles.trackHover,
            renderProps.isFocusVisible && styles.trackFocusVisible,
          )

          const { className: thumbClass, style: thumbStyle } = stylex.props(
            styles.thumb,
            renderProps.isSelected && styles.thumbChecked,
          )

          return (
            <>
              <div className={trackClass} style={trackStyle}>
                <div className={thumbClass} style={thumbStyle} />
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
      </AriaSwitch>
    )
  },
)
