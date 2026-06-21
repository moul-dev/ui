'use client'
import * as stylex from '@stylexjs/stylex'
import {
  Button as RACButton,
  type ButtonProps as RACButtonProps,
} from 'react-aria-components'

// Define StyleX styles
const styles = stylex.create({
  base: {
    fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
    fontSize: '0.95rem',
    fontWeight: 600,
    padding: '12px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    position: 'relative',
    textDecoration: 'none',
  },
  primary: {
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow:
      '0 4px 20px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
  },
  secondary: {
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#f3f4f6',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
  },
  // Interactive States
  primaryHovered: {
    transform: 'translateY(-2px)',
    boxShadow:
      '0 8px 25px rgba(99, 102, 241, 0.45), 0 0 15px rgba(168, 85, 247, 0.3)',
    filter: 'brightness(1.05)',
  },
  secondaryHovered: {
    transform: 'translateY(-2px)',
    background: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    boxShadow:
      '0 8px 20px rgba(255, 255, 255, 0.1), 0 4px 10px rgba(0, 0, 0, 0.2)',
  },
  pressed: {
    transform: 'translateY(1px)',
    filter: 'brightness(0.95)',
  },
  focused: {
    boxShadow:
      '0 0 0 3px rgba(168, 85, 247, 0.6), 0 4px 20px rgba(99, 102, 241, 0.3)',
  },
  disabled: {
    background: 'rgba(255, 255, 255, 0.04)',
    color: 'rgba(255, 255, 255, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
  },
})

export interface ButtonProps extends RACButtonProps {
  variant?: 'primary' | 'secondary'
}

export function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <RACButton
      {...props}
      style={{ outline: 'none' }} // Remove default browser focus outline
      className={(state) => {
        // Resolve StyleX classnames based on state
        const stylexProps = stylex.props(
          styles.base,
          variant === 'primary' ? styles.primary : styles.secondary,
          state.isHovered &&
            (variant === 'primary'
              ? styles.primaryHovered
              : styles.secondaryHovered),
          state.isPressed && styles.pressed,
          state.isFocusVisible && styles.focused,
          state.isDisabled && styles.disabled,
        )

        // Combine custom classNames if provided
        return `${stylexProps.className || ''} ${typeof className === 'function' ? className(state) : className || ''}`.trim()
      }}
    >
      {children}
    </RACButton>
  )
}
