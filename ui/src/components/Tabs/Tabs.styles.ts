import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  // ── Container styles ──────────────────────────────────────────────────
  container: {
    display: 'flex',
    gap: tokens.spacing2,
    color: tokens.colorFg,
    maxWidth: '100%',
  },
  containerHorizontal: {
    flexDirection: 'column',
  },
  containerVertical: {
    flexDirection: 'row',
    width: '100%',
  },

  // ── TabList styles ────────────────────────────────────────────────────
  tabList: {
    display: 'flex',
    maxWidth: '100%',
    padding: 0,
    margin: 0,
    listStyleType: 'none',
  },
  tabListHorizontal: {
    flexDirection: 'row',
    borderBlockEndWidth: '1px',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: tokens.colorBorder,
    overflowX: 'auto',
    overflowY: 'clip',
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': {
      display: 'none',
    },
  },
  tabListVertical: {
    flexDirection: 'column',
    borderInlineEndWidth: '1px',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: tokens.colorBorder,
  },
  tabListTertiary: {
    display: 'inline-flex',
    alignItems: 'center',
    width: 'fit-content',
    maxWidth: '100%',
    backgroundColor: tokens.colorBgSubtle,
    borderRadius: tokens.radiusMd,
    padding: tokens.spacing1,
    gap: tokens.spacing1,
    borderBlockStartWidth: '1px',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: tokens.colorBorder,
    borderBlockEndWidth: '1px',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: tokens.colorBorder,
    borderInlineStartWidth: '1px',
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: tokens.colorBorder,
    borderInlineEndWidth: '1px',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: tokens.colorBorder,
  },

  // ── Tab styles ────────────────────────────────────────────────────────
  tab: {
    position: 'relative',
    cursor: 'pointer',
    outline: 'none',
    userSelect: 'none',
    color: tokens.colorFgSubtle,
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing3,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    fontWeight: tokens.fontWeightMedium,
    backgroundColor: 'transparent',
    borderStyle: 'none',
    transitionProperty: 'color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    isolation: 'isolate',
    WebkitTapHighlightColor: 'transparent',
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
  tabPrimary: {
    ':hover': {
      color: tokens.colorPrimary500,
    },
  },
  tabSecondary: {
    ':hover': {
      color: tokens.colorFg,
    },
  },
  tabTertiary: {
    borderRadius: tokens.radiusSm,
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing3,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
    ':hover': {
      color: tokens.colorFg,
    },
  },
  tabPrimarySelected: {
    color: tokens.colorPrimary500,
  },
  tabSecondarySelected: {
    color: tokens.colorFg,
  },
  tabTertiarySelected: {
    color: tokens.colorFg,
    fontWeight: tokens.fontWeightSemibold,
  },
  tabDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    ':hover': {
      color: tokens.colorFgSubtle,
    },
  },

  // ── SelectionIndicator styles ──────────────────────────────────────────
  selectionIndicator: {
    position: 'absolute',
    transitionProperty: 'translate, width, height',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease-in-out',
    borderRadius: tokens.radiusSm,
    pointerEvents: 'none',
    '@media (prefers-reduced-motion: reduce)': {
      transitionProperty: 'none',
    },
  },
  selectionIndicatorHorizontal: {
    insetInlineStart: 0,
    insetBlockEnd: 0,
    width: '100%',
    height: '3px',
  },
  selectionIndicatorVertical: {
    insetBlockStart: 0,
    insetInlineEnd: 0,
    height: '100%',
    width: '3px',
  },
  selectionIndicatorPrimary: {
    backgroundColor: tokens.colorPrimary500,
  },
  selectionIndicatorSecondary: {
    backgroundColor: tokens.colorFg,
  },
  selectionIndicatorTertiary: {
    insetBlockStart: 0,
    insetInlineStart: 0,
    width: '100%',
    height: '100%',
    backgroundColor: tokens.colorBgElevated,
    borderRadius: tokens.radiusSm,
    boxShadow: tokens.shadowSm,
    borderBlockStartWidth: '1px',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: tokens.colorBorderGlass,
    borderBlockEndWidth: '1px',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: tokens.colorBorderGlass,
    borderInlineStartWidth: '1px',
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: tokens.colorBorderGlass,
    borderInlineEndWidth: '1px',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: tokens.colorBorderGlass,
    boxSizing: 'border-box',
    zIndex: -1,
    transitionProperty: 'translate, width, height',
    transitionDuration: '0.25s',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },

  // ── TabPanels styles ──────────────────────────────────────────────────
  tabPanels: {
    position: 'relative',
    overflow: 'clip',
  },
  tabPanelsFlex: {
    flex: 1,
  },

  // ── TabPanel styles ───────────────────────────────────────────────────
  tabPanel: {
    paddingBlock: tokens.spacing4,
    paddingInline: tokens.spacing4,
    color: tokens.colorFg,
    outline: 'none',
    boxSizing: 'border-box',
    transitionProperty: 'opacity',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease-in-out',
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
  tabPanelEntering: {
    opacity: 0,
  },
  tabPanelExiting: {
    opacity: 0,
    position: 'absolute',
    insetBlockStart: 0,
    insetInlineStart: 0,
    width: '100%',
  },
})
