/* eslint-disable @stylexjs/valid-styles */
import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing2,
    cursor: 'pointer',
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
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

  // Primary variant styles
  checkedPrimary: {
    backgroundColor: tokens.colorPrimary500,
    borderColor: tokens.colorPrimary500,
  },
  checkedHoverPrimary: {
    backgroundColor: tokens.colorPrimary600,
    borderColor: tokens.colorPrimary600,
  },
  iconPrimary: {
    color: tokens.colorFgOnPrimary,
  },
  focusPrimary: {
    outlineColor: tokens.colorBorderFocus,
  },

  // Secondary variant styles
  checkedSecondary: {
    backgroundColor: tokens.colorNeutral800,
    borderColor: tokens.colorNeutral800,
  },
  checkedHoverSecondary: {
    backgroundColor: tokens.colorNeutral900,
    borderColor: tokens.colorNeutral900,
  },
  iconSecondary: {
    color: tokens.colorBg,
  },
  focusSecondary: {
    outlineColor: tokens.colorNeutral800,
  },

  // Tertiary variant styles
  checkedTertiary: {
    backgroundColor: tokens.colorBg,
    borderColor: tokens.colorPrimary500,
  },
  checkedHoverTertiary: {
    backgroundColor: tokens.colorPrimary50,
    borderColor: tokens.colorPrimary600,
  },
  iconTertiary: {
    color: tokens.colorPrimary500,
  },
  focusTertiary: {
    outlineColor: tokens.colorPrimary500,
  },

  indicatorFocusVisible: {
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineOffset: '2px',
  },
  indicatorInvalid: {
    borderColor: tokens.colorError500,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
  label: {},
})
