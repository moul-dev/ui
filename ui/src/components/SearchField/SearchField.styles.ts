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
    alignItems: 'center',
    borderWidth: '1px',
    borderStyle: 'solid',
    boxShadow: tokens.shadowSm,
    boxSizing: 'border-box',
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
  },
  groupSm: {
    height: `calc(${tokens.spacing1} * 2 + ${tokens.lineHeightXs})`,
    borderRadius: tokens.radiusSm,
    paddingInline: tokens.spacing2,
  },
  groupMd: {
    height: `calc(${tokens.spacing2} * 2 + ${tokens.lineHeightSm})`,
    borderRadius: tokens.radiusMd,
    paddingInline: tokens.spacing3,
  },
  groupLg: {
    height: `calc(${tokens.spacing2} * 2 + ${tokens.lineHeightMd})`,
    borderRadius: tokens.radiusMd,
    paddingInline: tokens.spacing4,
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
  icon: {
    color: tokens.colorFgSubtle,
    flexShrink: 0,
  },
  iconSm: {
    width: tokens.spacing3,
    height: tokens.spacing3,
  },
  iconMd: {
    width: tokens.spacing4,
    height: tokens.spacing4,
  },
  iconLg: {
    width: tokens.spacing4,
    height: tokens.spacing4,
  },
  input: {
    flexGrow: 1,
    width: '100%',
    height: '100%',
    borderStyle: 'none',
    backgroundColor: 'transparent',
    color: tokens.colorFg,
    fontFamily: tokens.fontFamilyBase,
    outline: 'none',
  },
  inputSm: {
    paddingBlock: 0,
    paddingInline: tokens.spacing1,
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
  },
  inputMd: {
    paddingBlock: 0,
    paddingInline: tokens.spacing2,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
  },
  inputLg: {
    paddingBlock: 0,
    paddingInline: tokens.spacing2,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
  },
  clearButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'none',
    backgroundColor: 'transparent',
    color: tokens.colorFgSubtle,
    cursor: 'pointer',
    padding: 0,
    borderRadius: tokens.radiusFull,
    flexShrink: 0,
    transitionProperty: 'background-color, color',
    transitionDuration: '0.1s',
    transitionTimingFunction: 'ease-in-out',
    ':hover': {
      backgroundColor: tokens.colorBgSubtle,
      color: tokens.colorFg,
    },
  },
  clearButtonSm: {
    width: tokens.spacing3,
    height: tokens.spacing3,
    fontSize: tokens.fontSizeXs,
  },
  clearButtonMd: {
    width: tokens.spacing4,
    height: tokens.spacing4,
    fontSize: tokens.fontSizeSm,
  },
  clearButtonLg: {
    width: tokens.spacing4,
    height: tokens.spacing4,
    fontSize: tokens.fontSizeSm,
  },
  clearButtonHidden: {
    visibility: 'hidden',
    pointerEvents: 'none',
  },
})
