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
    borderColor: tokens.colorBorder,
    backgroundColor: tokens.colorBg,
    boxShadow: tokens.shadowSm,
    overflow: 'hidden',
    boxSizing: 'border-box',
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
    ':hover': {
      borderColor: tokens.colorNeutral400,
    },
    '@media (prefers-reduced-motion: reduce)': {
      transitionProperty: 'none',
    },
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
    height: '100%',
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
  stepperContainer: {
    display: 'flex',
    flexDirection: 'column',
    borderInlineStartWidth: '1px',
    borderInlineStartStyle: 'solid',
    flexShrink: 0,
  },
  stepperContainerSm: {
    width: tokens.spacing5,
  },
  stepperContainerMd: {
    width: tokens.spacing6,
  },
  stepperContainerLg: {
    width: tokens.spacing7,
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
