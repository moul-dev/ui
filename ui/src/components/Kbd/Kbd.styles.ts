import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    fontFamily: tokens.fontFamilyBase, // or monospace, but using base as default per design doc, or we can use code font if needed
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    backgroundColor: tokens.colorBgSubtle,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: tokens.colorBorder,
    borderRadius: tokens.radiusSm,
    color: tokens.colorFg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 0 var(--colorShadow)',
  },
})
