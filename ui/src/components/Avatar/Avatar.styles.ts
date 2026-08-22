import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    display: 'inline-flex',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutral200,
    color: tokens.colorNeutral700,
    fontWeight: tokens.fontWeightSemibold,
    userSelect: 'none',
    boxSizing: 'border-box',
    verticalAlign: 'middle',
    flexShrink: 0,
  },
  innerWrapper: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 'inherit',
  },
  // Sizes
  xs: {
    width: '24px',
    height: '24px',
    fontSize: '10px',
    lineHeight: '12px',
  },
  sm: {
    width: tokens.spacing8,
    height: tokens.spacing8,
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
  },
  md: {
    width: '40px',
    height: '40px',
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
  },
  lg: {
    width: '48px',
    height: '48px',
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
  },
  xl: {
    width: '56px',
    height: '56px',
    fontSize: tokens.fontSizeLg,
    lineHeight: tokens.lineHeightLg,
  },
  '2xl': {
    width: '64px',
    height: '64px',
    fontSize: tokens.fontSizeXl,
    lineHeight: tokens.lineHeightXl,
  },
  // Shapes
  circle: {
    borderRadius: tokens.radiusFull,
  },
  square: {
    borderRadius: tokens.radiusMd,
  },
  square_xs: {
    borderRadius: tokens.radiusSm,
  },
  square_sm: {
    borderRadius: tokens.radiusSm,
  },
  square_md: {
    borderRadius: tokens.radiusMd,
  },
  square_lg: {
    borderRadius: tokens.radiusMd,
  },
  square_xl: {
    borderRadius: tokens.radiusLg,
  },
  square_2xl: {
    borderRadius: tokens.radiusLg,
  },
  // Content
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  initials: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  fallbackIcon: {
    width: '55%',
    height: '55%',
    color: tokens.colorNeutral500,
  },
  // Status Dot Indicator
  statusDot: {
    position: 'absolute',
    borderRadius: tokens.radiusFull,
    borderStyle: 'solid',
    borderColor: tokens.colorBg,
    zIndex: 2,
    boxSizing: 'content-box',
  },
  status_bottomRight: {
    insetBlockEnd: 0,
    insetInlineEnd: 0,
    transform: 'translate(10%, 10%)',
  },
  status_topRight: {
    insetBlockStart: 0,
    insetInlineEnd: 0,
    transform: 'translate(10%, -10%)',
  },
  status_online: {
    backgroundColor: tokens.colorSuccess500,
  },
  status_offline: {
    backgroundColor: tokens.colorNeutral400,
  },
  status_busy: {
    backgroundColor: tokens.colorError500,
  },
  status_away: {
    backgroundColor: tokens.colorWarning500,
  },
  statusSize_xs: {
    width: '6px',
    height: '6px',
    borderWidth: '1.5px',
  },
  statusSize_sm: {
    width: '8px',
    height: '8px',
    borderWidth: '2px',
  },
  statusSize_md: {
    width: '10px',
    height: '10px',
    borderWidth: '2px',
  },
  statusSize_lg: {
    width: '12px',
    height: '12px',
    borderWidth: '2.5px',
  },
  statusSize_xl: {
    width: '14px',
    height: '14px',
    borderWidth: '2.5px',
  },
  statusSize_2xl: {
    width: '16px',
    height: '16px',
    borderWidth: '3px',
  },
  // Avatar Group
  group: {
    display: 'inline-flex',
    alignItems: 'center',
    flexDirection: 'row',
  },
  groupItem: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s ease, z-index 0.15s ease',
    ':hover': {
      zIndex: 10,
    },
  },
  groupItemRing: {
    boxShadow: `0 0 0 2px ${tokens.colorBg}`,
  },
  groupOverlap_xs: {
    marginInlineStart: '-6px',
  },
  groupOverlap_sm: {
    marginInlineStart: '-8px',
  },
  groupOverlap_md: {
    marginInlineStart: '-10px',
  },
  groupOverlap_lg: {
    marginInlineStart: '-12px',
  },
  groupOverlap_xl: {
    marginInlineStart: '-14px',
  },
  groupOverlap_2xl: {
    marginInlineStart: '-16px',
  },
  excess: {
    backgroundColor: tokens.colorNeutral300,
    color: tokens.colorNeutral800,
    fontWeight: tokens.fontWeightMedium,
  },
})
