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
  variant?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'danger-soft'
}

export const ToggleButton = React.forwardRef<
  HTMLButtonElement,
  ToggleButtonProps
>(function ToggleButton(
  {
    variant,
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
  const resolvedVariant = variant ?? groupContext?.variant ?? 'secondary'

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
          styles[`${resolvedVariant}Selected` as keyof typeof styles]
        const { className: stylexClass } = stylex.props(
          styles.base,
          styles[resolvedVariant as keyof typeof styles],
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
                  renderProps.isSelected &&
                    (resolvedVariant === 'primary'
                      ? styles.animatedItemSelectedPrimary
                      : styles.animatedItemSelected),
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
          styles[`${resolvedVariant}Selected` as keyof typeof styles]
        const { style: stylexStyle } = stylex.props(
          styles.base,
          styles[resolvedVariant as keyof typeof styles],
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
                  renderProps.isSelected &&
                    (resolvedVariant === 'primary'
                      ? styles.animatedItemSelectedPrimary
                      : styles.animatedItemSelected),
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
                    resolvedVariant === 'primary' &&
                      styles.selectionIndicatorPrimary,
                    resolvedVariant === 'secondary' &&
                      styles.selectionIndicatorSecondary,
                    resolvedVariant === 'tertiary' &&
                      styles.selectionIndicatorTertiary,
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
