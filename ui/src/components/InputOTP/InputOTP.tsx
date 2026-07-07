'use client'

import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import { OTPInput, OTPInputContext } from 'input-otp'
import * as React from 'react'
import { Description } from '../Description'
import { FieldError } from '../FieldError'
import { Label } from '../Label'
import { styles } from './InputOTP.styles'

// Internal context to share state with slots
interface InputOTPContextValue {
  isInvalid?: boolean
  isDisabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const InputOTPContextInstance = React.createContext<InputOTPContextValue>({
  isInvalid: false,
  isDisabled: false,
  size: 'md',
})

export interface InputOTPProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof OTPInput>,
    'render' | 'size'
  > {
  label?: string
  description?: string
  errorMessage?: string
  isInvalid?: boolean
  containerStyle?: StyleXStyles
  size?: 'sm' | 'md' | 'lg'
}

export const InputOTP = React.forwardRef<HTMLInputElement, InputOTPProps>(
  (
    {
      children,
      label,
      description,
      errorMessage,
      isInvalid,
      containerStyle,
      disabled,
      size = 'md',
      ...props
    },
    ref,
  ) => {
    return (
      <InputOTPContextInstance.Provider
        value={{ isInvalid, isDisabled: disabled, size }}
      >
        <div {...stylex.props(styles.container, containerStyle)}>
          {label && <Label>{label}</Label>}

          <OTPInput
            ref={ref}
            disabled={disabled}
            containerClassName={stylex.props(styles.otpContainer).className}
            className={stylex.props(disabled && styles.slotDisabled).className}
            render={(renderProps) => (
              <OTPInputContext.Provider value={renderProps}>
                {children}
              </OTPInputContext.Provider>
            )}
            {...props}
          />

          {description && <Description>{description}</Description>}
          {errorMessage && <FieldError errorMessage={errorMessage} />}
        </div>
      </InputOTPContextInstance.Provider>
    )
  },
)
InputOTP.displayName = 'InputOTP'

export interface InputOTPGroupProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'style'> {
  style?: StyleXStyles
}

export const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  InputOTPGroupProps
>(({ style, ...props }, ref) => {
  return <div ref={ref} {...stylex.props(styles.group, style)} {...props} />
})
InputOTPGroup.displayName = 'InputOTPGroup'

export interface InputOTPSlotProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'style'> {
  index: number
  style?: StyleXStyles
}

export const InputOTPSlot = React.forwardRef<HTMLDivElement, InputOTPSlotProps>(
  ({ index, style, ...props }, ref) => {
    const inputOTPContext = React.useContext(OTPInputContext)
    const {
      isInvalid,
      isDisabled,
      size = 'md',
    } = React.useContext(InputOTPContextInstance)

    if (!inputOTPContext) {
      throw new Error('InputOTPSlot must be used within InputOTP')
    }

    const slot = inputOTPContext.slots[index]
    if (!slot) {
      return null
    }

    const { char, hasFakeCaret, isActive } = slot

    return (
      <div
        ref={ref}
        {...stylex.props(
          styles.slot,
          styles[size],
          isActive && styles.slotActive,
          isInvalid && styles.slotInvalid,
          isDisabled && styles.slotDisabled,
          style,
        )}
        {...props}
      >
        {char}
        {hasFakeCaret && (
          <div {...stylex.props(styles.caretContainer)}>
            <div {...stylex.props(styles.caret)} />
          </div>
        )}
      </div>
    )
  },
)
InputOTPSlot.displayName = 'InputOTPSlot'

export interface InputOTPSeparatorProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'style'> {
  style?: StyleXStyles
}

export const InputOTPSeparator = React.forwardRef<
  HTMLDivElement,
  InputOTPSeparatorProps
>(({ style, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="separator"
      {...stylex.props(styles.separator, style)}
      {...props}
    >
      {children || <div {...stylex.props(styles.separatorDot)} />}
    </div>
  )
})
InputOTPSeparator.displayName = 'InputOTPSeparator'
