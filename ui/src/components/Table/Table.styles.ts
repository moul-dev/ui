import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

const pulse = stylex.keyframes({
  '0%': { opacity: 0.4 },
  '50%': { opacity: 0.85 },
  '100%': { opacity: 0.4 },
})

export const styles = stylex.create({
  wrapper: {
    position: 'relative',
    width: '100%',
    overflowX: 'auto',
    backgroundColor: tokens.colorBg,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    borderRadius: tokens.radiusMd,
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    textAlign: 'start',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
    color: tokens.colorFg,
  },
  tableFixed: {
    tableLayout: 'fixed',
  },
  tableAuto: {
    tableLayout: 'auto',
  },
  header: {
    backgroundColor: tokens.colorBgSubtle,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorBorder,
  },
  headerSticky: {
    position: 'sticky',
    insetBlockStart: 0,
    zIndex: 10,
    backgroundColor: tokens.colorBgSubtle,
  },
  footer: {
    backgroundColor: tokens.colorBgSubtle,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorBorder,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorFgSubtle,
  },
  footerSticky: {
    position: 'sticky',
    insetBlockEnd: 0,
    zIndex: 10,
    backgroundColor: tokens.colorBgSubtle,
  },
  body: {
    backgroundColor: tokens.colorBg,
    outline: 'none',
  },
  row: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorBorderSubtle,
    backgroundColor: 'transparent',
    transitionProperty: 'background-color, color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
    ':last-child': {
      borderBottomWidth: 0,
    },
    '@media (prefers-reduced-motion: reduce)': {
      transitionProperty: 'none',
    },
  },
  rowHoverable: {
    ':hover': {
      backgroundColor: tokens.colorNeutral100,
    },
  },
  rowStriped: {
    ':nth-child(even)': {
      backgroundColor: tokens.colorNeutral50,
    },
  },
  rowSelected: {
    backgroundColor: tokens.colorPrimary50,
    color: tokens.colorPrimary700,
  },
  rowInteractive: {
    cursor: 'pointer',
  },
  head: {
    paddingBlock: tokens.spacing3,
    paddingInline: tokens.spacing4,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorFgSubtle,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorBorder,
    verticalAlign: 'middle',
    outline: 'none',
  },
  headBordered: {
    borderInlineEndWidth: '1px',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: tokens.colorBorder,
    ':last-child': {
      borderInlineEndWidth: 0,
    },
  },
  headDense: {
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing3,
    fontSize: tokens.fontSizeXs,
  },
  headSortable: {
    cursor: 'pointer',
    userSelect: 'none',
    ':hover': {
      color: tokens.colorFg,
      backgroundColor: tokens.colorNeutral100,
    },
  },
  headContent: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing2,
    width: '100%',
  },
  headContentAlignLeft: {
    justifyContent: 'flex-start',
  },
  headContentAlignCenter: {
    justifyContent: 'center',
  },
  headContentAlignRight: {
    justifyContent: 'flex-end',
  },
  sortIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: tokens.colorFgSubtle,
    transitionProperty: 'color, transform',
    transitionDuration: '0.15s',
  },
  sortIndicatorActive: {
    color: tokens.colorPrimary500,
  },
  cell: {
    paddingBlock: tokens.spacing3,
    paddingInline: tokens.spacing4,
    color: 'inherit',
    verticalAlign: 'middle',
    outline: 'none',
  },
  cellBordered: {
    borderInlineEndWidth: '1px',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: tokens.colorBorderSubtle,
    ':last-child': {
      borderInlineEndWidth: 0,
    },
  },
  cellDense: {
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing3,
    fontSize: tokens.fontSizeXs,
  },
  cellTabular: {
    fontVariantNumeric: 'tabular-nums',
  },
  alignLeft: {
    textAlign: 'start',
  },
  alignCenter: {
    textAlign: 'center',
  },
  alignRight: {
    textAlign: 'end',
  },
  alignNumeric: {
    textAlign: 'end',
    fontVariantNumeric: 'tabular-nums',
  },
  pinnedLeft: {
    position: 'sticky',
    insetInlineStart: 0,
    zIndex: 2,
    backgroundColor: tokens.colorBg,
  },
  pinnedRight: {
    position: 'sticky',
    insetInlineEnd: 0,
    zIndex: 2,
    backgroundColor: tokens.colorBg,
    boxShadow: `inset 1px 0 0 ${tokens.colorBorderSubtle}`,
  },
  pinnedLeftHead: {
    position: 'sticky',
    insetInlineStart: 0,
    zIndex: 12,
    backgroundColor: tokens.colorBgSubtle,
  },
  pinnedRightHead: {
    position: 'sticky',
    insetInlineEnd: 0,
    zIndex: 12,
    backgroundColor: tokens.colorBgSubtle,
    boxShadow: `inset 1px 0 0 ${tokens.colorBorderSubtle}`,
  },
  caption: {
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing4,
    fontSize: tokens.fontSizeXs,
    color: tokens.colorFgSubtle,
    textAlign: 'start',
    captionSide: 'bottom',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorBorderSubtle,
  },
  captionTop: {
    captionSide: 'top',
    borderTopWidth: 0,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorBorderSubtle,
  },
  emptyCell: {
    paddingBlock: tokens.spacing8,
    paddingInline: tokens.spacing4,
    textAlign: 'center',
    color: tokens.colorFgSubtle,
  },
  skeletonCell: {
    paddingBlock: tokens.spacing3,
    paddingInline: tokens.spacing4,
  },
  skeletonBar: {
    height: '14px',
    width: '100%',
    borderRadius: tokens.radiusSm,
    backgroundColor: tokens.colorNeutral200,
    animationName: pulse,
    animationDuration: '1.6s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
  },
})
