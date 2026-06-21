import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing2,
    width: '100%',
  },
  tabList: {
    display: 'flex',
    flexDirection: 'row',
    borderBlockEndWidth: '1px',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: tokens.colorBorder,
    gap: tokens.spacing4,
    padding: 0,
    margin: 0,
    listStyleType: 'none',
  },
  tab: {
    cursor: 'pointer',
    outline: 'none',
    userSelect: 'none',
    color: tokens.colorFgSubtle,
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing3,
    borderBlockEndWidth: '2px',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: 'transparent',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    fontWeight: tokens.fontWeightMedium,
    backgroundColor: 'transparent',
    borderTopStyle: 'none',
    borderInlineStartStyle: 'none',
    borderInlineEndStyle: 'none',
    transitionProperty: 'color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
    ':hover': {
      color: tokens.colorFg,
    },
    ':focus-visible': {
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineOffset: '-2px',
      outlineColor: tokens.colorBorderFocus,
    },
    '@media (prefers-reduced-motion: reduce)': {
      transitionProperty: 'none',
    },
  },
  tabListTertiary: {
    borderBlockEndStyle: 'none',
  },
  tabPrimarySelected: {
    color: tokens.colorPrimary500,
    borderBlockEndColor: tokens.colorPrimary500,
  },
  tabSecondarySelected: {
    color: tokens.colorFg,
    borderBlockEndColor: tokens.colorFg,
  },
  tabTertiarySelected: {
    color: tokens.colorFg,
    borderBlockEndColor: 'transparent',
  },
  tabDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    ':hover': {
      color: tokens.colorFgSubtle,
    },
  },

  tabPanel: {
    paddingBlock: tokens.spacing4,
    paddingInline: tokens.spacing4,
    color: tokens.colorFg,
    backgroundColor: tokens.colorBgElevated,
    borderRadius: tokens.radiusMd,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    marginBlockStart: tokens.spacing2,
    outline: 'none',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    ':focus-visible': {
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineOffset: '2px',
      outlineColor: tokens.colorBorderFocus,
    },
  },
})
