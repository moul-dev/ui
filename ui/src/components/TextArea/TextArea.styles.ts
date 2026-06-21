import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing2,
    width: '100%',
  },
  textarea: {
    display: 'block',
    width: '100%',
    minHeight: `calc(${tokens.spacing8} * 2)`, // 4rem (approx 64px)
    resize: 'vertical',
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing3,
    borderRadius: tokens.radiusMd,
    borderWidth: '1px',
    borderStyle: 'solid',
    color: tokens.colorFg,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
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
  primary: {
    backgroundColor: tokens.colorBg,
    borderColor: tokens.colorBorder,
  },
  secondary: {
    backgroundColor: tokens.colorBgSubtle,
    borderColor: tokens.colorBorderSubtle,
  },

  textareaInvalid: {
    borderColor: tokens.colorError500,
    ':focus': {
      borderColor: tokens.colorError500,
      boxShadow: `0 0 0 1px ${tokens.colorError500}`,
    },
  },
  textareaDisabled: {
    opacity: 0.4,
    backgroundColor: tokens.colorBgSubtle,
    cursor: 'not-allowed',
    boxShadow: 'none',
    ':hover': {
      borderColor: tokens.colorBorder,
    },
  },
})
