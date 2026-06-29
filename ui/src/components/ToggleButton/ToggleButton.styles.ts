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
})
