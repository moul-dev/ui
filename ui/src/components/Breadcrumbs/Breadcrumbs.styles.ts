/* eslint-disable @stylexjs/valid-styles */
import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  nav: {
    display: 'flex',
    padding: 0,
    margin: 0,
  },
  breadcrumbs: {
    display: 'flex',
    flexWrap: 'wrap',
    listStyleType: 'none',
    padding: 0,
    margin: 0,
    gap: tokens.spacing1,
  },
  breadcrumbItem: {
    display: 'inline-flex',
    alignItems: 'center',
    color: tokens.colorFgSubtle,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    ':not(:last-child)::after': {
      content: '"/"',
      marginInlineStart: tokens.spacing2,
      marginInlineEnd: tokens.spacing2,
      color: tokens.colorFgSubtle,
      pointerEvents: 'none',
    },
  },
  breadcrumbItemCurrent: {
    color: tokens.colorFg,
  },
})
