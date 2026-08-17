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
    display: 'inline-flex',
    alignItems: 'center',
    width: tokens.spacing8,
    height: tokens.spacing5,
    padding: '2px',
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorBorder,
    boxSizing: 'border-box',
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
    display: 'block',
    height: '100%',
    aspectRatio: '1 / 1',
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorBg,
    boxShadow: tokens.shadowSm,
    transform: 'translateX(0)',
    transitionProperty: 'transform',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
    pointerEvents: 'none',
  },
  thumbChecked: {
    transform: `translateX(calc(${tokens.spacing8} - ${tokens.spacing5}))`,
  },
  label: {
    paddingInlineStart: tokens.spacing1,
  },
})
