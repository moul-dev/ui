import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    fontFamily: tokens.fontFamilyBase,
    color: tokens.colorFg,
    margin: 0,
  },
  h1: {
    fontSize: tokens.fontSizeXl,
    lineHeight: tokens.lineHeightXl,
    fontWeight: tokens.fontWeightBold,
  },
  h2: {
    fontSize: tokens.fontSizeLg,
    lineHeight: tokens.lineHeightLg,
    fontWeight: tokens.fontWeightSemibold,
  },
  h3: {
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    fontWeight: tokens.fontWeightSemibold,
  },
  h4: {
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
    fontWeight: tokens.fontWeightSemibold,
  },
  h5: {
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
    fontWeight: tokens.fontWeightMedium,
  },
  h6: {
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
    fontWeight: tokens.fontWeightMedium,
  },
  body: {
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    fontWeight: tokens.fontWeightNormal,
  },
  caption: {
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
    fontWeight: tokens.fontWeightNormal,
    color: tokens.colorFgSubtle,
  },
  label: {
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
    fontWeight: tokens.fontWeightMedium,
  },
})
