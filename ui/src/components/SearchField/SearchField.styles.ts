import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing2,
    width: '100%',
  },
  group: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: tokens.radiusMd,
    borderWidth: '1px',
    borderStyle: 'solid',
    boxShadow: tokens.shadowSm,
    paddingInline: tokens.spacing3,
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
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
    width: tokens.spacing4,
    height: tokens.spacing4,
    color: tokens.colorFgSubtle,
    flexShrink: 0,
  },
  input: {
    flexGrow: 1,
    width: '100%',
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing2,
    borderStyle: 'none',
    backgroundColor: 'transparent',
    color: tokens.colorFg,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    outline: 'none',
  },
  clearButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: tokens.spacing4,
    height: tokens.spacing4,
    borderStyle: 'none',
    backgroundColor: 'transparent',
    color: tokens.colorFgSubtle,
    cursor: 'pointer',
    padding: 0,
    borderRadius: tokens.radiusFull,
    transitionProperty: 'background-color, color',
    transitionDuration: '0.1s',
    transitionTimingFunction: 'ease-in-out',
    ':hover': {
      backgroundColor: tokens.colorBgSubtle,
      color: tokens.colorFg,
    },
  },
  clearButtonHidden: {
    visibility: 'hidden',
    pointerEvents: 'none',
  },
})
