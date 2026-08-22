import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: tokens.fontFamilyBase,
  },
  alignStart: {
    alignItems: 'flex-start',
    textAlign: 'start',
  },
  alignCenter: {
    alignItems: 'center',
    textAlign: 'center',
  },

  // Sizes (padding & gap)
  sizeSm: {
    padding: `${tokens.spacing4} ${tokens.spacing3}`,
    gap: tokens.spacing2,
  },
  sizeMd: {
    padding: `${tokens.spacing6} ${tokens.spacing4}`,
    gap: tokens.spacing3,
  },
  sizeLg: {
    padding: `${tokens.spacing8} ${tokens.spacing6}`,
    gap: tokens.spacing4,
  },

  // Variants
  variantDefault: {
    backgroundColor: 'transparent',
  },
  variantDashed: {
    backgroundColor: tokens.colorBgSubtle,
    borderWidth: '1px',
    borderStyle: 'dashed',
    borderColor: tokens.colorBorder,
    borderRadius: tokens.radiusLg,
  },
  variantCard: {
    backgroundColor: tokens.colorBgElevated,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorderSubtle,
    borderRadius: tokens.radiusLg,
    boxShadow: tokens.shadowSm,
  },

  // Icon Wrapper
  iconWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorNeutral100,
    color: tokens.colorFgSubtle,
    flexShrink: 0,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorderSubtle,
  },
  iconPrimary: {
    backgroundColor: tokens.colorPrimary50,
    color: tokens.colorPrimary600,
    borderColor: tokens.colorPrimary100,
  },
  iconSm: {
    width: '36px',
    height: '36px',
    fontSize: '18px',
  },
  iconMd: {
    width: '48px',
    height: '48px',
    fontSize: '24px',
  },
  iconLg: {
    width: '64px',
    height: '64px',
    fontSize: '32px',
  },

  // Content stack
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing1,
    alignItems: 'inherit',
    maxWidth: '440px',
  },

  // Title
  title: {
    margin: 0,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorFg,
    lineHeight: tokens.lineHeightSm,
  },
  titleSm: {
    fontSize: tokens.fontSizeSm,
  },
  titleMd: {
    fontSize: tokens.fontSizeMd,
  },
  titleLg: {
    fontSize: tokens.fontSizeLg,
  },

  // Description
  description: {
    margin: 0,
    fontWeight: tokens.fontWeightNormal,
    color: tokens.colorFgSubtle,
    lineHeight: tokens.lineHeightSm,
  },
  descriptionSm: {
    fontSize: tokens.fontSizeXs,
  },
  descriptionMd: {
    fontSize: tokens.fontSizeSm,
  },
  descriptionLg: {
    fontSize: tokens.fontSizeMd,
  },

  // Actions row
  actions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing2,
    flexWrap: 'wrap',
    marginBlockStart: tokens.spacing1,
  },
  actionsStart: {
    justifyContent: 'flex-start',
  },
  actionsCenter: {
    justifyContent: 'center',
  },
})
