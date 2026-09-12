import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing2,
    width: '100%',
    position: 'relative',
    boxSizing: 'border-box',
  },

  // ── ListBox ────────────────────────────────────────────────────────
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: tokens.spacing1,
    outline: 'none',
    backgroundColor: tokens.colorBg,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    borderRadius: tokens.radiusMd,
    boxShadow: tokens.shadowSm,
    boxSizing: 'border-box',
    overflowY: 'auto',
    maxHeight: '300px',
  },
  listSm: {
    borderRadius: tokens.radiusSm,
    padding: tokens.spacing1,
  },
  listMd: {
    borderRadius: tokens.radiusMd,
    padding: tokens.spacing1,
  },
  listLg: {
    borderRadius: tokens.radiusLg,
    padding: tokens.spacing2,
  },
  listBorderless: {
    borderWidth: 0,
    boxShadow: 'none',
    backgroundColor: 'transparent',
    padding: 0,
    maxHeight: 'none',
  },

  // ── Item ───────────────────────────────────────────────────────────
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing2,
    cursor: 'pointer',
    outline: 'none',
    userSelect: 'none',
    backgroundColor: 'transparent',
    color: tokens.colorFg,
    fontFamily: tokens.fontFamilyBase,
    transitionProperty: 'background-color, color',
    transitionDuration: '0.12s',
    transitionTimingFunction: 'ease-in-out',
    boxSizing: 'border-box',
    width: '100%',
  },
  itemSm: {
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    borderRadius: tokens.radiusSm,
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
    minHeight: '28px',
  },
  itemMd: {
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing3,
    borderRadius: tokens.radiusSm,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
    minHeight: '36px',
  },
  itemLg: {
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing4,
    borderRadius: tokens.radiusMd,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    minHeight: '44px',
  },
  itemHovered: {
    backgroundColor: tokens.colorBgSubtle,
  },
  itemFocused: {
    backgroundColor: tokens.colorBgSubtle,
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

  // ── Item Content & Slots ──────────────────────────────────────────
  itemIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: tokens.colorFgSubtle,
  },
  itemIconSm: {
    width: '14px',
    height: '14px',
  },
  itemIconMd: {
    width: '16px',
    height: '16px',
  },
  itemIconLg: {
    width: '20px',
    height: '20px',
  },
  itemContent: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minWidth: 0,
    textAlign: 'start',
  },
  itemLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemDescription: {
    fontSize: tokens.fontSizeXs,
    color: tokens.colorFgSubtle,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemEnd: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing2,
    flexShrink: 0,
    marginInlineStart: 'auto',
  },
  checkIcon: {
    width: '14px',
    height: '14px',
    color: tokens.colorPrimary600,
  },

  // ── Section ────────────────────────────────────────────────────────
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingBlock: tokens.spacing1,
  },
  sectionHeader: {
    fontSize: tokens.fontSizeXs,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorFgSubtle,
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing3,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    userSelect: 'none',
  },

  // ── Empty State ────────────────────────────────────────────────────
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBlock: tokens.spacing6,
    paddingInline: tokens.spacing4,
    color: tokens.colorFgSubtle,
    fontSize: tokens.fontSizeSm,
    textAlign: 'center',
  },

  // ── Popover ────────────────────────────────────────────────────────
  popover: {
    backgroundColor: tokens.colorBgElevated,
    boxShadow: tokens.shadowMd,
    borderRadius: tokens.radiusMd,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    zIndex: tokens.zIndexDropdown,
    outline: 'none',
    minWidth: 'var(--trigger-width)',
    maxHeight: '320px',
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  popoverSm: {
    borderRadius: tokens.radiusSm,
  },
  popoverMd: {
    borderRadius: tokens.radiusMd,
  },
  popoverLg: {
    borderRadius: tokens.radiusLg,
  },
})
