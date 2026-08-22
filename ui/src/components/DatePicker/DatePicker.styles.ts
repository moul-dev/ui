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
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    borderRadius: tokens.radiusSm,
    backgroundColor: tokens.colorBg,
    color: tokens.colorFg,
    boxSizing: 'border-box',
    width: '100%',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  groupSm: {
    minHeight: tokens.spacing7,
    paddingInlineStart: tokens.spacing2,
    paddingInlineEnd: tokens.spacing1,
    fontSize: tokens.fontSizeXs,
  },
  groupMd: {
    minHeight: tokens.spacing8,
    paddingInlineStart: tokens.spacing3,
    paddingInlineEnd: tokens.spacing2,
    fontSize: tokens.fontSizeSm,
  },
  groupLg: {
    minHeight: '42px',
    paddingInlineStart: tokens.spacing4,
    paddingInlineEnd: tokens.spacing2,
    fontSize: tokens.fontSizeMd,
  },
  primary: {
    backgroundColor: tokens.colorBg,
  },
  secondary: {
    backgroundColor: tokens.colorBgSubtle,
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
    backgroundColor: tokens.colorNeutral100,
    color: tokens.colorNeutral400,
    borderColor: tokens.colorBorderSubtle,
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  rangeSeparator: {
    color: tokens.colorFgSubtle,
    paddingInline: tokens.spacing1,
    userSelect: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
  triggerButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: tokens.colorFgSubtle,
    borderRadius: tokens.radiusSm,
    padding: tokens.spacing1,
    cursor: 'pointer',
    outline: 'none',
    transition: 'color 0.15s ease, background-color 0.15s ease',
  },
  triggerButtonHover: {
    color: tokens.colorFg,
    backgroundColor: tokens.colorNeutral100,
  },
  triggerButtonPressed: {
    backgroundColor: tokens.colorNeutral200,
  },
  triggerButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  triggerButtonFocused: {
    color: tokens.colorPrimary500,
  },
  calendarIcon: {
    width: '16px',
    height: '16px',
  },
  popover: {
    backgroundColor: tokens.colorBgElevated,
    boxShadow: tokens.shadowMd,
    borderRadius: tokens.radiusMd,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    zIndex: tokens.zIndexDropdown,
    outline: 'none',
    padding: tokens.spacing2,
  },
  dialog: {
    outline: 'none',
  },
})
