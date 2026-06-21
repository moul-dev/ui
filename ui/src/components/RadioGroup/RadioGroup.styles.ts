import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  groupBase: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing2,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing2,
  },
  radioBase: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing2,
    cursor: 'pointer',
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    color: tokens.colorFg,
    userSelect: 'none',
  },
  radioDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  radioReadOnly: {
    cursor: 'default',
  },
  indicator: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: tokens.spacing4,
    height: tokens.spacing4,
    flexShrink: 0,
    borderRadius: tokens.radiusFull,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    backgroundColor: tokens.colorBg,
    transitionProperty: 'background-color, border-color, box-shadow',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
  },
  indicatorHover: {
    borderColor: tokens.colorNeutral400,
  },
  indicatorChecked: {
    backgroundColor: tokens.colorPrimary500,
    borderColor: tokens.colorPrimary500,
  },
  indicatorFocusVisible: {
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineOffset: '2px',
    outlineColor: tokens.colorBorderFocus,
  },
  indicatorInvalid: {
    borderColor: tokens.colorError500,
  },
  dot: {
    width: tokens.spacing2,
    height: tokens.spacing2,
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorFgOnPrimary,
    transitionProperty: 'transform',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease-in-out',
    transform: 'scale(1)',
  },
  label: {
    paddingInlineStart: tokens.spacing1,
  },
})
