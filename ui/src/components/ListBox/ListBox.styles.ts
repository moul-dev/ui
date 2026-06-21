import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  listbox: {
    padding: tokens.spacing1,
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    borderRadius: tokens.radiusMd,
    backgroundColor: tokens.colorBg,
    fontFamily: tokens.fontFamilyBase,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing3,
    borderRadius: tokens.radiusSm,
    color: tokens.colorFg,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    cursor: 'pointer',
    outline: 'none',
    userSelect: 'none',
    backgroundColor: 'transparent',
    transitionProperty: 'background-color, color',
    transitionDuration: '0.1s',
    transitionTimingFunction: 'ease-in-out',
    '@media (prefers-reduced-motion: reduce)': {
      transitionProperty: 'none',
    },
  },
  itemHovered: {
    backgroundColor: tokens.colorBgSubtle,
  },
  itemFocused: {
    backgroundColor: tokens.colorBgSubtle,
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineOffset: '-2px',
    outlineColor: tokens.colorBorderFocus,
  },
  itemSelected: {
    backgroundColor: tokens.colorPrimary50,
    color: tokens.colorPrimary700,
    fontWeight: tokens.fontWeightMedium,
  },
  itemDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingBlock: tokens.spacing1,
  },
  sectionHeader: {
    fontSize: tokens.fontSizeXs,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorFgSubtle,
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing3,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
})
