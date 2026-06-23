import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: tokens.radiusLg,
    borderStyle: 'solid',
    borderWidth: '1px',
    boxSizing: 'border-box',
  },

  // Elevation Styles
  el0: {
    backgroundColor: tokens.colorBg,
    borderColor: tokens.colorBorder,
    boxShadow: 'none',
  },
  el1: {
    backgroundColor: tokens.colorBgElevated,
    borderColor: tokens.colorBorderSubtle,
    boxShadow: tokens.shadowSm,
  },
  el2: {
    backgroundColor: tokens.colorBgElevated,
    borderColor: tokens.colorBorderSubtle,
    boxShadow: tokens.shadowMd,
  },
  el3: {
    backgroundColor: tokens.colorBgElevated,
    borderColor: tokens.colorBorderSubtle,
    boxShadow: tokens.shadowLg,
  },

  // Card Variants
  default: {},
  flat: {
    backgroundColor: tokens.colorBgSubtle,
    borderColor: 'transparent',
    boxShadow: 'none',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: tokens.colorBorderSubtle,
    boxShadow: 'none',
  },
  glass: {
    backgroundColor: tokens.colorBgGlass,
    borderColor: tokens.colorBorderGlass,
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    boxShadow: tokens.shadowSm,
  },

  // Layout structures
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing1,
    color: tokens.colorFg,
    fontSize: tokens.fontSizeLg,
    fontWeight: tokens.fontWeightSemibold,
  },
  headerDivided: {
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: '1px',
    borderBlockEndColor: tokens.colorBorderSubtle,
  },

  body: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    color: tokens.colorFgSubtle,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
  },

  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: tokens.spacing3,
  },
  footerDivided: {
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: '1px',
    borderBlockStartColor: tokens.colorBorderSubtle,
  },

  // Spacing presets for Header
  header_sm: {
    paddingInline: tokens.spacing4,
    paddingBlockStart: tokens.spacing4,
    paddingBlockEnd: tokens.spacing1,
  },
  header_sm_divided: {
    paddingInline: tokens.spacing4,
    paddingBlockStart: tokens.spacing3,
    paddingBlockEnd: tokens.spacing3,
  },
  header_md: {
    paddingInline: tokens.spacing6,
    paddingBlockStart: tokens.spacing6,
    paddingBlockEnd: tokens.spacing2,
  },
  header_md_divided: {
    paddingInline: tokens.spacing5,
    paddingBlockStart: tokens.spacing4,
    paddingBlockEnd: tokens.spacing4,
  },
  header_lg: {
    paddingInline: tokens.spacing8,
    paddingBlockStart: tokens.spacing8,
    paddingBlockEnd: tokens.spacing3,
  },
  header_lg_divided: {
    paddingInline: tokens.spacing6,
    paddingBlockStart: tokens.spacing6,
    paddingBlockEnd: tokens.spacing6,
  },

  // Spacing presets for Body
  body_sm: {
    paddingInline: tokens.spacing4,
    paddingBlockStart: tokens.spacing1,
    paddingBlockEnd: tokens.spacing3,
    ':first-child': {
      paddingBlockStart: tokens.spacing4,
    },
    ':last-child': {
      paddingBlockEnd: tokens.spacing4,
    },
  },
  body_sm_divided: {
    paddingInline: tokens.spacing4,
    paddingBlockStart: tokens.spacing3,
    paddingBlockEnd: tokens.spacing3,
  },
  body_md: {
    paddingInline: tokens.spacing6,
    paddingBlockStart: tokens.spacing2,
    paddingBlockEnd: tokens.spacing4,
    ':first-child': {
      paddingBlockStart: tokens.spacing6,
    },
    ':last-child': {
      paddingBlockEnd: tokens.spacing6,
    },
  },
  body_md_divided: {
    paddingInline: tokens.spacing5,
    paddingBlockStart: tokens.spacing4,
    paddingBlockEnd: tokens.spacing4,
  },
  body_lg: {
    paddingInline: tokens.spacing8,
    paddingBlockStart: tokens.spacing3,
    paddingBlockEnd: tokens.spacing5,
    ':first-child': {
      paddingBlockStart: tokens.spacing8,
    },
    ':last-child': {
      paddingBlockEnd: tokens.spacing8,
    },
  },
  body_lg_divided: {
    paddingInline: tokens.spacing6,
    paddingBlockStart: tokens.spacing6,
    paddingBlockEnd: tokens.spacing6,
  },

  // Spacing presets for Footer
  footer_sm: {
    paddingInline: tokens.spacing4,
    paddingBlockStart: tokens.spacing1,
    paddingBlockEnd: tokens.spacing4,
  },
  footer_sm_divided: {
    paddingInline: tokens.spacing4,
    paddingBlockStart: tokens.spacing3,
    paddingBlockEnd: tokens.spacing3,
  },
  footer_md: {
    paddingInline: tokens.spacing6,
    paddingBlockStart: tokens.spacing2,
    paddingBlockEnd: tokens.spacing6,
  },
  footer_md_divided: {
    paddingInline: tokens.spacing5,
    paddingBlockStart: tokens.spacing4,
    paddingBlockEnd: tokens.spacing4,
  },
  footer_lg: {
    paddingInline: tokens.spacing8,
    paddingBlockStart: tokens.spacing3,
    paddingBlockEnd: tokens.spacing8,
  },
  footer_lg_divided: {
    paddingInline: tokens.spacing6,
    paddingBlockStart: tokens.spacing6,
    paddingBlockEnd: tokens.spacing6,
  },
})
