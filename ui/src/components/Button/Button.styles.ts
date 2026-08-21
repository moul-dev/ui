/* eslint-disable @stylexjs/valid-styles */
import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing2,
    fontWeight: tokens.fontWeightMedium,
    cursor: 'pointer',
    boxSizing: 'border-box',
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
    height: `calc(${tokens.spacing1} * 2 + ${tokens.lineHeightXs})`,
    paddingBlock: 0,
    paddingInline: tokens.spacing2,
    borderRadius: tokens.radiusSm,
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
  },
  md: {
    height: `calc(${tokens.spacing2} * 2 + ${tokens.lineHeightSm})`,
    paddingBlock: 0,
    paddingInline: tokens.spacing3,
    borderRadius: tokens.radiusMd,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
  },
  lg: {
    height: `calc(${tokens.spacing2} * 2 + ${tokens.lineHeightMd})`,
    paddingBlock: 0,
    paddingInline: tokens.spacing4,
    borderRadius: tokens.radiusMd,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
  },
  iconSm: {
    width: `calc(${tokens.spacing1} * 2 + ${tokens.lineHeightXs})`,
    paddingInline: 0,
    paddingBlock: 0,
  },
  iconMd: {
    width: `calc(${tokens.spacing2} * 2 + ${tokens.lineHeightSm})`,
    paddingInline: 0,
    paddingBlock: 0,
  },
  iconLg: {
    width: `calc(${tokens.spacing2} * 2 + ${tokens.lineHeightMd})`,
    paddingInline: 0,
    paddingBlock: 0,
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
