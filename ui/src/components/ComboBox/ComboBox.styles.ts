import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing1,
    width: '100%',
  },
  group: {
    display: 'flex',
    alignItems: 'stretch',
    borderWidth: '1px',
    borderStyle: 'solid',
    boxShadow: tokens.shadowSm,
    overflow: 'hidden',
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
  },
  groupSm: {
    height: `calc(${tokens.spacing1} * 2 + ${tokens.lineHeightXs})`,
    borderRadius: tokens.radiusSm,
  },
  groupMd: {
    height: `calc(${tokens.spacing2} * 2 + ${tokens.lineHeightSm})`,
    borderRadius: tokens.radiusMd,
  },
  groupLg: {
    height: `calc(${tokens.spacing2} * 2 + ${tokens.lineHeightMd})`,
    borderRadius: tokens.radiusMd,
  },
  primary: {
    backgroundColor: tokens.colorBg,
    borderColor: tokens.colorBorder,
  },
  secondary: {
    backgroundColor: tokens.colorBgSubtle,
    borderColor: tokens.colorBorderSubtle,
  },

  groupHover: {
    borderColor: tokens.colorNeutral400,
  },
  groupFocused: {
    borderColor: tokens.colorBorderFocus,
    boxShadow: `0 0 0 1px ${tokens.colorBorderFocus}`,
  },
  groupInvalid: {
    borderColor: tokens.colorError500,
  },
  groupFocusedInvalid: {
    borderColor: tokens.colorError500,
    boxShadow: `0 0 0 1px ${tokens.colorError500}`,
  },
  groupDisabled: {
    opacity: 0.4,
    backgroundColor: tokens.colorBgSubtle,
    cursor: 'not-allowed',
    ':hover': {
      borderColor: tokens.colorBorder,
    },
  },
  input: {
    flexGrow: 1,
    width: '100%',
    borderStyle: 'none',
    backgroundColor: 'transparent',
    color: tokens.colorFg,
    fontFamily: tokens.fontFamilyBase,
    outline: 'none',
  },
  inputSm: {
    paddingBlock: 0,
    paddingInlineStart: tokens.spacing2,
    paddingInlineEnd: tokens.spacing1,
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
  },
  inputMd: {
    paddingBlock: 0,
    paddingInlineStart: tokens.spacing3,
    paddingInlineEnd: tokens.spacing1,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
  },
  inputLg: {
    paddingBlock: 0,
    paddingInlineStart: tokens.spacing4,
    paddingInlineEnd: tokens.spacing1,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'none',
    backgroundColor: 'transparent',
    color: tokens.colorFgSubtle,
    cursor: 'pointer',
    transitionProperty: 'background-color, color',
    transitionDuration: '0.1s',
    transitionTimingFunction: 'ease-in-out',
    ':hover': {
      backgroundColor: tokens.colorBgSubtle,
      color: tokens.colorFg,
    },
    ':active': {
      backgroundColor: tokens.colorBorderSubtle,
    },
  },
  triggerSm: {
    paddingInline: tokens.spacing2,
  },
  triggerMd: {
    paddingInline: tokens.spacing3,
  },
  triggerLg: {
    paddingInline: tokens.spacing4,
  },
  triggerDisabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
    ':hover': {
      backgroundColor: 'transparent',
      color: tokens.colorFgSubtle,
    },
  },
  chevron: {
    width: tokens.spacing3,
    height: tokens.spacing3,
    color: 'currentColor',
  },
  popover: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    backgroundColor: tokens.colorBgElevated,
    boxShadow: tokens.shadowMd,
    zIndex: tokens.zIndexDropdown,
    minWidth: 'var(--trigger-width)',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  popoverSm: {
    borderRadius: tokens.radiusSm,
  },
  popoverMd: {
    borderRadius: tokens.radiusMd,
  },
  popoverLg: {
    borderRadius: tokens.radiusMd,
  },
  listbox: {
    padding: tokens.spacing1,
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorFg,
    cursor: 'pointer',
    outline: 'none',
    userSelect: 'none',
    backgroundColor: 'transparent',
    transitionProperty: 'background-color, color',
    transitionDuration: '0.1s',
    transitionTimingFunction: 'ease-in-out',
  },
  itemSm: {
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    borderRadius: `calc(${tokens.radiusSm} - ${tokens.spacing1})`,
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
  },
  itemMd: {
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing3,
    borderRadius: `calc(${tokens.radiusMd} - ${tokens.spacing1})`,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
  },
  itemLg: {
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing4,
    borderRadius: `calc(${tokens.radiusMd} - ${tokens.spacing1})`,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
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
