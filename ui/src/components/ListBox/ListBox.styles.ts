import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  // ── Container styles ──────────────────────────────────────────────────
  container: {
    position: 'relative',
    outline: 'none',
    overflow: 'auto',
    boxSizing: 'border-box',
    fontFamily: tokens.fontFamilyBase,
    color: tokens.colorFg,
    forcedColorAdjust: 'none',
    maxHeight: 'inherit',
  },

  // Container variants
  bordered: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    backgroundColor: tokens.colorBg,
    borderRadius: tokens.radiusMd,
    boxShadow: tokens.shadowSm,
  },
  flat: {
    borderWidth: '0px',
    backgroundColor: tokens.colorBgSubtle,
    borderRadius: tokens.radiusMd,
  },
  plain: {
    borderWidth: '0px',
    backgroundColor: 'transparent',
    borderRadius: tokens.radiusNone,
  },

  // Container sizing (padding)
  containerSm: {
    padding: tokens.spacing1,
  },
  containerMd: {
    padding: tokens.spacing1,
  },
  containerLg: {
    padding: tokens.spacing2,
  },

  // Container layouts
  stackVertical: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  stackHorizontal: {
    display: 'flex',
    flexDirection: 'row',
    gap: tokens.spacing2,
    overflowX: 'auto',
  },
  grid: {
    display: 'grid',
    gap: tokens.spacing2,
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  },

  // Container focus / drag states
  containerFocusVisible: {
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineColor: tokens.colorBorderFocus,
    outlineOffset: '-1px',
  },
  containerDropTarget: {
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineColor: tokens.colorPrimary600,
    outlineOffset: '-1px',
    backgroundColor: tokens.colorPrimary50,
  },

  // Empty state container
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing6,
    color: tokens.colorFgSubtle,
    fontSize: tokens.fontSizeSm,
    fontStyle: 'italic',
  },

  // ── Item styles ───────────────────────────────────────────────────────
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    cursor: 'pointer',
    outline: 'none',
    userSelect: 'none',
    boxSizing: 'border-box',
    fontFamily: tokens.fontFamilyBase,
    color: tokens.colorFg,
    backgroundColor: 'transparent',
    transitionProperty: 'background-color, color, border-color, box-shadow',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
    textDecoration: 'none',
  },

  // Item sizing
  itemSm: {
    minHeight: '28px',
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    borderRadius: tokens.radiusSm,
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
    gap: tokens.spacing2,
  },
  itemMd: {
    minHeight: '36px',
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing3,
    borderRadius: tokens.radiusSm,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
    gap: tokens.spacing2,
  },
  itemLg: {
    minHeight: '44px',
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing4,
    borderRadius: tokens.radiusMd,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    gap: tokens.spacing3,
  },

  // Item states
  itemHovered: {
    backgroundColor: tokens.colorBgSubtle,
  },
  itemFocused: {
    backgroundColor: tokens.colorBgSubtle,
  },
  itemFocusVisible: {
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineColor: tokens.colorBorderFocus,
    outlineOffset: '-2px',
    zIndex: 1,
  },
  itemPressed: {
    backgroundColor: tokens.colorPrimary100,
  },
  itemSelected: {
    backgroundColor: tokens.colorPrimary50,
    color: tokens.colorPrimary700,
    fontWeight: tokens.fontWeightMedium,
  },
  itemSelectedFocusVisible: {
    outlineColor: tokens.colorPrimary700,
  },
  itemDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  itemDragging: {
    opacity: 0.5,
  },
  itemDropTarget: {
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineColor: tokens.colorPrimary600,
    outlineOffset: '-1px',
    backgroundColor: tokens.colorPrimary100,
  },

  // ── Item Content Sub-elements ─────────────────────────────────────────
  itemContent: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: tokens.spacing2,
  },
  itemTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    textAlign: 'start',
  },
  itemLabel: {
    fontWeight: tokens.fontWeightMedium,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemDescription: {
    fontSize: tokens.fontSizeXs,
    color: tokens.colorFgSubtle,
    lineHeight: tokens.lineHeightXs,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemCheckmark: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: tokens.colorPrimary600,
    marginInlineStart: tokens.spacing2,
  },

  // ── Section & Header styles ───────────────────────────────────────────
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  sectionHeader: {
    fontSize: tokens.fontSizeXs,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorFgSubtle,
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing3,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: tokens.colorBg,
    userSelect: 'none',
    cursor: 'default',
  },
  sectionHeaderSticky: {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    backgroundColor: tokens.colorBgElevated,
    borderBlockEndWidth: '1px',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: tokens.colorBorderSubtle,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },

  // ── Load More Item ────────────────────────────────────────────────────
  loadMore: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBlock: tokens.spacing3,
    width: '100%',
    minHeight: '36px',
    color: tokens.colorFgSubtle,
  },

  // ── Drop Indicator ────────────────────────────────────────────────────
  dropIndicator: {
    position: 'relative',
    boxSizing: 'border-box',
    outline: 'none',
    zIndex: 5,
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
  },
  dropIndicatorHorizontal: {
    width: '100%',
    height: '2px',
    marginBlock: '-1px',
    backgroundColor: tokens.colorPrimary600,
    borderRadius: tokens.radiusFull,
  },
  dropIndicatorVertical: {
    height: '100%',
    width: '2px',
    marginInline: '-1px',
    backgroundColor: tokens.colorPrimary600,
    borderRadius: tokens.radiusFull,
  },
  dropIndicatorTarget: {
    opacity: 1,
  },
})
