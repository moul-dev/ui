import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing3,
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeSm,
    flexWrap: 'wrap',
  },
  content: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing1,
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  item: {
    display: 'inline-flex',
    alignItems: 'center',
    margin: 0,
    padding: 0,
  },

  // Button / Link Base
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: tokens.fontFamilyBase,
    fontWeight: tokens.fontWeightMedium,
    cursor: 'pointer',
    userSelect: 'none',
    outline: 'none',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    transitionProperty: 'background-color, border-color, color, box-shadow',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
    textDecoration: 'none',
    color: tokens.colorFg,
    backgroundColor: 'transparent',
  },
  linkHover: {
    backgroundColor: tokens.colorNeutral100,
  },
  linkFocus: {
    boxShadow: `0 0 0 2px ${tokens.colorBg}, 0 0 0 4px ${tokens.colorBorderFocus}`,
  },
  linkDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },

  // Sizes
  linkSm: {
    minWidth: '28px',
    height: '28px',
    paddingInline: tokens.spacing1,
    fontSize: tokens.fontSizeXs,
  },
  linkMd: {
    minWidth: '36px',
    height: '36px',
    paddingInline: tokens.spacing2,
    fontSize: tokens.fontSizeSm,
  },
  linkLg: {
    minWidth: '44px',
    height: '44px',
    paddingInline: tokens.spacing3,
    fontSize: tokens.fontSizeMd,
  },

  // Shapes
  shapeRounded: {
    borderRadius: tokens.radiusMd,
  },
  shapeCircle: {
    borderRadius: tokens.radiusFull,
  },
  shapeSquare: {
    borderRadius: tokens.radiusNone,
  },

  // Variants
  variantGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  variantOutline: {
    backgroundColor: 'transparent',
    borderColor: tokens.colorBorder,
  },
  variantSubtle: {
    backgroundColor: tokens.colorBgSubtle,
    borderColor: 'transparent',
  },

  // Active / Selected page
  linkActive: {
    backgroundColor: tokens.colorPrimary500,
    borderColor: tokens.colorPrimary500,
    color: tokens.colorFgOnPrimary,
    fontWeight: tokens.fontWeightBold,
  },
  linkActiveOutline: {
    backgroundColor: tokens.colorPrimary50,
    borderColor: tokens.colorPrimary500,
    color: tokens.colorPrimary600,
    fontWeight: tokens.fontWeightBold,
  },

  // Ellipsis
  ellipsis: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '28px',
    height: '28px',
    color: tokens.colorFgSubtle,
    fontSize: tokens.fontSizeSm,
    userSelect: 'none',
  },

  // Navigation Arrows
  navButtonText: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing1,
  },

  // Summary
  summary: {
    color: tokens.colorFgSubtle,
    fontSize: tokens.fontSizeSm,
    whiteSpace: 'nowrap',
  },

  // Page Size Selector Container
  pageSizeContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing2,
    color: tokens.colorFgSubtle,
    fontSize: tokens.fontSizeSm,
    whiteSpace: 'nowrap',
  },
  pageSizeSelect: {
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeSm,
    color: tokens.colorFg,
    backgroundColor: tokens.colorBgElevated,
    borderColor: tokens.colorBorder,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: tokens.radiusMd,
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    outline: 'none',
    cursor: 'pointer',
  },
})
