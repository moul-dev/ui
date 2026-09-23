/* eslint-disable @stylexjs/valid-styles */
import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  // ── Sidebar Container ───────────────────────────────────────────────
  // ── Sidebar Container ───────────────────────────────────────────────
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    boxSizing: 'border-box',
    overflow: 'hidden',
    position: 'relative',
    fontFamily: tokens.fontFamilyBase,
    color: tokens.colorFg,
  },
  sidebarResponsive: {
    display: {
      default: 'flex',
      '@media (max-width: 768px)': 'none',
    },
  },

  // Sidebar Layout variants (framed vs flush/unframed)
  sidebarFramed: {
    height: {
      default: `calc(100% - ${tokens.spacing3} * 2)`,
      '@media (max-width: 768px)': 'auto',
    },
    marginBlock: {
      default: tokens.spacing3,
      '@media (max-width: 768px)': 0,
    },
    marginInlineStart: {
      default: tokens.spacing3,
      '@media (max-width: 768px)': 0,
    },
    marginInlineEnd: 0,
    borderRadius: {
      default: tokens.radiusLg,
      '@media (max-width: 768px)': 0,
    },
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  sidebarUnframed: {
    height: {
      default: `calc(100% - ${tokens.spacing3} * 2)`,
      '@media (max-width: 768px)': 'auto',
    },
    marginBlock: {
      default: tokens.spacing3,
      '@media (max-width: 768px)': 0,
    },
    marginInlineStart: {
      default: tokens.spacing3,
      '@media (max-width: 768px)': 0,
    },
    marginInlineEnd: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderStyle: 'none',
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },

  // Width variants
  expanded: {
    width: 'var(--sidebar-width, 260px)',
  },
  collapsed: {
    width: 'var(--sidebar-collapsed-width, 72px)',
  },

  // Style variants (Solid and Glassmorphic)
  solid: {
    backgroundColor: tokens.colorBgSubtle,
    borderColor: tokens.colorBorder,
  },
  glass: {
    backgroundColor: tokens.colorBgSubtle,
    borderColor: tokens.colorBorder,
    '@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))':
      {
        backgroundColor: tokens.colorBgGlass,
        borderColor: tokens.colorBorderGlass,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
  },

  // ── Sidebar Header ──────────────────────────────────────────────────
  header: {
    display: 'flex',
    alignItems: 'center',
    paddingBlock: tokens.spacing4,
    paddingInline: tokens.spacing4,
    minHeight: '64px',
    boxSizing: 'border-box',
    gap: tokens.spacing3,
  },
  headerDense: {
    minHeight: '48px',
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing3,
    gap: tokens.spacing2,
  },
  headerCollapsed: {
    justifyContent: 'center',
    paddingInline: tokens.spacing2,
    paddingBlock: tokens.spacing3,
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing3,
    width: '100%',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    transitionProperty: 'opacity, transform',
    transitionDuration: '0.2s',
  },
  headerContentDense: {
    gap: tokens.spacing2,
  },
  headerContentCollapsed: {
    justifyContent: 'center',
    gap: 0,
    width: '100%',
  },

  // ── Sidebar Footer ──────────────────────────────────────────────────
  footer: {
    display: 'flex',
    alignItems: 'center',
    paddingBlock: tokens.spacing4,
    paddingInline: tokens.spacing4,
    borderBlockStartWidth: '1px',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: 'transparent',
    boxSizing: 'border-box',
    marginTop: 'auto',
    gap: tokens.spacing3,
    minHeight: '64px',
  },
  footerDense: {
    minHeight: '48px',
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing3,
    gap: tokens.spacing2,
  },
  footerBorder: {
    borderBlockStartColor: tokens.colorBorderSubtle,
  },
  footerCollapsed: {
    justifyContent: 'center',
    paddingInline: tokens.spacing2,
    paddingBlock: tokens.spacing3,
  },
  footerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing3,
    width: '100%',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    transitionProperty: 'opacity, transform',
    transitionDuration: '0.2s',
  },
  footerContentDense: {
    gap: tokens.spacing2,
  },
  footerContentCollapsed: {
    justifyContent: 'center',
    gap: 0,
    width: '100%',
  },

  // ── Sidebar User / Profile ──────────────────────────────────────────
  user: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing3,
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
    boxSizing: 'border-box',
    borderRadius: tokens.radiusMd,
    textDecoration: 'none',
    color: tokens.colorFg,
  },
  userInteractive: {
    cursor: 'pointer',
    userSelect: 'none',
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    marginInline: `calc(-1 * ${tokens.spacing2})`,
    transitionProperty: 'background-color, transform',
    transitionDuration: '0.15s',
    ':hover': {
      backgroundColor: tokens.colorNeutral100,
    },
    ':active': {
      transform: 'scale(0.98)',
    },
  },
  userCollapsed: {
    justifyContent: 'center',
    gap: 0,
    width: '100%',
    paddingInline: 0,
    marginInline: 0,
  },
  userDense: {
    gap: tokens.spacing2,
  },
  userAvatarWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flex: 1,
    overflow: 'hidden',
  },
  userName: {
    fontSize: tokens.fontSizeSm,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorFg,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userDescription: {
    fontSize: tokens.fontSizeXs,
    color: tokens.colorFgSubtle,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: '2px',
  },
  userAction: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: tokens.colorFgSubtle,
  },

  // ── Sidebar Brand ───────────────────────────────────────────────────
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing3,
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
    boxSizing: 'border-box',
    borderRadius: tokens.radiusMd,
    textDecoration: 'none',
    color: tokens.colorFg,
  },
  brandInteractive: {
    cursor: 'pointer',
    userSelect: 'none',
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    marginInline: `calc(-1 * ${tokens.spacing2})`,
    transitionProperty: 'background-color, transform',
    transitionDuration: '0.15s',
    ':hover': {
      backgroundColor: tokens.colorNeutral100,
    },
    ':active': {
      transform: 'scale(0.98)',
    },
  },
  brandCollapsed: {
    justifyContent: 'center',
    gap: 0,
    width: '100%',
    paddingInline: 0,
    marginInline: 0,
  },
  brandDense: {
    gap: tokens.spacing2,
  },
  brandLogoWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandInfo: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flex: 1,
    overflow: 'hidden',
  },
  brandTitle: {
    fontSize: tokens.fontSizeSm,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorFg,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  brandSubtitle: {
    fontSize: tokens.fontSizeXs,
    color: tokens.colorFgSubtle,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: '2px',
  },

  // ── Sidebar Group ───────────────────────────────────────────────────
  group: {
    display: 'flex',
    flexDirection: 'column',
    paddingInline: tokens.spacing3,
    paddingBlockEnd: tokens.spacing4,
    gap: tokens.spacing1,
  },
  groupDense: {
    paddingInline: tokens.spacing2,
    paddingBlockEnd: tokens.spacing2,
  },
  groupCollapsed: {
    paddingInline: tokens.spacing2,
    alignItems: 'center',
  },

  // Group Header / Title
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing3,
    fontSize: tokens.fontSizeXs,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorFgSubtle,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    userSelect: 'none',
    boxSizing: 'border-box',
    height: tokens.spacing7,
  },
  groupHeaderDense: {
    height: tokens.spacing6,
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
  },
  groupHeaderCollapsible: {
    cursor: 'pointer',
    borderRadius: tokens.radiusSm,
    ':hover': {
      backgroundColor: tokens.colorNeutral100,
      color: tokens.colorFg,
    },
  },
  groupTitle: {
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  groupHeaderCollapsed: {
    display: 'none',
  },

  // Collapse indicator (chevron icon)
  groupChevron: {
    width: tokens.spacing3,
    height: tokens.spacing3,
    fill: 'currentColor',
    transitionProperty: 'transform',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
  },
  groupChevronExpanded: {
    transform: 'rotate(90deg)',
  },

  // Items container for Group
  groupItems: {
    gap: tokens.spacing1,
    overflow: 'hidden',
    boxSizing: 'border-box',
    width: '100%',
    transitionProperty: 'grid-template-rows, opacity',
    transitionDuration: '0.25s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'grid',
  },
  groupItemsExpanded: {
    gridTemplateRows: '1fr',
    opacity: 1,
  },
  groupItemsCollapsed: {
    gridTemplateRows: '0fr',
    opacity: 0,
    pointerEvents: 'none',
  },
  groupItemsInner: {
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing1,
  },
  groupItemsInnerDense: {
    gap: '2px',
  },

  // ── Sidebar Item ────────────────────────────────────────────────────
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing3,
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing3,
    borderRadius: tokens.radiusMd,
    fontSize: tokens.fontSizeSm,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorFg,
    textDecoration: 'none',
    cursor: 'pointer',
    userSelect: 'none',
    outline: 'none',
    boxSizing: 'border-box',
    height: '36px',
    transitionProperty: 'background-color, color, transform',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
    isolation: 'isolate',
    ':active': {
      transform: 'scale(0.98)',
    },
    ':focus-visible': {
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineColor: tokens.colorBorderFocus,
      outlineOffset: '2px',
    },
  },
  itemDense: {
    height: '30px',
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    gap: tokens.spacing2,
  },

  // Hover & Active/Selected states
  itemHover: {
    ':hover': {
      backgroundColor: tokens.colorNeutral100,
    },
  },
  itemSelected: {
    backgroundColor: tokens.colorPrimary100,
    color: tokens.colorPrimary500,
    fontWeight: tokens.fontWeightSemibold,
    ':hover': {
      backgroundColor: tokens.colorPrimary200,
    },
  },

  // Collapsed item styles
  itemCollapsed: {
    justifyContent: 'center',
    paddingInline: 0,
    width: '36px',
    height: '36px',
    alignSelf: 'center',
  },
  itemCollapsedDense: {
    width: '30px',
    height: '30px',
  },

  // Icon container
  itemIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: tokens.spacing4,
    height: tokens.spacing4,
    transitionProperty: 'transform',
    transitionDuration: '0.2s',
  },
  itemIconSelected: {
    color: tokens.colorPrimary500,
  },

  // Label text
  itemLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    transitionProperty: 'opacity, transform',
    transitionDuration: '0.2s',
  },
  itemLabelCollapsed: {
    opacity: 0,
    transform: 'translateX(-10px)',
    width: 0,
    display: 'none',
  },

  // ── Divider ─────────────────────────────────────────────────────────
  divider: {
    marginBlock: tokens.spacing3,
    marginInline: tokens.spacing4,
    height: '1px',
    backgroundColor: tokens.colorBorderSubtle,
    borderStyle: 'none',
  },
  dividerDense: {
    marginBlock: tokens.spacing2,
  },
  dividerCollapsed: {
    marginInline: tokens.spacing3,
  },

  // ── Toggle Button ───────────────────────────────────────────────────
  toggleButton: {
    position: 'absolute',
    insetBlockEnd: tokens.spacing4,
    insetInlineEnd: tokens.spacing4,
    width: tokens.spacing8,
    height: tokens.spacing8,
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorBgElevated,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: tokens.colorBorder,
    color: tokens.colorFgSubtle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: tokens.shadowSm,
    zIndex: tokens.zIndexBase,
    transitionProperty: 'transform, background-color, color, border-color',
    transitionDuration: '0.2s',
    outline: 'none',
    ':hover': {
      backgroundColor: tokens.colorNeutral100,
      color: tokens.colorFg,
    },
    ':active': {
      transform: 'scale(0.95)',
    },
    ':focus-visible': {
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineColor: tokens.colorBorderFocus,
    },
  },
  toggleButtonCollapsed: {
    position: 'relative',
    insetBlockEnd: 'auto',
    insetInlineEnd: 'auto',
    alignSelf: 'center',
    marginBlockStart: tokens.spacing1,
    marginBlockEnd: tokens.spacing3,
  },
  layout: {
    display: 'flex',
    flexDirection: {
      default: 'row',
      '@media (max-width: 768px)': 'column',
    },
    height: '100%',
    maxHeight: '100%',
    width: '100%',
    backgroundColor: tokens.colorBg,
    color: tokens.colorFg,
    fontFamily: tokens.fontFamilyBase,
    boxSizing: 'border-box',
    overflow: 'hidden',
    gap: {
      default: tokens.spacing3,
      '@media (max-width: 768px)': 0,
    },
  },
  layoutStatic: {
    flexDirection: 'row',
    gap: tokens.spacing3,
  },
  layoutMobile: {
    flexDirection: 'column',
    gap: 0,
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    boxSizing: 'border-box',
    fontFamily: tokens.fontFamilyBase,
    color: tokens.colorFg,
    minWidth: 0,
  },
  mainContentMobileNav: {
    paddingBlockEnd: {
      default: 0,
      '@media (max-width: 768px)': `calc(env(safe-area-inset-bottom, 0px) + ${tokens.spacing8} * 2.5)`,
    },
  },
  mainContentMobileWithHeader: {
    paddingBlockStart: {
      default: 0,
      '@media (max-width: 768px)': `calc(${tokens.spacing7} * 2)`,
    },
  },
  mainUnframed: {
    height: '100%',
    backgroundColor: 'transparent',
    paddingBlockStart: {
      default: tokens.spacing3,
      '@media (max-width: 768px)': 0,
    },
    borderWidth: 0,
    borderStyle: 'none',
    borderColor: 'transparent',
    borderRadius: 0,
    margin: 0,
  },
  mainFramed: {
    height: {
      default: `calc(100% - ${tokens.spacing3} * 2)`,
      '@media (max-width: 768px)': '100%',
    },
    marginBlock: {
      default: tokens.spacing3,
      '@media (max-width: 768px)': 0,
    },
    marginInlineEnd: {
      default: tokens.spacing3,
      '@media (max-width: 768px)': 0,
    },
    marginInlineStart: 0,
    borderRadius: {
      default: tokens.radiusLg,
      '@media (max-width: 768px)': 0,
    },
    borderWidth: {
      default: '1px',
      '@media (max-width: 768px)': 0,
    },
    borderStyle: 'solid',
    overflow: 'hidden',
  },
  mainSolid: {
    backgroundColor: tokens.colorBgSubtle,
    borderColor: tokens.colorBorder,
  },
  mainGlass: {
    backgroundColor: tokens.colorBgSubtle,
    borderColor: tokens.colorBorder,
    '@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))':
      {
        backgroundColor: tokens.colorBgGlass,
        borderColor: tokens.colorBorderGlass,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
  },

  // ── Mobile Top Bar ──────────────────────────────────────────────────
  mobileTopBar: {
    display: {
      default: 'none',
      '@media (max-width: 768px)': 'flex',
    },
    position: 'absolute',
    insetBlockStart: 0,
    insetInline: 0,
    zIndex: 40,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing4,
    minHeight: '56px',
    boxSizing: 'border-box',
    backgroundColor: tokens.colorBgSubtle,
    borderBlockEndWidth: '1px',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: tokens.colorBorderSubtle,
    '@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))':
      {
        backgroundColor: tokens.colorBgGlass,
        borderBlockEndColor: tokens.colorBorderGlass,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
  },
  mobileTopBarContent: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    gap: tokens.spacing2,
  },

  // ── Mobile Bottom Navigation Dock ───────────────────────────────────
  mobileBottomNavContainer: {
    display: {
      default: 'none',
      '@media (max-width: 768px)': 'flex',
    },
    position: 'fixed',
    insetBlockEnd: `calc(env(safe-area-inset-bottom, 0px) + ${tokens.spacing3})`,
    insetInline: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 50,
    paddingInline: tokens.spacing3,
  },
  mobileBottomNav: {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: tokens.spacing1,
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorBgElevated,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    boxShadow: tokens.shadowLg,
    maxWidth: '420px',
    width: 'auto',
    minWidth: '240px',
    boxSizing: 'border-box',
    transformOrigin: 'bottom center',
    '@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))':
      {
        backgroundColor: tokens.colorBgGlass,
        borderColor: tokens.colorBorderGlass,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      },
  },
  mobileNavItem: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    minWidth: '52px',
    minHeight: '44px',
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    borderRadius: tokens.radiusFull,
    color: tokens.colorFgSubtle,
    textDecoration: 'none',
    cursor: 'pointer',
    userSelect: 'none',
    boxSizing: 'border-box',
    zIndex: 1,
    borderStyle: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
  },
  mobileNavItemActive: {
    color: tokens.colorPrimary500,
    fontWeight: tokens.fontWeightSemibold,
  },
  mobileNavActivePill: {
    position: 'absolute',
    insetBlock: 0,
    insetInline: 0,
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorNeutral100,
    zIndex: -1,
  },
  mobileNavIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    flexShrink: 0,
  },
  mobileNavLabel: {
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '64px',
    display: 'block',
  },
  mobileNavMoreButton: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    minWidth: '52px',
    minHeight: '44px',
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    borderRadius: tokens.radiusFull,
    color: tokens.colorFgSubtle,
    cursor: 'pointer',
    userSelect: 'none',
    boxSizing: 'border-box',
    zIndex: 1,
    borderStyle: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
  },

  // ── Mobile Drawer Content ───────────────────────────────────────────
  mobileDrawerOverlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  mobileDrawerModal: {
    width: '100vw',
    maxWidth: '100vw',
    marginBlockEnd: 0,
    marginBlockStart: 'auto',
    marginInline: 0,
    borderTopLeftRadius: tokens.radiusLg,
    borderTopRightRadius: tokens.radiusLg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 0,
    borderBlockStartWidth: '1px',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: tokens.colorBorderSubtle,
    maxHeight: '85dvh',
    height: 'auto',
    backgroundColor: tokens.colorBgElevated,
    boxShadow: tokens.shadowLg,
    outline: 'none',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  mobileDrawerDialog: {
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxHeight: '85dvh',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  mobileDrawerHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingBlockStart: tokens.spacing1,
    paddingBlockEnd: tokens.spacing3,
    paddingInline: tokens.spacing4,
    borderBlockEndWidth: '1px',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: tokens.colorBorderSubtle,
    backgroundColor: tokens.colorBgElevated,
    gap: tokens.spacing1,
    flexShrink: 0,
    boxSizing: 'border-box',
  },
  mobileDrawerHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  mobileDrawerTitle: {
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorFg,
    margin: 0,
  },
  mobileDrawerBody: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    paddingBlockStart: tokens.spacing3,
    paddingBlockEnd: `calc(max(${tokens.spacing4}, env(safe-area-inset-bottom, ${tokens.spacing4})) + ${tokens.spacing3})`,
    paddingInline: tokens.spacing4,
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  mobileDrawerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing3,
  },
  mobileDrawerGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing1,
  },
  mobileDrawerGroupTitle: {
    fontSize: tokens.fontSizeXs,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorFgSubtle,
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  mobileDrawerFooter: {
    paddingBlockStart: tokens.spacing3,
    borderBlockStartWidth: '1px',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: tokens.colorBorderSubtle,
    marginBlockStart: tokens.spacing2,
  },
})
