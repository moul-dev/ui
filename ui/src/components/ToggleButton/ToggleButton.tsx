'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  SelectionIndicator as AriaSelectionIndicator,
  ToggleButton as AriaToggleButton,
  type ToggleButtonProps as AriaToggleButtonProps,
  composeRenderProps,
} from 'react-aria-components'
import { warnMissingLabel } from '../../utils/warnMissingLabel'
import { ToggleButtonGroupContext } from '../ToggleButtonGroup/context'
import { styles } from './ToggleButton.styles'

export interface ToggleButtonProps
  extends Omit<AriaToggleButtonProps, 'style'> {
  style?: StyleXStyles
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
  isSquare?: boolean
}

export const ToggleButton = React.forwardRef<
  HTMLButtonElement,
  ToggleButtonProps
>(function ToggleButton(
  {
    size,
    variant = 'primary',
    isSquare = false,
    isSelected,
    defaultSelected,
    onChange,
    isDisabled,
    style,
    className,
    children,
    ...rest
  },
  ref,
) {
  const groupContext = React.useContext(ToggleButtonGroupContext)
  const resolvedSize = size ?? groupContext?.size ?? 'md'

  if (process.env.NODE_ENV !== 'production') {
    warnMissingLabel('ToggleButton', {
      label: rest['aria-label'],
      labelledBy: rest['aria-labelledby'],
      children: typeof children === 'function' ? undefined : children,
    })
  }

  return (
    <AriaToggleButton
      {...rest}
      ref={ref}
      isSelected={isSelected}
      defaultSelected={defaultSelected}
      onChange={onChange}
      isDisabled={isDisabled}
      className={(renderProps) => {
        const selectedStyle =
          variant === 'primary' ? styles.primarySelected : styles.secondarySelected
        const { className: stylexClass } = stylex.props(
          styles.base,
          styles[resolvedSize as keyof typeof styles],
          isSquare &&
            styles[
              `square${resolvedSize.charAt(0).toUpperCase()}${resolvedSize.slice(1)}` as keyof typeof styles
            ],
          styles[variant],
          renderProps.isSelected && selectedStyle,
          renderProps.isDisabled && styles.isDisabled,
          groupContext?.isInGroup && styles.groupItem,
          groupContext?.isInGroup &&
            renderProps.isSelected &&
            styles.groupItemActive,
          groupContext?.isInGroup &&
            renderProps.isFocusVisible &&
            styles.groupItemActive,
          groupContext?.isInGroup &&
            renderProps.isHovered &&
            styles.groupItemActive,
          groupContext?.isInGroup &&
            renderProps.isDisabled &&
            styles.groupItemDisabled,
          groupContext?.isInGroup &&
            (groupContext.animated
              ? [
                  styles.animatedItem,
                  styles[
                    `animatedItem${resolvedSize.charAt(0).toUpperCase()}${resolvedSize.slice(1)}` as keyof typeof styles
                  ],
                  renderProps.isSelected &&
                    (variant === 'primary'
                      ? styles.animatedItemSelectedPrimary
                      : styles.animatedItemSelectedSecondary),
                ]
              : groupContext.orientation === 'horizontal'
                ? styles.groupHorizontal
                : styles.groupVertical),
          style,
        )
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={(renderProps) => {
        const selectedStyle =
          variant === 'primary' ? styles.primarySelected : styles.secondarySelected
        const { style: stylexStyle } = stylex.props(
          styles.base,
          styles[resolvedSize as keyof typeof styles],
          isSquare &&
            styles[
              `square${resolvedSize.charAt(0).toUpperCase()}${resolvedSize.slice(1)}` as keyof typeof styles
            ],
          styles[variant],
          renderProps.isSelected && selectedStyle,
          renderProps.isDisabled && styles.isDisabled,
          groupContext?.isInGroup && styles.groupItem,
          groupContext?.isInGroup &&
            renderProps.isSelected &&
            styles.groupItemActive,
          groupContext?.isInGroup &&
            renderProps.isFocusVisible &&
            styles.groupItemActive,
          groupContext?.isInGroup &&
            renderProps.isHovered &&
            styles.groupItemActive,
          groupContext?.isInGroup &&
            renderProps.isDisabled &&
            styles.groupItemDisabled,
          groupContext?.isInGroup &&
            (groupContext.animated
              ? [
                  styles.animatedItem,
                  styles[
                    `animatedItem${resolvedSize.charAt(0).toUpperCase()}${resolvedSize.slice(1)}` as keyof typeof styles
                  ],
                  renderProps.isSelected &&
                    (variant === 'primary'
                      ? styles.animatedItemSelectedPrimary
                      : styles.animatedItemSelectedSecondary),
                ]
              : groupContext.orientation === 'horizontal'
                ? styles.groupHorizontal
                : styles.groupVertical),
          style,
        )
        return stylexStyle
      }}
    >
      {composeRenderProps(children, (childrenVal) => (
        <>
          {childrenVal}
          {groupContext?.isInGroup && groupContext.animated && (
            <AriaSelectionIndicator
              {...(() => {
                const { className: stylexClass, style: stylexStyle } =
                  stylex.props(
                    styles.selectionIndicator,
                    styles[
                      `selectionIndicator${resolvedSize.charAt(0).toUpperCase()}${resolvedSize.slice(1)}` as keyof typeof styles
                    ],
                    variant === 'primary'
                      ? styles.selectionIndicatorPrimary
                      : styles.selectionIndicatorSecondary,
                  )
                return {
                  className: [stylexClass, 'react-aria-SelectionIndicator']
                    .filter(Boolean)
                    .join(' '),
                  style: stylexStyle,
                }
              })()}
            />
          )}
        </>
      ))}
    </AriaToggleButton>
  )
})
