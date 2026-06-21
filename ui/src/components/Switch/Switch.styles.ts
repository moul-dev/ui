import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing2,
    cursor: 'pointer',
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    color: tokens.colorFg,
    userSelect: 'none',
  },
  isDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  isReadOnly: {
    cursor: 'default',
  },
  track: {
    position: 'relative',
    width: tokens.spacing8, // 32px
    height: tokens.spacing5, // 20px
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorBorder,
    transitionProperty: 'background-color, box-shadow',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
    flexShrink: 0,
  },
  trackChecked: {
    backgroundColor: tokens.colorPrimary500,
  },
  trackHover: {
    filter: 'brightness(0.95)',
  },
  trackFocusVisible: {
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineOffset: '2px',
    outlineColor: tokens.colorBorderFocus,
  },
  thumb: {
    position: 'absolute',
    top: '1px', // (20px - 18px) / 2 = 1px (Let's make thumb 18px so it has 1px padding!)
    insetInlineStart: '1px',
    width: '18px',
    height: '18px',
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorBg,
    boxShadow: tokens.shadowSm,
    transitionProperty: 'inset-inline-start, transform',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
  },
  thumbChecked: {
    insetInlineStart: 'calc(100% - 19px)', // 32px - 18px - 1px = 13px
  },
  label: {
    paddingInlineStart: tokens.spacing1,
  },
})
