/* eslint-disable @stylexjs/valid-styles */
import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: tokens.fontWeightMedium,
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color, box-shadow, transform',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
    ':active': {
      transform: {
        default: 'scale(0.98)',
        '@media (prefers-reduced-motion: reduce)': 'none',
      },
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
  sm: {
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    borderRadius: tokens.radiusSm,
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
  },
  md: {
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing3,
    borderRadius: tokens.radiusMd,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
  },
  lg: {
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing4,
    borderRadius: tokens.radiusMd,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
  },
  primary: {
    backgroundColor: tokens.colorPrimary500,
    color: tokens.colorFgOnPrimary,
    borderStyle: 'none',
    boxShadow: tokens.shadowSm,
    ':hover': {
      backgroundColor: tokens.colorPrimary600,
    },
    ':active': {
      backgroundColor: tokens.colorPrimary700,
    },
  },
  secondary: {
    backgroundColor: tokens.colorNeutral100,
    color: tokens.colorPrimary500,
    borderStyle: 'none',
    boxShadow: tokens.shadowSm,
    ':hover': {
      backgroundColor: tokens.colorNeutral200,
    },
    ':active': {
      backgroundColor: tokens.colorNeutral300,
    },
  },
  tertiary: {
    backgroundColor: tokens.colorNeutral100,
    color: tokens.colorFg,
    borderStyle: 'none',
    boxShadow: tokens.shadowSm,
    ':hover': {
      backgroundColor: tokens.colorNeutral200,
    },
    ':active': {
      backgroundColor: tokens.colorNeutral300,
    },
  },
  outline: {
    backgroundColor: tokens.colorBg,
    color: tokens.colorFg,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: tokens.colorBorder,
    boxShadow: 'none',
    ':hover': {
      backgroundColor: tokens.colorNeutral50,
      borderColor: tokens.colorNeutral400,
    },
    ':active': {
      backgroundColor: tokens.colorNeutral100,
    },
  },
  ghost: {
    backgroundColor: 'transparent',
    color: tokens.colorFg,
    borderStyle: 'none',
    boxShadow: 'none',
    ':hover': {
      backgroundColor: tokens.colorNeutral200,
    },
    ':active': {
      backgroundColor: tokens.colorNeutral200,
    },
  },
  danger: {
    backgroundColor: tokens.colorError500,
    color: tokens.colorFgOnPrimary,
    borderStyle: 'none',
    boxShadow: tokens.shadowSm,
    ':hover': {
      backgroundColor: tokens.colorError600,
    },
    ':active': {
      backgroundColor: tokens.colorError700,
    },
  },
  'danger-soft': {
    backgroundColor: tokens.colorError300,
    color: tokens.colorError700,
    borderStyle: 'none',
    boxShadow: tokens.shadowSm,
    ':hover': {
      backgroundColor: tokens.colorError400,
    },
    ':active': {
      backgroundColor: tokens.colorError500,
    },
  },
  isPending: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  isDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
})
