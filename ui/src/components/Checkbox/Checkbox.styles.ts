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
  indicator: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: tokens.spacing4,
    height: tokens.spacing4,
    flexShrink: 0,
    borderRadius: tokens.radiusSm,
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
  indicatorIndeterminate: {
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
  icon: {
    width: '100%',
    height: '100%',
    color: tokens.colorFgOnPrimary,
  },
  label: {
    paddingInlineStart: tokens.spacing1,
  },
})
