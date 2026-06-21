import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    textAlign: 'start',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    color: tokens.colorFg,
  },
  header: {
    backgroundColor: tokens.colorBgSubtle,
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorBorder,
  },
  column: {
    paddingBlock: tokens.spacing3,
    paddingInline: tokens.spacing4,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorFg,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorBorder,
    textAlign: 'start',
    outline: 'none',
    ':focus-visible': {
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineOffset: '-2px',
      outlineColor: tokens.colorBorderFocus,
    },
  },
  body: {
    outline: 'none',
  },
  row: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorBorder,
    backgroundColor: tokens.colorBg,
    outline: 'none',
    cursor: 'default',
    transitionProperty: 'background-color, color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
    '@media (prefers-reduced-motion: reduce)': {
      transitionProperty: 'none',
    },
  },
  rowHovered: {
    backgroundColor: tokens.colorBgSubtle,
  },
  rowSelected: {
    backgroundColor: tokens.colorPrimary50,
    color: tokens.colorPrimary700,
  },
  rowFocused: {
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineOffset: '-2px',
    outlineColor: tokens.colorBorderFocus,
  },
  cell: {
    paddingBlock: tokens.spacing3,
    paddingInline: tokens.spacing4,
    color: 'inherit',
    outline: 'none',
    ':focus-visible': {
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineOffset: '-2px',
      outlineColor: tokens.colorBorderFocus,
    },
  },
})
