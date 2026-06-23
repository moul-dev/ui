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
    borderRadius: tokens.radiusMd,
    borderWidth: '1px',
    borderStyle: 'solid',
    boxShadow: tokens.shadowSm,
    overflow: 'hidden',
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
  input: {
    flexGrow: 1,
    width: '100%',
    paddingBlock: tokens.spacing2,
    paddingInlineStart: tokens.spacing3,
    paddingInlineEnd: tokens.spacing1,
    borderStyle: 'none',
    backgroundColor: 'transparent',
    color: tokens.colorFg,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    outline: 'none',
  },
  stepperContainer: {
    display: 'flex',
    flexDirection: 'column',
    borderInlineStartWidth: '1px',
    borderInlineStartStyle: 'solid',
    width: tokens.spacing6,
    flexShrink: 0,
  },
  stepperContainerPrimary: {
    borderInlineStartColor: tokens.colorBorder,
  },
  stepperContainerSecondary: {
    borderInlineStartColor: tokens.colorBorderSubtle,
  },

  stepperButton: {
    flexGrow: 1,
    height: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'none',
    backgroundColor: 'transparent',
    color: tokens.colorFgSubtle,
    cursor: 'pointer',
    padding: 0,
    fontSize: '0.625rem',
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
  stepperButtonDisabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
    ':hover': {
      backgroundColor: 'transparent',
      color: tokens.colorFgSubtle,
    },
  },
})
