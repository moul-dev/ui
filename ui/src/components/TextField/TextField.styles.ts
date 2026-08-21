import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing1,
    width: '100%',
  },
  input: {
    display: 'block',
    width: '100%',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    backgroundColor: tokens.colorBg,
    color: tokens.colorFg,
    fontFamily: tokens.fontFamilyBase,
    outline: 'none',
    boxShadow: tokens.shadowSm,
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
    ':hover': {
      borderColor: tokens.colorNeutral400,
    },
    ':focus': {
      borderColor: tokens.colorBorderFocus,
      boxShadow: `0 0 0 1px ${tokens.colorBorderFocus}`,
    },
    '@media (prefers-reduced-motion: reduce)': {
      transitionProperty: 'none',
    },
  },
  sm: {
    height: `calc(${tokens.spacing1} * 2 + ${tokens.lineHeightXs})`,
    paddingBlock: 0,
    paddingInline: tokens.spacing2,
    borderRadius: tokens.radiusSm,
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
  },
  md: {
    height: `calc(${tokens.spacing2} * 2 + ${tokens.lineHeightSm})`,
    paddingBlock: 0,
    paddingInline: tokens.spacing3,
    borderRadius: tokens.radiusMd,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
  },
  lg: {
    height: `calc(${tokens.spacing2} * 2 + ${tokens.lineHeightMd})`,
    paddingBlock: 0,
    paddingInline: tokens.spacing4,
    borderRadius: tokens.radiusMd,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
  },
  primary: {
    backgroundColor: tokens.colorBg,
    borderColor: tokens.colorBorder,
  },
  secondary: {
    backgroundColor: tokens.colorBgSubtle,
    borderColor: tokens.colorBorderSubtle,
  },

  inputInvalid: {
    borderColor: tokens.colorError500,
    ':focus': {
      borderColor: tokens.colorError500,
      boxShadow: `0 0 0 1px ${tokens.colorError500}`,
    },
  },
  inputDisabled: {
    opacity: 0.4,
    backgroundColor: tokens.colorBgSubtle,
    cursor: 'not-allowed',
    boxShadow: 'none',
    ':hover': {
      borderColor: tokens.colorBorder,
    },
  },
})
