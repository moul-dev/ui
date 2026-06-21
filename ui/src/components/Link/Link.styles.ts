import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    textDecoration: 'none',
    cursor: 'pointer',
    transitionProperty: 'color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
    ':hover': {
      textDecoration: 'underline',
    },
    ':focus-visible': {
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineOffset: '2px',
      outlineColor: tokens.colorBorderFocus,
    },
    '@media (prefers-reduced-motion: reduce)': {
      transitionProperty: 'none',
    },
  },
  primary: {
    color: tokens.colorPrimary500,
    ':hover': {
      color: tokens.colorPrimary600,
    },
    ':active': {
      color: tokens.colorPrimary700,
    },
  },
  secondary: {
    color: tokens.colorNeutral600,
    ':hover': {
      color: tokens.colorNeutral700,
    },
    ':active': {
      color: tokens.colorNeutral800,
    },
  },
  tertiary: {
    color: tokens.colorFg,
    ':hover': {
      color: tokens.colorNeutral600,
    },
    ':active': {
      color: tokens.colorNeutral700,
    },
  },
  outline: {
    color: tokens.colorFg,
    textDecoration: 'underline',
    ':hover': {
      color: tokens.colorNeutral600,
    },
    ':active': {
      color: tokens.colorNeutral700,
    },
  },
  ghost: {
    color: tokens.colorNeutral500,
    ':hover': {
      color: tokens.colorNeutral600,
    },
    ':active': {
      color: tokens.colorNeutral700,
    },
  },
  danger: {
    color: tokens.colorError500,
    ':hover': {
      color: tokens.colorError600,
    },
    ':active': {
      color: tokens.colorError700,
    },
  },
  'danger-soft': {
    color: tokens.colorError300,
    ':hover': {
      color: tokens.colorError400,
    },
    ':active': {
      color: tokens.colorError500,
    },
  },
  isDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    pointerEvents: 'none',
    textDecoration: 'none',
  },
})
