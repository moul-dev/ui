/* eslint-disable @stylexjs/valid-styles */
import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

const rotate = stylex.keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
})

export const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing3,
    paddingBlock: tokens.spacing4,
    paddingInline: tokens.spacing4,
    borderRadius: tokens.radiusLg,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorderSubtle,
    backgroundColor: tokens.colorBgSubtle,
    color: tokens.colorFg,
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: tokens.shadowSm,
  },

  // Layout components
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    height: tokens.lineHeightSm,
  },
  icon: {
    width: '20px',
    height: '20px',
  },

  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing1,
    flexGrow: 1,
  },
  title: {
    fontWeight: tokens.fontWeightNormal,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
  },
  description: {
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
    color: tokens.colorFgSubtle,
  },

  actionContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing2,
    flexShrink: 0,
    marginInlineStart: tokens.spacing3,
    height: tokens.lineHeightSm,
  },

  closeButtonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    height: tokens.lineHeightSm,
    marginInlineStart: tokens.spacing3,
  },

  closeButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: tokens.colorFgSubtle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing1,
    borderRadius: tokens.radiusSm,
    transition: 'background-color 0.15s, color 0.15s',
    ':hover': {
      color: tokens.colorFg,
    },
  },
  closeButton_info: {
    ':hover': {
      backgroundColor: tokens.colorAlertHoverInfo,
    },
    ':active': {
      backgroundColor: tokens.colorAlertActiveInfo,
    },
  },
  closeButton_loading: {
    ':hover': {
      backgroundColor: tokens.colorAlertHoverInfo,
    },
    ':active': {
      backgroundColor: tokens.colorAlertActiveInfo,
    },
  },
  closeButton_accent: {
    ':hover': {
      backgroundColor: tokens.colorAlertHoverAccent,
    },
    ':active': {
      backgroundColor: tokens.colorAlertActiveAccent,
    },
  },
  closeButton_success: {
    ':hover': {
      backgroundColor: tokens.colorAlertHoverSuccess,
    },
    ':active': {
      backgroundColor: tokens.colorAlertActiveSuccess,
    },
  },
  closeButton_warning: {
    ':hover': {
      backgroundColor: tokens.colorAlertHoverWarning,
    },
    ':active': {
      backgroundColor: tokens.colorAlertActiveWarning,
    },
  },
  closeButton_error: {
    ':hover': {
      backgroundColor: tokens.colorAlertHoverError,
    },
    ':active': {
      backgroundColor: tokens.colorAlertActiveError,
    },
  },

  closeIcon: {
    width: '16px',
    height: '16px',
  },

  // Color Status Overrides
  info: {},
  accent: {
    backgroundColor: tokens.colorAlertBgAccent,
    borderColor: tokens.colorAlertBorderAccent,
  },
  success: {
    backgroundColor: tokens.colorAlertBgSuccess,
    borderColor: tokens.colorAlertBorderSuccess,
  },
  warning: {
    backgroundColor: tokens.colorAlertBgWarning,
    borderColor: tokens.colorAlertBorderWarning,
  },
  error: {
    backgroundColor: tokens.colorAlertBgError,
    borderColor: tokens.colorAlertBorderError,
  },
  loading: {},

  // Icon Color Variants
  icon_info: {
    color: tokens.colorFg,
  },
  icon_accent: {
    color: tokens.colorPrimary500,
  },
  icon_success: {
    color: tokens.colorSuccess500,
  },
  icon_warning: {
    color: tokens.colorWarning500,
  },
  icon_error: {
    color: tokens.colorError500,
  },
  icon_loading: {
    color: tokens.colorPrimary500,
    animationName: rotate,
    animationDuration: '1s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },

  // Title Color Variants
  title_info: {
    color: tokens.colorFg,
  },
  title_accent: {
    color: tokens.colorPrimary500,
  },
  title_success: {
    color: tokens.colorSuccess500,
  },
  title_warning: {
    color: tokens.colorWarning500,
  },
  title_error: {
    color: tokens.colorError500,
  },
  title_loading: {
    color: tokens.colorPrimary500,
  },
})
