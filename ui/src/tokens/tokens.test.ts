import fs from 'fs'
import { glob } from 'glob'
import { describe, expect, test } from 'vitest'

describe('Property 2: No hardcoded style values in component definitions', () => {
  test('scans all *.styles.ts files to ensure no hardcoded color, spacing, or radius literals are used', () => {
    // Locate all *.styles.ts files in the src directory
    const styleFiles = glob.sync('src/**/*.styles.ts')

    styleFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8')

      // Check for hex colors (e.g. #fff, #ffffff, etc.)
      const hexColorRegex = /#([a-fA-F0-9]{3,8})\b/
      expect(content).not.toMatch(hexColorRegex)

      // Check for css color functions (e.g. rgb(), rgba(), hsl(), hsla(), oklch(), oklab())
      const colorFunctionRegex = /\b(rgb|rgba|hsl|hsla|oklch|oklab)\(/
      expect(content).not.toMatch(colorFunctionRegex)

      // Check for basic color literals (excluding allowed keywords like transparent, currentColor, inherit)
      // We check if properties related to colors are assigned literals like 'white', 'black', 'red', etc.
      const colorProperties = [
        'backgroundColor',
        'color',
        'borderColor',
        'outlineColor',
        'borderBlockStartColor',
        'borderBlockEndColor',
        'borderInlineStartColor',
        'borderInlineEndColor',
      ]
      colorProperties.forEach((prop) => {
        // Match prop: 'color' or prop: "color"
        const propRegex = new RegExp(
          `\\b${prop}\\s*:\\s*['"\`](?!transparent|currentColor|inherit|initial|unset|none)[a-zA-Z]+['"\`]`,
          'i',
        )
        expect(content).not.toMatch(propRegex)
      })

      // Check for spacing, sizing and radius properties that use literal units instead of tokens
      // e.g. padding: '16px', borderRadius: '0.5rem', but allowing 0, 1px, 2px for borders/focus rings
      const spacingProperties = [
        'padding',
        'paddingTop',
        'paddingRight',
        'paddingBottom',
        'paddingLeft',
        'paddingBlock',
        'paddingBlockStart',
        'paddingBlockEnd',
        'paddingInline',
        'paddingInlineStart',
        'paddingInlineEnd',
        'margin',
        'marginTop',
        'marginRight',
        'marginBottom',
        'marginLeft',
        'marginBlock',
        'marginBlockStart',
        'marginBlockEnd',
        'marginInline',
        'marginInlineStart',
        'marginInlineEnd',
        'gap',
        'rowGap',
        'columnGap',
        'borderRadius',
        'borderTopLeftRadius',
        'borderTopRightRadius',
        'borderBottomLeftRadius',
        'borderBottomRightRadius',
        'borderStartStartRadius',
        'borderStartEndRadius',
        'borderEndStartRadius',
        'borderEndEndRadius',
        'radius',
      ]

      spacingProperties.forEach((prop) => {
        // Look for spacing properties followed by a string literal that is not 0, 1px, 2px, or 0px.
        // e.g. padding: '4px' -> matches; padding: tokens.spacing2 -> does not match
        const propRegex = new RegExp(
          `\\b${prop}\\s*:\\s*['"\`](?!0|1px|2px|0px)['"\`0-9.][^'"\`]*['"\`]`,
          'i',
        )
        expect(content).not.toMatch(propRegex)
      })
    })
  })
})
