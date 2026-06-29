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
  primarySelected: {
    backgroundColor: tokens.colorFg,
    color: tokens.colorBg,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: tokens.colorFg,
    ':hover': {
      backgroundColor: tokens.colorNeutral800,
      borderColor: tokens.colorNeutral800,
    },
    ':active': {
      backgroundColor: tokens.colorNeutral700,
      borderColor: tokens.colorNeutral700,
    },
  },
  secondary: {
    backgroundColor: 'transparent',
    color: tokens.colorFg,
    borderStyle: 'none',
    boxShadow: 'none',
    ':hover': {
      backgroundColor: tokens.colorNeutral100,
    },
    ':active': {
      backgroundColor: tokens.colorNeutral200,
    },
  },
  secondarySelected: {
    backgroundColor: tokens.colorNeutral200,
    color: tokens.colorFg,
    borderStyle: 'none',
    ':hover': {
      backgroundColor: tokens.colorNeutral300,
    },
    ':active': {
      backgroundColor: tokens.colorNeutral400,
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
    transitionProperty: 'color',
    ':hover': {
      backgroundColor: 'transparent',
      color: tokens.colorFg,
    },
    ':active': {
      transform: 'none',
    },
  },
  animatedItemSm: {
    borderRadius: `calc(${tokens.radiusSm} - 3px)`,
  },
  animatedItemMd: {
    borderRadius: `calc(${tokens.radiusMd} - 3px)`,
  },
  animatedItemLg: {
    borderRadius: `calc(${tokens.radiusMd} - 3px)`,
  },
  animatedItemSelectedPrimary: {
    color: tokens.colorFg,
    backgroundColor: 'transparent',
    ':hover': {
      backgroundColor: 'transparent',
      color: tokens.colorFg,
    },
  },
  animatedItemSelectedSecondary: {
    color: tokens.colorFg,
    backgroundColor: 'transparent',
    ':hover': {
      backgroundColor: 'transparent',
      color: tokens.colorFg,
    },
  },
  selectionIndicator: {
    position: 'absolute',
    inset: 0,
    zIndex: -1,
    transitionProperty: 'translate, width, height',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease-in-out',
    pointerEvents: 'none',
    '@media (prefers-reduced-motion: reduce)': {
      transitionProperty: 'none',
    },
  },
  selectionIndicatorSm: {
    borderRadius: `calc(${tokens.radiusSm} - 3px)`,
  },
  selectionIndicatorMd: {
    borderRadius: `calc(${tokens.radiusMd} - 3px)`,
  },
  selectionIndicatorLg: {
    borderRadius: `calc(${tokens.radiusMd} - 3px)`,
  },
  selectionIndicatorPrimary: {
    backgroundColor: tokens.colorBg,
    boxShadow: tokens.shadowSm,
  },
  selectionIndicatorSecondary: {
    backgroundColor: tokens.colorNeutral200,
  },
  squareSm: {
    paddingInline: tokens.spacing1,
    aspectRatio: '1/1',
  },
  squareMd: {
    paddingInline: tokens.spacing2,
    aspectRatio: '1/1',
  },
  squareLg: {
    paddingInline: tokens.spacing2,
    aspectRatio: '1/1',
  },
})
