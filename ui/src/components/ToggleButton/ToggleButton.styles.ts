/* eslint-disable @stylexjs/valid-styles */
import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing4,
    borderRadius: tokens.radiusMd,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    fontWeight: tokens.fontWeightMedium,
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color, color, transform',
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
  primary: {
    backgroundColor: tokens.colorNeutral100,
    color: tokens.colorPrimary500,
    borderStyle: 'none',
    boxShadow: tokens.shadowSm,
    ':hover': {
      backgroundColor: tokens.colorNeutral200,
    },
  },
  primarySelected: {
    backgroundColor: tokens.colorPrimary500,
    color: tokens.colorFgOnPrimary,
    borderStyle: 'none',
    ':hover': {
      backgroundColor: tokens.colorPrimary600,
    },
    ':active': {
      backgroundColor: tokens.colorPrimary700,
    },
  },
  secondary: {
    backgroundColor: tokens.colorBgSubtle,
    color: tokens.colorFg,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    boxShadow: tokens.shadowSm,
    ':hover': {
      backgroundColor: tokens.colorBgElevated,
      borderColor: tokens.colorBorderFocus,
    },
  },
  secondarySelected: {
    backgroundColor: tokens.colorPrimary500,
    color: tokens.colorFgOnPrimary,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorPrimary500,
    ':hover': {
      backgroundColor: tokens.colorPrimary600,
      borderColor: tokens.colorPrimary600,
    },
    ':active': {
      backgroundColor: tokens.colorPrimary700,
      borderColor: tokens.colorPrimary700,
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
  },
  tertiarySelected: {
    backgroundColor: tokens.colorNeutral700,
    color: tokens.colorBg,
    borderStyle: 'none',
    ':hover': {
      backgroundColor: tokens.colorNeutral800,
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
  },
  outlineSelected: {
    backgroundColor: tokens.colorFg,
    color: tokens.colorBg,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: tokens.colorFg,
    ':hover': {
      backgroundColor: tokens.colorNeutral800,
      borderColor: tokens.colorNeutral800,
    },
  },
  ghost: {
    backgroundColor: 'transparent',
    color: tokens.colorFg,
    borderStyle: 'none',
    boxShadow: 'none',
    ':hover': {
      backgroundColor: tokens.colorNeutral100,
    },
  },
  ghostSelected: {
    backgroundColor: tokens.colorNeutral100,
    color: tokens.colorFg,
    borderStyle: 'none',
    ':hover': {
      backgroundColor: tokens.colorNeutral200,
    },
  },
  danger: {
    backgroundColor: tokens.colorNeutral100,
    color: tokens.colorError500,
    borderStyle: 'none',
    boxShadow: tokens.shadowSm,
    ':hover': {
      backgroundColor: tokens.colorNeutral200,
    },
  },
  dangerSelected: {
    backgroundColor: tokens.colorError500,
    color: tokens.colorFgOnPrimary,
    borderStyle: 'none',
    ':hover': {
      backgroundColor: tokens.colorError600,
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
  },
  'danger-softSelected': {
    backgroundColor: tokens.colorError500,
    color: tokens.colorFgOnPrimary,
    borderStyle: 'none',
    ':hover': {
      backgroundColor: tokens.colorError600,
    },
  },
  isDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    boxShadow: 'none',
    pointerEvents: 'none',
  },
  groupItem: {
    position: 'relative',
    zIndex: 1,
  },
  groupItemActive: {
    zIndex: 2,
  },
  groupItemDisabled: {
    zIndex: 0,
  },
  groupHorizontal: {
    borderRadius: 0,
    marginInlineStart: '-1px',
    ':first-child': {
      borderTopLeftRadius: tokens.radiusMd,
      borderBottomLeftRadius: tokens.radiusMd,
      marginInlineStart: 0,
    },
    ':last-child': {
      borderTopRightRadius: tokens.radiusMd,
      borderBottomRightRadius: tokens.radiusMd,
    },
  },
  groupVertical: {
    borderRadius: 0,
    marginBlockStart: '-1px',
    ':first-child': {
      borderTopLeftRadius: tokens.radiusMd,
      borderTopRightRadius: tokens.radiusMd,
      marginBlockStart: 0,
    },
    ':last-child': {
      borderBottomLeftRadius: tokens.radiusMd,
      borderBottomRightRadius: tokens.radiusMd,
    },
  },
  animatedItem: {
    backgroundColor: 'transparent',
    borderStyle: 'none',
    boxShadow: 'none',
    color: tokens.colorFgSubtle,
    borderRadius: tokens.radiusSm,
    transitionProperty: 'color',
    ':hover': {
      backgroundColor: 'transparent',
      color: tokens.colorFg,
    },
    ':active': {
      transform: 'none',
    },
  },
  animatedItemSelected: {
    color: tokens.colorFg,
    backgroundColor: 'transparent',
    ':hover': {
      backgroundColor: 'transparent',
      color: tokens.colorFg,
    },
  },
  animatedItemSelectedPrimary: {
    color: tokens.colorFgOnPrimary,
    backgroundColor: 'transparent',
    ':hover': {
      backgroundColor: 'transparent',
      color: tokens.colorFgOnPrimary,
    },
  },
  selectionIndicator: {
    position: 'absolute',
    inset: 0,
    zIndex: -1,
    borderRadius: tokens.radiusSm,
    transitionProperty: 'translate, width, height',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease-in-out',
    pointerEvents: 'none',
    '@media (prefers-reduced-motion: reduce)': {
      transitionProperty: 'none',
    },
  },
  selectionIndicatorPrimary: {
    backgroundColor: tokens.colorPrimary500,
  },
  selectionIndicatorSecondary: {
    backgroundColor: tokens.colorBgElevated,
    boxShadow: tokens.shadowSm,
  },
  selectionIndicatorTertiary: {
    backgroundColor: tokens.colorNeutral200,
  },
})
