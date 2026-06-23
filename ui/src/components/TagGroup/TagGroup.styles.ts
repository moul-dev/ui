import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    fontFamily: tokens.fontFamilyBase,
    gap: tokens.spacing2,
  },
  list: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacing2,
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing1,
    borderRadius: tokens.radiusFull,
    fontFamily: tokens.fontFamilyBase,
    cursor: 'default',
    userSelect: 'none',
    outline: 'none',
    borderWidth: '1px',
    borderStyle: 'solid',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
  },
  tagLink: {
    cursor: 'pointer',
  },
  tagFocused: {
    // base focused style
  },
  tagFocusVisible: {
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineColor: tokens.colorBorderFocus,
    outlineOffset: '1px',
  },
  tagPressed: {
    transform: 'scale(0.96)',
  },
  tagDisabled: {
    opacity: 0.5,
    pointerEvents: 'none',
  },

  // ── Sizing — Padding & Typography ─────────────────────────────────
  sm: {
    paddingBlock: '2px',
    paddingInline: tokens.spacing2,
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
  },
  md: {
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing3,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
  },
  lg: {
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing4,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
  },

  // ── Sizing with Close Button ──────────────────────────────────────
  tagWithRemoveSm: {
    paddingInlineStart: tokens.spacing2,
    paddingInlineEnd: '2px',
  },
  tagWithRemoveMd: {
    paddingInlineStart: tokens.spacing3,
    paddingInlineEnd: tokens.spacing1,
  },
  tagWithRemoveLg: {
    paddingInlineStart: tokens.spacing4,
    paddingInlineEnd: tokens.spacing2,
  },

  // ── Variants — Colors ─────────────────────────────────────────────
  // 1. Primary Variant
  variantPrimary: {
    backgroundColor: tokens.colorPrimary100,
    borderColor: tokens.colorPrimary200,
    color: tokens.colorPrimary700,
  },
  variantPrimaryHovered: {
    backgroundColor: tokens.colorPrimary200,
    borderColor: tokens.colorPrimary300,
    color: tokens.colorPrimary800,
  },
  variantPrimarySelected: {
    backgroundColor: tokens.colorPrimary500,
    borderColor: tokens.colorPrimary500,
    color: tokens.colorBg,
  },
  variantPrimarySelectedHovered: {
    backgroundColor: tokens.colorPrimary600,
    borderColor: tokens.colorPrimary600,
    color: tokens.colorBg,
  },

  // 2. Secondary Variant
  variantSecondary: {
    backgroundColor: tokens.colorNeutral200,
    borderColor: tokens.colorBorder,
    color: tokens.colorNeutral800,
  },
  variantSecondaryHovered: {
    backgroundColor: tokens.colorNeutral300,
    borderColor: tokens.colorNeutral400,
    color: tokens.colorNeutral900,
  },
  variantSecondarySelected: {
    backgroundColor: tokens.colorPrimary500,
    borderColor: tokens.colorPrimary500,
    color: tokens.colorBg,
  },
  variantSecondarySelectedHovered: {
    backgroundColor: tokens.colorPrimary600,
    borderColor: tokens.colorPrimary600,
    color: tokens.colorBg,
  },

  // 3. Tertiary Variant
  variantTertiary: {
    backgroundColor: 'transparent',
    borderColor: tokens.colorBorderSubtle,
    color: tokens.colorNeutral600,
  },
  variantTertiaryHovered: {
    backgroundColor: tokens.colorNeutral100,
    borderColor: tokens.colorNeutral300,
    color: tokens.colorNeutral800,
  },
  variantTertiarySelected: {
    backgroundColor: tokens.colorNeutral700,
    borderColor: tokens.colorNeutral700,
    color: tokens.colorBg,
  },
  variantTertiarySelectedHovered: {
    backgroundColor: tokens.colorNeutral800,
    borderColor: tokens.colorNeutral800,
    color: tokens.colorBg,
  },

  // ── Close / Remove Buttons ────────────────────────────────────────
  removeButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radiusFull,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    padding: 0,
    lineHeight: 1,
    outline: 'none',
  },
  removeButtonSm: {
    width: '14px',
    height: '14px',
    fontSize: '8px',
  },
  removeButtonMd: {
    width: '18px',
    height: '18px',
    fontSize: '9px',
  },
  removeButtonLg: {
    width: '22px',
    height: '22px',
    fontSize: tokens.fontSizeXs,
  },
  removeButtonHovered: {
    backgroundColor: tokens.colorNeutral300,
  },
  removeHoverPrimary: {
    backgroundColor: tokens.colorPrimary200,
  },
  removeHoverSecondary: {
    backgroundColor: tokens.colorNeutral300,
  },
  removeHoverTertiary: {
    backgroundColor: tokens.colorNeutral200,
  },
  removeHoverPrimarySelected: {
    backgroundColor: tokens.colorPrimary600,
  },
  removeHoverSecondarySelected: {
    backgroundColor: tokens.colorPrimary600,
  },
  removeHoverTertiarySelected: {
    backgroundColor: tokens.colorNeutral800,
  },
  removeButtonPressed: {
    transform: 'scale(0.85)',
  },
  removeButtonFocused: {
    outlineWidth: '1px',
    outlineStyle: 'solid',
    outlineColor: tokens.colorBorderFocus,
  },
  errorMessage: {
    color: tokens.colorError500,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
    marginBlockStart: tokens.spacing1,
  },
})
