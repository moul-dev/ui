import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    fontFamily: tokens.fontFamilyBase,
    color: tokens.colorFg,
    margin: 0,
  },
  h1: {
    fontSize: tokens.fontSize4xl,
    lineHeight: tokens.lineHeight4xl,
    fontWeight: tokens.fontWeightBold,
  },
  h2: {
    fontSize: tokens.fontSize3xl,
    lineHeight: tokens.lineHeight3xl,
    fontWeight: tokens.fontWeightSemibold,
  },
  h3: {
    fontSize: tokens.fontSizeXxl,
    lineHeight: tokens.lineHeightXxl,
    fontWeight: tokens.fontWeightSemibold,
  },
  h4: {
    fontSize: tokens.fontSizeXl,
    lineHeight: tokens.lineHeightXl,
    fontWeight: tokens.fontWeightSemibold,
  },
  h5: {
    fontSize: tokens.fontSizeLg,
    lineHeight: tokens.lineHeightLg,
    fontWeight: tokens.fontWeightMedium,
  },
  h6: {
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    fontWeight: tokens.fontWeightMedium,
  },
  p: {
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    fontWeight: tokens.fontWeightNormal,
  },
  span: {
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    fontWeight: tokens.fontWeightNormal,
  },
  label: {
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
    fontWeight: tokens.fontWeightMedium,
  },
})
